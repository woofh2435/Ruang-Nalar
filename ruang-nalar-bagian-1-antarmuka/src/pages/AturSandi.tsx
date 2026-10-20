import { Link, useNavigate } from 'react-router-dom'
import { Ikon } from '../components/art/Ikon'
import { Panel } from '../components/art/Panel'
import { FormGantiSandi } from '../components/toko/FormGantiSandi'
import { Nalar } from '../components/nalar/Nalar'
import { useTemaGlobal } from '../lib/store'
import { kulitTemaGlobal } from '../lib/tema'
import { useToko } from '../lib/toko/store'
import { NotFound } from './NotFound'

/** Halaman tujuan setelah pengguna membuka tautan atur ulang sandi dari email (sesi pemulihan sudah aktif). */
export function AturSandi() {
  const tk = useToko()
  const navigate = useNavigate()
  const [tema] = useTemaGlobal()

  if (tk.mode === 'mati') return <NotFound judul="Fitur akun belum aktif" pesan="Pemilik web belum menyalakan akun dan pembayaran." />
  if (!tk.siap) {
    return (
      <div className="wadah grid min-h-[70vh] place-items-center pt-24" role="status">
        <p className="font-display text-xl font-bold">Memeriksa akunmu…</p>
      </div>
    )
  }

  return (
    <div className="wadah flex min-h-[85vh] flex-col items-center justify-center gap-6 pb-16 pt-24">
      <div className="w-[min(220px,58vw)]">
        <Nalar kulit={kulitTemaGlobal(tema)} ukuran="besar" gelembung="atas" />
      </div>
      <Panel warna="kertas" miring={0.6} className="w-full max-w-md px-5 py-6 sm:px-7">
        <p className="m-0 flex items-center gap-2 font-tangan text-2xl font-bold" style={{ color: '#8a3d00' }}>
          <Ikon n="kunci" ukuran={20} /> sandi baru
        </p>
        <h1 className="cat-judul m-0 font-display text-4xl font-black">Buat kata sandi baru</h1>
        {tk.sesi ? (
          <div className="mt-4">
            <p className="m-0 mb-3 text-[0.95rem]">
              Untuk akun <strong className="break-all">{tk.sesi.email}</strong>.
            </p>
            <FormGantiSandi onSelesai={() => setTimeout(() => navigate('/dasbor/akun', { replace: true }), 1400)} />
          </div>
        ) : (
          <div className="mt-4" role="status">
            <p className="m-0">Sesi pemulihanmu belum aktif atau sudah habis. Minta tautan baru dari email, ya.</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link to="/lupa-sandi" className="tombol tombol-primer">
                Minta tautan baru
              </Link>
              <Link to="/masuk" className="tombol">
                Ke halaman masuk
              </Link>
            </div>
          </div>
        )}
      </Panel>
    </div>
  )
}
