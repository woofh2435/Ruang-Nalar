import { AnimatePresence, motion } from 'framer-motion'
import { useMemo } from 'react'
import { NAMA_WEB } from '../../config'

// Layar pemuatan: pusaran yang berputar.

function spiralPath(r0: number, r1: number, putaran: number, fase: number) {
  let d = ''
  for (let i = 0; i <= 120; i++) {
    const t = i / 120
    const a = fase + t * putaran * Math.PI * 2
    const r = r0 + (r1 - r0) * t
    d += `${i ? 'L' : 'M'}${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)} `
  }
  return d
}

export function LoadingSwirl({ tampil }: { tampil: boolean }) {
  const untai = useMemo(() => {
    const warna = ['#f6d24b', '#4aa3c7', '#2f4ba2', '#fff6c8', '#7ec4e0', '#f26a1b']
    return Array.from({ length: 6 }, (_, k) => ({
      d: spiralPath(4 + k * 1.5, 92 - k * 5, 3.2, (k * Math.PI * 2) / 6),
      c: warna[k % warna.length],
      w: 7 + (k % 3) * 2.5,
    }))
  }, [])
  return (
    <AnimatePresence>
      {tampil && (
        <motion.div
          key="memuat"
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-6 px-6 text-center"
          style={{ background: 'radial-gradient(circle at 50% 40%, #2f4ba2 0%, #1c2b6b 55%, #101a52 100%)', color: '#f4e9cf' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
        >
          <svg viewBox="-110 -110 220 220" className="h-44 w-44 sm:h-56 sm:w-56" aria-hidden="true" focusable="false">
            <g className="putar-cepat">
              {untai.map((u, i) => (
                <path key={i} d={u.d} fill="none" stroke={u.c} strokeWidth={u.w} strokeLinecap="round" opacity="0.9" />
              ))}
            </g>
            <circle r="5" fill="#fff6c8" />
          </svg>
          <p className="font-display text-xl font-bold italic sm:text-2xl">Nalar lagi menyiapkan rak buku…</p>
          <span className="sr-only">Memuat {NAMA_WEB}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
