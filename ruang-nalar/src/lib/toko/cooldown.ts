// Jeda otomatis setelah salah kata sandi berkali-kali (lapisan tambahan di browser).
// JUJUR soal batasnya: ini hanya menghambat orang yang mencoba menebak lewat halaman web ini dan tidak bisa menghentikan
// penyerang yang memanggil API langsung. Pembatasan sungguhan ada di server (Supabase Auth) dan di CAPTCHA bila dinyalakan.

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

export const KUNCI_COBA = 'rn-coba-masuk'
/** Percobaan salah berturut-turut sebelum jeda mulai. */
export const AMBANG_GAGAL = 5
export const JEDA_DASAR_MS = 30_000
export const JEDA_MAKS_MS = 15 * 60_000
/** Hitungan salah dilupakan bila tidak ada percobaan selama ini. */
export const LUPA_SETELAH_MS = 30 * 60_000
/** Jeda yang dipakai bila server sendiri menjawab "terlalu sering". */
export const JEDA_SERVER_MS = 60_000

export interface KeadaanCoba {
  gagal: number
  /** waktu (epoch ms) jeda berakhir; 0 = tidak sedang dijeda */
  sampai: number
  /** waktu percobaan salah terakhir */
  terakhir: number
}

export const KOSONG: KeadaanCoba = { gagal: 0, sampai: 0, terakhir: 0 }

const angka = (x: unknown, maks: number): number => (typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= maks ? Math.floor(x) : 0)

/** Validasi data mentah dari penyimpanan (bisa rusak atau diubah-ubah). */
export function bacaKeadaanCoba(mentah: unknown): KeadaanCoba {
  let o: unknown = mentah
  if (typeof mentah === 'string') {
    try {
      o = JSON.parse(mentah)
    } catch {
      return KOSONG
    }
  }
  if (!o || typeof o !== 'object') return KOSONG
  const r = o as Record<string, unknown>
  const sekarangMaks = 8.64e15
  return { gagal: angka(r.gagal, 1000), sampai: angka(r.sampai, sekarangMaks), terakhir: angka(r.terakhir, sekarangMaks) }
}

export function jedaUntuk(gagal: number): number {
  if (gagal < AMBANG_GAGAL) return 0
  return Math.min(JEDA_MAKS_MS, JEDA_DASAR_MS * 2 ** (gagal - AMBANG_GAGAL))
}

/** Catat satu percobaan yang gagal. Jeda berlipat dua tiap kegagalan berikutnya: 30 dtk, 1 mnt, 2 mnt ... maksimal 15 menit. */
export function catatGagal(k: KeadaanCoba, sekarang: number): KeadaanCoba {
  const lama = k.terakhir > 0 && sekarang - k.terakhir > LUPA_SETELAH_MS && k.sampai <= sekarang
  const gagal = (lama ? 0 : k.gagal) + 1
  const jeda = jedaUntuk(gagal)
  return { gagal, sampai: jeda > 0 ? sekarang + jeda : 0, terakhir: sekarang }
}

/** Server menolak karena terlalu sering: beri jeda minimal sekian milidetik tanpa menambah hitungan. */
export function tahanPaksa(k: KeadaanCoba, sekarang: number, ms: number = JEDA_SERVER_MS): KeadaanCoba {
  return { ...k, sampai: Math.max(k.sampai, sekarang + ms), terakhir: sekarang }
}

export function sisaJeda(k: KeadaanCoba, sekarang: number): number {
  return Math.max(0, k.sampai - sekarang)
}

export function pesanJeda(sisaMs: number): string {
  const d = Math.ceil(sisaMs / 1000)
  if (d <= 90) return `Terlalu banyak percobaan. Coba lagi dalam ${d} detik.`
  return `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(d / 60)} menit.`
}

// ---------- penyimpanan kecil dengan cadangan memori ----------
let memori: string | null = null
const ambilMentah = (): string | null => {
  try {
    const v = globalThis.localStorage?.getItem(KUNCI_COBA)
    if (v !== undefined && v !== null) return v
  } catch {
    /* abaikan */
  }
  return memori
}
const simpanMentah = (v: string | null) => {
  try {
    if (v === null) globalThis.localStorage?.removeItem(KUNCI_COBA)
    else globalThis.localStorage?.setItem(KUNCI_COBA, v)
  } catch {
    /* jatuh ke memori */
  }
  memori = v
}

let keadaan: KeadaanCoba = bacaKeadaanCoba(ambilMentah())
const pendengar = new Set<() => void>()
const tetapkan = (k: KeadaanCoba) => {
  keadaan = k
  simpanMentah(k.gagal === 0 && k.sampai === 0 ? null : JSON.stringify(k))
  pendengar.forEach((f) => f())
}

export const ambilKeadaanCoba = (): KeadaanCoba => keadaan
export function muatUlangCoba() {
  keadaan = bacaKeadaanCoba(ambilMentah())
  pendengar.forEach((f) => f())
}
export function resetCoba() {
  memori = null
  tetapkan(KOSONG)
}
export const catatGagalMasuk = (sekarang: number = Date.now()) => tetapkan(catatGagal(keadaan, sekarang))
export const catatBerhasilMasuk = () => tetapkan(KOSONG)
export const tahanKarenaServer = (sekarang: number = Date.now(), ms?: number) => tetapkan(tahanPaksa(keadaan, sekarang, ms))

/** Sisa jeda dalam milidetik, diperbarui tiap detik selama masih dijeda. */
export function useSisaJeda(): number {
  const k = useSyncExternalStore(
    (cb) => {
      pendengar.add(cb)
      return () => {
        pendengar.delete(cb)
      }
    },
    ambilKeadaanCoba,
    ambilKeadaanCoba,
  )
  const [sekarang, setSekarang] = useState(() => Date.now())
  const sisa = sisaJeda(k, sekarang)
  useEffect(() => {
    setSekarang(Date.now())
    if (k.sampai <= Date.now()) return
    const t = setInterval(() => {
      const n = Date.now()
      setSekarang(n)
      if (n >= k.sampai) clearInterval(t)
    }, 500)
    return () => clearInterval(t)
  }, [k])
  return sisa
}

/** Pintasan untuk komponen: sisa jeda dan fungsi mencatat hasil percobaan. */
export function useCooldownMasuk() {
  const sisa = useSisaJeda()
  const gagal = useCallback(() => catatGagalMasuk(), [])
  const berhasil = useCallback(() => catatBerhasilMasuk(), [])
  const server = useCallback(() => tahanKarenaServer(), [])
  return { sisa, gagal, berhasil, server }
}
