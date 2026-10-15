import { useDeferredValue, useEffect, useId, useMemo, useRef, useState, type ClipboardEvent, type DragEvent, type ReactNode } from 'react'
import { NAMA_PENULIS_DEFAULT, PLACEHOLDER_PENULIS } from '../../config'
import { BATAS_BERKAS, bacaBerkas } from '../../lib/berkas'
import { META_KOSONG, parseEbook, pisahEbook, susunEbook } from '../../lib/parser'
import { buatId, simpanEbookLokal, useEbookLokal } from '../../lib/store'
import { DAFTAR_TEMA, IKON_SAMPUL, TEMA } from '../../lib/tema'
import type { EbookMeta, StatusEbook, TemaId } from '../../lib/types'
import { Ikon } from '../art/Ikon'
import { Panel } from '../art/Panel'
import { SampulGambar } from '../art/Sampul'
import { useNalar } from '../nalar/NalarContext'
import { DataBacaProvider } from '../reader/DataBaca'
import { IsiBab } from '../reader/Blok'
import { Konfirmasi } from './Konfirmasi'
import type { PesanAdmin } from './DaftarEbook'

interface Form {
  judul: string
  subjudul: string
  penulis: string
  deskripsi: string
  tagTeks: string
  tema: TemaId
  ikon: string
  status: StatusEbook
  isi: string
}

const ISI_AWAL = `# Bab 1: Judul Bab

Tulis paragrafmu di sini. Pakai **tebal**, *miring*, dan [[Istilah|definisi singkatnya]].
`

const CONTEKAN = `# Judul Bab            ← setiap bab diawali "# "

Paragraf biasa dengan **tebal**, *miring*,
dan [[Istilah|definisi yang muncul sebagai tooltip]].

:::catatan tipe=penting      ← penting | tips | awas
Isi kotak catatan.
:::

:::tokoh nama="Nama Tokoh" tahun="1858–1917"
Satu paragraf singkat tentang tokoh.
:::

:::kartu
Depan: Istilah atau pertanyaan
Belakang: Penjelasan atau jawaban
:::

:::kuis
Q: Pertanyaan kuis?
- Pilihan salah
- [x] Pilihan benar
- Pilihan salah lain
Penjelasan: Alasan jawaban benar.
:::

:::refleksi
Pertanyaan renungan untuk pembaca.
:::`

function formDariRaw(raw: string): Form {
  const u = pisahEbook(raw)
  const m = u.meta
  return {
    judul: u.adaFrontmatter ? m.judul : '',
    subjudul: m.subjudul,
    penulis: m.penulis && m.penulis !== PLACEHOLDER_PENULIS ? m.penulis : NAMA_PENULIS_DEFAULT,
    deskripsi: m.deskripsi,
    tagTeks: m.tag.join(', '),
    tema: m.tema,
    ikon: m.ikon,
    status: m.status,
    isi: u.adaFrontmatter ? u.isi : raw,
  }
}

const FORM_BARU: Form = {
  judul: '',
  subjudul: '',
  penulis: NAMA_PENULIS_DEFAULT,
  deskripsi: '',
  tagTeks: '',
  tema: 'malam',
  ikon: '🦎',
  status: 'draf',
  isi: ISI_AWAL,
}

function Medan({ label, petunjuk, children, htmlFor }: { label: string; petunjuk?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="font-semibold">
        {label}
      </label>
      {children}
      {petunjuk && (
        <p className="m-0 text-xs" style={{ color: 'var(--tinta-redup)' }}>
          {petunjuk}
        </p>
      )}
    </div>
  )
}

interface Props {
  /** null = ebook baru */
  id: string | null
  onSelesai: (pesan?: PesanAdmin) => void
  onTema: (t: TemaId) => void
}

