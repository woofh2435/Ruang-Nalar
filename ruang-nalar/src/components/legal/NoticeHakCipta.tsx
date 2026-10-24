import { Link } from 'react-router-dom'
import { noticeHakCipta } from '../../lib/legal/dokumen'
import { useIdentitas } from '../../lib/legal/identitas'

/** Notice hak cipta di ujung setiap bab (Syarat & Ketentuan bagian 2). */
export function NoticeHakCipta({ penulis }: { penulis: string }) {
  const { tahun } = useIdentitas()
  return (
    <p className="m-0 mt-6 text-center text-xs leading-relaxed" style={{ color: 'var(--tinta-redup)' }} data-hak-cipta>
      {noticeHakCipta(penulis, tahun)} Dibaca untuk keperluan pribadi; tidak untuk disebarkan ulang.{' '}
      <Link to="/syarat-ketentuan" className="font-semibold underline underline-offset-4" style={{ color: 'var(--tautan)' }}>
        Syarat &amp; Ketentuan
      </Link>
    </p>
  )
}
