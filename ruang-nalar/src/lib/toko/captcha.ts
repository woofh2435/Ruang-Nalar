// CAPTCHA opsional (Cloudflare Turnstile). MATI secara bawaan: baru aktif bila toko-config.json berisi TURNSTILE_SITE_KEY.
// Site key itu memang publik. Secret key-nya hanya dimasukkan di dashboard Supabase (Authentication → Attack Protection),
// BUKAN di web ini. Kalau CAPTCHA dinyalakan di Supabase, kunci di sini wajib diisi supaya login dan daftar tetap bisa.

import { useSyncExternalStore } from 'react'

export const URL_TURNSTILE = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

/** Site key Turnstile berupa huruf, angka, garis bawah, atau strip. Nilai lain ditolak (mencegah isian ngawur masuk ke halaman). */
export function kunciCaptchaValid(x: unknown): x is string {
  return typeof x === 'string' && /^[0-9A-Za-z_-]{8,80}$/.test(x.trim())
}

/** Ambil site key dari isi toko-config.json. Kosong atau tidak valid = CAPTCHA mati. */
export function bacaKunciCaptcha(berkas: unknown): string {
  const b = berkas && typeof berkas === 'object' ? (berkas as Record<string, unknown>) : {}
  const k = b.TURNSTILE_SITE_KEY
  return kunciCaptchaValid(k) ? k.trim() : ''
}

let kunci = ''
const pendengar = new Set<() => void>()
export function setKunciCaptcha(k: string) {
  kunci = k
  pendengar.forEach((f) => f())
}
export const ambilKunciCaptcha = (): string => kunci
export function useKunciCaptcha(): string {
  return useSyncExternalStore(
    (cb) => {
      pendengar.add(cb)
      return () => {
        pendengar.delete(cb)
      }
    },
    ambilKunciCaptcha,
    ambilKunciCaptcha,
  )
}

export interface OpsiTurnstile {
  sitekey: string
  theme?: 'light' | 'dark' | 'auto'
  language?: string
  callback?: (token: string) => void
  'expired-callback'?: () => void
  'error-callback'?: () => void
}
export interface ApiTurnstile {
  render(el: HTMLElement, opsi: OpsiTurnstile): string
  reset(id?: string): void
  remove(id?: string): void
}
declare global {
  interface Window {
    turnstile?: ApiTurnstile
  }
}

let janji: Promise<ApiTurnstile> | null = null

/** Muat skrip Turnstile satu kali. Gagal (diblokir pemblokir iklan, offline) → ditolak dengan pesan yang ramah. */
export function muatTurnstile(batasMs = 10_000): Promise<ApiTurnstile> {
  if (typeof window !== 'undefined' && window.turnstile) return Promise.resolve(window.turnstile)
  if (janji) return janji
  janji = new Promise<ApiTurnstile>((ok, gagal) => {
    const s = document.createElement('script')
    s.src = URL_TURNSTILE
    s.async = true
    s.defer = true
    const t = setTimeout(() => {
      janji = null
      s.remove()
      gagal(new Error('batas waktu'))
    }, batasMs)
    s.onload = () => {
      clearTimeout(t)
      if (window.turnstile) ok(window.turnstile)
      else {
        janji = null
        gagal(new Error('turnstile tidak tersedia'))
      }
    }
    s.onerror = () => {
      clearTimeout(t)
      janji = null
      s.remove()
      gagal(new Error('skrip gagal dimuat'))
    }
    document.head.appendChild(s)
  })
  return janji
}
