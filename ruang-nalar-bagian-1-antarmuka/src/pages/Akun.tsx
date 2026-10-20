import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { Ikon } from '../components/art/Ikon'
import { Panel } from '../components/art/Panel'
import { Footer } from '../components/Footer'
import { Nalar } from '../components/nalar/Nalar'
import { useNalar } from '../components/nalar/NalarContext'
import { BannerDemo } from '../components/toko/BannerDemo'
import { FormGantiSandi } from '../components/toko/FormGantiSandi'
import { useTemaGlobal } from '../lib/store'
import { kulitTemaGlobal } from '../lib/tema'
import { ambilToko, useToko } from '../lib/toko/store'
import { GalatToko, rupiah, type Pembelian } from '../lib/toko/tipe'
import { NotFound } from './NotFound'

const JEDA_PERIKSA_MS = 4000
const BATAS_PERIKSA = 30 // sekitar 2 menit

const LABEL: Record<Pembelian['status'], { teks: string; bg: string; fg: string }> = {
  lunas: { teks: 'Lunas', bg: '#dff0d2', fg: '#1f4a12' },
  pending: { teks: 'Menunggu pembayaran', bg: '#fde7b0', fg: '#5c3600' },
  gagal: { teks: 'Gagal / kedaluwarsa', bg: '#fbd9c8', fg: '#5a1306' },
}

const tanggal = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

