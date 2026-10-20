import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Panel } from '../components/art/Panel'
import { Nalar } from '../components/nalar/Nalar'
import { useNalar } from '../components/nalar/NalarContext'
import { useTemaGlobal } from '../lib/store'
import { kulitTemaGlobal } from '../lib/tema'
import { ambilToko, useToko } from '../lib/toko/store'
import { ambilTautanTertangkap, lupakanTautan } from '../lib/toko/tautan'
import { GalatToko } from '../lib/toko/tipe'
import { NotFound } from './NotFound'

/** Tujuan setelah email dikonfirmasi. */
const TUJUAN_KONFIRMASI = '/dasbor'

let sedangProses: Promise<string> | null = null

/** Menukar token dari tautan email (atur ulang sandi / konfirmasi akun) menjadi sesi masuk, lalu mengarahkan pengguna. */
export function TautanAkun() {
  const tk = useToko()
  const navigate = useNavigate()
  const [tema] = useTemaGlobal()
  const { katakan } = useNalar()
  const [pesan, setPesan] = useState('')
  const [kosong, setKosong] = useState(false)

  useEffect(() => {
    if (!tk.konfigSiap || tk.mode === 'mati' || !tk.siap) return
    const hasil = ambilTautanTertangkap()
    if (!hasil) {
      setKosong(true)
      return
    }
    if (hasil.tipe === 'galat') {
      setPesan(hasil.pesan)
      return
    }
    let batal = false
    // satu proses saja walau komponen dipasang dua kali (StrictMode)
    sedangProses ??= ambilToko()
      .pulihkanDariTautan(hasil.tautan)
      .then(() => (hasil.tautan.jenis === 'pemulihan' ? '/atur-sandi' : TUJUAN_KONFIRMASI))
    sedangProses
      .then((tujuan) => {
        lupakanTautan()
        sedangProses = null
        if (batal) return
        if (tujuan === TUJUAN_KONFIRMASI) katakan('tokoMasuk')
        navigate(tujuan, { replace: true })
      })
      .catch((err) => {
        sedangProses = null
        lupakanTautan()
        if (!batal) setPesan(err instanceof GalatToko ? err.message : 'Tautan ini tidak bisa dipakai. Minta tautan baru, ya.')
      })
    return () => {
      batal = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tk.konfigSiap, tk.mode, tk.siap])

  if (tk.mode === 'mati' && tk.konfigSiap) return <NotFound judul="Fitur akun belum aktif" pesan="Pemilik web belum menyalakan akun dan pembayaran." />

  return (
    <div className="wadah flex min-h-[85vh] flex-col items-center justify-center gap-6 pb-16 pt-24 text-center">
      <div className="w-[min(220px,58vw)]">
        <Nalar kulit={kulitTemaGlobal(tema)} ukuran="besar" gelembung={false} />
      </div>
      <Panel warna="kertas" miring={-0.6} className="w-full max-w-md px-5 py-6 sm:px-7">
        {pesan || kosong ? (
          <div role="alert">
            <h1 className="cat-judul m-0 font-display text-3xl font-black">{kosong ? 'Tautan tidak ditemukan' : 'Tautan tidak bisa dipakai'}</h1>
            <p className="mt-2">{kosong ? 'Halaman ini hanya terbuka lewat tautan di email. Buka lagi tautannya, atau minta yang baru.' : pesan}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link to="/lupa-sandi" className="tombol tombol-primer">
                Minta tautan baru
              </Link>
              <Link to="/masuk" className="tombol">
                Ke halaman masuk
              </Link>
            </div>
          </div>
        ) : (
          <div role="status">
            <h1 className="cat-judul m-0 font-display text-3xl font-black">Sebentar…</h1>
            <p className="mt-2">Nalar sedang memeriksa tautan dari emailmu.</p>
          </div>
        )}
      </Panel>
    </div>
  )
}
