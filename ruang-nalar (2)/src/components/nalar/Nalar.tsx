// Nalar, maskot bunglon — SVG inline yang dianimasikan dengan CSS + Framer Motion.
//  • warna kulit mengikuti tema (transisi halus lewat CSS variable)
//  • mata kiri & kanan bergerak INDEPENDEN mengikuti kursor / sentuhan (+ melirik sendiri saat sepi)
//  • ekor menggulung dan bergoyang; lidah menjulur menangkap kunang-kunang saat diklik
//  • 8 ekspresi lewat setMood(): senang, mikir, kaget, ngantuk, semangat, sedih, bangga, kedip-nakal

import { AnimatePresence, animate, motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion'
import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useGerak } from '../../lib/gerak'
import type { Kulit } from '../../lib/tema'
import { amanId, f1 } from '../art/util'
import { EKSPRESI } from './ekspresi'
import { useNalar } from './NalarContext'

// ---------- geometri ----------
const BADAN =
  'M112 232 C100 170 140 112 205 108 C262 104 304 134 316 178 C326 218 300 262 256 272 C212 282 140 276 120 252 C115 246 113 240 112 232 Z'
const PERUT =
  'M112 244 C140 284 220 288 262 272 C296 258 316 226 320 194 C298 236 250 252 196 254 C160 256 128 252 112 244 Z'

function bangunEkor() {
  const cx = 58
  const cy = 254
  const th0 = Math.atan2(238 - cy, 120 - cx)
  const r0 = Math.hypot(120 - cx, 238 - cy)
  const N = 64
  const pts: [number, number][] = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const th = th0 + t * 8.4
    const r = r0 * (1 - 0.88 * t)
    pts.push([cx + r * Math.cos(th), cy + r * Math.sin(th)])
  }
  const kiri: string[] = []
  const kanan: string[] = []
  for (let i = 0; i <= N; i++) {
    const a = pts[Math.max(0, i - 1)]
    const b = pts[Math.min(N, i + 1)]
    const tx = b[0] - a[0]
    const ty = b[1] - a[1]
    const len = Math.hypot(tx, ty) || 1
    const nx = -ty / len
    const ny = tx / len
    const w = (27 * (1 - i / N) + 4.5) / 2
    kiri.push(`${f1(pts[i][0] + nx * w)} ${f1(pts[i][1] + ny * w)}`)
    kanan.push(`${f1(pts[i][0] - nx * w)} ${f1(pts[i][1] - ny * w)}`)
  }
  const bentuk = 'M' + kiri.join('L') + 'L' + kanan.reverse().join('L') + 'Z'
  const garis = 'M' + pts.map((p) => `${f1(p[0])} ${f1(p[1])}`).join('L')
  return { bentuk, garis, ujung: pts[N] }
}
const EKOR = bangunEkor()

const PUNGGUNG: [number, number][] = [
  [120, 168], [130, 142], [148, 124], [172, 113], [200, 108], [228, 110], [254, 118], [276, 130],
]
const DURI = PUNGGUNG.slice(0, -1)
  .map((a, i) => {
    const b = PUNGGUNG[i + 1]
    const mx = (a[0] + b[0]) / 2
    const my = (a[1] + b[1]) / 2
    const tx = b[0] - a[0]
    const ty = b[1] - a[1]
    const len = Math.hypot(tx, ty)
    const nx = ty / len
    const ny = -tx / len
    return `M${a[0]} ${a[1]} L${f1(mx + nx * 15)} ${f1(my + ny * 15)} L${b[0]} ${b[1]} Z`
  })
  .join(' ')

const BINTIK: [number, number, number][] = [
  [150, 176, 14], [198, 144, 11], [236, 196, 16], [172, 226, 10], [128, 210, 7], [258, 152, 8], [214, 238, 7],
]

const ASAL_LIDAH: [number, number] = [364, 191]
const MAKS_PUPIL = 8