/** `tanpaKepala`: dipakai di dalam dasbor (kepala, ganti sandi, dan footer sudah disediakan halaman pembungkusnya). */
export function Akun({ tanpaKepala = false }: { tanpaKepala?: boolean } = {}) {
  const tk = useToko()
  const toko = ambilToko()
  const lokasi = useLocation()
  const [params] = useSearchParams()
  const [tema] = useTemaGlobal()
  const { katakan } = useNalar()
  const [sibukKeluar, setSibukKeluar] = useState(false)
  const [galat, setGalat] = useState('')
  const [periksa, setPeriksa] = useState(0)
  const [habis, setHabis] = useState(false)
  const lunasSebelumnya = useRef<Set<string> | null>(null)

  // Midtrans mengembalikan pembeli dengan ?order_id=...; kadang di hash, kadang di query biasa.
  // Nilai ini HANYA memicu pemeriksaan ulang; status sebenarnya selalu dibaca dari database.
  const orderId = params.get('order_id') ?? new URLSearchParams(window.location.search).get('order_id')
  const adaPending = tk.pembelian.some((p) => p.status === 'pending')
  const perluPantau = !!tk.sesi && (!!orderId || adaPending)

  // muat pembelian saat halaman dibuka
  useEffect(() => {
    if (tk.sesi) void toko.muatPembelian()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tk.sesi?.id])

  // pantau status selama masih ada yang menunggu
  useEffect(() => {
    if (!perluPantau || tk.pembelianStatus === 'belum') return
    const stillPending = adaPending || (!!orderId && !tk.pembelian.some((p) => p.orderId === orderId && p.status !== 'pending'))
    if (!stillPending) return
    if (periksa >= BATAS_PERIKSA) {
      setHabis(true)
      return
    }
    const t = setTimeout(() => {
      setPeriksa((n) => n + 1)
      void toko.muatPembelian()
    }, JEDA_PERIKSA_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perluPantau, periksa, tk.pembelian, tk.pembelianStatus, adaPending, orderId])

  // rayakan saat ada pembelian yang baru menjadi lunas
  useEffect(() => {
    const kini = new Set(tk.pembelian.filter((p) => p.status === 'lunas').map((p) => p.id))
    if (lunasSebelumnya.current && [...kini].some((id) => !lunasSebelumnya.current!.has(id))) katakan('tokoBeli')
    if (tk.pembelianStatus === 'siap') lunasSebelumnya.current = kini
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tk.pembelian, tk.pembelianStatus])

  if (tk.mode === 'mati') return <NotFound judul="Fitur akun belum aktif" pesan="Pemilik web belum menyalakan akun dan pembayaran." />
  if (!tk.siap) {
    return (
      <div className="wadah grid min-h-[70vh] place-items-center pt-24" role="status">
        <p className="font-display text-xl font-bold">Memeriksa akunmu…</p>
      </div>
    )
  }
  if (!tk.sesi) return <Navigate to={`/masuk?lanjut=${encodeURIComponent(lokasi.pathname + lokasi.search)}`} replace />

  const judulDari = (ebookId: string) => tk.katalog.find((k) => k.id === ebookId)?.judul ?? ebookId

  const keluar = async () => {
    setSibukKeluar(true)
    setGalat('')
    try {
      await toko.keluar()
      katakan('tokoKeluar')
    } catch (e) {
      setGalat(e instanceof GalatToko ? e.message : 'Gagal keluar. Coba lagi.')
    } finally {
      setSibukKeluar(false)
    }
  }

  const periksaSekarang = () => {
    setHabis(false)
    setPeriksa(0)
    void toko.muatPembelian()
  }

  const urut = [...tk.pembelian].sort((a, b) => b.dibuat.localeCompare(a.dibuat))
  const sedangMenunggu = perluPantau && !habis && (adaPending || (!!orderId && !tk.pembelian.some((p) => p.orderId === orderId && p.status !== 'pending')))

  return (
    <>
      <div className={tanpaKepala ? '' : 'wadah pb-8 pt-20'}>
        {!tanpaKepala && (
        <header className="mb-6 grid items-center gap-4 sm:grid-cols-[1fr_auto]">
          <Panel warna="kertas" miring={-0.6} className="px-5 py-5 sm:px-7">
            <p className="m-0 font-tangan text-2xl font-bold" style={{ color: '#8a3d00' }}>
              halo, pembaca!
            </p>
            <h1 className="cat-judul m-0 font-display text-4xl font-black sm:text-5xl">Akunku</h1>
            <p className="m-0 mt-2">
              Masuk sebagai <strong className="break-all">{tk.sesi.email}</strong>
              {tk.sesi.admin && (
                <span className="chip ml-2" style={{ background: '#e4dcf8', color: '#2d1f66' }}>
                  Admin
                </span>
              )}
            </p>
            {tk.mode === 'demo' && <BannerDemo className="mt-3" />}
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/" className="tombol tombol-kecil">
                <Ikon n="kembali" ukuran={16} /> Ke rak buku
              </Link>
              {tk.sesi.admin && (
                <Link to="/admin" className="tombol tombol-kecil">
                  <Ikon n="edit" ukuran={16} /> Kelola toko
                </Link>
              )}
              <button type="button" className="tombol tombol-kecil" disabled={sibukKeluar} onClick={keluar}>
                <Ikon n="keluar" ukuran={16} /> {sibukKeluar ? 'Keluar…' : 'Keluar'}
              </button>
            </div>
            <p role="alert" className="m-0 mt-2 font-semibold" style={{ color: '#7a1608' }}>
              {galat}
            </p>
          </Panel>
          <div className="mx-auto mt-14 w-[min(200px,55vw)] sm:mx-0 sm:mt-0 sm:w-[200px]">
            <Nalar kulit={kulitTemaGlobal(tema)} ukuran="besar" gelembung="atas" />
          </div>
        </header>
        )}

        {!tanpaKepala && (
          <section aria-labelledby="judul-sandi" className="mb-10">
            <details>
              <summary id="judul-sandi" className="cursor-pointer font-display text-2xl font-black leading-tight" style={{ color: 'var(--teks)' }}>
                Ganti kata sandi
              </summary>
              <Panel warna="kertas" className="mt-3 max-w-md px-5 py-5">
                <FormGantiSandi />
              </Panel>
            </details>
          </section>
        )}

        <section aria-labelledby="judul-pembelian">
          <h2 id="judul-pembelian" className="m-0 font-display text-3xl font-black" style={{ color: 'var(--teks)' }}>
            Pembelianku
          </h2>

          <div role="status" aria-live="polite">
            {sedangMenunggu && (
              <p className="mt-3 rounded-xl border-2 border-tinta p-3 font-semibold" style={{ background: '#dbe7fb', color: '#14275f' }}>
                Memeriksa status pembayaranmu… Biasanya hanya beberapa detik. Halaman ini memperbarui dirinya sendiri.
              </p>
            )}
            {habis && (
              <div className="mt-3 rounded-xl border-2 border-tinta p-3" style={{ background: '#fde7b0', color: '#4a2c00' }}>
                <p className="m-0 font-semibold">Pembayaran belum terkonfirmasi.</p>
                <p className="m-0 mt-1 text-sm">
                  Kalau kamu sudah membayar, kadang butuh beberapa menit (terutama transfer bank). Tekan “Periksa lagi” nanti. Kalau uangmu sudah terpotong tapi ebook tetap terkunci setelah lama, hubungi pemilik web dan sebutkan Order ID di bawah.
                </p>
              </div>
            )}
          </div>

          {tk.pembelianStatus === 'galat' && (
            <p role="alert" className="mt-3 font-semibold" style={{ color: '#ffd9c9' }}>
              Daftar pembelian gagal dimuat. Periksa koneksimu lalu coba lagi.
            </p>
          )}

          {urut.length === 0 && tk.pembelianStatus !== 'memuat' && tk.pembelianStatus !== 'belum' ? (
            <Panel warna="kertas" className="mt-4 px-6 py-8 text-center">
              <p className="m-0 font-display text-2xl font-bold">Belum ada pembelian</p>
              <p className="mt-2">Ebook berbayar yang kamu beli akan muncul di sini dan terbuka otomatis setelah lunas.</p>
              <Link to="/" className="tombol tombol-primer mt-3">
                Lihat rak buku
              </Link>
            </Panel>
          ) : (
            <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
              {urut.map((p) => {
                const l = LABEL[p.status]
                return (
                  <li key={p.id} className="m-0">
                    <Panel warna="kertas" className="px-4 py-4 sm:px-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="m-0 font-display text-xl font-bold leading-tight">{judulDari(p.ebookId)}</h3>
                          <p className="m-0 mt-1 text-sm" style={{ color: 'var(--tinta-redup)' }}>
                            {rupiah(p.jumlah)} · {tanggal(p.dibuat)}
                          </p>
                          <p className="m-0 mt-1 break-all text-xs" style={{ color: 'var(--tinta-redup)' }}>
                            Order ID: {p.orderId}
                          </p>
                        </div>
                        <span className="chip shrink-0" style={{ background: l.bg, color: l.fg }}>
                          {l.teks}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {p.status === 'lunas' ? (
                          <Link to={`/baca/${p.ebookId}`} className="tombol tombol-kecil tombol-primer" aria-label={`Baca ${judulDari(p.ebookId)}`}>
                            <Ikon n="buku" ukuran={16} /> Baca sekarang
                          </Link>
                        ) : (
                          <Link to={`/baca/${p.ebookId}`} className="tombol tombol-kecil" aria-label={`Buka halaman ${judulDari(p.ebookId)}`}>
                            Buka halaman ebook
                          </Link>
                        )}
                      </div>
                    </Panel>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="mt-4">
            <button type="button" className="tombol tombol-kecil" onClick={periksaSekarang}>
              <Ikon n="segar" ukuran={16} /> Periksa lagi
            </button>
          </div>
        </section>
      </div>
      {!tanpaKepala && <Footer />}
    </>
  )
}