export function Editor({ id, onSelesai, onTema }: Props) {
  const lokal = useEbookLokal()
  const lama = id ? lokal.find((e) => e.id === id) : undefined
  const { katakan } = useNalar()

  const [form, setForm] = useState<Form>(() => (lama ? formDariRaw(lama.raw) : FORM_BARU))
  const awalJson = useRef(JSON.stringify(form))
  const kotor = JSON.stringify(form) !== awalJson.current
  const [tab, setTab] = useState<'tulis' | 'lihat'>('tulis')
  const [galat, setGalat] = useState<string[]>([])
  const [infoBerkas, setInfoBerkas] = useState<{ jenis: 'ok' | 'galat'; teks: string } | null>(null)
  const [konfirmasiBatal, setKonfirmasiBatal] = useState(false)
  const [babLihat, setBabLihat] = useState(0)
  const area = useRef<HTMLTextAreaElement>(null)
  const berkas = useRef<HTMLInputElement>(null)
  const idForm = useId()
  const idIsi = useId()
  const idGalat = useId()

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }))

  useEffect(() => onTema(form.tema), [form.tema, onTema])

  // peringatan sebelum menutup tab bila ada perubahan yang belum disimpan
  useEffect(() => {
    if (!kotor) return
    const f = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', f)
    return () => window.removeEventListener('beforeunload', f)
  }, [kotor])

  // ---------- susun & periksa ----------
  const meta: EbookMeta = useMemo(
    () => ({
      judul: form.judul.trim() || META_KOSONG.judul,
      subjudul: form.subjudul.trim(),
      penulis: form.penulis.trim(),
      tema: form.tema,
      ikon: form.ikon.trim() || META_KOSONG.ikon,
      tag: form.tagTeks.split(',').map((t) => t.trim()).filter(Boolean),
      status: form.status,
      deskripsi: form.deskripsi.trim(),
    }),
    [form.judul, form.subjudul, form.penulis, form.tema, form.ikon, form.tagTeks, form.status, form.deskripsi],
  )
  const { raw, offset } = useMemo(() => susunEbook(meta, form.isi), [meta, form.isi])
  const rawTunda = useDeferredValue(raw)
  const parsed = useMemo(() => parseEbook(rawTunda), [rawTunda])
  const barisKosongDepan = form.isi.match(/^\n+/)?.[0].length ?? 0
  const masalah = useMemo(
    () =>
      parsed.peringatan.map((w) => ({
        pesan: w.pesan,
        // nomor baris dihitung terhadap kolom isi (bukan teks mentah berfrontmatter)
        baris: w.baris - offset + barisKosongDepan,
      })),
    [parsed.peringatan, offset, barisKosongDepan],
  )
  const adaFmDiIsi = /^\s*---\s*\n/.test(form.isi)

  useEffect(() => {
    if (babLihat >= parsed.bab.length) setBabLihat(Math.max(0, parsed.bab.length - 1))
  }, [parsed.bab.length, babLihat])

  // ---------- aksi ----------
  const terapkanTeks = (teks: string, namaBerkas?: string) => {
    const u = pisahEbook(teks)
    setForm((f) => {
      if (u.adaFrontmatter) {
        const m = u.meta
        return {
          ...f,
          judul: m.judul !== META_KOSONG.judul ? m.judul : f.judul,
          subjudul: m.subjudul,
          penulis: m.penulis && m.penulis !== PLACEHOLDER_PENULIS ? m.penulis : f.penulis,
          deskripsi: m.deskripsi,
          tagTeks: m.tag.join(', '),
          tema: m.tema,
          ikon: m.ikon,
          status: m.status,
          isi: u.isi,
        }
      }
      const dariNama = namaBerkas ? namaBerkas.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() : ''
      return { ...f, isi: teks, judul: f.judul.trim() ? f.judul : dariNama }
    })
    return u.adaFrontmatter
  }

  const muatBerkas = async (file: File) => {
    setInfoBerkas(null)
    if (!/\.(md|markdown|txt)$/i.test(file.name)) {
      setInfoBerkas({ jenis: 'galat', teks: `"${file.name}" bukan file .md atau .txt. Pilih file teks ebook, ya.` })
      katakan('adminError')
      return
    }
    if (file.size > BATAS_BERKAS) {
      setInfoBerkas({ jenis: 'galat', teks: 'File terlalu besar (maksimal 2 MB untuk satu ebook).' })
      katakan('adminError')
      return
    }
    try {
      const teks = await bacaBerkas(file)
      if (!teks.trim()) {
        setInfoBerkas({ jenis: 'galat', teks: `File "${file.name}" kosong.` })
        katakan('adminError')
        return
      }
      const adaFm = terapkanTeks(teks, file.name)
      setInfoBerkas({
        jenis: 'ok',
        teks: adaFm ? `"${file.name}" dimuat. Pengaturan ebook (judul, tema, dst.) diisi otomatis dari frontmatter.` : `"${file.name}" dimuat ke editor.`,
      })
      katakan('adminUpload')
    } catch {
      setInfoBerkas({ jenis: 'galat', teks: 'File tidak bisa dibaca. Coba pilih ulang.' })
      katakan('adminError')
    }
  }

  const saatTempel = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const t = e.clipboardData.getData('text')
    if (!/^\s*---\s*\n/.test(t)) return
    const ta = e.currentTarget
    const gantiSemua = ta.value.trim() === '' || (ta.selectionStart === 0 && ta.selectionEnd === ta.value.length)
    if (!gantiSemua || !pisahEbook(t).adaFrontmatter) return
    e.preventDefault()
    terapkanTeks(t)
    setInfoBerkas({ jenis: 'ok', teks: 'Teks ditempel. Pengaturan ebook diisi otomatis dari frontmatter.' })
    katakan('adminUpload')
  }

  const saatLepas = (e: DragEvent<HTMLTextAreaElement>) => {
    const f = e.dataTransfer?.files?.[0]
    if (!f) return
    e.preventDefault()
    void muatBerkas(f)
  }

  const lompat = (baris: number) => {
    const ta = area.current
    if (!ta) return
    setTab('tulis')
    setTimeout(() => {
      const baris2 = Math.max(1, baris)
      const bagian = form.isi.split('\n')
      let awal = 0
      for (let i = 0; i < baris2 - 1 && i < bagian.length; i++) awal += bagian[i].length + 1
      const akhir = awal + (bagian[baris2 - 1]?.length ?? 0)
      ta.focus()
      ta.setSelectionRange(awal, akhir)
      const lh = parseFloat(getComputedStyle(ta).lineHeight) || 24
      ta.scrollTop = Math.max(0, (baris2 - 3) * lh)
    }, 30)
  }

  const simpan = () => {
    const segar = parseEbook(raw)
    const g: string[] = []
    if (!form.judul.trim()) g.push('Judul wajib diisi.')
    if (!form.isi.trim()) g.push('Isi ebook masih kosong. Tulis minimal satu bab, mulai dengan baris “# Judul Bab”.')
    else if (segar.bab.length === 0 && form.status === 'terbit') {
      g.push('Ebook berstatus Terbit harus punya minimal satu bab. Mulai bab dengan “# Judul Bab”, atau ubah statusnya menjadi Draf.')
    }
    setGalat(g)
    if (g.length) {
      katakan('adminError')
      return
    }
    const sekarang = Date.now()
    simpanEbookLokal({ id: lama?.id ?? buatId(), raw, dibuat: lama?.dibuat ?? sekarang, diperbarui: sekarang })
    katakan('adminSimpan')
    onSelesai({
      jenis: 'ok',
      judul: `"${meta.judul}" tersimpan di browser ini sebagai ${meta.status === 'terbit' ? 'Terbit' : 'Draf'}.`,
      rincian: segar.peringatan.length ? [`Ada ${segar.peringatan.length} peringatan format. Buka Edit lagi untuk melihat rinciannya.`] : [],
    })
  }

  const batal = () => (kotor ? setKonfirmasiBatal(true) : onSelesai())

  if (id && !lama) {
    return (
      <Panel warna="kertas" className="mx-auto max-w-xl px-6 py-8 text-center">
        <p className="m-0 font-display text-2xl font-bold">Ebook ini tidak ditemukan</p>
        <p className="mt-2">Mungkin sudah dihapus dari browser ini.</p>
        <button type="button" className="tombol tombol-primer mt-2" onClick={() => onSelesai()}>
          Kembali ke daftar
        </button>
      </Panel>
    )
  }

  const babTampil = parsed.bab[Math.min(babLihat, parsed.bab.length - 1)]

  return (
    <section aria-labelledby={idForm}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={idForm} className="m-0 font-display text-3xl font-black" style={{ color: 'var(--teks)' }}>
          {lama ? 'Edit ebook' : 'Ebook baru'}
        </h2>
        <button type="button" className="tombol" onClick={batal}>
          <Ikon n="kembali" ukuran={18} /> Kembali ke daftar
        </button>
      </div>

      {/* tab untuk layar sempit; berdampingan di layar lebar */}
      <div role="tablist" aria-label="Tampilan editor" className="mt-4 flex gap-2 lg:hidden">
        {(['tulis', 'lihat'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            id={`tab-${t}`}
            aria-selected={tab === t}
            aria-controls={`panel-${t}`}
            className={`tombol flex-1 ${tab === t ? 'tombol-primer' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'tulis' ? 'Tulis' : 'Pratinjau'}
            {t === 'lihat' && masalah.length > 0 && <span className="chip" style={{ color: '#7a1608' }}>{masalah.length}</span>}
          </button>
        ))}
      </div>

      <div className="mt-5 grid items-start gap-6 lg:grid-cols-2">
        {/* ---------- kolom tulis ---------- */}
        <div id="panel-tulis" role="tabpanel" aria-labelledby="tab-tulis" className={`${tab === 'tulis' ? 'block' : 'hidden'} min-w-0 lg:block`}>
          <Panel warna="kertas" className="px-4 py-5 sm:px-6">
            <div className="flex flex-col gap-4">
              <Medan label="Judul *" htmlFor={`${idIsi}-judul`}>
                <input id={`${idIsi}-judul`} className="input" value={form.judul} maxLength={140} onChange={(e) => set('judul', e.target.value)} aria-required="true" />
              </Medan>
              <Medan label="Subjudul" htmlFor={`${idIsi}-sub`}>
                <input id={`${idIsi}-sub`} className="input" value={form.subjudul} maxLength={140} onChange={(e) => set('subjudul', e.target.value)} />
              </Medan>
              <div className="grid gap-4 sm:grid-cols-2">
                <Medan label="Penulis" htmlFor={`${idIsi}-penulis`}>
                  <input id={`${idIsi}-penulis`} className="input" value={form.penulis} maxLength={100} onChange={(e) => set('penulis', e.target.value)} />
                </Medan>
                <Medan label="Tag" htmlFor={`${idIsi}-tag`} petunjuk="Pisahkan dengan koma, mis. pengantar, teori">
                  <input id={`${idIsi}-tag`} className="input" value={form.tagTeks} onChange={(e) => set('tagTeks', e.target.value)} />
                </Medan>
              </div>
              <Medan label="Deskripsi" htmlFor={`${idIsi}-desk`}>
                <textarea id={`${idIsi}-desk`} className="input" rows={2} value={form.deskripsi} maxLength={400} onChange={(e) => set('deskripsi', e.target.value.replace(/\n/g, ' '))} />
              </Medan>

              <fieldset className="m-0 border-0 p-0">
                <legend className="mb-1 font-semibold">Tema warna sampul</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {DAFTAR_TEMA.map((t) => (
                    <label key={t.id} className="relative block cursor-pointer">
                      <input type="radio" name={`tema-${idIsi}`} className="peer sr-only" checked={form.tema === t.id} onChange={() => set('tema', t.id)} />
                      <span
                        className="flex min-h-[44px] items-center gap-2 rounded-lg border-2 border-tinta px-2 py-1.5 text-sm font-semibold peer-checked:shadow-[0_0_0_3px_var(--kuning-pusaran),0_0_0_5px_var(--tinta)] peer-focus-visible:shadow-[0_0_0_3px_var(--kuning-pusaran),0_0_0_5px_var(--tinta)]"
                        style={{ background: '#fffaf0', color: 'var(--tinta)' }}
                      >
                        <span className="h-6 w-6 shrink-0 rounded-full border-2 border-tinta" style={{ background: `linear-gradient(135deg, ${t.dasar}, ${t.dasar2})` }} aria-hidden="true" />
                        <span className="min-w-0">
                          <span className="block leading-tight">{t.nama}</span>
                          <span className="block text-[0.7rem] font-normal opacity-80">{t.id}</span>
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="m-0 border-0 p-0">
                <legend className="mb-1 font-semibold">Ikon sampul</legend>
                <div className="flex flex-wrap gap-1.5">
                  {IKON_SAMPUL.map((ik) => (
                    <label key={ik} className="relative block cursor-pointer">
                      <input type="radio" name={`ikon-${idIsi}`} className="peer sr-only" checked={form.ikon === ik} onChange={() => set('ikon', ik)} aria-label={`Ikon ${ik}`} />
                      <span
                        className="grid h-11 w-11 place-items-center rounded-lg border-2 border-tinta text-2xl peer-checked:bg-kuning-pusaran peer-checked:shadow-[0_0_0_2px_var(--tinta)] peer-focus-visible:shadow-[0_0_0_3px_var(--kuning-pusaran),0_0_0_5px_var(--tinta)]"
                        style={{ background: '#fffaf0', fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}
                        aria-hidden="true"
                      >
                        {ik}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <label htmlFor={`${idIsi}-ikon`} className="text-sm">
                    atau ketik sendiri:
                  </label>
                  <input id={`${idIsi}-ikon`} className="input !w-24 text-center text-xl" value={form.ikon} maxLength={8} onChange={(e) => set('ikon', e.target.value)} />
                </div>
              </fieldset>

              <fieldset className="m-0 border-0 p-0">
                <legend className="mb-1 font-semibold">Status</legend>
                <div className="flex gap-3">
                  {(['terbit', 'draf'] as const).map((s) => (
                    <label key={s} className="relative block cursor-pointer">
                      <input type="radio" name={`status-${idIsi}`} className="peer sr-only" checked={form.status === s} onChange={() => set('status', s)} />
                      <span
                        className="flex min-h-[44px] items-center rounded-full border-2 border-tinta px-4 font-semibold peer-checked:bg-kuning-pusaran peer-focus-visible:shadow-[0_0_0_3px_var(--kuning-pusaran),0_0_0_5px_var(--tinta)]"
                        style={{ background: '#fffaf0', color: 'var(--tinta)' }}
                      >
                        {s === 'terbit' ? 'Terbit (tampil di rak)' : 'Draf (disembunyikan)'}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor={`${idIsi}-isi`} className="font-semibold">
                    Isi ebook (Markdown)
                  </label>
                  <button type="button" className="tombol tombol-kecil" onClick={() => berkas.current?.click()}>
                    <Ikon n="unggah" ukuran={16} /> Unggah .md / .txt
                  </button>
                  <input
                    ref={berkas}
                    type="file"
                    accept=".md,.markdown,.txt,text/markdown,text/plain"
                    className="sr-only"
                    tabIndex={-1}
                    aria-label="Pilih file .md atau .txt untuk dimuat ke editor"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      e.target.value = ''
                      if (f) void muatBerkas(f)
                    }}
                  />
                </div>
                <p className="m-0 text-xs" style={{ color: 'var(--tinta-redup)' }}>
                  Tulis langsung, tempel teks, atau seret file ke kotak ini.
                </p>
                <div role="status" aria-live="polite" className="min-h-[1px]">
                  {infoBerkas && (
                    <p className="m-0 rounded-lg border-2 border-dashed p-2 text-sm font-semibold" style={{ borderColor: 'var(--tinta)', background: infoBerkas.jenis === 'ok' ? '#e5f4d9' : '#fbd9c8', color: infoBerkas.jenis === 'ok' ? '#1f4a12' : '#5a1306' }}>
                      {infoBerkas.teks}
                    </p>
                  )}
                </div>
                {adaFmDiIsi && (
                  <p className="m-0 rounded-lg border-2 border-dashed p-2 text-sm" style={{ borderColor: 'var(--tinta)', background: '#fff3d6' }} role="note">
                    Isi ini diawali frontmatter (<code>---</code>). Pengaturan seperti judul dan tema sebaiknya ada di kolom atas.{' '}
                    <button type="button" className="font-bold underline" style={{ color: 'var(--tautan)' }} onClick={() => terapkanTeks(form.isi)}>
                      Pindahkan otomatis
                    </button>
                  </p>
                )}
                <textarea
                  ref={area}
                  id={`${idIsi}-isi`}
                  className="input font-mono"
                  style={{ fontSize: '0.92rem', minHeight: 320, whiteSpace: 'pre-wrap', tabSize: 2 }}
                  rows={18}
                  spellCheck={false}
                  value={form.isi}
                  onChange={(e) => set('isi', e.target.value)}
                  onPaste={saatTempel}
                  onDrop={saatLepas}
                  onDragOver={(e) => e.preventDefault()}
                />
                <details className="rounded-lg border-2 border-tinta p-2" style={{ background: '#fffaf0' }}>
                  <summary className="cursor-pointer font-semibold">Contekan format</summary>
                  <pre className="m-0 mt-2 overflow-x-auto whitespace-pre text-xs leading-relaxed">{CONTEKAN}</pre>
                </details>
              </div>

              {/* hasil pemeriksaan format */}
              <div aria-live="polite">
                <h3 className="m-0 mb-1 font-display text-lg font-bold">Pemeriksaan format</h3>
                {masalah.length === 0 ? (
                  <p className="m-0 flex items-center gap-1.5 font-semibold" style={{ color: '#1f4a12' }}>
                    <Ikon n="cek" ukuran={18} tebal={3} /> Rapi: tidak ada peringatan.
                  </p>
                ) : (
                  <>
                    <p className="m-0 font-semibold" style={{ color: '#7a1608' }}>
                      {masalah.length} hal perlu dicek. Ebook tetap bisa disimpan; blok yang bermasalah dilewati.
                    </p>
                    <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
                      {masalah.map((m, i) => (
                        <li key={i} className="m-0 rounded-lg border-2 border-tinta p-2 text-sm" style={{ background: '#fff3d6' }}>
                          <span className="font-bold">{m.baris >= 1 ? `Baris ${m.baris}` : 'Pengaturan'}:</span> {m.pesan}
                          {m.baris >= 1 && (
                            <button type="button" className="tombol tombol-kecil ml-2 align-middle" onClick={() => lompat(m.baris)} aria-label={`Loncat ke baris ${m.baris} di editor`}>
                              Loncat
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              {galat.length > 0 && (
                <div id={idGalat} role="alert" className="rounded-lg border-2 p-3" style={{ borderColor: '#7a1f0d', background: '#fbd9c8', color: '#5a1306' }}>
                  <p className="m-0 font-bold">Belum bisa disimpan:</p>
                  <ul className="m-0 mt-1 pl-5">
                    {galat.map((g) => (
                      <li key={g}>{g}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button type="button" className="tombol tombol-primer" onClick={simpan} aria-describedby={galat.length ? idGalat : undefined}>
                  <Ikon n="cek" ukuran={18} /> Simpan
                </button>
                <button type="button" className="tombol" onClick={batal}>
                  Batal
                </button>
              </div>
            </div>
          </Panel>
        </div>

        {/* ---------- kolom pratinjau ---------- */}
        <div id="panel-lihat" role="tabpanel" aria-labelledby="tab-lihat" className={`${tab === 'lihat' ? 'block' : 'hidden'} min-w-0 lg:sticky lg:top-6 lg:block`}>
          <Panel warna="kertas" className="px-4 py-5 sm:px-6">
            <h3 className="m-0 font-display text-xl font-bold">Pratinjau langsung</h3>
            <div className="mt-3 flex items-start gap-4">
              <div className="w-28 shrink-0">
                <SampulGambar meta={parsed.meta} id={id ?? 'baru'} />
              </div>
              <div className="min-w-0 text-sm">
                <p className="m-0 font-display text-lg font-bold leading-tight">{parsed.meta.judul}</p>
                <p className="m-0 mt-1">
                  {parsed.bab.length} bab · {parsed.jumlahKuis} kuis · tema {TEMA[parsed.meta.tema].nama}
                </p>
                <p className="m-0 mt-1" style={{ color: 'var(--tinta-redup)' }}>
                  Sampul dibuat otomatis dari tema, ikon, dan judul.
                </p>
              </div>
            </div>

            {parsed.bab.length > 1 && (
              <div className="mt-4">
                <label htmlFor={`${idIsi}-bab`} className="mb-1 block text-sm font-semibold">
                  Bab yang ditampilkan
                </label>
                <select id={`${idIsi}-bab`} className="input" value={Math.min(babLihat, parsed.bab.length - 1)} onChange={(e) => setBabLihat(Number(e.target.value))}>
                  {parsed.bab.map((b, i) => (
                    <option key={b.id} value={i}>
                      {b.judul}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-4 max-h-none overflow-y-auto rounded-xl border-2 border-dashed border-tinta p-4 lg:max-h-[calc(100vh-18rem)]" style={{ background: '#fffdf7' }}>
              {babTampil ? (
                <DataBacaProvider ebookId={null} key={babTampil.id}>
                  <h4 className="m-0 mb-4 font-display text-2xl font-black">{babTampil.judul}</h4>
                  <div className="baca">
                    {babTampil.blok.length === 0 ? <p style={{ color: 'var(--tinta-redup)' }}>Bab ini belum ada isinya.</p> : <IsiBab bab={babTampil} />}
                  </div>
                </DataBacaProvider>
              ) : (
                <p className="m-0" style={{ color: 'var(--tinta-redup)' }}>
                  Belum ada bab. Mulai bab dengan baris <code># Judul Bab</code> dan pratinjaunya muncul di sini.
                </p>
              )}
            </div>
            <p className="m-0 mt-2 text-xs" style={{ color: 'var(--tinta-redup)' }}>
              Kuis, kartu balik, dan kotak refleksi di pratinjau bisa dicoba, tetapi jawabannya tidak disimpan.
            </p>
          </Panel>
        </div>
      </div>

      {konfirmasiBatal && (
        <Konfirmasi judul="Buang perubahan?" labelYa="Ya, buang" labelBatal="Lanjut menulis" bahaya onBatal={() => setKonfirmasiBatal(false)} onYa={() => onSelesai()}>
          <p className="m-0">Ada perubahan yang belum disimpan. Kalau kamu keluar sekarang, perubahan itu hilang.</p>
        </Konfirmasi>
      )}
    </section>
  )
}
