import { Link } from 'react-router-dom'
import { useToko } from '../../lib/toko/store'
import { Ikon } from '../art/Ikon'
import { Panel } from '../art/Panel'

/** Muncul di akhir bab terakhir ebook gratis: ajak pembaca melihat rak dan (untuk tamu) membuat akun. */
export function AjakanLanjut() {
  const tk = useToko()
  const tamu = tk.mode !== 'mati' && !tk.sesi
  return (
    <Panel warna="kuning" miring={-0.4} className="mt-8 px-5 py-6 text-center" aria-label="Lanjut membaca">
      <p className="m-0 font-tangan text-2xl font-bold text-[#8a3d00]">suka sejauh ini?</p>
      <p className="m-0 font-display text-2xl font-black leading-tight">Masih ada catatan lain di rak</p>
      <p className="mx-auto mb-0 mt-2 max-w-md">
        {tamu ? 'Kamu baru mencoba satu ebook. Lihat ebook lainnya di rak, dan buat akun kalau mau membuka ebook berbayar.' : 'Lanjut ke ebook berikutnya di rak, atau baca ulang bab yang tadi kamu tandai.'}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Link to="/" className="tombol tombol-primer">
          <Ikon n="buku" ukuran={18} /> Lihat rak buku
        </Link>
        {tamu && (
          <Link to="/masuk?tab=daftar" className="tombol">
            <Ikon n="pengguna" ukuran={18} /> Buat akun
          </Link>
        )}
      </div>
    </Panel>
  )
}
