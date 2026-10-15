import { useEffect, useRef } from 'react'
import { fx } from '../../lib/fxbus'
import { useGerak } from '../../lib/gerak'
import type { TemaGlobal } from '../../lib/types'

// Lapisan efek di atas segalanya (Canvas, pointer-events: none):
//  1. kursor kuas: titik cat + jejak warna yang memudar (tidak aktif di layar sentuh)
//  4. percikan saat bintang diklik
//  5. hujan kelopak bunga matahari saat bab selesai

interface Jejak {
  x: number
  y: number
  r: number
  c: string
  lahir: number
}
interface Percik {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  c: string
  lahir: number
  umur: number
}
interface Kelopak {
  x: number
  y: number
  vy: number
  vx: number
  rot: number
  vr: number
  s: number
  fase: number
  lahir: number
  umur: number
}

const PALET_JEJAK: Record<TemaGlobal, string[]> = {
  malam: ['#f6d24b', '#4aa3c7', '#f26a1b', '#fff6c8', '#7ec4e0'],
  ladang: ['#2f4ba2', '#f26a1b', '#5b4b9a', '#1c2b6b', '#4aa3c7'],
}

const KELOPAK = new Path2D('M0 -4 C 5 -10, 5 -22, 0 -28 C -5 -22, -5 -10, 0 -4 Z')

