import { useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { InlineIstilah, Para, Sorotan } from '../../lib/types'

// Merender teks paragraf: **tebal**, *miring*, [[istilah|definisi]] (tooltip), plus sorotan.
// Setiap potongan teks memakai data-off = posisi awalnya di teks polos paragraf,
// dipakai untuk menyimpan sorotan sebagai rentang karakter.

type Peta = (Sorotan | null)[]

function petaSorot(panjang: number, sorotan: Sorotan[]): Peta {
  const peta: Peta = new Array(panjang).fill(null)
  for (const s of sorotan) {
    const a = Math.max(0, s.mulai)
    const b = Math.min(panjang, s.akhir)
    for (let i = a; i < b; i++) peta[i] = s
  }
  return peta
}

function Potongan({ s, mulai, peta }: { s: string; mulai: number; peta: Peta }) {
  const out: ReactNode[] = []
  let i = 0
  while (i < s.length) {
    const h = peta[mulai + i] ?? null
    let j = i + 1
    while (j < s.length && (peta[mulai + j] ?? null)?.id === h?.id) j++
    const teks = s.slice(i, j)
    out.push(
      h ? (
        <span key={i} data-off={mulai + i} data-hid={h.id} className={`hl-${h.warna}`}>
          {teks}
        </span>
      ) : (
        <span key={i} data-off={mulai + i}>
          {teks}
        </span>
      ),
    )
    i = j
  }
  return <>{out}</>
}

function bungkus(node: ReactNode, tebal: boolean, miring: boolean, key: string | number) {
  let n = node
  if (miring) n = <em>{n}</em>
  if (tebal) n = <strong>{n}</strong>
  return <span key={key} className="contents">{n}</span>
}

function Istilah({ t, mulai, peta }: { t: InlineIstilah; mulai: number; peta: Peta }) {
  const [buka, setBuka] = useState(false)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const tombol = useRef<HTMLButtonElement>(null)
  const tip = useRef<HTMLDivElement>(null)
  const id = useId()

  useLayoutEffect(() => {
    if (!buka) {
      setPos(null)
      return
    }
    const b = tombol.current?.getBoundingClientRect()
    const w = tip.current?.offsetWidth ?? 240
    const h = tip.current?.offsetHeight ?? 60
    if (!b) return
    const kiri = Math.min(Math.max(8, b.left + b.width / 2 - w / 2), window.innerWidth - w - 8)
    let atas = b.top - h - 10
    if (atas < 8) atas = b.bottom + 10
    setPos({ left: kiri, top: atas })
  }, [buka])

  return (
    <>
      <button
        ref={tombol}
        type="button"
        className="istilah"
        aria-expanded={buka}
        aria-describedby={buka ? id : undefined}
        onMouseEnter={() => setBuka(true)}
        onMouseLeave={() => setBuka(false)}
        onFocus={() => setBuka(true)}
        onBlur={() => setBuka(false)}
        onClick={() => setBuka((b) => !b)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setBuka(false)
        }}
      >
        {bungkus(<Potongan s={t.s} mulai={mulai} peta={peta} />, t.tebal, t.miring, 'i')}
      </button>
      {buka &&
        createPortal(
          <div
            ref={tip}
            id={id}
            role="tooltip"
            className="tooltip-istilah"
            style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? 'visible' : 'hidden' }}
          >
            <strong>{t.s}</strong>: {t.def}
          </div>,
          document.body,
        )}
    </>
  )
}

interface Props {
  para: Para
  /** true = istilah tampil sebagai teks bergaris (dipakai di dalam tombol) */
  polos?: boolean
  sorotan?: Sorotan[]
}

const KOSONG: Sorotan[] = []

export function TeksInline({ para, polos = false, sorotan = KOSONG }: Props) {
  const peta = useMemo(() => petaSorot(para.teks.length, sorotan), [para.teks.length, sorotan])
  let mulai = 0
  return (
    <>
      {para.inline.map((t, i) => {
        const dari = mulai
        mulai += t.s.length
        if (t.k === 'istilah') {
          if (polos) {
            return (
              <span key={i} className="istilah-polos" title={t.def}>
                {bungkus(<Potongan s={t.s} mulai={dari} peta={peta} />, t.tebal, t.miring, i)}
              </span>
            )
          }
          return <Istilah key={i} t={t} mulai={dari} peta={peta} />
        }
        return bungkus(<Potongan s={t.s} mulai={dari} peta={peta} />, t.tebal, t.miring, i)
      })}
    </>
  )
}
