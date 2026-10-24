import { Link } from 'react-router-dom'
import { NAMA_PENULIS_DEFAULT, NAMA_WEB } from '../config'
import { useIdentitas } from '../lib/legal/identitas'
import { bukaPengaturanCookie } from '../lib/persetujuan'

export function Footer() {
  const { pengelola, tahun } = useIdentitas()
  return (
    <footer className="wadah relative z-[2] pb-10 pt-12 text-center text-sm" style={{ color: 'var(--teks-redup)' }}>
      <p className="m-0">
        {NAMA_WEB} · catatan kuliah oleh {NAMA_PENULIS_DEFAULT}
      </p>
      <p className="m-0 mt-1 text-xs">
        © {tahun} {pengelola}. Seluruh hak dilindungi UU No. 28 Tahun 2014 tentang Hak Cipta.
      </p>
      <p className="m-0 mt-1 flex flex-wrap justify-center gap-x-5 gap-y-1">
        <Link to="/dasbor" className="inline-flex min-h-[44px] items-center underline underline-offset-4" style={{ color: 'var(--teks)' }}>
          Dasbor
        </Link>
        <Link to="/klien" className="inline-flex min-h-[44px] items-center underline underline-offset-4" style={{ color: 'var(--teks)' }}>
          Untuk peninjau
        </Link>
        <Link to="/kebijakan-privasi" className="inline-flex min-h-[44px] items-center underline underline-offset-4" style={{ color: 'var(--teks)' }}>
          Kebijakan Privasi
        </Link>
        <Link to="/syarat-ketentuan" className="inline-flex min-h-[44px] items-center underline underline-offset-4" style={{ color: 'var(--teks)' }}>
          Syarat &amp; Ketentuan
        </Link>
        <button type="button" onClick={bukaPengaturanCookie} className="inline-flex min-h-[44px] items-center underline underline-offset-4" style={{ color: 'var(--teks)' }}>
          Pengaturan cookie
        </button>
        <Link to="/admin" className="inline-flex min-h-[44px] items-center underline underline-offset-4" style={{ color: 'var(--teks)' }}>
          Ruang Redaksi
        </Link>
      </p>
    </footer>
  )
}