export function FxLayer({ tema }: { tema: TemaGlobal }) {
  const gerak = useGerak()
  const ref = useRef<HTMLCanvasElement>(null)
  const temaRef = useRef(tema)
  temaRef.current = tema
  const gerakRef = useRef(gerak)
  gerakRef.current = gerak

  const kursorAktif = gerak.halus && !gerak.ringan

  useEffect(() => {
    document.documentElement.classList.toggle('kuas-aktif', kursorAktif)
    return () => document.documentElement.classList.remove('kuas-aktif')
  }, [kursorAktif])

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const g = c.getContext('2d')
    if (!g) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    const susun = () => {
      w = window.innerWidth
      h = window.innerHeight
      c.width = Math.round(w * dpr)
      c.height = Math.round(h * dpr)
      c.style.width = w + 'px'
      c.style.height = h + 'px'
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    susun()

    const jejak: Jejak[] = []
    const percik: Percik[] = []
    const kelopak: Kelopak[] = []
    const kursor = { x: -100, y: -100, tampil: false, warna: 0, jarak: 0 }
    let raf = 0
    let akhir = 0

    const butuh = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }

    const frame = (t: number) => {
      raf = 0
      const dt = Math.min(0.05, (t - akhir) / 1000 || 0.016)
      akhir = t
      g.clearRect(0, 0, w, h)

      // jejak cat
      for (let i = jejak.length - 1; i >= 0; i--) {
        const j = jejak[i]
        const umur = (t - j.lahir) / 950
        if (umur >= 1) {
          jejak.splice(i, 1)
          continue
        }
        g.globalAlpha = (1 - umur) * 0.85
        g.fillStyle = j.c
        g.beginPath()
        g.arc(j.x, j.y, j.r * (1 - umur * 0.6), 0, Math.PI * 2)
        g.fill()
      }

      // percikan
      for (let i = percik.length - 1; i >= 0; i--) {
        const p = percik[i]
        const umur = (t - p.lahir) / p.umur
        if (umur >= 1) {
          percik.splice(i, 1)
          continue
        }
        p.vy += 520 * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        g.globalAlpha = 1 - umur
        g.fillStyle = p.c
        g.beginPath()
        g.arc(p.x, p.y, p.r * (1 - umur * 0.5), 0, Math.PI * 2)
        g.fill()
      }

      // kelopak bunga matahari
      for (let i = kelopak.length - 1; i >= 0; i--) {
        const k = kelopak[i]
        const umur = (t - k.lahir) / k.umur
        if (umur >= 1 || k.y > h + 40) {
          kelopak.splice(i, 1)
          continue
        }
        if (gerakRef.current.kurang) {
          // reduced-motion: kelopak muncul diam lalu memudar (tanpa jatuh)
          g.globalAlpha = Math.sin(Math.min(1, umur) * Math.PI) * 0.9
        } else {
          k.y += k.vy * dt
          k.x += (k.vx + Math.sin(t / 420 + k.fase) * 38) * dt
          k.rot += k.vr * dt
          g.globalAlpha = umur > 0.85 ? (1 - umur) / 0.15 : 1
        }
        g.save()
        g.translate(k.x, k.y)
        g.rotate(k.rot)
        g.scale(k.s, k.s)
        g.fillStyle = '#f6d24b'
        g.strokeStyle = '#e8892b'
        g.lineWidth = 1.6
        g.fill(KELOPAK)
        g.stroke(KELOPAK)
        g.restore()
      }

      // kepala kuas
      if (kursor.tampil && gerakRef.current.halus && !gerakRef.current.ringan) {
        const warna = PALET_JEJAK[temaRef.current][kursor.warna % 5]
        g.globalAlpha = 1
        g.fillStyle = warna
        g.strokeStyle = '#1a1a2e'
        g.lineWidth = 2
        g.beginPath()
        g.arc(kursor.x, kursor.y, 8, 0, Math.PI * 2)
        g.fill()
        g.stroke()
        g.fillStyle = 'rgba(255,255,255,.65)'
        g.beginPath()
        g.arc(kursor.x - 2.5, kursor.y - 2.5, 2.2, 0, Math.PI * 2)
        g.fill()
      }
      g.globalAlpha = 1

      if (jejak.length || percik.length || kelopak.length) butuh()
    }

    // --- kursor kuas ---
    const gerakKursor = (e: PointerEvent) => {
      const gr = gerakRef.current
      if (e.pointerType !== 'mouse' || !gr.halus || gr.ringan) return
      const dx = e.clientX - kursor.x
      const dy = e.clientY - kursor.y
      const jarak = Math.hypot(dx, dy)
      if (kursor.tampil && jarak < 220) {
        const langkah = Math.max(1, Math.floor(jarak / 5))
        for (let i = 1; i <= langkah; i++) {
          kursor.jarak += jarak / langkah
          if (kursor.jarak > 90) {
            kursor.jarak = 0
            kursor.warna++
          }
          jejak.push({
            x: kursor.x + (dx * i) / langkah,
            y: kursor.y + (dy * i) / langkah,
            r: 5.5 + Math.random() * 2,
            c: PALET_JEJAK[temaRef.current][kursor.warna % 5],
            lahir: performance.now(),
          })
        }
        if (jejak.length > 260) jejak.splice(0, jejak.length - 260)
      }
      kursor.x = e.clientX
      kursor.y = e.clientY
      kursor.tampil = true
      butuh()
    }
    const keluar = () => {
      kursor.tampil = false
      butuh()
    }
    window.addEventListener('pointermove', gerakKursor, { passive: true })
    document.documentElement.addEventListener('pointerleave', keluar)
    window.addEventListener('blur', keluar)

    // --- percikan & kelopak ---
    const offFx = fx.pantau((e) => {
      if (e.jenis === 'percik') {
        const n = gerakRef.current.kurang ? 8 : 16
        const warna = [...(e.warna ?? ['#f6d24b']), '#ffffff', '#f26a1b', '#fff6c8']
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2
          const v = 80 + Math.random() * 240
          percik.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v - 80,
            r: 2 + Math.random() * 3.2,
            c: warna[i % warna.length],
            lahir: performance.now(),
            umur: 650 + Math.random() * 450,
          })
        }
      } else {
        const kurang = gerakRef.current.kurang
        const n = kurang ? 22 : gerakRef.current.ringan ? 36 : 72
        const kini = performance.now()
        for (let i = 0; i < n; i++) {
          kelopak.push({
            x: Math.random() * w,
            y: kurang ? Math.random() * h * 0.8 : -30 - Math.random() * h * 0.6,
            vy: 110 + Math.random() * 150,
            vx: -20 + Math.random() * 40,
            rot: Math.random() * Math.PI * 2,
            vr: -2.2 + Math.random() * 4.4,
            s: 0.7 + Math.random() * 0.8,
            fase: Math.random() * 6.28,
            lahir: kini + (kurang ? Math.random() * 400 : 0),
            umur: kurang ? 2600 : 9000,
          })
        }
      }
      butuh()
    })

    window.addEventListener('resize', susun)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', gerakKursor)
      document.documentElement.removeEventListener('pointerleave', keluar)
      window.removeEventListener('blur', keluar)
      window.removeEventListener('resize', susun)
      offFx()
    }
  }, [])

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[70]" />
}
