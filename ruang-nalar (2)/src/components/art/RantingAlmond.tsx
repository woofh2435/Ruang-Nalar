import { useMemo } from 'react'
import { acak, antara } from '../../lib/rng'
import { bez, f1 } from './util'

interface Props {
  seed?: number | string
  className?: string
}

const S1: [[number, number], [number, number], [number, number], [number, number]] = [[-10, 182], [50, 162], [110, 132], [172, 94]]
const S2: [[number, number], [number, number], [number, number], [number, number]] = [[172, 94], [234, 56], [272, 28], [334, 12]]

function Bunga({ x, y, s, rot }: { x: number; y: number; s: number; rot: number }) {
  return (
    <g transform={`translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)}) scale(${f1(s)})`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <ellipse key={i} cx="0" cy="-8" rx="6" ry="9" transform={`rotate(${i * 72})`} fill="#fff7f3" stroke="#e59ab0" strokeWidth="1.2" />
      ))}
      <circle r="3.4" fill="#f1a3b4" />
      {Array.from({ length: 5 }).map((_, i) => (
        <g key={'s' + i} transform={`rotate(${i * 72 + 36})`}>
          <line x1="0" y1="-3" x2="0" y2="-9" stroke="#e8892b" strokeWidth="0.9" />
          <circle cy="-9.6" r="1.3" fill="#f6d24b" />
        </g>
      ))}
    </g>
  )
}

// Ranting bunga almond — gaya kolase, digambar procedural.
export function RantingAlmond({ seed = 5, className }: Props) {
  const isi = useMemo(() => {
    const r = acak(seed)
    const titik: { x: number; y: number; nx: number; ny: number }[] = []
    for (let i = 1; i <= 9; i++) {
      const t = i / 9
      const [px, py] = t < 0.5 ? bez(...S1, t * 2) : bez(...S2, (t - 0.5) * 2)
      titik.push({ x: px, y: py, nx: antara(r, -1, 1), ny: r() > 0.5 ? -1 : 1 })
    }
    const bunga = titik.map((p) => ({ x: p.x + p.nx * 6, y: p.y + p.ny * antara(r, 12, 26), s: antara(r, 0.75, 1.25), rot: antara(r, 0, 72) }))
    const daun = titik.map((p) => ({ x: p.x, y: p.y + (p.ny > 0 ? -1 : 1) * antara(r, 8, 18), rot: antara(r, -70, 70) }))
    return { bunga, daun }
  }, [seed])

  return (
    <svg viewBox="0 0 320 200" className={className} aria-hidden="true" focusable="false">
      {isi.daun.map((d, i) => (
        <ellipse key={'d' + i} cx={f1(d.x)} cy={f1(d.y)} rx="4.5" ry="14" transform={`rotate(${f1(d.rot)} ${f1(d.x)} ${f1(d.y)})`} fill="#79a05a" stroke="#4f7a3a" strokeWidth="1.2" />
      ))}
      <path d="M-10 182 C 50 162 110 132 172 94 S 272 28 334 12" fill="none" stroke="#3d2314" strokeWidth="8" strokeLinecap="round" />
      <path d="M-10 182 C 50 162 110 132 172 94 S 272 28 334 12" fill="none" stroke="#6b4426" strokeWidth="3" strokeLinecap="round" strokeDasharray="14 9" />
      <path d="M90 143 C 100 160 110 168 122 172" fill="none" stroke="#3d2314" strokeWidth="4" strokeLinecap="round" />
      <path d="M210 60 C 222 78 240 84 258 84" fill="none" stroke="#3d2314" strokeWidth="4" strokeLinecap="round" />
      {isi.bunga.map((b, i) => (
        <Bunga key={i} {...b} />
      ))}
      <circle cx="122" cy="173" r="5" fill="#f1a3b4" stroke="#c4708a" strokeWidth="1" />
      <circle cx="259" cy="85" r="5" fill="#f1a3b4" stroke="#c4708a" strokeWidth="1" />
    </svg>
  )
}
