import { useId, type CSSProperties } from 'react'
import type { Kulit } from '../../lib/tema'
import { BADAN, BINTIK, DURI, EKOR, PERUT } from '../nalar/Nalar'
import { amanId, f1 } from './util'

// Nalar versi stiker: gambar diam (tanpa animasi, tanpa konteks) dengan garis tepi krem ala stiker, dipakai sampul kolase.
// Bentuk badannya memakai geometri yang sama dengan maskot di web, jadi tetap terasa satu karakter.
// Garis tepi dibuat dengan menggambar siluet yang sama sekali lagi (tebal, berwarna krem) di belakang gambar utama,
// jadi tidak bergantung pada filter CSS atau foreignObject yang perilakunya beda-beda antarbrowser.

export const KOTAK_NALAR_STIKER = '-16 -6 496 332'

const KREM = '#f4f1e6'
const TINTA = '#0b1517'

const CASQUE = 'M252 122 C238 98 228 86 212 80 C226 104 224 128 238 146 Z'
const KAKI_KIRI = 'M146 248 L152 274 L170 284 M170 284 l12 -9 M170 284 l12 6'
const KAKI_KANAN = 'M258 244 L272 272 L290 284 M290 284 l13 -10 M290 284 l13 6'

/** Seluruh bentuk Nalar sebagai siluet satu warna (untuk garis tepi dan bayangan). */
function Siluet({ warna, tebal }: { warna: string; tebal: number }) {
  return (
    <g fill={warna} stroke={warna} strokeWidth={tebal} strokeLinejoin="round" strokeLinecap="round">
      <path d={EKOR.bentuk} />
      <path d={KAKI_KIRI} fill="none" strokeWidth={19 + tebal} />
      <path d={KAKI_KANAN} fill="none" strokeWidth={19 + tebal} />
      <path d={BADAN} />
      <path d={DURI} />
      <path d={CASQUE} />
      <ellipse cx="298" cy="156" rx="57" ry="50" />
      <ellipse cx="346" cy="179" rx="33" ry="24" />
    </g>
  )
}

/** Isi gambar (tanpa elemen <svg>), supaya bisa ditanam langsung di dalam gambar lain. Kotak gambar: KOTAK_NALAR_STIKER. */
export function IsiNalarStiker({ kulit }: { kulit: Kulit }) {
  const idBadan = amanId(useId()) + '-badan'
  const gaya = {
    '--n-dasar': kulit.dasar,
    '--n-bayang': kulit.bayang,
    '--n-terang': kulit.terang,
    '--n-bintik': kulit.bintik,
  } as CSSProperties
  return (
    <g style={gaya}>
      <defs>
        <clipPath id={idBadan}>
          <path d={BADAN} />
        </clipPath>
      </defs>
      {/* bayangan dan garis tepi stiker */}
      <g transform="translate(6 8)" opacity="0.38">
        <Siluet warna={TINTA} tebal={20} />
      </g>
      <Siluet warna={KREM} tebal={18} />

      <path d={EKOR.bentuk} className="n-dasar n-garis-bayang" strokeWidth="2.5" strokeLinejoin="round" />
      <path d={EKOR.garis} fill="none" className="n-garis-bayang" strokeWidth="2.6" strokeDasharray="5 11" strokeLinecap="round" opacity="0.5" />
      <circle cx={f1(EKOR.ujung[0])} cy={f1(EKOR.ujung[1])} r="3.4" className="n-bintik" />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round" className="n-garis-bayang">
        <path d={KAKI_KIRI} strokeWidth="19" />
        <path d={KAKI_KANAN} strokeWidth="19" />
      </g>
      <path d={BADAN} className="n-dasar n-garis-bayang" strokeWidth="3" strokeLinejoin="round" />
      <g clipPath={`url(#${idBadan})`}>
        <path d={PERUT} className="n-terang" />
        <path d="M160 120 C152 170 158 214 178 270 M206 108 C200 150 206 200 220 276 M252 114 C250 160 256 210 262 270" fill="none" className="n-garis-bayang" strokeWidth="5" opacity="0.32" strokeLinecap="round" />
        {BINTIK.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} className="n-bintik n-garis-bayang" strokeWidth="2" opacity="0.92" />
        ))}
      </g>
      <path d={DURI} className="n-bayang" strokeLinejoin="round" />
      <path d={CASQUE} className="n-bayang n-garis-bayang" strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="298" cy="156" rx="57" ry="50" className="n-dasar n-garis-bayang" strokeWidth="3" />
      <ellipse cx="346" cy="179" rx="33" ry="24" className="n-dasar n-garis-bayang" strokeWidth="3" />
      <ellipse cx="346" cy="170" rx="22" ry="8" className="n-terang" opacity="0.5" />
      <circle cx="324" cy="170" r="10" fill="#ff8fa3" opacity="0.7" />
      <circle cx="352" cy="164" r="2.6" fill="#1a1a2e" opacity="0.55" />
      {/* senyum kecil */}
      <path d="M338 192 Q352 204 368 190" fill="none" stroke="#4a1220" strokeWidth="3" strokeLinecap="round" />
      {(
        [
          [268, 114, 24, 16.5, 8],
          [324, 122, 26, 18, 8.8],
        ] as const
      ).map(([cx, cy, R, r, rp], i) => (
        <g key={i} transform={`translate(${cx} ${cy})`}>
          <circle r={R} className="n-dasar n-garis-bayang" strokeWidth="3.2" />
          <circle r={r} fill="#fffdf2" />
          <circle cx={4} cy={-1} r={rp} fill="#1a1a2e" />
          <circle cx={1} cy={-4} r={rp * 0.32} fill="#fff" />
        </g>
      ))}
    </g>
  )
}

export function NalarStiker({ kulit, className = '' }: { kulit: Kulit; className?: string }) {
  return (
    <svg viewBox={KOTAK_NALAR_STIKER} className={className} aria-hidden="true" focusable="false">
      <IsiNalarStiker kulit={kulit} />
    </svg>
  )
}
