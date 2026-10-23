// Identitas pengelola web untuk dokumen hukum. Nilai bawaan dari src/config.ts, bisa ditimpa lewat toko-config.json.

import { useSyncExternalStore } from 'react'
import { KOTA_DOMISILI, NAMA_PENGELOLA, TAHUN_HAK_CIPTA } from '../../config'

export interface Identitas {
  pengelola: string
  /** kosong = tidak menyebut kota tertentu */
  kota: string
  tahun: number
}

export const IDENTITAS_BAWAAN: Identitas = {
  pengelola: NAMA_PENGELOLA.trim().slice(0, 80) || 'Pengelola Ruang Nalar',
  kota: KOTA_DOMISILI.trim().slice(0, 60),
  tahun: TAHUN_HAK_CIPTA,
}

const teks = (x: unknown, maks: number): string => (typeof x === 'string' ? x.replace(/[<>]/g, '').trim().slice(0, maks) : '')

export function gabungIdentitas(bawaan: Identitas, berkas: unknown): Identitas {
  const b = berkas && typeof berkas === 'object' ? (berkas as Record<string, unknown>) : {}
  const thn = typeof b.TAHUN_HAK_CIPTA === 'number' && Number.isInteger(b.TAHUN_HAK_CIPTA) && b.TAHUN_HAK_CIPTA >= 2000 && b.TAHUN_HAK_CIPTA <= 2100 ? b.TAHUN_HAK_CIPTA : bawaan.tahun
  return {
    pengelola: teks(b.NAMA_PENGELOLA, 80) || bawaan.pengelola,
    kota: 'KOTA_DOMISILI' in b ? teks(b.KOTA_DOMISILI, 60) : bawaan.kota,
    tahun: thn,
  }
}

let identitas: Identitas = IDENTITAS_BAWAAN
const pendengar = new Set<() => void>()
export function setIdentitas(i: Identitas) {
  identitas = i
  pendengar.forEach((f) => f())
}
export const ambilIdentitas = (): Identitas => identitas
export function useIdentitas(): Identitas {
  return useSyncExternalStore(
    (cb) => {
      pendengar.add(cb)
      return () => {
        pendengar.delete(cb)
      }
    },
    ambilIdentitas,
    ambilIdentitas,
  )
}
