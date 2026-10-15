import { useEffect, useRef } from 'react'
import { dentingKecil } from '../../lib/audio'
import { fx } from '../../lib/fxbus'
import { useGerak } from '../../lib/gerak'
import { acak } from '../../lib/rng'
import type { TemaGlobal } from '../../lib/types'
import { useNalar } from '../nalar/NalarContext'

// Latar bergerak pelan (Canvas):
//  - pusaran langit digambar sekali ke kanvas lepas, lalu diputar sangat pelan lewat CSS
//  - bintang berkelip digambar per frame (±30 fps), dihentikan di mode hemat
//  - klik/ketuk bintang di area kosong -> percikan + Nalar berkomentar

interface Bintang {
  x: number
  y: number
  r: number
  fase: number
  kec: number
  boom: number
}

const WARNA: Record<TemaGlobal, { goresan: string[]; bintang: string[]; inti: string }> = {
  malam: {
    goresan: ['#2f4ba2', '#4aa3c7', '#f6d24b', '#7ec4e0', '#22389a', '#cfe8ef'],
    bintang: ['#f6d24b', '#fff6c8', '#cfe8ef'],
    inti: '#fffbe0',
  },
  ladang: {
    goresan: ['#f6d24b', '#e8892b', '#f4e9cf', '#f26a1b', '#ffe9a0'],
    bintang: ['#f26a1b', '#ffffff', '#e8892b'],
    inti: '#ffffff',
  },
}

function gambarPusaran(c: HTMLCanvasElement, tema: TemaGlobal, ukuran: number) {
  c.width = ukuran
  c.height = ukuran
  const g = c.getContext('2d')
  if (!g) return
  const r = acak(tema === 'malam' ? 11 : 29)
  const w = WARNA[tema].goresan
  g.clearRect(0, 0, ukuran, ukuran)
  g.lineCap = 'round'
  const pusaran = [
    { x: 0.42, y: 0.46, s: 0.42, t: 3.4 },
    { x: 0.76, y: 0.26, s: 0.22, t: 2.8 },
    { x: 0.22, y: 0.8, s: 0.2, t: 2.6 },
  ]
  for (const p of pusaran) {
    for (let k = 0; k < 9; k++) {
      g.beginPath()
      g.strokeStyle = w[(k + Math.floor(r() * 3)) % w.length]
      g.globalAlpha = 0.16 + r() * 0.18
      g.lineWidth = (ukuran / 110) * (3 + r() * 5)
      const fase = k * 0.62
      for (let i = 0; i <= 160; i++) {
        const t = i / 160
        const a = fase + t * p.t * Math.PI * 2
        const rad = (p.s * ukuran * (0.08 + t * 0.92)) + k * 3
        const x = p.x * ukuran + Math.cos(a) * rad
        const y = p.y * ukuran + Math.sin(a) * rad * 0.85
        if (i === 0) g.moveTo(x, y)
        else g.lineTo(x, y)
      }
      g.stroke()
    }
  }
  // pita angin
  for (let k = 0; k < 7; k++) {
    g.beginPath()
    g.strokeStyle = w[k % w.length]
    g.globalAlpha = 0.12 + r() * 0.12
    g.lineWidth = (ukuran / 110) * (4 + r() * 6)
    const y0 = ukuran * (0.55 + k * 0.05)
    g.moveTo(0, y0)
    for (let x = 0; x <= ukuran; x += ukuran / 12) g.quadraticCurveTo(x + ukuran / 24, y0 + (((x / ukuran) * 12) % 2 ? -1 : 1) * ukuran * 0.03, x + ukuran / 12, y0)
    g.stroke()
  }
  g.globalAlpha = 1
}

