import { EMAIL_ADMIN_DEMO } from '../../lib/toko/demo'

/** Penanda jelas bahwa toko berjalan dalam mode DEMO (data palsu, tanpa uang sungguhan). */
export function BannerDemo({ className = '', admin = false }: { className?: string; admin?: boolean }) {
  return (
    <p className={`m-0 rounded-lg border-2 border-dashed p-3 text-sm ${className}`} style={{ borderColor: 'var(--tinta)', background: '#fff3d6', color: 'var(--tinta)' }} role="note">
      <strong>MODE DEMO.</strong> Akun dan pembayaran di sini palsu dan hanya tersimpan di browser ini. Tidak ada uang yang dipotong.
      {admin && (
        <>
          {' '}
          Akun admin demo: <code>{EMAIL_ADMIN_DEMO}</code> / <code>admin-demo-123</code>.
        </>
      )}
    </p>
  )
}
