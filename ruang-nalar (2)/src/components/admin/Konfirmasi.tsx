import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  judul: string
  children: ReactNode
  labelYa: string
  labelBatal?: string
  bahaya?: boolean
  onYa: () => void
  onBatal: () => void
}

/** Dialog konfirmasi yang ramah keyboard: fokus dijaga di dalam, Esc = batal, fokus kembali ke tombol pemicu. */
export function Konfirmasi({ judul, children, labelYa, labelBatal = 'Batal', bahaya = false, onYa, onBatal }: Props) {
  const idJudul = useId()
  const idIsi = useId()
  const kotak = useRef<HTMLDivElement>(null)
  const tombolBatal = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const sebelumnya = document.activeElement as HTMLElement | null
    tombolBatal.current?.focus()
    const tombol = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onBatal()
        return
      }
      if (e.key !== 'Tab' || !kotak.current) return
      const fokus = Array.from(kotak.current.querySelectorAll<HTMLElement>('button:not([disabled])'))
      if (!fokus.length) return
      const pertama = fokus[0]
      const terakhir = fokus[fokus.length - 1]
      if (e.shiftKey && document.activeElement === pertama) {
        e.preventDefault()
        terakhir.focus()
      } else if (!e.shiftKey && document.activeElement === terakhir) {
        e.preventDefault()
        pertama.focus()
      }
    }
    document.addEventListener('keydown', tombol, true)
    return () => {
      document.removeEventListener('keydown', tombol, true)
      sebelumnya?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return createPortal(
    <div className="dialog-latar" onMouseDown={(e) => e.target === e.currentTarget && onBatal()}>
      <div ref={kotak} role="alertdialog" aria-modal="true" aria-labelledby={idJudul} aria-describedby={idIsi} className="dialog-kotak">
        <h2 id={idJudul} className="m-0 font-display text-2xl font-black">
          {judul}
        </h2>
        <div id={idIsi} className="mt-2">
          {children}
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button ref={tombolBatal} type="button" className="tombol" onClick={onBatal}>
            {labelBatal}
          </button>
          <button type="button" className={`tombol ${bahaya ? 'tombol-bahaya' : 'tombol-primer'}`} onClick={onYa}>
            {labelYa}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
