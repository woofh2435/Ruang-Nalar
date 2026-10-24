import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Ikon } from '../art/Ikon'
import { Panel } from '../art/Panel'
import { SampulGambar } from '../art/Sampul'
import { useNalar } from '../nalar/NalarContext'
import { penulisTampil } from '../../lib/library'
import { ambilToko, dimiliki, useToko } from '../../lib/toko/store'
import { GalatToko, rupiah } from '../../lib/toko/tipe'
import type { Ebook } from '../../lib/types'
import { BannerDemo } from './BannerDemo'

function Memuat({ teks }: { teks: string }) {
  return (
    <div className="wadah grid min-h-[70vh] place-items-center pt-24" role="status">
      <p className="m-0 font-display text-xl font-bold">{teks}</p>
    </div>
  )
}

/**
 * Pintu ebook berbayar: tampil di halaman baca selama isinya belum bisa dibuka
 * (belum masuk / belum beli / sedang memuat). Isi ebook TIDAK ada di sini sama sekali.
 */
export function PintuToko({ ebook }: { ebook: Ebook }) {
  const tk = useToko()
  const toko = ambilToko()
  const { katakan } = useNalar()
  const [sibuk, setSibuk] = useState(false)
  const [galat, setGalat] = useState('')
  const [dialihkan, setDialihkan] = useState(false)
  const id = ebook.id
  const { meta } = ebook.parsed
  const berhak = dimiliki(tk, id)
  const statusIsi = tk.isiStatus[id]
  const tertunda = tk.pembelian.some((p) => p.ebookId === id && p.status === 'pending')
  const harga = ebook.harga ?? 0

  useEffect(() => {
    katakan('tokoKunci')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (berhak && tk.sesi && statusIsi === undefined) void toko.muatIsi(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [berhak, tk.sesi?.id, id, statusIsi])

  if (!tk.siap) return <Memuat teks="Memeriksa akunmu…" />
  if (tk.sesi && (tk.pembelianStatus === 'belum' || tk.pembelianStatus === 'memuat')) return <Memuat teks="Memeriksa pembelianmu…" />

  const bayar = async () => {
    if (sibuk) return
    setGalat('')
    setSibuk(true)
    try {
      const h = await toko.beli(id)
      if (h.jenis === 'alihkan') {
        setDialihkan(true)
        window.location.assign(h.url)
        return
      }
      katakan('tokoBeli')
    } catch (e) {
      const g = e instanceof GalatToko ? e : null
      setGalat(g ? g.message : 'Terjadi kesalahan. Coba lagi.')
      if (g?.kode === 'sudah_dibeli') void toko.muatPembelian()
      else katakan('tokoGalat')
    } finally {
      setSibuk(false)
    }
  }

  const sudahBeliTapiGagalMuat = berhak && (statusIsi === 'galat' || statusIsi === 'tidak_berhak' || tk.pembelianStatus === 'galat')

  const tujuan = encodeURIComponent(`/baca/${id}`)

  return (
    <div className="wadah pb-8 pt-20">
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-[minmax(0,260px)_1fr] md:items-start">
        <div className="mx-auto w-[min(260px,62vw)] md:mx-0 md:w-full">
          <SampulGambar meta={meta} id={id} />
        </div>
        <Panel warna="kertas" miring={0.5} className="px-5 py-6 sm:px-7">
          <p className="m-0 flex items-center gap-2 font-tangan text-2xl font-bold" style={{ color: '#8a3d00' }}>
            <Ikon n="kunci" ukuran={20} /> ebook berbayar
          </p>
          <h1 className="cat-judul m-0 font-display text-3xl font-black leading-tight sm:text-4xl">{meta.judul}</h1>
          {meta.subjudul && <p className="m-0 mt-1 text-lg font-semibold">{meta.subjudul}</p>}
          <p className="m-0 mt-1 italic">oleh {penulisTampil(ebook)}</p>
          {meta.deskripsi && <p className="mt-3">{meta.deskripsi}</p>}

          {tk.mode === 'demo' && <BannerDemo className="mt-3" />}

          <div className="mt-4 rounded-xl border-2 border-dashed p-4" style={{ borderColor: 'var(--tinta)', background: '#fff8e6' }}>
            {berhak ? (
              statusIsi === 'galat' || statusIsi === 'tidak_berhak' || sudahBeliTapiGagalMuat ? (
                <>
                  <p role="alert" className="m-0 font-bold" style={{ color: '#7a1608' }}>
                    {statusIsi === 'tidak_berhak' ? 'Isi ebook belum bisa dibuka untuk akunmu. Coba lagi sebentar lagi.' : 'Isi ebook gagal dimuat. Periksa koneksimu lalu coba lagi.'}
                  </p>
                  <button
                    type="button"
                    className="tombol tombol-primer mt-3"
                    onClick={() => {
                      void toko.muatPembelian()
                      void toko.muatIsi(id)
                    }}
                  >
                    <Ikon n="segar" ukuran={18} /> Coba lagi
                  </button>
                </>
              ) : (
                <p role="status" className="m-0 font-bold">
                  Membuka ebook…
                </p>
              )
            ) : (
              <>
                <p className="m-0 font-display text-3xl font-black">{rupiah(harga)}</p>
                <p className="m-0 mt-1 text-sm" style={{ color: 'var(--tinta-redup)' }}>
                  Sekali bayar. Setelah lunas, ebook ini terbuka di akunmu di perangkat mana pun.
                </p>

                {!tk.sesi ? (
                  <>
                    <p className="mt-3">Masuk dulu supaya pembelianmu tercatat di akunmu.</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <Link to={`/masuk?lanjut=${tujuan}`} className="tombol tombol-primer">
                        <Ikon n="pengguna" ukuran={18} /> Masuk
                      </Link>
                      <Link to={`/masuk?tab=daftar&lanjut=${tujuan}`} className="tombol">
                        Buat akun
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    {tertunda && (
                      <p role="status" className="mt-3 rounded-lg border-2 border-tinta p-3 text-sm" style={{ background: '#dbe7fb', color: '#14275f' }}>
                        Ada pembayaran untuk ebook ini yang masih menunggu. Kalau kamu sudah membayar, tunggu sebentar lalu periksa lagi di halaman akunmu.
                      </p>
                    )}
                    <p className="m-0 mt-3 text-sm">
                      Masuk sebagai <strong>{tk.sesi.email}</strong>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <button type="button" className="tombol tombol-primer" disabled={sibuk || dialihkan} aria-busy={sibuk} onClick={bayar}>
                        {dialihkan ? 'Mengarahkan ke pembayaran…' : sibuk ? 'Sebentar…' : tk.mode === 'demo' ? `Beli (demo) ${rupiah(harga)}` : `Beli ${rupiah(harga)}`}
                      </button>
                      {tertunda && (
                        <Link to="/akun" className="tombol">
                          Periksa di akunku
                        </Link>
                      )}
                    </div>
                    {tk.mode === 'nyata' && (
                      <p className="m-0 mt-3 text-xs" style={{ color: 'var(--tinta-redup)' }}>
                        Kamu akan diarahkan ke halaman pembayaran Midtrans. Metode yang tersedia mengikuti pengaturan Midtrans pemilik web. Data kartu atau rekeningmu tidak pernah melewati web ini.
                      </p>
                    )}
                    <p className="m-0 mt-1 text-xs" style={{ color: 'var(--tinta-redup)' }}>
                      Dengan membeli, kamu menyetujui{' '}
                      <Link to="/syarat-ketentuan" className="font-semibold underline underline-offset-4" style={{ color: 'var(--tautan)' }}>
                        Syarat &amp; Ketentuan
                      </Link>{' '}
                      (termasuk kebijakan pengembalian dana).
                    </p>
                  </>
                )}
                <p id="galat-bayar" role="alert" className="m-0 mt-3 min-h-[1.25rem] font-semibold" style={{ color: '#7a1608' }}>
                  {galat}
                </p>
              </>
            )}
          </div>

          <div className="mt-4">
            <Link to="/" className="tombol tombol-kecil">
              <Ikon n="kembali" ukuran={16} /> Kembali ke rak
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  )
}
