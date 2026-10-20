import { useMemo } from 'react'
import { acak, antara } from '../../lib/rng'
import { f1 } from './util'

const SUDUT_EMAS = Math.PI * (3 - Math.sqrt(5))

interface Props {
  seed?: number | string
  /** gambar tangkai + daun (true) atau hanya kepala bunga (false) */
  tangkai?: boolean
  className?: string
}

export function BungaMatahari({ seed = 3, tangkai = true, className }: Props) {
  const biji = useMemo(() => {
    const r = acak(seed)
    const out: { x: number; y: number; r: number; w: string }[] = []
    for (let i = 1; i <= 90; i++) {
      const rad = 3.1 * Math.sqrt(i)
      const a = i * SUDUT_EMAS
      out.push({ x: f1(Math.cos(a) * rad), y: f1(Math.sin(a) * rad), r: antara(r, 1.2, 2.1), w: r() > 0.5 ? '#3a200c' : '#8a5a1e' })
    }
    return out
  }, [seed])

  const kelopak = 'M0 -24 C 11 -42 11 -66 0 -86 C -11 -66 -11 -42 0 -24 Z'
  return (
    <svg viewBox="0 0 200 280" className={className} aria-hidden="true" focusable="false">
      {tangkai && (
        <g>
          <path d="M100 150 C 96 190 106 230 100 280" fill="none" stroke="#3d6a2a" strokeWidth="7" strokeLinecap="round" />
          <path d="M100 214 C 70 196 44 200 28 216 C 52 232 82 232 100 214Z" fill="#4f7a3a" stroke="#34561f" strokeWidth="2" />
          <path d="M102 238 C 130 218 158 222 176 238 C 150 254 120 254 102 238Z" fill="#5c8a43" stroke="#34561f" strokeWidth="2" />
        </g>
      )}
      <g transform="translate(100 100)">
        {Array.from({ length: 16 }).map((_, i) => (
          <path key={'a' + i} d={kelopak} transform={`rotate(${i * 22.5})`} fill="#e8892b" stroke="#b5470a" strokeWidth="1.5" />
        ))}
        {Array.from({ length: 16 }).map((_, i) => (
          <path key={'b' + i} d={kelopak} transform={`rotate(${i * 22.5 + 11.25}) scale(0.9)`} fill="#f6d24b" stroke="#c98a12" strokeWidth="1.5" />
        ))}
        <circle r="34" fill="#5a3416" stroke="#3a200c" strokeWidth="3" />
        {biji.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={b.w} opacity="0.9" />
        ))}
      </g>
    </svg>
  )
}
