import { useId, useMemo } from 'react'
import { KANJI } from '../../lib/kanjiSampul'
import { TEMA } from '../../lib/tema'
import type { EbookMeta } from '../../lib/types'
import { IsiNalarStiker, KOTAK_NALAR_STIKER } from './NalarStiker'
import { amanId, f1 } from './util'

// Sampul "kolase": gaya tempel-guntingan poster Jepang tahun 90-an. Latar teal bergrain, pita kuning miring dengan
// kanji, stiker Nalar, blok judul gelap bertulisan putih tebal, bintang, dan pita bawah.
// Semua gambar dibuat sendiri (bukan salinan karya mana pun); kanji hanya sebagai elemen grafis.
// Dibuat dalam kotak 300 x 400 lalu diskalakan, jadi tampil sama di rak, di pembaca, dan di pratinjau admin.

const P = {
  latar: '#0e3a40',
  latar2: '#176069',
  kuning: '#f6c936',
  tinta: '#0b1517',
  krem: '#f4f1e6',
  merah: '#e2432d',
}

const HURUF = '"Montserrat","Arial Black","Helvetica Neue",Arial,sans-serif'

/** Satu huruf kanji pada kotak ukuran `u` dengan sudut kiri-atas di (x, y). */
function Kanji({ k, x, y, u, ...sisa }: { k: string; x: number; y: number; u: number } & React.SVGProps<SVGPathElement>) {
  const d = KANJI[k]
  if (!d) return null
  return <path d={d} transform={`translate(${f1(x)} ${f1(y)}) scale(${u / 1000})`} {...sisa} />
}

