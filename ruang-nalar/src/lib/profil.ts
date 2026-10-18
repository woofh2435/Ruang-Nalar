// Profil situs (cerita pembuat, kontak). Nilai bawaan dari src/config.ts, bisa ditimpa lewat toko-config.json
// supaya pemilik web cukup menyunting satu file kecil di GitHub.

import { useSyncExternalStore } from 'react'
import { KONTAK_EMAIL, TAUTAN_KONTAK, TENTANG_PEMBUAT } from '../config'
import { emailValid } from './toko/tipe'

export interface TautanProfil {
  label: string
  url: string
}

export interface ProfilSitus {
  tentang: string
  kontakEmail: string
  tautan: TautanProfil[]
}

const BATAS_TENTANG = 1200
const BATAS_TAUTAN = 6

const teks = (x: unknown): string => (typeof x === 'string' ? x.trim() : '')

/** Hanya alamat https yang diterima (mencegah javascript:, data:, dsb. dari file konfigurasi). */
export function urlAman(u: string): boolean {
  try {
    const x = new URL(u)
    return x.protocol === 'https:' && x.hostname.includes('.')
  } catch {
    return false
  }
}

export function saringTautan(x: unknown): TautanProfil[] {
  if (!Array.isArray(x)) return []
  const hasil: TautanProfil[] = []
  for (const it of x) {
    if (!it || typeof it !== 'object') continue
    const label = teks((it as Record<string, unknown>).label).slice(0, 40)
    const url = teks((it as Record<string, unknown>).url)
    if (label && urlAman(url) && url.length <= 300) hasil.push({ label, url })
    if (hasil.length >= BATAS_TAUTAN) break
  }
  return hasil
}

export const PROFIL_BAWAAN: ProfilSitus = {
  tentang: TENTANG_PEMBUAT.slice(0, BATAS_TENTANG),
  kontakEmail: emailValid(KONTAK_EMAIL) ? KONTAK_EMAIL : '',
  tautan: saringTautan(TAUTAN_KONTAK),
}

/** Gabungkan nilai bawaan dengan isi toko-config.json. Nilai berkas menang bila valid dan tidak kosong. */
export function gabungProfil(bawaan: ProfilSitus, berkas: unknown): ProfilSitus {
  const b = berkas && typeof berkas === 'object' ? (berkas as Record<string, unknown>) : {}
  const tentang = teks(b.TENTANG_PEMBUAT).slice(0, BATAS_TENTANG)
  const email = teks(b.KONTAK_EMAIL)
  const tautan = 'TAUTAN' in b ? saringTautan(b.TAUTAN) : bawaan.tautan
  return {
    tentang: tentang || bawaan.tentang,
    kontakEmail: email && emailValid(email) ? email : bawaan.kontakEmail,
    tautan,
  }
}

let profil: ProfilSitus = PROFIL_BAWAAN
const pendengar = new Set<() => void>()

export function setProfil(p: ProfilSitus) {
  profil = p
  pendengar.forEach((f) => f())
}

export const ambilProfil = (): ProfilSitus => profil

export function useProfil(): ProfilSitus {
  return useSyncExternalStore(
    (cb) => {
      pendengar.add(cb)
      return () => {
        pendengar.delete(cb)
      }
    },
    () => profil,
    () => PROFIL_BAWAAN,
  )
}
