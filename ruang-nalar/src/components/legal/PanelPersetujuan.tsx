import { useId } from 'react'
import { Link } from 'react-router-dom'
import { NalarStiker } from '../art/NalarStiker'
import { Panel } from '../art/Panel'
import { useTemaGlobal } from '../../lib/store'
import { kulitTemaGlobal } from '../../lib/tema'

interface Props {
  setuju: boolean
  promo: boolean
  onSetuju: (v: boolean) => void
  onPromo: (v: boolean) => void
  /** tampilkan penanda bahwa kotak wajib belum dicentang */
  perluSetuju?: boolean
}

/**
 * "Surat persetujuan" dari Nalar di form daftar. Kotak TIDAK tercentang dari awal (opt-in, UU PDP),
 * persetujuan wajib dipisah dari yang opsional, dan tautan dokumen dibuka di tab baru supaya isian form tidak hilang.
 */
export function PanelPersetujuan({ setuju, promo, onSetuju, onPromo, perluSetuju }: Props) {
  const [tema] = useTemaGlobal()
  const idSetuju = useId()
  const idPromo = useId()
  const idHint = useId()
  const tautan = { className: 'font-semibold underline underline-offset-4', style: { color: 'var(--tautan)' }, target: '_blank', rel: 'noopener noreferrer' } as const
  return (
    <Panel warna="kuning" miring={0.5} className="mt-4 px-4 py-4" role="group" aria-label="Persetujuan pendaftaran">
      <div className="flex items-center gap-3">
        <div className="w-[64px] shrink-0" aria-hidden="true">
          <NalarStiker kulit={kulitTemaGlobal(tema)} />
        </div>
        <p className="m-0 font-tangan text-2xl font-bold leading-tight" style={{ color: '#5a2a00' }}>
          Surat kecil dari Nalar
        </p>
      </div>
      <p id={idHint} className="m-0 mt-2 text-sm leading-relaxed">
        Sebelum jadi anggota, baca dulu ya. Kami hanya minta email dan kata sandi. Kami tidak jual datamu.
      </p>

      <label htmlFor={idSetuju} className="mt-3 flex cursor-pointer items-start gap-3">
        <input
          id={idSetuju}
          type="checkbox"
          checked={setuju}
          onChange={(e) => onSetuju(e.target.checked)}
          aria-required="true"
          aria-invalid={perluSetuju && !setuju}
          aria-describedby={idHint}
          className="kotak-cek mt-1"
        />
        <span>
          Saya sudah membaca dan menyetujui{' '}
          <Link to="/kebijakan-privasi" {...tautan}>
            Kebijakan Privasi
          </Link>{' '}
          dan{' '}
          <Link to="/syarat-ketentuan" {...tautan}>
            Syarat &amp; Ketentuan
          </Link>
          . <span className="font-semibold">(wajib)</span>
        </span>
      </label>

      <label htmlFor={idPromo} className="mt-3 flex cursor-pointer items-start gap-3">
        <input id={idPromo} type="checkbox" checked={promo} onChange={(e) => onPromo(e.target.checked)} className="kotak-cek mt-1" />
        <span>
          Kirimi saya kabar ebook baru dan promo lewat email. <span className="text-sm" style={{ color: 'var(--tinta-redup)' }}>(opsional, bisa dicabut kapan saja)</span>
        </span>
      </label>
    </Panel>
  )
}