/** Bintang empat sudut ala kilau stiker. */
function Bintang({ x, y, r, rot = 0, warna = P.kuning }: { x: number; y: number; r: number; rot?: number; warna?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${r})`}>
      <path d="M0 -1 C.1 -.34 .34 -.1 1 0 C.34 .1 .1 .34 0 1 C-.1 .34 -.34 .1 -1 0 C-.34 -.1 -.1 -.34 0 -1Z" fill={warna} stroke={P.tinta} strokeWidth={0.09} strokeLinejoin="round" />
    </g>
  )
}

const LEBAR_HURUF = 0.72 // perkiraan lebar rata-rata huruf kapital tebal terhadap tinggi huruf
const AREA_X = 246
const AREA_TINGGI = 90

/** Bagi judul jadi 1-3 baris (kata utuh) dengan huruf sebesar mungkin. */
export function susunJudul(judul: string): { baris: string[]; ukuran: number } {
  const kata = judul.toUpperCase().split(/\s+/).filter(Boolean).slice(0, 9)
  if (kata.length === 0) return { baris: [''], ukuran: 30 }
  const n = kata.length
  let terbaik: { baris: string[]; ukuran: number } | null = null
  for (let k = 1; k <= Math.min(3, n); k++) {
    // semua cara memotong n kata menjadi k potong berurutan; ambil yang baris terpanjangnya paling pendek
    let pilih: string[] | null = null
    let pilihMaks = Infinity
    const coba = (mulai: number, sisaK: number, acc: string[]) => {
      if (sisaK === 1) {
        const bar = [...acc, kata.slice(mulai).join(' ')]
        const maks = Math.max(...bar.map((b) => b.length))
        if (maks < pilihMaks) {
          pilihMaks = maks
          pilih = bar
        }
        return
      }
      for (let i = mulai + 1; i <= n - sisaK + 1; i++) coba(i, sisaK - 1, [...acc, kata.slice(mulai, i).join(' ')])
    }
    coba(0, k, [])
    if (!pilih) continue
    const ukuran = Math.max(13, Math.min(46, AREA_TINGGI / k - 6, AREA_X / (pilihMaks * LEBAR_HURUF)))
    if (!terbaik || ukuran > terbaik.ukuran + 0.5) terbaik = { baris: pilih, ukuran }
  }
  return terbaik ?? { baris: [kata.join(' ')], ukuran: 20 }
}

const potong = (t: string, maks: number) => (t.length > maks ? t.slice(0, maks - 1).trimEnd() + '…' : t)

interface Props {
  meta: EbookMeta
  penulis: string
}

export function SampulKolase({ meta, penulis }: Props) {
  const uid = amanId(useId())
  const kulit = TEMA[meta.tema].kulit
  const { baris, ukuran } = useMemo(() => susunJudul(meta.judul), [meta.judul])
  const sub = meta.subjudul ? potong(meta.subjudul.toUpperCase(), 34) : ''
  const tingginyaBaris = ukuran + 6
  const yAwal = 252 + (AREA_TINGGI - tingginyaBaris * baris.length) / 2

  return (
    <>
      {/* teks untuk pembaca layar; gambarnya sendiri dekoratif */}
      <h3 className="sr-only">{meta.judul}</h3>
      {meta.subjudul && <p className="sr-only">{meta.subjudul}</p>}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <defs>
          <pattern id={`${uid}-titik`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
            <circle cx="3.5" cy="3.5" r="1.5" fill={P.latar2} />
          </pattern>
          <linearGradient id={`${uid}-latar`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#12474f" />
            <stop offset="1" stopColor={P.latar} />
          </linearGradient>
          <filter id={`${uid}-grain`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 -0.28" />
          </filter>
          <clipPath id={`${uid}-pita`}>
            <rect x="-70" y="34" width="440" height="112" />
          </clipPath>
        </defs>

        {/* latar, titik halftone, dan grain */}
        <rect width="300" height="400" fill={`url(#${uid}-latar)`} />
        <rect x="150" y="-10" width="170" height="200" fill={`url(#${uid}-titik)`} opacity="0.9" />
        <rect x="-10" y="215" width="130" height="150" fill={`url(#${uid}-titik)`} opacity="0.7" />

        {/* pita kuning miring + kanji 進路 */}
        <g transform="rotate(-12 150 90)">
          <rect x="-70" y="34" width="440" height="112" fill="#000" opacity="0.38" transform="translate(4 6)" />
          <rect x="-70" y="152" width="440" height="9" fill={P.krem} transform="translate(0 0)" />
          <rect x="-70" y="34" width="440" height="112" fill={P.kuning} stroke={P.krem} strokeWidth="3.2" />
          <g clipPath={`url(#${uid}-pita)`}>
            <g fill={P.tinta}>
              <Kanji k="進" x={8} y={38} u={104} />
              <Kanji k="路" x={114} y={38} u={104} />
            </g>
            <g stroke={P.tinta} strokeWidth="5" opacity="0.9">
              <line x1="236" y1="150" x2="262" y2="30" />
              <line x1="250" y1="150" x2="276" y2="30" />
              <line x1="264" y1="150" x2="290" y2="30" />
            </g>
          </g>
        </g>

        {/* kanji 社会 (masyarakat), kerangka krem di kanan */}
        <g transform="rotate(6 268 210)" fill={P.krem} fillOpacity="0.14" stroke={P.krem} strokeWidth={2.4 / 0.06} strokeLinejoin="round">
          <Kanji k="社" x={238} y={150} u={60} />
          <Kanji k="会" x={238} y={212} u={60} />
        </g>

        {/* stiker Nalar */}
        <g transform="rotate(-5 141 188)">
          <svg x="26" y="112" width="230" height="153" viewBox={KOTAK_NALAR_STIKER} overflow="visible">
            <IsiNalarStiker kulit={kulit} />
          </svg>
        </g>

        {/* segel merah 未来 (masa depan) */}
        <g transform="rotate(-10 38 196)">
          <circle cx="38" cy="196" r="23" fill="#000" opacity="0.35" transform="translate(2.5 3)" />
          <circle cx="38" cy="196" r="23" fill={P.merah} stroke={P.krem} strokeWidth="2.6" />
          <g fill={P.krem}>
            <Kanji k="未" x={27.5} y={174.5} u={21} />
            <Kanji k="来" x={27.5} y={196} u={21} />
          </g>
        </g>

        <Bintang x={96} y={238} r={6} rot={0} warna={P.krem} />
        <Bintang x={246} y={110} r={7} rot={0} warna={P.krem} />

        {/* blok judul */}
        <g transform="rotate(-3 20 300)">
          {baris.map((b, i) => {
            const w = Math.min(AREA_X, b.length * LEBAR_HURUF * ukuran)
            const y = yAwal + i * tingginyaBaris
            const x = 14 + i * 9
            return (
              <g key={i}>
                <rect x={x + 3} y={y + 3} width={w + 18} height={tingginyaBaris} fill="#000" opacity="0.4" />
                <rect x={x} y={y} width={w + 18} height={tingginyaBaris} fill={P.tinta} stroke={P.krem} strokeWidth="1.6" />
                <text
                  x={x + 9}
                  y={y + tingginyaBaris / 2 + ukuran * 0.36}
                  fontFamily={HURUF}
                  fontWeight={900}
                  fontSize={f1(ukuran)}
                  fill={P.krem}
                  textLength={f1(w)}
                  lengthAdjust="spacingAndGlyphs"
                >
                  {b}
                </text>
              </g>
            )
          })}
        </g>

        <Bintang x={276} y={258} r={15} rot={12} />
        <Bintang x={20} y={352} r={8} rot={-10} />

        {/* label subjudul kuning */}
        {sub && (
          <g transform="rotate(1.6 150 350)">
            {(() => {
              const w = Math.min(268, sub.length * 0.74 * 11.5)
              const x = 300 - w - 28
              return (
                <>
                  <rect x={x + 3} y={342} width={w + 20} height={22} fill="#000" opacity="0.38" />
                  <rect x={x} y={339} width={w + 20} height={22} fill={P.kuning} stroke={P.tinta} strokeWidth="1.6" />
                  <text x={x + 10} y={354} fontFamily={HURUF} fontWeight={800} fontSize="11.5" fill={P.tinta} textLength={f1(w)} lengthAdjust="spacingAndGlyphs">
                    {sub}
                  </text>
                </>
              )
            })()}
          </g>
        )}

        {/* pita bawah */}
        <rect x="0" y="368" width="300" height="32" fill={P.kuning} />
        <rect x="0" y="368" width="300" height="2.4" fill={P.tinta} />
        <g fill={P.tinta}>
          <text x="22" y="388" fontFamily={HURUF} fontWeight={800} fontSize="10.5" textLength={f1(Math.min(150, penulis.length * 7.4))} lengthAdjust="spacingAndGlyphs">
            {penulis.toUpperCase()}
          </text>
          <text x="278" y="388" textAnchor="end" fontFamily={HURUF} fontWeight={800} fontSize="9" letterSpacing="1.6">
            RUANG NALAR
          </text>
        </g>

        {/* grain di atas semuanya */}
        <rect width="300" height="400" filter={`url(#${uid}-grain)`} opacity="0.34" style={{ mixBlendMode: 'multiply' }} />
      </svg>
    </>
  )
}
