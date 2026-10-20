import { Link } from 'react-router-dom'
import { NAMA_PENULIS_DEFAULT, NAMA_WEB } from '../config'

export function Footer() {
  return (
    <footer className="wadah relative z-[2] pb-10 pt-12 text-center text-sm" style={{ color: 'var(--teks-redup)' }}>
      <p className="m-0">
        {NAMA_WEB} · catatan kuliah oleh {NAMA_PENULIS_DEFAULT}
      </p>
      <p className="m-0 mt-1 flex flex-wrap justify-center gap-x-5 gap-y-1">
        <Link to="/dasbor" className="inline-flex min-h-[44px] items-center underline underline-offset-4" style={{ color: 'var(--teks)' }}>
          Dasbor
        </Link>
        <Link to="/klien" className="inline-flex min-h-[44px] items-center underline underline-offset-4" style={{ color: 'var(--teks)' }}>
          Untuk peninjau
        </Link>
        <Link to="/admin" className="inline-flex min-h-[44px] items-center underline underline-offset-4" style={{ color: 'var(--teks)' }}>
          Ruang Redaksi
        </Link>
      </p>
    </footer>
  )
}
