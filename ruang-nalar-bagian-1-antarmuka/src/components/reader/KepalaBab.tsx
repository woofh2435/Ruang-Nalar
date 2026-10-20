import type { Ref } from 'react'
import type { GayaBab } from '../../lib/gayaBab'
import type { TemaPreset } from '../../lib/tema'

const AKSEN = '#8a3d00'

interface Props {
  gaya: GayaBab
  /** nomor bab, mulai 1 */
  nomor: number
  total: number
  judul: string
  idJudul: string
  judulRef: Ref<HTMLHeadingElement>
  tema: TemaPreset
}

function Ornamen() {
  return (
    <svg viewBox="0 0 200 16" className="mx-auto block h-4 w-44" aria-hidden="true" focusable="false">
      <path d="M2 8H82M118 8H198" stroke={AKSEN} strokeWidth="2" strokeLinecap="round" />
      <path d="M100 1l7 7-7 7-7-7z" fill={AKSEN} />
      <circle cx="88" cy="8" r="2" fill={AKSEN} />
      <circle cx="112" cy="8" r="2" fill={AKSEN} />
    </svg>
  )
}

/** Kepala bab dengan lima gaya. Elemen judulnya (h2 dengan id, ref, dan tabIndex) sama di semua gaya, jadi fokus dan pembaca layar tetap bekerja. */
export function KepalaBab({ gaya, nomor, total, judul, idJudul, judulRef, tema }: Props) {
  const h2 = (kelas: string) => (
    <h2 id={idJudul} ref={judulRef} tabIndex={-1} className={`cat-judul font-display font-black leading-tight outline-none ${kelas}`}>
      {judul}
    </h2>
  )
  const label = (
    <p className="m-0 font-tangan text-2xl font-bold" style={{ color: AKSEN }}>
      bab {nomor} dari {total}
    </p>
  )

  switch (gaya) {
    case 'angka':
      return (
        <div className="mb-6" data-gaya-bab="angka">
          <div className="flex items-start gap-4">
            <span aria-hidden="true" className="select-none font-tangan font-bold leading-[0.75]" style={{ fontSize: 'clamp(4.5rem, 16vw, 6.5rem)', color: AKSEN }}>
              {nomor}
            </span>
            <div className="min-w-0 flex-1 pt-1">
              {label}
              {h2('m-0 text-3xl sm:text-4xl')}
            </div>
          </div>
          <svg viewBox="0 0 300 12" className="mt-3 block h-3 w-52" aria-hidden="true" focusable="false">
            <path d="M3 8C40 2 80 12 120 6S200 2 240 8 285 10 297 5" stroke={AKSEN} strokeWidth="4" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      )
    case 'pita':
      return (
        <div className="mb-6 rounded-lg border-2 border-tinta px-5 py-4 shadow-[3px_4px_0_rgba(8,12,40,0.35)]" style={{ background: tema.dasar, color: tema.teks }} data-gaya-bab="pita">
          <p className="m-0 font-tangan text-2xl font-bold">
            bab {nomor} dari {total}
          </p>
          {h2('m-0 text-3xl sm:text-4xl')}
        </div>
      )
    case 'tengah':
      return (
        <div className="mb-6 text-center" data-gaya-bab="tengah">
          <Ornamen />
          <div className="mt-2">{label}</div>
          {h2('m-0 mt-1 text-3xl sm:text-4xl')}
          <div className="mt-3">
            <Ornamen />
          </div>
        </div>
      )
    case 'tepi':
      return (
        <div className="mb-6 grid gap-x-5 gap-y-1 sm:grid-cols-[5.5rem_1fr]" data-gaya-bab="tepi">
          <p className="sr-only">
            bab {nomor} dari {total}
          </p>
          <div className="flex items-baseline gap-2 sm:flex-col sm:items-start sm:gap-0 sm:border-r-4 sm:border-double sm:pr-3" style={{ borderColor: AKSEN }} aria-hidden="true">
            <span className="font-display text-5xl font-black leading-none" style={{ color: AKSEN }}>
              {String(nomor).padStart(2, '0')}
            </span>
            <span className="font-tangan text-xl font-bold" style={{ color: AKSEN }}>
              dari {total}
            </span>
          </div>
          <div className="min-w-0 self-center">{h2('m-0 text-3xl sm:text-4xl')}</div>
        </div>
      )
    default:
      return (
        <div data-gaya-bab="klasik">
          {label}
          {h2('mb-6 mt-0 text-3xl sm:text-4xl')}
        </div>
      )
  }
}
