import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Konfirmasi } from '../admin/Konfirmasi'
import type { PesanAdmin } from '../admin/DaftarEbook'
import { Ikon } from '../art/Ikon'
import { Panel } from '../art/Panel'
import { useNalar } from '../nalar/NalarContext'
import { bacaBerkas, BATAS_BERKAS, namaBerkasTeksValid, periksaIsiTeks, slugify, unduhTeks } from '../../lib/berkas'
import { useSemuaEbook } from '../../lib/library'
import { parseEbook } from '../../lib/parser'
import { TEMA } from '../../lib/tema'
import { ambilToko, useToko } from '../../lib/toko/store'
import { hargaDariTeks, itemDariRaw, periksaIsian } from '../../lib/toko/susun'
import { GalatToko, rupiah, type ItemKatalog } from '../../lib/toko/tipe'
import { BannerDemo } from './BannerDemo'

const pesanGalat = (e: unknown) => (e instanceof GalatToko ? e.message : 'Terjadi kesalahan. Coba lagi.')

// ------------------------------------------------------------------
// Formulir tambah / ubah ebook berbayar
// ------------------------------------------------------------------
function FormToko({ awal, onSelesai, onPesan }: { awal: ItemKatalog | null; onSelesai: () => void; onPesan: (p: PesanAdmin | null) => void }) {
  const toko = ambilToko()
  const { katakan } = useNalar()
  const semua = useSemuaEbook()
  const lokal = semua.filter((e) => e.sumber === 'lokal')
  const [id, setId] = useState(awal?.id ?? '')
  const [idSentuh, setIdSentuh] = useState(!!awal)
  const [harga, setHarga] = useState(awal ? String(awal.harga) : '25000')
  const [terbit, setTerbit] = useState(awal?.terbit ?? false)
  const [raw, setRaw] = useState('')
  const [memuat, setMemuat] = useState(!!awal)
  const [galat, setGalat] = useState<string[]>([])
  const [sibuk, setSibuk] = useState(false)
  const [pilihLokal, setPilihLokal] = useState('')
  const berkas = useRef<HTMLInputElement>(null)
  const idId = useId()
  const idHarga = useId()
  const idRaw = useId()
  const idLokal = useId()
  const idGalat = useId()

  useEffect(() => {
    if (!awal) return
    let batal = false
    toko
      .adminBacaIsi(awal.id)
      .then((r) => {
        if (!batal) setRaw(r ?? '')
      })
      .catch((e) => {
        if (!batal) setGalat([pesanGalat(e)])
      })
      .finally(() => {
        if (!batal) setMemuat(false)
      })
    return () => {
      batal = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awal?.id])

  const parsed = useMemo(() => parseEbook(raw), [raw])
  const ringkas = raw.trim() ? parsed : null

  // usulan ID dari judul selama pengguna belum mengetik ID sendiri
  useEffect(() => {
    if (!awal && !idSentuh && ringkas) setId(slugify(ringkas.meta.judul))
  }, [awal, idSentuh, ringkas?.meta.judul]) // eslint-disable-line react-hooks/exhaustive-deps

  const idTerpakai = semua.map((e) => e.id)

  const simpan = async () => {
    const g = periksaIsian({ id, hargaTeks: harga, raw, idTerpakai, baru: !awal })
    setGalat(g)
    if (g.length) {
      katakan('adminError')
      return
    }
    setSibuk(true)
    try {
      await toko.adminSimpan({ item: itemDariRaw(raw, { id, harga: hargaDariTeks(harga), terbit, urutan: awal?.urutan }), raw })
      onPesan({
        jenis: 'ok',
        judul: `"${parsed.meta.judul}" tersimpan di toko (${rupiah(hargaDariTeks(harga))}).`,
        rincian: terbit ? ['Sudah tampil di rak beranda dengan label harga.'] : ['Statusnya Draf, jadi belum tampil di rak. Klik “Terbitkan” di daftar toko kalau sudah siap. Kamu sendiri tetap bisa membacanya lewat tombol Baca.'],
      })
      katakan('tokoAdmin')
      onSelesai()
    } catch (e) {
      setGalat([pesanGalat(e)])
      katakan('adminError')
    } finally {
      setSibuk(false)
    }
  }

  return (
    <Panel warna="kertas" className="px-4 py-5 sm:px-6">
      <h3 className="m-0 font-display text-2xl font-black">{awal ? `Ubah: ${awal.judul}` : 'Ebook berbayar baru'}</h3>
      <p className="m-0 mt-2 rounded-lg border-2 border-dashed p-3 text-sm" style={{ borderColor: 'var(--tinta)', background: '#fff3d6' }} role="note">
        Judul, penulis, tema, ikon, tag, dan deskripsi diambil dari bagian atas (frontmatter) isi ebook di bawah. Isi ebook disimpan di server dan hanya dikirim ke pembeli yang sudah lunas. <strong>Jangan</strong> menaruh ebook berbayar di folder src/content/ karena itu publik.
      </p>

      {memuat ? (
        <p role="status" className="mt-4 font-semibold">
          Memuat isi ebook…
        </p>
      ) : (
        <div className="mt-4 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={idId} className="mb-1 block font-semibold">
                ID ebook
              </label>
              <input
                id={idId}
                className="input"
                value={id}
                readOnly={!!awal}
                autoCapitalize="none"
                spellCheck={false}
                aria-describedby={`${idId}-h`}
                onChange={(e) => {
                  setIdSentuh(true)
                  setId(e.target.value.toLowerCase())
                }}
              />
              <p id={`${idId}-h`} className="m-0 mt-1 text-xs" style={{ color: 'var(--tinta-redup)' }}>
                {awal ? 'ID tidak bisa diubah.' : 'Huruf kecil, angka, tanda hubung. Jadi alamat #/baca/ID.'}
              </p>
            </div>
            <div>
              <label htmlFor={idHarga} className="mb-1 block font-semibold">
                Harga (rupiah)
              </label>
              <input id={idHarga} className="input" inputMode="numeric" value={harga} onChange={(e) => setHarga(e.target.value)} aria-describedby={`${idHarga}-h`} />
              <p id={`${idHarga}-h`} className="m-0 mt-1 text-xs" style={{ color: 'var(--tinta-redup)' }}>
                {Number.isInteger(hargaDariTeks(harga)) && harga.trim() ? `Pembeli membayar ${rupiah(hargaDariTeks(harga))}.` : 'Angka saja, mis. 25000. Minimal 1000.'} Harga dibaca ulang dari server saat pembayaran, jadi tidak bisa dimanipulasi dari browser pembeli.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 font-semibold">
            <input type="checkbox" className="kotak-cek" checked={terbit} onChange={(e) => setTerbit(e.target.checked)} />
            Terbit (tampil di rak dan bisa dibeli)
          </label>

          <div>
            <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
              <label htmlFor={idRaw} className="block font-semibold">
                Isi ebook (format .md Ruang Nalar)
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="tombol tombol-kecil" onClick={() => berkas.current?.click()}>
                  <Ikon n="unggah" ukuran={16} /> Ambil dari file .md
                </button>
                {awal && raw && (
                  <button type="button" className="tombol tombol-kecil" onClick={() => unduhTeks(`${awal.id}.md`, raw, 'text/markdown;charset=utf-8')}>
                    <Ikon n="unduh" ukuran={16} /> Unduh .md
                  </button>
                )}
              </div>
              <input
                ref={berkas}
                type="file"
                accept=".md,.txt,text/markdown,text/plain"
                className="sr-only"
                tabIndex={-1}
                aria-label="Pilih file .md atau .txt untuk isi ebook"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  e.target.value = ''
                  if (!f) return
                  if (!namaBerkasTeksValid(f.name)) {
                    setGalat([`"${f.name}" bukan file .md atau .txt. Pilih file teks ebook, ya.`])
                    return
                  }
                  if (f.size > BATAS_BERKAS) {
                    setGalat(['File terlalu besar (maksimal 2 MB).'])
                    return
                  }
                  try {
                    const teksBerkas = await bacaBerkas(f)
                    const bukanTeks = periksaIsiTeks(teksBerkas)
                    if (bukanTeks) {
                      setGalat([bukanTeks])
                      return
                    }
                    setRaw(teksBerkas)
                    setGalat([])
                  } catch {
                    setGalat(['File tidak bisa dibaca. Coba pilih ulang.'])
                  }
                }}
              />
            </div>

            {lokal.length > 0 && (
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <label htmlFor={idLokal} className="text-sm font-semibold">
                  Atau salin dari ebook buatanmu di browser ini:
                </label>
                <select id={idLokal} className="input" style={{ width: 'auto', maxWidth: '100%' }} value={pilihLokal} onChange={(e) => setPilihLokal(e.target.value)}>
                  <option value="">Pilih ebook…</option>
                  {lokal.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.parsed.meta.judul}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="tombol tombol-kecil"
                  disabled={!pilihLokal}
                  onClick={() => {
                    const e = lokal.find((x) => x.id === pilihLokal)
                    if (e) {
                      setRaw(e.raw)
                      setGalat([])
                    }
                  }}
                >
                  Pakai isinya
                </button>
              </div>
            )}

            <textarea id={idRaw} className="input font-mono text-sm" rows={14} value={raw} spellCheck={false} onChange={(e) => setRaw(e.target.value)} placeholder={'---\njudul: Judul Ebook\ntema: malam\n---\n\n# Bab 1: ...'} />
            {ringkas && (
              <p className="m-0 mt-1 text-sm" role="status">
                Terbaca: <strong>{ringkas.meta.judul}</strong> · {ringkas.bab.length} bab · {ringkas.jumlahKuis} kuis · tema {TEMA[ringkas.meta.tema].nama}
                {ringkas.peringatan.length > 0 && <span style={{ color: '#7a1608' }}> · {ringkas.peringatan.length} peringatan format</span>}
              </p>
            )}
            {ringkas && ringkas.peringatan.length > 0 && (
              <ul className="m-0 mt-1 pl-5 text-sm" style={{ color: '#7a1608' }}>
                {ringkas.peringatan.slice(0, 5).map((p, i) => (
                  <li key={i}>
                    Baris {p.baris}: {p.pesan}
                  </li>
                ))}
                {ringkas.peringatan.length > 5 && <li>…dan {ringkas.peringatan.length - 5} lainnya.</li>}
              </ul>
            )}
          </div>

          <div id={idGalat} role="alert">
            {galat.length > 0 && (
              <ul className="m-0 rounded-lg border-2 p-3 pl-7 font-semibold" style={{ background: '#fbd9c8', color: '#5a1306', borderColor: '#7a1f0d' }}>
                {galat.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" className="tombol tombol-primer" disabled={sibuk} aria-busy={sibuk} onClick={simpan}>
              {sibuk ? 'Menyimpan…' : 'Simpan ke toko'}
            </button>
            <button type="button" className="tombol" disabled={sibuk} onClick={onSelesai}>
              Batal
            </button>
          </div>
        </div>
      )}
    </Panel>
  )
}

// ------------------------------------------------------------------
// Bagian "Toko" di Ruang Redaksi
// ------------------------------------------------------------------
export function TokoAdmin({ onPesan }: { onPesan: (p: PesanAdmin | null) => void }) {
  const tk = useToko()
  const toko = ambilToko()
  const { katakan } = useNalar()
  const [form, setForm] = useState<{ awal: ItemKatalog | null } | null>(null)
  const [hapus, setHapus] = useState<ItemKatalog | null>(null)
  const [galatMuat, setGalatMuat] = useState('')
  const [sibukId, setSibukId] = useState('')
  const admin = !!tk.sesi?.admin

  useEffect(() => {
    if (!admin) return
    setGalatMuat('')
    toko.adminMuat().catch((e) => setGalatMuat(pesanGalat(e)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, tk.sesi?.id])

  if (tk.mode === 'mati') return null

  const aksi = async (item: ItemKatalog, kerja: () => Promise<void>, ok: string) => {
    setSibukId(item.id)
    try {
      await kerja()
      onPesan({ jenis: 'ok', judul: ok })
      katakan('tokoAdmin')
    } catch (e) {
      onPesan({ jenis: 'galat', judul: pesanGalat(e) })
      katakan('adminError')
    } finally {
      setSibukId('')
    }
  }

  return (
    <section aria-labelledby="judul-toko" className="mt-12">
      <h2 id="judul-toko" className="m-0 font-display text-3xl font-black" style={{ color: 'var(--teks)' }}>
        Toko ebook berbayar
      </h2>
      {tk.mode === 'demo' && <BannerDemo admin className="mt-3" />}

      {!tk.siap ? (
        <p className="mt-3" role="status">
          Memeriksa akunmu…
        </p>
      ) : !tk.sesi ? (
        <Panel warna="kertas" className="mt-4 px-5 py-5">
          <p className="m-0">Untuk mengelola ebook berbayar, masuk dulu dengan akun admin toko (berbeda dari kode sandi Ruang Redaksi).</p>
          <Link to="/masuk?lanjut=/admin" className="tombol tombol-primer mt-3">
            <Ikon n="pengguna" ukuran={18} /> Masuk sebagai admin
          </Link>
        </Panel>
      ) : !admin ? (
        <Panel warna="kertas" className="mt-4 px-5 py-5">
          <p className="m-0">
            Kamu masuk sebagai <strong className="break-all">{tk.sesi.email}</strong>, tetapi akun ini belum terdaftar sebagai admin toko.
          </p>
          <p className="m-0 mt-2 text-sm">
            Cara menjadikan akunmu admin ada di README bagian 9, langkah 3 (satu perintah SQL di Supabase). Atau masuk dengan akun lain.
          </p>
          <Link to="/akun" className="tombol tombol-kecil mt-3">
            Ke halaman akun
          </Link>
        </Panel>
      ) : form ? (
        <div className="mt-4">
          <FormToko key={form.awal?.id ?? 'baru'} awal={form.awal} onPesan={onPesan} onSelesai={() => setForm(null)} />
        </div>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" className="tombol tombol-primer" onClick={() => setForm({ awal: null })}>
              <Ikon n="plus" ukuran={18} /> Ebook berbayar baru
            </button>
            <p className="m-0 text-sm" style={{ color: 'var(--teks-redup)' }}>
              Masuk sebagai admin: {tk.sesi.email}
            </p>
          </div>

          {galatMuat && (
            <p role="alert" className="mt-3 font-semibold" style={{ color: '#ffd9c9' }}>
              {galatMuat}
            </p>
          )}

          {tk.adminItem.length === 0 && !galatMuat ? (
            <Panel warna="kertas" className="mt-4 px-6 py-8 text-center">
              <p className="m-0 font-display text-2xl font-bold">Belum ada ebook berbayar</p>
              <p className="mt-2">Klik “Ebook berbayar baru”, lalu tempel isi .md atau ambil dari ebook buatanmu.</p>
            </Panel>
          ) : (
            <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
              {tk.adminItem.map((it) => (
                <li key={it.id} className="m-0">
                  <Panel warna="kertas" className="px-4 py-4 sm:px-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="m-0 font-display text-xl font-bold leading-tight">{it.judul}</h3>
                      <span className="chip" style={it.terbit ? { background: '#dff0d2', color: '#1f4a12' } : { background: '#fde7b0', color: '#5c3600' }}>
                        {it.terbit ? 'Terbit' : 'Draf'}
                      </span>
                      <span className="chip" style={{ color: '#3b2f78' }}>
                        {rupiah(it.harga)}
                      </span>
                    </div>
                    <p className="m-0 mt-1 break-all text-sm" style={{ color: 'var(--tinta-redup)' }}>
                      ID: {it.id}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link to={`/baca/${it.id}`} className="tombol tombol-kecil" aria-label={`Baca ${it.judul} (pratinjau admin)`}>
                        <Ikon n="mata" ukuran={16} /> Baca
                      </Link>
                      <button type="button" className="tombol tombol-kecil" aria-label={`Ubah ${it.judul}`} onClick={() => setForm({ awal: it })}>
                        <Ikon n="edit" ukuran={16} /> Ubah
                      </button>
                      <button
                        type="button"
                        className="tombol tombol-kecil"
                        disabled={sibukId === it.id}
                        aria-label={`${it.terbit ? 'Jadikan draf' : 'Terbitkan'}: ${it.judul}`}
                        onClick={() =>
                          aksi(it, () => toko.adminAtur(it.id, { terbit: !it.terbit }), it.terbit ? `"${it.judul}" disembunyikan dari rak (Draf).` : `"${it.judul}" diterbitkan di rak.`)
                        }
                      >
                        {it.terbit ? 'Jadikan draf' : 'Terbitkan'}
                      </button>
                      <button type="button" className="tombol tombol-kecil tombol-bahaya" aria-label={`Hapus ${it.judul}`} onClick={() => setHapus(it)}>
                        <Ikon n="hapus" ukuran={16} /> Hapus
                      </button>
                    </div>
                  </Panel>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {hapus && (
        <Konfirmasi
          judul="Hapus ebook berbayar ini?"
          labelYa="Ya, hapus"
          bahaya
          onBatal={() => setHapus(null)}
          onYa={() => {
            const it = hapus
            setHapus(null)
            void aksi(it, () => toko.adminHapus(it.id), `"${it.judul}" dihapus dari toko.`)
          }}
        >
          <p className="m-0">
            “<strong>{hapus.judul}</strong>” dan isinya akan dihapus dari server. Tidak bisa dibatalkan.
          </p>
          <p className="m-0 mt-2 text-sm">Ebook yang sudah pernah dibeli tidak bisa dihapus (pembelinya akan kehilangan akses). Untuk itu, pakai “Jadikan draf”.</p>
        </Konfirmasi>
      )}
    </section>
  )
}
