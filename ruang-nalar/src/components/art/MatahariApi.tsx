import { useMemo } from 'react'
import { acak, antara } from '../../lib/rng'
import { f1 } from './util'

// Matahari api bergerigi: tiga lapis gerigi + cakram berpusar di tengah (tempat Nalar duduk).

function gerigi(r: () => number, n: number, rDalam: number, rLuar: number, jitter: number, rot: number): string {
  let d = ''
  for (let i = 0; i < n; i++) {
    const a0 = rot + (i / n) * Math.PI * 2
    const a1 = rot + ((i + 0.5) / n) * Math.PI * 2
    const ro = rLuar * (1 + antara(r, -jitter, jitter))
    const ri = rDalam * (1 + antara(r, -0.02, 0.02))
    d += (i === 0 ? 'M' : 'L') + f1(200 + ri * Math.cos(a0)) + ' ' + f1(200 + ri * Math.sin(a0))
    d += 'L' + f1(200 + ro * Math.cos(a1)) + ' ' + f1(200 + ro * Math.sin(a1))
  }
  return d + 'Z'
}

interface Props {
  seed?: number | string
  className?: string
  putar?: boolean
}

export function MatahariApi({ seed = 7, className, putar = true }: Props) {
  const lapis = useMemo(() => {
    const r = acak(seed)
    return {
      luar: gerigi(r, 26, 148, 198, 0.1, 0),
      tengah: gerigi(r, 26, 140, 176, 0.08, Math.PI / 26),
      dalam: gerigi(r, 22, 132, 152, 0.06, 0.1),
    }
  }, [seed])

  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="mt-cakram" cx="50%" cy="46%" r="55%">
          <stop offset="0" stopColor="#fff3a8" />
          <stop offset="0.6" stopColor="#f6d24b" />
          <stop offset="1" stopColor="#efb73a" />
        </radialGradient>
      </defs>
      <g className={putar ? 'putar-pelan' : undefined}>
        <path d={lapis.luar} fill="#f26a1b" stroke="#c4480a" strokeWidth="2" strokeLinejoin="round" />
        <path d={lapis.tengah} fill="#e8892b" stroke="#b5470a" strokeWidth="1.5" strokeLinejoin="round" />
        <path d={lapis.dalam} fill="#f6d24b" stroke="#d99a1c" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
      <circle cx="200" cy="200" r="124" fill="url(#mt-cakram)" stroke="#e8892b" strokeWidth="4" />
      {/* cincin cat melingkar */}
      <circle cx="200" cy="200" r="108" fill="none" stroke="#e8892b" strokeWidth="5" strokeDasharray="46 12 18 12" strokeLinecap="round" opacity="0.7" />
      <circle cx="200" cy="200" r="90" fill="none" stroke="#f26a1b" strokeWidth="4" strokeDasharray="30 10 60 10" strokeLinecap="round" opacity="0.55" />
      <circle cx="200" cy="200" r="72" fill="none" stroke="#e8892b" strokeWidth="4" strokeDasharray="20 14" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}
