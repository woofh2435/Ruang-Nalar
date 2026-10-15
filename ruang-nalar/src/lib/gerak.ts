// Tingkat gerak: hormati prefers-reduced-motion dan matikan animasi berat di perangkat lemah.

import { useSyncExternalStore } from 'react'

export interface Gerak {
  /** pengguna meminta gerak dikurangi */
  kurang: boolean
  /** mode ringan: filter cat, kursor kuas, dan animasi berat dimatikan */
  ringan: boolean
  /** ada mouse/trackpad halus (kursor kuas hanya aktif di sini) */
  halus: boolean
}

function perangkatLemah(): boolean {
  try {
    const n = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
    if (typeof n.hardwareConcurrency === 'number' && n.hardwareConcurrency <= 2) return true
    if (typeof n.deviceMemory === 'number' && n.deviceMemory <= 2) return true
    if (n.connection?.saveData) return true
    if (new URLSearchParams(window.location.search).get('ringan') === '1') return true
  } catch {
    /* abaikan */
  }
  return false
}

function hitung(): Gerak {
  if (typeof window === 'undefined' || !window.matchMedia) return { kurang: false, ringan: false, halus: false }
  const kurang = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const halus = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  return { kurang, halus, ringan: kurang || perangkatLemah() }
}

let nilai: Gerak = hitung()
const pendengar = new Set<() => void>()
let terpasang = false

function terapkanKelas() {
  const k = document.documentElement.classList
  k.toggle('ringan', nilai.ringan)
  k.toggle('kurang-gerak', nilai.kurang)
}

function pasang() {
  if (terpasang || typeof window === 'undefined' || !window.matchMedia) return
  terpasang = true
  const ubah = () => {
    const baru = hitung()
    if (baru.kurang !== nilai.kurang || baru.ringan !== nilai.ringan || baru.halus !== nilai.halus) {
      nilai = baru
      terapkanKelas()
      pendengar.forEach((f) => f())
    }
  }
  for (const q of ['(prefers-reduced-motion: reduce)', '(hover: hover) and (pointer: fine)']) {
    const m = window.matchMedia(q)
    if (m.addEventListener) m.addEventListener('change', ubah)
    else if ((m as MediaQueryList).addListener) (m as MediaQueryList).addListener(ubah)
  }
  terapkanKelas()
}

export function ambilGerak(): Gerak {
  return nilai
}

export function useGerak(): Gerak {
  pasang()
  return useSyncExternalStore(
    (f) => {
      pendengar.add(f)
      return () => {
        pendengar.delete(f)
      }
    },
    () => nilai,
    () => nilai,
  )
}
