import { useId } from 'react'

// Progress bar bergaya sapuan kuas: goresan warna-warni yang "tersingkap" sesuai persentase.

interface Props {
  persen: number
  label?: string
  warna?: [string, string, string]
}

export function BarKuas({ persen, label = 'Kemajuan membaca', warna = ['#1c2b6b', '#f6d24b', '#f26a1b'] }: Props) {
  const p = Math.max(0, Math.min(100, Math.round(persen)))
  const id = useId().replace(/:/g, '')
  const goresan = (
    <svg viewBox="0 0 600 28" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} x1="0" x2="1">
          <stop offset="0" stopColor={warna[0]} />
          <stop offset="0.55" stopColor={warna[1]} />
          <stop offset="1" stopColor={warna[2]} />
        </linearGradient>
      </defs>
      <g className="sapuan-pita">
        <path d="M-6 15 C 70 6, 120 24, 200 13 S 330 6, 400 15 S 520 22, 610 12" fill="none" stroke={`url(#${id})`} strokeWidth="19" strokeLinecap="round" />
        <path d="M-6 10 C 90 4, 150 18, 240 9 S 380 5, 470 11 S 560 14, 610 8" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" />
        <path d="M-6 21 C 80 26, 170 15, 260 22 S 420 26, 520 20 S 580 18, 610 22" fill="none" stroke="#1a1a2e" strokeOpacity="0.28" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  )
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={p}
      aria-valuetext={`${p} persen`}
      className="relative h-7 w-full"
    >
      {/* jalur redup */}
      <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-black/25" aria-hidden="true" />
      {/* goresan yang tersingkap */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - p}% 0 0)`, transition: 'clip-path 0.6s ease' }}>
        {goresan}
      </div>
    </div>
  )
}
