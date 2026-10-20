import { motion } from 'framer-motion'
import { useEffect } from 'react'

// Transisi halaman: sapuan kuas lebar yang menyapu layar dari kiri ke kanan.
// Halaman baru dipasang tepat saat layar tertutup penuh (onTutup).

const PITA = [
  { warna: '#1c2b6b', atas: 0 },
  { warna: '#2f4ba2', atas: 18 },
  { warna: '#4aa3c7', atas: 36 },
  { warna: '#f6d24b', atas: 54 },
  { warna: '#f26a1b', atas: 72 },
]

interface Props {
  onTutup: () => void
  onSelesai: () => void
}

export function Sapuan({ onTutup, onSelesai }: Props) {
  useEffect(() => {
    const a = window.setTimeout(onTutup, 560)
    const b = window.setTimeout(onSelesai, 1250)
    return () => {
      window.clearTimeout(a)
      window.clearTimeout(b)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[80] overflow-hidden">
      {PITA.map((p, i) => (
        <motion.div
          key={i}
          className="sapuan-pita absolute -left-[8%] w-[116%]"
          style={{ top: `${p.atas - 2}%`, height: '24%', background: p.warna }}
          initial={{ x: '-112%' }}
          animate={{ x: ['-112%', '0%', '112%'] }}
          transition={{ duration: 1.1, times: [0, 0.45, 1], ease: 'easeInOut', delay: i * 0.055 }}
        />
      ))}
    </div>
  )
}
