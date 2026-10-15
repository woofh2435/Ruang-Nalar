import { Link } from 'react-router-dom'
import { NAMA_PENULIS_DEFAULT, NAMA_WEB } from '../config'

export function Footer() {
  return (
    <footer className="wadah relative z-[2] pb-10 pt-12 text-center text-sm" style={{ color: 'var(--teks-redup)' }}>
      <p className="m-0">
        {NAMA_WEB} · catatan kuliah oleh {NAMA_PENULIS_DEFAULT}
      </p>
      <p className="m-0 mt-1">
        <Link to="/admin" className="underline underline-offset-4" style={{ color: 'var(--teks)' }}>
          Ruang Redaksi
        </Link>
      </p>
    </footer>
  )
}
