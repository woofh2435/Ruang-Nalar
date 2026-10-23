// Pilihan cookie / izin pengunjung (opt-in), disimpan di perangkat ini.
// PENTING: ini hanya "ingatan" supaya banner tidak muncul terus. Bukti persetujuan yang sah untuk pemilik akun ada di
// database (tabel persetujuan, lihat supabase/patch/01-persetujuan.sql), bukan di sini.

import { useSyncExternalStore } from 'react'
import { VERSI_KEBIJAKAN } from './legal/versi'

export const KUNCI_COOKIE = 'rn-cookie'

export interface PilihanCookie {
  /** versi kebijakan saat pilihan dibuat */
  versi: string
  /** izin analitik / pelacakan. Saat ini web TIDAK memasang pelacak; kalau kelak ada, wajib cek bolehAnalitik() dulu. */
  analitik: boolean
  /** ISO waktu pilihan dibuat */
  waktu: string
}

/** Validasi data mentah dari penyimpanan (bisa rusak atau dari versi lama). */
export function bacaPilihan(mentah: unknown): PilihanCookie | null {
  let o: unknown = mentah
  if (typeof mentah === 'string') {
    try {
      o = JSON.parse(mentah)
    } catch {
      return null
    }
  }
  if (!o || typeof o !== 'object') return null
  const r = o as Record<string, unknown>
  if (typeof r.versi !== 'string' || r.versi.length === 0 || r.versi.length > 20) return null
  if (typeof r.analitik !== 'boolean') return null
  const waktu = typeof r.waktu === 'string' && !Number.isNaN(Date.parse(r.waktu)) ? r.waktu : new Date(0).toISOString()
  return { versi: r.versi, analitik: r.analitik, waktu }
}

/** Banner perlu tampil bila belum pernah memilih, atau pilihan dibuat untuk versi kebijakan yang lebih lama. */
export function perluTanya(p: PilihanCookie | null, versiKini: string = VERSI_KEBIJAKAN): boolean {
  return !p || p.versi !== versiKini
}

// ---------- penyimpanan kecil dengan cadangan memori ----------
const memori = new Map<string, string>()
const ambilMentah = (): string | null => {
  try {
    const v = globalThis.localStorage?.getItem(KUNCI_COOKIE)
    if (v !== undefined && v !== null) return v
  } catch {
    /* abaikan */
  }
  return memori.get(KUNCI_COOKIE) ?? null
}
const simpanMentah = (v: string | null) => {
  try {
    if (v === null) globalThis.localStorage?.removeItem(KUNCI_COOKIE)
    else globalThis.localStorage?.setItem(KUNCI_COOKIE, v)
  } catch {
    /* jatuh ke memori */
  }
  if (v === null) memori.delete(KUNCI_COOKIE)
  else memori.set(KUNCI_COOKIE, v)
}

interface Keadaan {
  pilihan: PilihanCookie | null
  /** banner pengaturan dibuka paksa (dari tautan "Pengaturan cookie") */
  dibukaPaksa: boolean
}
let keadaan: Keadaan = { pilihan: bacaPilihan(ambilMentah()), dibukaPaksa: false }
const pendengar = new Set<() => void>()
const ubah = (p: Partial<Keadaan>) => {
  keadaan = { ...keadaan, ...p }
  pendengar.forEach((f) => f())
}

export const ambilKeadaanCookie = (): Keadaan => keadaan

/** Muat ulang dari penyimpanan (dipakai di pengujian). */
export function muatUlangCookie() {
  keadaan = { pilihan: bacaPilihan(ambilMentah()), dibukaPaksa: false }
  pendengar.forEach((f) => f())
}

/** Simpan pilihan baru (selalu atas tindakan pengunjung sendiri). */
export function setPilihanCookie(analitik: boolean, sekarang: Date = new Date()): PilihanCookie {
  const p: PilihanCookie = { versi: VERSI_KEBIJAKAN, analitik, waktu: sekarang.toISOString() }
  simpanMentah(JSON.stringify(p))
  ubah({ pilihan: p, dibukaPaksa: false })
  return p
}

export function lupakanPilihanCookie() {
  simpanMentah(null)
  ubah({ pilihan: null, dibukaPaksa: false })
}

/** Buka lagi panel pengaturan cookie (mis. dari footer). */
export function bukaPengaturanCookie() {
  ubah({ dibukaPaksa: true })
}
export function tutupPengaturanCookie() {
  ubah({ dibukaPaksa: false })
}

/** Kode analitik / pelacak APA PUN yang kelak ditambahkan wajib memeriksa ini lebih dulu. */
export function bolehAnalitik(): boolean {
  const p = keadaan.pilihan
  return !!p && p.versi === VERSI_KEBIJAKAN && p.analitik
}

export function useCookie(): Keadaan {
  return useSyncExternalStore(
    (cb) => {
      pendengar.add(cb)
      return () => {
        pendengar.delete(cb)
      }
    },
    ambilKeadaanCookie,
    ambilKeadaanCookie,
  )
}

/** Isi persetujuan yang dikirim saat mendaftar. Izin analitik diambil dari pilihan banner (default: tidak). */
export function susunPersetujuanDaftar(promo: boolean, versi: string = VERSI_KEBIJAKAN): { versi: string; promo: boolean; analitik: boolean } {
  return { versi, promo, analitik: bolehAnalitik() }
}
