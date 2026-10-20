import { useMemo } from 'react'
import { acak, antara } from '../../lib/rng'
import { f1 } from './util'

// Pusaran langit berbintang — digambar sendiri (procedural), bukan salinan lukisan mana pun.

export type PaletPusaran = 'malam' | 'ladang' | 'iris'

const PALET: Record<PaletPusaran, { latar: string[]; lengan: string[]; gelombang: string[]; bintang: string; inti: string }> = {
  malam: {
    latar: ['#111a55', '#1c2b6b', '#2a41a0'],
    lengan: ['#2f4ba2', '#4aa3c7', '#f6d24b', '#bfe3ef', '#3b66c4', '#7fc3dc'],
    gelombang: ['#4aa3c7', '#bfe3ef', '#2f4ba2'],
    bintang: '#f6d24b',
    inti: '#fff6c4',
  },
  ladang: {
    latar: ['#f9df78', '#f6d24b', '#e8892b'],
    lengan: ['#e8892b', '#f26a1b', '#fff1a8', '#f4e9cf', '#d46a14', '#f6d24b'],
    gelombang: ['#fff1a8', '#f4e9cf', '#e8892b'],
    bintang: '#ffffff',
    inti: '#ffffff',
  },
  iris: {
    latar: ['#2d2466', '#5b4b9a', '#2f4ba2'],
    lengan: ['#7a6ac0', '#4aa3c7', '#f6d24b', '#cfc4f2', '#3b66c4', '#9a8cdb'],
    gelombang: ['#9a8cdb', '#cfc4f2', '#4aa3c7'],
    bintang: '#f6d24b',
    inti: '#fff6c4',
  },
}

interface Lengan {
  d: string
  warna: string
  w: number
}

function spiral(
  r: () => number,
  cx: number,
  cy: number,
  rMax: number,
  putaran: number,
  fase: number,
  arah: 1 | -1,
  jumlahLengan: number,
  warna: string[],
): Lengan[] {
  const out: Lengan[] = []
  for (let a = 0; a < jumlahLengan; a++) {
    const gelar = (a * Math.PI * 2) / jumlahLengan
    const geser = antara(r, 0.9, 1.1)
    let d = ''
    const n = 70
    for (let i = 0; i <= n; i++) {
      const t = i / n
      const rad = rMax * Math.pow(t, 0.92) * geser
      const th = fase + gelar + arah * putaran * Math.PI * 2 * t
      const gelombang = 1 + 0.045 * Math.sin(th * 3 + a)
      const x = cx + rad * gelombang * Math.cos(th)
      const y = cy + rad * gelombang * 0.82 * Math.sin(th)
      d += (i === 0 ? 'M' : 'L') + f1(x) + ' ' + f1(y)
    }
    out.push({ d, warna: warna[a % warna.length], w: antara(r, 4, 7.5) })
  }
  return out
}

interface Props {
  seed?: number | string
  palet?: PaletPusaran
  bintang?: number
  className?: string
}

export function Pusaran({ seed = 1, palet = 'malam', bintang = 14, className }: Props) {
  const p = PALET[palet]
  const data = useMemo(() => {
    const r = acak(seed)
    const lengan = [
      ...spiral(r, 118, 128, 150, 1.55, antara(r, 0, 6), 1, 6, p.lengan),
      ...spiral(r, 300, 176, 112, -1.35, antara(r, 0, 6), -1, 5, p.lengan),
    ]
    const gel: string[] = []
    for (let i = 0; i < 3; i++) {
      const y0 = 28 + i * 50
      const fase = antara(r, 0, 6)
      let d = ''
      for (let x = -10; x <= 410; x += 10) {
        const y = y0 + 15 * Math.sin(x / 38 + fase) + 6 * Math.sin(x / 13 + fase * 2)
        d += (x === -10 ? 'M' : 'L') + x + ' ' + f1(y)
      }
      gel.push(d)
    }
    const bt: { x: number; y: number; s: number }[] = []
    for (let i = 0; i < bintang; i++) bt.push({ x: antara(r, 14, 386), y: antara(r, 14, 286), s: antara(r, 0.55, 1.25) })
    return { lengan, gel, bt }
  }, [seed, palet, bintang, p])

  const gid = 'pg' + String(seed).replace(/[^a-zA-Z0-9]/g, '') + palet

  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={p.latar[0]} />
          <stop offset="0.55" stopColor={p.latar[1]} />
          <stop offset="1" stopColor={p.latar[2]} />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#${gid})`} />
      {data.gel.map((d, i) => (
        <path key={'g' + i} d={d} fill="none" stroke={p.gelombang[i % p.gelombang.length]} strokeWidth={11 - i * 2} strokeLinecap="round" opacity={0.42} />
      ))}
      {data.lengan.map((l, i) => (
        <g key={'l' + i} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={l.d} stroke={l.warna} strokeWidth={l.w + 6} opacity={0.3} />
          <path d={l.d} stroke={l.warna} strokeWidth={l.w} opacity={0.92} />
        </g>
      ))}
      {data.bt.map((b, i) => (
        <g key={'b' + i} transform={`translate(${f1(b.x)} ${f1(b.y)}) scale(${b.s})`}>
          <circle r="15" fill={p.bintang} opacity="0.2" />
          <circle r="9.5" fill="none" stroke={p.bintang} strokeWidth="1.6" opacity="0.55" />
          <circle r="4" fill={p.inti} />
        </g>
      ))}
    </svg>
  )
}