// ---------- mata ----------
interface PropsMata {
  cx: number
  cy: number
  R: number
  r: number
  rp: number
  lid: number
  miring: number
  busur: boolean
  pupil: number
  skala: number
  xs: MotionValue<number>
  ys: MotionValue<number>
  refSklera: React.RefObject<SVGCircleElement>
}

function Mata({ cx, cy, R, r, rp, lid, miring, busur, pupil, skala, xs, ys, refSklera }: PropsMata) {
  const id = amanId(useId())
  const yBuka = -(3 * R + 4)
  const yTutup = -(R + 2)
  const y = yBuka + lid * (yTutup - yBuka)
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <motion.g animate={{ scale: skala }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
        <circle r={R} className="n-dasar n-garis-bayang" strokeWidth="3.2" />
        <clipPath id={id}>
          <circle r={R - 1.6} />
        </clipPath>
        <g clipPath={`url(#${id})`}>
          <circle r={r} fill="#fffdf2" ref={refSklera} />
          <motion.g style={{ x: xs, y: ys }}>
            <motion.circle initial={{ r: rp * pupil }} animate={{ r: rp * pupil }} transition={{ duration: 0.25 }} fill="#1a1a2e" />
            <circle cx={-rp * 0.38} cy={-rp * 0.42} r={rp * 0.32} fill="#ffffff" />
          </motion.g>
          <g transform={`rotate(${miring})`}>
            <motion.rect
              x={-R - 3}
              width={2 * R + 6}
              height={2 * R + 6}
              className="n-dasar n-garis-bayang"
              strokeWidth="2.6"
              animate={{ y }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            />
          </g>
        </g>
        <motion.path
          d={`M${f1(-R * 0.55)} ${f1(R * 0.18)} Q 0 ${f1(-R * 0.62)} ${f1(R * 0.55)} ${f1(R * 0.18)}`}
          fill="none"
          stroke="#1a1a2e"
          strokeWidth="3.6"
          strokeLinecap="round"
          animate={{ opacity: busur ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />
      </motion.g>
    </g>
  )
}

// ---------- komponen utama ----------
interface Kunang {
  x: number
  y: number
  bx: number
  by: number
  ax: number
  ay: number
  fx: number
  fy: number
  fase: number
  hidup: boolean
}

const BASIS_KUNANG: [number, number][] = [
  [412, 64],
  [442, 140],
  [410, 224],
]

export type PosisiGelembung = 'atas' | 'kiri-atas' | false

interface Props {
  kulit: Kulit
  ukuran?: 'besar' | 'sedang' | 'kecil'
  cabang?: boolean
  gelembung?: PosisiGelembung
  className?: string
}

const LEBAR: Record<NonNullable<Props['ukuran']>, string> = {
  besar: 'w-full',
  sedang: 'w-[min(240px,70vw)]',
  kecil: 'w-[112px]',
}

export function Nalar({ kulit, ukuran = 'besar', cabang = true, gelembung = 'atas', className = '' }: Props) {
  const { mood, gelembung: teks, poin, katakan, tambahPoin } = useNalar()
  const gerak = useGerak()
  const ekspresi = EKSPRESI[mood]
  const idBadan = amanId(useId())
  const idGlow = amanId(useId())

  // --- mata ---
  const sklKiri = useRef<SVGCircleElement>(null)
  const sklKanan = useRef<SVGCircleElement>(null)
  const xKiri = useSpring(0, { stiffness: 140, damping: 16 })
  const yKiri = useSpring(0, { stiffness: 140, damping: 16 })
  const xKanan = useSpring(0, { stiffness: 205, damping: 20 })
  const yKanan = useSpring(0, { stiffness: 205, damping: 20 })
  const terakhirPointer = useRef<{ x: number; y: number } | null>(null)
  const terakhirGerak = useRef(0)
  const tatap = useRef<[number, number] | null>(null)
  tatap.current = ekspresi.tatap

  const arahkan = useCallback((px: number, py: number) => {
    const pasang: [React.RefObject<SVGCircleElement>, MotionValue<number>, MotionValue<number>][] = [
      [sklKiri, xKiri, yKiri],
      [sklKanan, xKanan, yKanan],
    ]
    for (const [ref, mx, my] of pasang) {
      const el = ref.current
      if (!el) continue
      const b = el.getBoundingClientRect()
      const dx = px - (b.left + b.width / 2)
      const dy = py - (b.top + b.height / 2)
      const jarak = Math.hypot(dx, dy) || 1
      const mag = Math.min(1, jarak / 150) * MAKS_PUPIL
      mx.set((dx / jarak) * mag)
      my.set((dy / jarak) * mag)
    }
  }, [xKiri, yKiri, xKanan, yKanan])

  // ikuti kursor / sentuhan
  useEffect(() => {
    if (gerak.kurang) return
    let raf = 0
    const onGerak = (e: PointerEvent) => {
      terakhirPointer.current = { x: e.clientX, y: e.clientY }
      terakhirGerak.current = performance.now()
      if (tatap.current || raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const p = terakhirPointer.current
        if (p) arahkan(p.x, p.y)
      })
    }
    window.addEventListener('pointermove', onGerak, { passive: true })
    window.addEventListener('pointerdown', onGerak, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onGerak)
      window.removeEventListener('pointerdown', onGerak)
      cancelAnimationFrame(raf)
    }
  }, [gerak.kurang, arahkan])

  // ekspresi yang menuntut arah pandang tertentu (mikir, ngantuk, sedih) atau kembali ke kursor
  useEffect(() => {
    const t = ekspresi.tatap
    if (t) {
      xKiri.set(t[0]); yKiri.set(t[1]); xKanan.set(t[0]); yKanan.set(t[1])
    } else if (terakhirPointer.current && !gerak.kurang) {
      arahkan(terakhirPointer.current.x, terakhirPointer.current.y)
    } else {
      xKiri.set(0); yKiri.set(0); xKanan.set(0); yKanan.set(0)
    }
  }, [ekspresi, gerak.kurang, arahkan, xKiri, yKiri, xKanan, yKanan])

  // melirik sendiri-sendiri saat sepi (mata bunglon tidak selalu searah)
  useEffect(() => {
    if (gerak.kurang) return
    const timers: ReturnType<typeof setTimeout>[] = []
    const jalan = (mx: MotionValue<number>, my: MotionValue<number>, min: number, rentang: number) => {
      const langkah = () => {
        if (!tatap.current && performance.now() - terakhirGerak.current > 3000) {
          const sudut = Math.random() * Math.PI * 2
          const mag = Math.random() < 0.25 ? 0 : MAKS_PUPIL * (0.4 + Math.random() * 0.6)
          mx.set(Math.cos(sudut) * mag)
          my.set(Math.sin(sudut) * mag)
        }
        timers.push(setTimeout(langkah, min + Math.random() * rentang))
      }
      timers.push(setTimeout(langkah, min + Math.random() * rentang))
    }
    jalan(xKiri, yKiri, 1100, 2400)
    jalan(xKanan, yKanan, 1700, 3000)
    return () => timers.forEach(clearTimeout)
  }, [gerak.kurang, xKiri, yKiri, xKanan, yKanan])

  // kedip bergantian
  const [kedipK, setKedipK] = useState(false)
  const [kedipB, setKedipB] = useState(false)
  useEffect(() => {
    if (gerak.kurang) return
    const timers: ReturnType<typeof setTimeout>[] = []
    const jalan = (set: (v: boolean) => void, min: number, rentang: number) => {
      const langkah = () => {
        set(true)
        timers.push(setTimeout(() => set(false), 130))
        timers.push(setTimeout(langkah, min + Math.random() * rentang))
      }
      timers.push(setTimeout(langkah, min + Math.random() * rentang))
    }
    jalan(setKedipK, 2600, 3200)
    jalan(setKedipB, 3300, 3600)
    return () => timers.forEach(clearTimeout)
  }, [gerak.kurang])

  // --- kunang-kunang & lidah ---
  const kunang = useRef<Kunang[]>(
    BASIS_KUNANG.map(([x, y], i) => ({ x, y, bx: x, by: y, ax: 12 + i * 3, ay: 14 - i * 2, fx: 0.7 + i * 0.23, fy: 0.9 - i * 0.17, fase: i * 2.1, hidup: true })),
  )
  const elKunang = useRef<(SVGGElement | null)[]>([])
  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const s = (t - t0) / 1000
      kunang.current.forEach((k, i) => {
        if (!gerak.kurang) {
          k.x = k.bx + k.ax * Math.sin(s * k.fx + k.fase)
          k.y = k.by + k.ay * Math.cos(s * k.fy + k.fase * 1.3)
        }
        const el = elKunang.current[i]
        if (el) {
          el.setAttribute('transform', `translate(${f1(k.x)} ${f1(k.y)})`)
          el.style.opacity = k.hidup ? String(0.7 + 0.3 * Math.sin(s * 3.2 + k.fase)) : '0'
        }
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [gerak.kurang])

  const p = useMotionValue(0)
  const sasaran = useRef<[number, number]>([ASAL_LIDAH[0] + 60, ASAL_LIDAH[1]])
  const dLidah = useTransform(p, (v) => `M${ASAL_LIDAH[0]} ${ASAL_LIDAH[1]} L${f1(ASAL_LIDAH[0] + (sasaran.current[0] - ASAL_LIDAH[0]) * v)} ${f1(ASAL_LIDAH[1] + (sasaran.current[1] - ASAL_LIDAH[1]) * v)}`)
  const cxLidah = useTransform(p, (v) => ASAL_LIDAH[0] + (sasaran.current[0] - ASAL_LIDAH[0]) * v)
  const cyLidah = useTransform(p, (v) => ASAL_LIDAH[1] + (sasaran.current[1] - ASAL_LIDAH[1]) * v)
  const oLidah = useTransform(p, (v) => (v > 0.02 ? 1 : 0))
  const sedangMenjulur = useRef(false)
  const [plus, setPlus] = useState<{ id: number; x: number; y: number }[]>([])
  const idPlus = useRef(0)

  const klikBeruntun = useRef({ n: 0, t: 0 })
  const [goyang, setGoyang] = useState(0)

  const tangkap = useCallback(async () => {
    if (sedangMenjulur.current) return
    const hidup = kunang.current.filter((k) => k.hidup)
    if (!hidup.length) {
      katakan('tangkapGagal')
      return
    }
    hidup.sort((a, b) => Math.hypot(a.x - ASAL_LIDAH[0], a.y - ASAL_LIDAH[1]) - Math.hypot(b.x - ASAL_LIDAH[0], b.y - ASAL_LIDAH[1]))
    const k = hidup[0]
    sasaran.current = [k.x, k.y]
    sedangMenjulur.current = true
    const dur = gerak.kurang ? 0.3 : 0.6
    await animate(p, 1, { duration: dur * 0.45, ease: 'easeOut' })
    k.hidup = false
    const id = ++idPlus.current
    setPlus((arr) => [...arr, { id, x: k.x, y: k.y }])
    setTimeout(() => setPlus((arr) => arr.filter((z) => z.id !== id)), 1100)
    tambahPoin(1)
    katakan('tangkap')
    await animate(p, 0, { duration: dur * 0.55, ease: 'easeIn' })
    sedangMenjulur.current = false
    setTimeout(() => {
      const [bx, by] = BASIS_KUNANG[Math.floor(Math.random() * BASIS_KUNANG.length)]
      k.bx = bx + (Math.random() * 16 - 8)
      k.by = by + (Math.random() * 16 - 8)
      k.hidup = true
    }, 3800)
  }, [gerak.kurang, katakan, p, tambahPoin])

  const onKlik = useCallback(() => {
    const sekarang = performance.now()
    const b = klikBeruntun.current
    b.n = sekarang - b.t < 1800 ? b.n + 1 : 1
    b.t = sekarang
    if (b.n >= 5) {
      b.n = 0
      katakan('klikBeruntun')
      setGoyang((g) => g + 1)
      return
    }
    void tangkap()
  }, [katakan, tangkap])

  // --- gaya ---
  const gayaKulit = useMemo(
    () =>
      ({
        '--n-dasar': kulit.dasar,
        '--n-bayang': kulit.bayang,
        '--n-terang': kulit.terang,
        '--n-bintik': kulit.bintik,
        '--n-ekor': `${ekspresi.ekor}s`,
      }) as CSSProperties,
    [kulit, ekspresi.ekor],
  )

  const anim = useMemo(() => {
    if (gerak.kurang) return { y: 0 }
    if (mood === 'semangat') return { y: [0, -9, 0], transition: { duration: 0.65, repeat: Infinity, ease: 'easeInOut' as const } }
    if (mood === 'kaget') return { y: [0, -18, 0], transition: { duration: 0.45 } }
    return { y: 0, transition: { duration: 0.35 } }
  }, [mood, gerak.kurang])

  const label = `Nalar, maskot bunglon, sedang ${ekspresi.label}`

  return (
    <div className={`relative ${LEBAR[ukuran]} ${className}`}>
      {gelembung && (
        <div
          className={`pointer-events-none absolute z-20 ${gelembung === 'atas' ? 'bottom-[96%] left-1/2 -translate-x-1/2' : 'bottom-[96%] right-0'}`}
          style={{ width: 'max-content', maxWidth: 'min(240px, 80vw)' }}
        >
          <div role="status" aria-live="polite">
            {teks && (
              <p key={teks.id} className={`gelembung n-gelembung ${gelembung === 'atas' ? 'gelembung-tengah' : 'gelembung-kanan'}`}>
                {teks.teks}
              </p>
            )}
          </div>
        </div>
      )}

      <motion.button
        key={goyang}
        type="button"
        onClick={onKlik}
        aria-label={`${label}. Klik untuk mencolek.`}
        className="block w-full cursor-pointer border-0 bg-transparent p-0"
        style={{ WebkitTapHighlightColor: 'transparent' }}
        animate={goyang ? { rotate: [0, -5, 5, -4, 4, 0] } : undefined}
        transition={{ duration: 0.5 }}
      >
        <svg viewBox="-16 0 496 330" role="img" aria-label={label} className="block h-auto w-full overflow-visible" style={gayaKulit}>
          <title>{label}</title>
          <defs>
            <clipPath id={idBadan}>
              <path d={BADAN} />
            </clipPath>
            <radialGradient id={idGlow}>
              <stop offset="0" stopColor="#fff9c4" stopOpacity="1" />
              <stop offset="0.35" stopColor="#f6d24b" stopOpacity="0.7" />
              <stop offset="1" stopColor="#f6d24b" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* dahan tempat duduk */}
          {cabang && (
            <g>
              <path d="M-20 296 C60 282 140 300 230 292 S400 280 490 292" fill="none" stroke="#3d2314" strokeWidth="19" strokeLinecap="round" />
              <path d="M-20 296 C60 282 140 300 230 292 S400 280 490 292" fill="none" stroke="#6b4426" strokeWidth="5" strokeLinecap="round" strokeDasharray="22 14" />
              <ellipse cx="396" cy="270" rx="6" ry="14" transform="rotate(30 396 270)" fill="#79a05a" stroke="#4f7a3a" strokeWidth="1.5" />
              <ellipse cx="416" cy="276" rx="5" ry="12" transform="rotate(62 416 276)" fill="#79a05a" stroke="#4f7a3a" strokeWidth="1.5" />
            </g>
          )}

          {/* ekor menggulung */}
          <g className="n-ekor">
            <path d={EKOR.bentuk} className="n-dasar n-garis-bayang" strokeWidth="2.5" strokeLinejoin="round" />
            <path d={EKOR.garis} fill="none" className="n-garis-bayang" strokeWidth="2.6" strokeDasharray="5 11" strokeLinecap="round" opacity="0.5" />
            <circle cx={f1(EKOR.ujung[0])} cy={f1(EKOR.ujung[1])} r="3.4" className="n-bintik" />
          </g>

          <motion.g animate={anim}>
            <g className="n-napas">
              {/* kaki */}
              <g fill="none" strokeLinecap="round" strokeLinejoin="round" className="n-garis-bayang">
                <path d="M146 248 L152 274 L170 284 M170 284 l12 -9 M170 284 l12 6" strokeWidth="19" />
                <path d="M258 244 L272 272 L290 284 M290 284 l13 -10 M290 284 l13 6" strokeWidth="19" />
              </g>

              {/* badan */}
              <path d={BADAN} className="n-dasar n-garis-bayang" strokeWidth="3" strokeLinejoin="round" />
              <g clipPath={`url(#${idBadan})`}>
                <path d={PERUT} className="n-terang" />
                <path d="M160 120 C152 170 158 214 178 270 M206 108 C200 150 206 200 220 276 M252 114 C250 160 256 210 262 270" fill="none" className="n-garis-bayang" strokeWidth="5" opacity="0.32" strokeLinecap="round" />
                {BINTIK.map(([x, y, r], i) => (
                  <circle key={i} cx={x} cy={y} r={r} className="n-bintik n-garis-bayang" strokeWidth="2" opacity="0.92" />
                ))}
              </g>
              <path d={DURI} className="n-bayang" strokeLinejoin="round" />

              {/* kepala */}
              <motion.g animate={{ rotate: ekspresi.kepala }} transition={{ type: 'spring', stiffness: 120, damping: 14 }} style={{ transformOrigin: '292px 200px' }}>
                {/* jambul (casque) */}
                <path d="M252 122 C238 98 228 86 212 80 C226 104 224 128 238 146 Z" className="n-bayang n-garis-bayang" strokeWidth="2.5" strokeLinejoin="round" />
                <ellipse cx="298" cy="156" rx="57" ry="50" className="n-dasar n-garis-bayang" strokeWidth="3" />
                <ellipse cx="346" cy="179" rx="33" ry="24" className="n-dasar n-garis-bayang" strokeWidth="3" />
                <ellipse cx="346" cy="170" rx="22" ry="8" className="n-terang" opacity="0.5" />
                <motion.circle cx="324" cy="170" r="10" fill="#ff8fa3" animate={{ opacity: ekspresi.pipi }} transition={{ duration: 0.3 }} />
                <circle cx="352" cy="164" r="2.6" fill="#1a1a2e" opacity="0.55" />

                {/* mulut */}
                <motion.path d={ekspresi.mulut} initial={false} animate={{ d: ekspresi.mulut }} transition={{ duration: 0.28 }} fill="#6a2231" stroke="#4a1220" strokeWidth="2.6" strokeLinejoin="round" />
                <motion.g animate={{ opacity: ekspresi.lidahNakal ? 1 : 0, y: ekspresi.lidahNakal ? 0 : -6 }} transition={{ duration: 0.25 }}>
                  <path d="M352 198 C354 214 366 214 368 198 Z" fill="#ef6f86" stroke="#b83a58" strokeWidth="2" />
                </motion.g>

                {/* mata kiri & kanan — independen */}
                <Mata cx={268} cy={114} R={24} r={16.5} rp={8} lid={Math.max(ekspresi.lidK, kedipK ? 1 : 0)} miring={ekspresi.miring} busur={ekspresi.busur} pupil={ekspresi.pupil} skala={ekspresi.mata} xs={xKiri} ys={yKiri} refSklera={sklKiri} />
                <Mata cx={324} cy={122} R={26} r={18} rp={8.8} lid={Math.max(ekspresi.lidB, kedipB ? 1 : 0)} miring={-ekspresi.miring} busur={ekspresi.busur} pupil={ekspresi.pupil} skala={ekspresi.mata} xs={xKanan} ys={yKanan} refSklera={sklKanan} />
              </motion.g>
            </g>
          </motion.g>

          {/* lidah */}
          <motion.g style={{ opacity: oLidah }}>
            <motion.path d={dLidah} fill="none" stroke="#e8627a" strokeWidth="7" strokeLinecap="round" />
            <motion.circle cx={cxLidah} cy={cyLidah} r="8" fill="#ef6f86" stroke="#b83a58" strokeWidth="2" />
          </motion.g>

          {/* hiasan ekspresi */}
          <AnimatePresence>
            {ekspresi.ekstra === 'zzz' && (
              <motion.g key="zzz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {[0, 0.8, 1.6].map((d, i) => (
                  <text key={i} x={348 + i * 14} y={96 - i * 14} fontSize={22 + i * 6} className="n-zzz" style={{ animationDelay: `${d}s` }}>
                    z
                  </text>
                ))}
              </motion.g>
            )}
            {ekspresi.ekstra === 'tanya' && (
              <motion.g key="tanya" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <text x="332" y="72" fontSize="46" fontFamily="Fraunces, Georgia, serif" fontWeight="800" fill="#fff7d6" stroke="#1a1a2e" strokeWidth="3.5" paintOrder="stroke">
                  ?
                </text>
              </motion.g>
            )}
            {ekspresi.ekstra === 'keringat' && (
              <motion.g key="keringat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <path className="n-tetes" d="M366 112 C358 124 358 134 366 136 C374 134 374 124 366 112 Z" fill="#8fd3f4" stroke="#1a1a2e" strokeWidth="2" />
              </motion.g>
            )}
            {ekspresi.ekstra === 'airMata' && (
              <motion.g key="air" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <path className="n-tetes" d="M334 146 C327 156 327 164 334 166 C341 164 341 156 334 146 Z" fill="#8fd3f4" stroke="#1a1a2e" strokeWidth="2" />
              </motion.g>
            )}
            {ekspresi.ekstra === 'kilau' && (
              <motion.g key="kilau" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {[[236, 76, 1], [372, 98, 0.8], [302, 52, 1.1]].map(([x, y, s], i) => (
                  <path key={i} className="n-kilau" style={{ animationDelay: `${i * 0.35}s` }} transform={`translate(${x} ${y}) scale(${s})`} d="M0 -12 L3 -3 L12 0 L3 3 L0 12 L-3 3 L-12 0 L-3 -3 Z" fill="#fff6c4" stroke="#e8892b" strokeWidth="1.5" />
                ))}
              </motion.g>
            )}
          </AnimatePresence>

          {/* kunang-kunang */}
          {kunang.current.map((_, i) => (
            <g key={i} ref={(el) => (elKunang.current[i] = el)} aria-hidden="true">
              <circle r="15" fill={`url(#${idGlow})`} />
              <circle r="3.4" fill="#fffbd6" />
            </g>
          ))}

          {/* poin kecil */}
          <AnimatePresence>
            {plus.map((z) => (
              <motion.text
                key={z.id}
                x={z.x}
                y={z.y}
                textAnchor="middle"
                fontSize="26"
                fontWeight="800"
                fontFamily="Fraunces, Georgia, serif"
                fill="#fff7d6"
                stroke="#1a1a2e"
                strokeWidth="4"
                paintOrder="stroke"
                initial={{ opacity: 0, y: z.y }}
                animate={{ opacity: [0, 1, 1, 0], y: z.y - 34 }}
                transition={{ duration: 1, times: [0, 0.15, 0.7, 1] }}
              >
                +1
              </motion.text>
            ))}
          </AnimatePresence>
        </svg>
      </motion.button>

      {poin > 0 && (
        <span className="absolute -top-1 left-0 rounded-full border-2 border-tinta bg-kuning-pusaran px-2 py-0.5 text-xs font-bold text-tinta shadow" aria-label={`${poin} kunang-kunang tertangkap`}>
          ✨ {poin}
        </span>
      )}
    </div>
  )
}