export function StarField({ tema }: { tema: TemaGlobal }) {
  const gerak = useGerak()
  const swirlRef = useRef<HTMLCanvasElement>(null)
  const starRef = useRef<HTMLCanvasElement>(null)
  const bintang = useRef<Bintang[]>([])
  const { katakan } = useNalar()
  const katakanRef = useRef(katakan)
  katakanRef.current = katakan

  // --- pusaran (digambar sekali per tema / ukuran layar) ---
  useEffect(() => {
    const c = swirlRef.current
    if (!c) return
    const ukuran = Math.min(1300, Math.round(Math.max(window.innerWidth, window.innerHeight) * 1.45))
    gambarPusaran(c, tema, gerak.ringan ? Math.round(ukuran * 0.6) : ukuran)
  }, [tema, gerak.ringan])

  // --- bintang berkelip ---
  useEffect(() => {
    const c = starRef.current
    if (!c) return
    const g = c.getContext('2d')
    if (!g) return
    let w = 0
    let h = 0
    let raf = 0
    let akhir = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const palet = WARNA[tema]

    const susun = () => {
      w = window.innerWidth
      h = window.innerHeight
      c.width = Math.round(w * dpr)
      c.height = Math.round(h * dpr)
      c.style.width = w + 'px'
      c.style.height = h + 'px'
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      const r = acak(7)
      const n = Math.min(gerak.ringan ? 36 : 90, Math.round((w * h) / 11000))
      bintang.current = Array.from({ length: n }, () => ({
        x: r() * w,
        y: r() * h,
        r: 1.2 + r() * 2.6,
        fase: r() * Math.PI * 2,
        kec: 0.0008 + r() * 0.002,
        boom: -9999,
      }))
    }

    const gambar = (t: number) => {
      g.clearRect(0, 0, w, h)
      bintang.current.forEach((b, i) => {
        const kedip = gerak.ringan ? 0.8 : 0.5 + 0.5 * Math.sin(t * b.kec + b.fase)
        const letus = Math.max(0, 1 - (t - b.boom) / 700)
        const rr = b.r * (0.75 + kedip * 0.5) * (1 + letus * 1.6)
        const warna = palet.bintang[i % palet.bintang.length]
        g.globalAlpha = (0.25 + kedip * 0.55) * 0.9 + letus * 0.2
        g.fillStyle = warna
        g.beginPath()
        g.arc(b.x, b.y, rr * 2.4, 0, Math.PI * 2)
        g.globalAlpha *= 0.22
        g.fill()
        g.globalAlpha = 0.3 + kedip * 0.7
        g.beginPath()
        g.arc(b.x, b.y, rr, 0, Math.PI * 2)
        g.fill()
        g.fillStyle = palet.inti
        g.beginPath()
        g.arc(b.x, b.y, rr * 0.45, 0, Math.PI * 2)
        g.fill()
        if (kedip > 0.75 || letus > 0) {
          g.strokeStyle = warna
          g.lineWidth = 1
          g.globalAlpha = 0.35 + letus * 0.4
          const s = rr * (3.2 + letus * 3)
          g.beginPath()
          g.moveTo(b.x - s, b.y)
          g.lineTo(b.x + s, b.y)
          g.moveTo(b.x, b.y - s)
          g.lineTo(b.x, b.y + s)
          g.stroke()
        }
      })
      g.globalAlpha = 1
    }

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop)
      if (t - akhir < 33) return // ±30 fps cukup untuk kelipan
      akhir = t
      gambar(t)
    }

    susun()
    gambar(performance.now())
    if (!gerak.ringan) raf = requestAnimationFrame(loop)
    const ubahUkuran = () => {
      susun()
      gambar(performance.now())
    }
    window.addEventListener('resize', ubahUkuran)

    // klik bintang di latar
    const klik = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null
      if (!el) return
      const langit = el === document.documentElement || el === document.body || el.id === 'root' || el.hasAttribute('data-langit') || el.classList.contains('wadah')
      if (!langit) return
      let terdekat: Bintang | null = null
      let jarak = 30
      for (const b of bintang.current) {
        const d = Math.hypot(b.x - e.clientX, b.y - e.clientY)
        if (d < jarak) {
          jarak = d
          terdekat = b
        }
      }
      if (!terdekat) return
      terdekat.boom = performance.now()
      fx.percik(terdekat.x, terdekat.y, [palet.bintang[0], '#ffffff', '#f26a1b'])
      dentingKecil(Math.floor(Math.random() * 6))
      katakanRef.current('bintang')
      if (gerak.ringan) gambar(performance.now())
    }
    window.addEventListener('pointerdown', klik)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', ubahUkuran)
      window.removeEventListener('pointerdown', klik)
    }
  }, [tema, gerak.ringan, gerak.ringan])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <canvas ref={swirlRef} className={`latar-pusaran ${gerak.ringan ? '' : 'latar-putar'}`} />
      <canvas ref={starRef} className="absolute left-0 top-0" />
    </div>
  )
}
