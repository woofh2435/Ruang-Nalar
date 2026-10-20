import { useId } from 'react'
import { amanId } from './util'

interface Props {
  className?: string
}

// Jendela kafe malam yang kuning — hanya jendelanya, digambar sendiri.
export function JendelaKafe({ className }: Props) {
  const id = amanId(useId())
  return (
    <svg viewBox="0 0 240 300" className={className} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={id + 'g'} cx="50%" cy="55%" r="60%">
          <stop offset="0" stopColor="#fff3a8" />
          <stop offset="0.55" stopColor="#f6d24b" />
          <stop offset="1" stopColor="#e8892b" />
        </radialGradient>
        <radialGradient id={id + 'h'} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#f6d24b" stopOpacity="0.55" />
          <stop offset="1" stopColor="#f6d24b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="240" height="300" fill="#1c2b6b" />
      {/* batu dinding */}
      {Array.from({ length: 9 }).map((_, r) =>
        Array.from({ length: 5 }).map((__, c) => (
          <rect key={r + '-' + c} x={c * 52 - (r % 2) * 26 + 2} y={r * 34 + 2} width="48" height="30" rx="3" fill={(r + c) % 3 === 0 ? '#243780' : '#1f3074'} stroke="#14204f" strokeWidth="2" />
        )),
      )}
      <ellipse cx="120" cy="170" rx="118" ry="130" fill={`url(#${id}h)`} />
      {/* bingkai & kaca */}
      <rect x="38" y="68" width="164" height="194" rx="6" fill="#3b2314" />
      <rect x="48" y="78" width="144" height="174" fill={`url(#${id}g)`} />
      {/* isi kafe: lampu, meja, kursi */}
      <g opacity="0.85" fill="#b5470a">
        <circle cx="120" cy="100" r="9" fill="#fff7d0" opacity="0.95" />
        <path d="M120 78 V92" stroke="#7a2f08" strokeWidth="2" />
        <rect x="76" y="188" width="88" height="7" rx="2" />
        <rect x="116" y="195" width="8" height="46" />
        <rect x="98" y="238" width="44" height="6" rx="2" />
        <path d="M60 196 h10 v46 h-5 v-24 h-5z" />
        <path d="M170 196 h10 v46 h-5 v-24 h-5z" />
        <circle cx="96" cy="176" r="9" />
        <rect x="88" y="184" width="16" height="6" rx="2" />
        <circle cx="148" cy="174" r="9" />
        <rect x="140" y="182" width="16" height="8" rx="2" />
      </g>
      {/* sekat jendela */}
      <rect x="116" y="78" width="8" height="174" fill="#3b2314" />
      <rect x="48" y="156" width="144" height="8" fill="#3b2314" />
      {/* kanopi bergaris dengan lengkung */}
      <path d="M20 40 H220 L232 78 H8 Z" fill="#f26a1b" stroke="#7a2f08" strokeWidth="2" />
      {Array.from({ length: 7 }).map((_, i) => (
        <path key={i} d={`M${8 + i * 32} 78 L${20 + i * 28.5} 40 H${36 + i * 28.5} L${40 + i * 32} 78 Z`} fill={i % 2 ? '#f6d24b' : '#f26a1b'} opacity="0.95" />
      ))}
      {Array.from({ length: 7 }).map((_, i) => (
        <path key={'s' + i} d={`M${8 + i * 32.6} 78 q16 20 32.6 0`} fill={i % 2 ? '#f6d24b' : '#f26a1b'} stroke="#7a2f08" strokeWidth="1.5" />
      ))}
      {/* ambang & pot bunga */}
      <rect x="30" y="262" width="180" height="10" rx="2" fill="#6b4426" />
      <rect x="150" y="248" width="30" height="16" rx="2" fill="#b5470a" />
      <circle cx="158" cy="242" r="5" fill="#f4e9cf" />
      <circle cx="170" cy="239" r="5" fill="#f1a3b4" />
      <circle cx="165" cy="246" r="4" fill="#f6d24b" />
    </svg>
  )
}
