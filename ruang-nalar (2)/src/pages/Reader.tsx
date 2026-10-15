import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Ikon } from '../components/art/Ikon'
import { Panel, type WarnaPanel } from '../components/art/Panel'
import { Footer } from '../components/Footer'
import { PintuToko } from '../components/toko/PintuToko'
import { Nalar } from '../components/nalar/Nalar'
import { useNalar } from '../components/nalar/NalarContext'
import { BarKuas } from '../components/reader/BarKuas'
import { DataBacaProvider, useDataBaca } from '../components/reader/DataBaca'
import { IsiBab } from '../components/reader/Blok'
import { SorotToolbar } from '../components/reader/SorotToolbar'
import { NAMA_WEB } from '../config'
import { fx } from '../lib/fxbus'
import { useGerak } from '../lib/gerak'
import { penulisTampil, useEbook, useLencana } from '../lib/library'
import { cariPara } from '../lib/parser'
import { K, useKv } from '../lib/store'
import { useToko } from '../lib/toko/store'
import { TEMA, type Kulit } from '../lib/tema'
import type { Ebook, PosisiBaca, TemaId } from '../lib/types'
import { NotFound } from './NotFound'

const UKURAN_HURUF = [15, 16, 17, 18, 20, 22, 24, 26]
const WARNA_PANEL: Record<TemaId, WarnaPanel> = { malam: 'malam', siang: 'kuning', iris: 'ungu', almond: 'biru', api: 'jingga' }
const WARNA_BAR: Record<TemaId, [string, string, string]> = {
  malam: ['#2f4ba2', '#f6d24b', '#f26a1b'],
  siang: ['#4f7a3a', '#f6d24b', '#e8892b'],
  iris: ['#5b4b9a', '#4aa3c7', '#f6d24b'],
  almond: ['#4aa3c7', '#f4e9cf', '#e8892b'],
  api: ['#f26a1b', '#f6d24b', '#1c2b6b'],
}

const jepit = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x))

// ---------- Nalar di pojok bawah (kecil, bisa diminimalkan) ----------
function NalarSudut({ kulit }: { kulit: Kulit }) {
  const [tersimpan, setKecil] = useKv<boolean | null>(K.nalarKecil, null)
  const kecil = tersimpan ?? (typeof window !== 'undefined' && window.innerWidth < 640)
  return (
    <div className="pointer-events-none fixed bottom-2 right-2 z-40 flex justify-end">
      {kecil ? (
        <button
          type="button"
          className="tombol tombol-ikon pointer-events-auto"
          aria-label="Tampilkan Nalar"
          title="Tampilkan Nalar"
          onClick={() => setKecil(false)}
        >
          <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true" focusable="false">
            <circle cx="15" cy="19" r="11" fill={kulit.dasar} stroke="#1a1a2e" strokeWidth="2" />
            <circle cx="21" cy="12" r="6.5" fill={kulit.dasar} stroke="#1a1a2e" strokeWidth="2" />
            <circle cx="21" cy="12" r="3.4" fill="#fff" />
            <circle cx="21.9" cy="12.1" r="1.6" fill="#1a1a2e" />
          </svg>
        </button>
      ) : (
        <div className="pointer-events-auto relative w-[112px]">
          <button
            type="button"
            className="tombol-mini absolute -left-2 -top-2 z-10"
            aria-label="Minimalkan Nalar"
            title="Minimalkan Nalar"
            onClick={() => setKecil(true)}
          >
            <Ikon n="minimal" ukuran={14} tebal={3} />
          </button>
          <Nalar kulit={kulit} ukuran="kecil" cabang={false} gelembung="kiri-atas" />
        </div>
      )}
    </div>
  )
}

/** Dipasang setiap kali halaman (bab) baru tampil: atur posisi gulir setelah animasi balik halaman. */
function Halaman({ onMasuk, children }: { onMasuk: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const t = setTimeout(onMasuk, 40)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <>{children}</>
}

// ---------- isi pembaca ----------
function ReaderIsi({ ebook }: { ebook: Ebook }) {
  const { parsed } = ebook
  const { meta, bab } = parsed
  const n = bab.length
  const d = useDataBaca()
  const gerak = useGerak()
  const { katakan } = useNalar()
  const lencana = useLencana(ebook)
  const tema = TEMA[meta.tema]
  const [params, setParams] = useSearchParams()
  const [pos, setPos] = useKv<PosisiBaca | null>(K.posisi(ebook.id), null)
  const [huruf, setHuruf] = useKv<number>(K.fontBaca, 18)

  const [awal] = useState(() => {
    const q = Number(params.get('bab'))
    if (Number.isInteger(q) && q >= 1 && q <= n) return { idx: q - 1, pulih: false }
    if (pos && Number.isInteger(pos.bab) && pos.bab >= 0 && pos.bab < n) return { idx: pos.bab, pulih: pos.pct > 0.02 || pos.bab > 0 }
    return { idx: 0, pulih: false }
  })
  const [idx, setIdx] = useState(awal.idx)
  const [frac, setFrac] = useState(0)
  const [daftarBuka, setDaftarBuka] = useState(false)
  const arah = useRef(1)
  const pulih = useRef(awal.pulih)
  const tujuanPara = useRef<string | null>(null)
  const siapSimpan = useRef(false)
  const artikel = useRef<HTMLDivElement>(null)
  const judulRef = useRef<HTMLHeadingElement>(null)
  const pewaktuSimpan = useRef<ReturnType<typeof setTimeout>>()
  const babSaatIni = bab[idx]

  // judul tab browser
  useEffect(() => {
    const lama = document.title
    document.title = `${meta.judul} — ${NAMA_WEB}`
    return () => {
      document.title = lama
    }
  }, [meta.judul])

  const posisikan = useCallback(() => {
    const el = artikel.current
    if (!el) return
    const atas = el.getBoundingClientRect().top + window.scrollY
    const perilaku: ScrollBehavior = gerak.kurang ? 'auto' : 'smooth'
    if (tujuanPara.current) {
      const p = document.getElementById('p-' + tujuanPara.current)
      tujuanPara.current = null
      if (p) {
        p.scrollIntoView({ block: 'center', behavior: perilaku })
        p.classList.add('para-lompat')
        setTimeout(() => p.classList.remove('para-lompat'), 2200)
        return
      }
    }
    if (pulih.current && pos) {
      pulih.current = false
      const tinggi = Math.max(1, el.offsetHeight - window.innerHeight * 0.5)
      window.scrollTo({ top: atas + jepit(pos.pct) * tinggi - 8, behavior: 'auto' })
      return
    }
    pulih.current = false
    if (window.scrollY > atas - 90) window.scrollTo({ top: Math.max(0, atas - 90), behavior: 'auto' })
  }, [gerak.kurang, pos])

  // hitung kemajuan gulir + simpan posisi (di IndexedDB)
  useEffect(() => {
    let raf = 0
    const hitung = () => {
      raf = 0
      const el = artikel.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const atas = r.top + window.scrollY
      setFrac(jepit((window.scrollY + window.innerHeight - atas) / Math.max(1, r.height)))
      if (!siapSimpan.current) return
      const pct = jepit((window.scrollY - atas) / Math.max(1, r.height - window.innerHeight * 0.5))
      clearTimeout(pewaktuSimpan.current)
      pewaktuSimpan.current = setTimeout(() => setPos({ bab: idx, pct, t: Date.now() }), 500)
    }
    const saatGulir = () => {
      if (!raf) raf = requestAnimationFrame(hitung)
    }
    window.addEventListener('scroll', saatGulir, { passive: true })
    window.addEventListener('resize', saatGulir)
    saatGulir()
    return () => {
      window.removeEventListener('scroll', saatGulir)
      window.removeEventListener('resize', saatGulir)
      cancelAnimationFrame(raf)
      clearTimeout(pewaktuSimpan.current)
    }
  }, [idx, setPos])

  const pindah = useCallback(
    (i: number, paraId?: string) => {
      if (i < 0 || i >= n) return
      tujuanPara.current = paraId ?? null
      if (i === idx) {
        if (paraId) posisikan()
        return
      }
      arah.current = i > idx ? 1 : -1
      pulih.current = false
      siapSimpan.current = false
      setIdx(i)
      setFrac(0)
      setDaftarBuka(false)
      setParams({ bab: String(i + 1) }, { replace: true })
      setTimeout(() => katakan('babBaru'), gerak.kurang ? 100 : 500)
    },
    [n, idx, posisikan, setParams, katakan, gerak.kurang],
  )

  const saatHalamanMasuk = useCallback(() => {
    posisikan()
    setTimeout(() => {
      siapSimpan.current = true
    }, 700)
  }, [posisikan])

  const selesaiSet = useMemo(() => new Set(d.selesai.filter((i) => i >= 0 && i < n)), [d.selesai, n])
  const sudahIni = selesaiSet.has(idx)
  const persen = n === 0 ? 0 : ((selesaiSet.size + (sudahIni ? 0 : frac)) / n) * 100

  const tandaiSelesai = () => {
    if (sudahIni) return
    d.tandaiSelesai(idx)
    fx.kelopak()
    katakan(new Set([...selesaiSet, idx]).size === n ? 'selesaiBuku' : 'selesaiBab')
  }

  const ukuranIdx = Math.max(0, UKURAN_HURUF.indexOf(huruf) >= 0 ? UKURAN_HURUF.indexOf(huruf) : UKURAN_HURUF.findIndex((u) => u >= huruf))
  const ubahHuruf = (delta: number) => setHuruf(UKURAN_HURUF[jepit(ukuranIdx + delta, 0, UKURAN_HURUF.length - 1)])

  const penandaDaftar = useMemo(
    () =>
      d.penanda
        .map((id) => ({ id, hasil: cariPara(parsed, id) }))
        .filter((x): x is { id: string; hasil: NonNullable<ReturnType<typeof cariPara>> } => !!x.hasil)
        .sort((a, b) => a.hasil.babIdx - b.hasil.babIdx || a.id.localeCompare(b.id, undefined, { numeric: true })),
    [d.penanda, parsed],
  )

  const alasanPanel = WARNA_PANEL[meta.tema]
  const geserMasuk = gerak.kurang ? { opacity: 0 } : { opacity: 0, rotateY: arah.current > 0 ? 62 : -62, x: arah.current > 0 ? 30 : -30 }
  const geserKeluar = gerak.kurang ? { opacity: 0 } : { opacity: 0, rotateY: arah.current > 0 ? -62 : 62, x: arah.current > 0 ? -30 : 30 }

  if (n === 0) {
    return (
      <div className="wadah pb-16 pt-24">
        <Panel warna="kertas" miring={-0.5} className="mx-auto max-w-xl px-6 py-8 text-center">
          <h1 className="cat-judul m-0 font-display text-3xl font-black">{meta.judul}</h1>
          <p className="mt-3">
            Ebook ini belum punya bab. Mulai setiap bab dengan baris <code># Judul Bab</code>.
          </p>
          <Link to="/" className="tombol tombol-primer mt-3">
            Kembali ke rak buku
          </Link>
        </Panel>
      </div>
    )
  }

  return (
    <>
      <div className="wadah pb-44 pt-16 sm:pb-32">
        {/* kepala ebook */}
        <header className="mb-6">
          <Link to="/" className="mb-3 inline-flex min-h-[44px] items-center gap-1 font-semibold underline-offset-4 hover:underline" style={{ color: 'var(--teks)' }}>
            <Ikon n="kembali" ukuran={18} />
            Rak buku
          </Link>
          <Panel warna={alasanPanel} miring={-0.5} className="px-5 py-5 sm:px-8">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="text-5xl leading-none" aria-hidden="true" style={{ fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}>
                {meta.ikon}
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="cat-judul m-0 font-display text-3xl font-black leading-tight sm:text-4xl">{meta.judul}</h1>
                {meta.subjudul && <p className="m-0 mt-0.5 text-lg font-semibold">{meta.subjudul}</p>}
                <p className="m-0 mt-1 text-sm italic">oleh {penulisTampil(ebook)}</p>
              </div>
            </div>
            {(meta.status === 'draf' || lencana.selesaiDibaca || lencana.kuisSempurna || meta.tag.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {meta.status === 'draf' && <span className="chip" style={{ background: 'var(--kertas)', color: 'var(--tinta)', borderColor: 'var(--tinta)' }}>Draf: hanya terlihat olehmu</span>}
                {lencana.selesaiDibaca && (
                  <span className="chip" style={{ background: 'var(--kuning-pusaran)', color: 'var(--tinta)', borderColor: 'var(--tinta)' }}>
                    <Ikon n="cek" ukuran={12} tebal={3} /> Selesai Dibaca
                  </span>
                )}
                {lencana.kuisSempurna && (
                  <span className="chip" style={{ background: 'var(--tinta)', color: 'var(--kuning-pusaran)', borderColor: 'var(--kuning-pusaran)' }}>
                    <Ikon n="bintang" ukuran={12} tebal={2.5} /> Kuis Sempurna
                  </span>
                )}
                {meta.tag.map((t) => (
                  <span key={t} className="chip">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </Panel>
        </header>

        {/* progress bar sapuan kuas (menempel di atas saat menggulir) */}
        <div
          className="sticky top-0 z-30 -mx-4 mb-6 px-4 py-2 pr-[112px] backdrop-blur-sm md:-mx-8 md:px-8 md:pr-[120px]"
          style={{ background: 'color-mix(in srgb, var(--latar-solid) 82%, transparent)' }}
        >
          <div className="flex items-center gap-3">
            <p className="m-0 shrink-0 whitespace-nowrap text-sm font-bold" style={{ color: 'var(--teks)' }}>
              Bab {idx + 1}/{n}
            </p>
            <div className="min-w-0 flex-1">
              <BarKuas persen={persen} warna={WARNA_BAR[meta.tema]} label={`Kemajuan membaca ${meta.judul}`} />
            </div>
            <p className="m-0 w-10 shrink-0 text-right text-sm font-bold tabular-nums" style={{ color: 'var(--teks)' }}>
              {Math.round(persen)}%
            </p>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8">
          {/* sidebar: daftar bab, penanda, ukuran huruf */}
          <aside className="lg:sticky lg:top-20" aria-label="Navigasi ebook">
            <button
              type="button"
              className="tombol tombol-kecil w-full lg:hidden"
              aria-expanded={daftarBuka}
              aria-controls="panel-daftar-bab"
              onClick={() => setDaftarBuka((b) => !b)}
            >
              <Ikon n="menu" ukuran={18} />
              {daftarBuka ? 'Tutup daftar bab' : 'Daftar bab & penanda'}
            </button>
            <div id="panel-daftar-bab" className={`${daftarBuka ? 'mt-3 block' : 'hidden'} lg:mt-0 lg:block`}>
              <Panel warna="kertas" miring={0.4} className="px-4 py-4">
                <nav aria-label="Daftar bab">
                  <h2 className="m-0 mb-2 font-display text-lg font-bold">Daftar bab</h2>
                  <ol className="m-0 flex list-none flex-col gap-1 p-0">
                    {bab.map((b, i) => {
                      const aktif = i === idx
                      const selesai = selesaiSet.has(i)
                      return (
                        <li key={b.id} className="m-0">
                          <button
                            type="button"
                            aria-current={aktif ? 'page' : undefined}
                            className="flex min-h-[44px] w-full items-start gap-2 rounded-lg border-2 px-2.5 py-2 text-left text-[0.95rem] leading-snug"
                            style={{
                              borderColor: aktif ? 'var(--tinta)' : 'transparent',
                              background: aktif ? 'var(--kuning-pusaran)' : 'transparent',
                              fontWeight: aktif ? 700 : 500,
                              cursor: 'pointer',
                              color: 'var(--tinta)',
                            }}
                            onClick={() => pindah(i)}
                          >
                            <span
                              className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-tinta"
                              style={{ background: selesai ? 'var(--hijau-daun)' : '#fffaf0', color: '#fff' }}
                              aria-hidden="true"
                            >
                              {selesai && <Ikon n="cek" ukuran={12} tebal={3.5} />}
                            </span>
                            <span className="min-w-0 flex-1">
                              {b.judul}
                              {selesai && <span className="sr-only"> (selesai)</span>}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ol>
                </nav>

                <div className="mt-4 border-t-2 border-dashed border-tinta pt-3">
                  <h2 className="m-0 mb-1 flex items-center gap-1.5 font-display text-lg font-bold">
                    <Ikon n="penanda" ukuran={18} /> Penanda
                  </h2>
                  {penandaDaftar.length === 0 ? (
                    <p className="m-0 text-sm" style={{ color: 'var(--tinta-redup)' }}>
                      Belum ada. Pilih teks lalu ketuk ikon penanda.
                    </p>
                  ) : (
                    <ul className="m-0 flex list-none flex-col gap-1 p-0">
                      {penandaDaftar.map(({ id, hasil }) => (
                        <li key={id} className="m-0">
                          <button
                            type="button"
                            className="min-h-[44px] w-full rounded-lg border-2 border-transparent px-2.5 py-1.5 text-left text-sm leading-snug hover:border-tinta"
                            style={{ cursor: 'pointer', color: 'var(--tinta)', background: 'transparent' }}
                            onClick={() => pindah(hasil.babIdx, id)}
                          >
                            <span className="block text-xs font-bold" style={{ color: 'var(--kobalt)' }}>
                              Bab {hasil.babIdx + 1}
                            </span>
                            {hasil.para.teks.length > 64 ? hasil.para.teks.slice(0, 64) + '…' : hasil.para.teks}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-4 border-t-2 border-dashed border-tinta pt-3">
                  <h2 className="m-0 mb-2 font-display text-lg font-bold">Ukuran huruf</h2>
                  <div className="flex items-center gap-2" role="group" aria-label="Ukuran huruf bacaan">
                    <button type="button" className="tombol tombol-ikon" style={{ width: 44 }} aria-label="Perkecil huruf" disabled={ukuranIdx === 0} onClick={() => ubahHuruf(-1)}>
                      <Ikon n="hurufKecil" ukuran={18} />
                    </button>
                    <span className="min-w-[3.5rem] text-center font-bold tabular-nums" role="status" aria-live="polite">
                      {UKURAN_HURUF[ukuranIdx]} px
                    </span>
                    <button type="button" className="tombol tombol-ikon" style={{ width: 44 }} aria-label="Perbesar huruf" disabled={ukuranIdx === UKURAN_HURUF.length - 1} onClick={() => ubahHuruf(1)}>
                      <Ikon n="plus" ukuran={18} />
                    </button>
                  </div>
                </div>
              </Panel>
            </div>
          </aside>

          {/* halaman: animasi balik halaman antarbab */}
          <div style={{ perspective: 1600 }} className="min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={idx}
                initial={geserMasuk}
                animate={{ opacity: 1, rotateY: 0, x: 0 }}
                exit={geserKeluar}
                transition={{ duration: gerak.kurang ? 0.15 : 0.34, ease: 'easeInOut' }}
                style={{ transformOrigin: arah.current > 0 ? 'left center' : 'right center' }}
                onAnimationComplete={() => {
                  if (document.activeElement === document.body) judulRef.current?.focus({ preventScroll: true })
                }}
              >
                <Halaman onMasuk={saatHalamanMasuk}>
                <div ref={artikel}>
                  <Panel as="article" warna="kertas" className="px-5 py-7 sm:px-10 sm:py-10 lg:pr-16" aria-labelledby={`judul-${babSaatIni.id}`}>
                    <div className="mx-auto max-w-[44rem]">
                      <p className="m-0 font-tangan text-2xl font-bold" style={{ color: '#8a3d00' }}>
                        bab {idx + 1} dari {n}
                      </p>
                      <h2
                        id={`judul-${babSaatIni.id}`}
                        ref={judulRef}
                        tabIndex={-1}
                        className="cat-judul mb-6 mt-0 font-display text-3xl font-black leading-tight outline-none sm:text-4xl"
                      >
                        {babSaatIni.judul}
                      </h2>
                      <div className="baca" style={{ ['--ukuran-baca' as string]: `${UKURAN_HURUF[ukuranIdx]}px` }}>
                        {babSaatIni.blok.length === 0 ? (
                          <p style={{ color: 'var(--tinta-redup)' }}>Bab ini belum ada isinya.</p>
                        ) : (
                          <IsiBab bab={babSaatIni} />
                        )}
                      </div>

                      {/* navigasi bawah + selesai bab */}
                      <nav aria-label="Pindah bab" className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-tinta pt-6">
                        <button type="button" className="tombol" disabled={idx === 0} onClick={() => pindah(idx - 1)}>
                          <Ikon n="kiri" ukuran={18} /> Bab sebelumnya
                        </button>
                        {sudahIni ? (
                          <span className="chip order-first w-full justify-center py-1.5 text-sm sm:order-none sm:w-auto" style={{ color: '#1f4a12' }}>
                            <Ikon n="cek" ukuran={14} tebal={3} /> Bab ini sudah selesai
                          </span>
                        ) : (
                          <button type="button" className="tombol tombol-primer order-first w-full sm:order-none sm:w-auto" onClick={tandaiSelesai}>
                            <Ikon n="cek" ukuran={18} /> Selesai bab ini
                          </button>
                        )}
                        {idx < n - 1 ? (
                          <button type="button" className="tombol" onClick={() => pindah(idx + 1)}>
                            Bab berikutnya <Ikon n="kanan" ukuran={18} />
                          </button>
                        ) : (
                          <Link to="/" className="tombol">
                            Kembali ke rak
                          </Link>
                        )}
                      </nav>
                    </div>
                  </Panel>
                </div>
                </Halaman>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      <Footer />
      <SorotToolbar kunciBab={idx} />
      <NalarSudut kulit={tema.kulit} />
    </>
  )
}

export function Reader() {
  const { id } = useParams()
  const ebook = useEbook(id)
  const tk = useToko()
  // ebook berbayar belum tentu sudah termuat (katalog diambil dari server): jangan buru-buru bilang "tidak ketemu"
  if (!ebook && tk.mode !== 'mati' && (tk.katalogStatus === 'belum' || tk.katalogStatus === 'memuat')) {
    return (
      <div className="wadah grid min-h-[70vh] place-items-center pt-24" role="status">
        <p className="font-display text-xl font-bold">Memuat ebook…</p>
      </div>
    )
  }
  if (ebook && ebook.sumber === 'toko' && ebook.terkunci) return <PintuToko ebook={ebook} />
  if (!ebook) return <NotFound judul="Ebook tidak ketemu" pesan="Mungkin ebooknya sudah dihapus, atau alamatnya salah ketik." />
  return (
    <DataBacaProvider ebookId={ebook.id}>
      <ReaderIsi key={ebook.id} ebook={ebook} />
    </DataBacaProvider>
  )
}
