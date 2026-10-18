// Tautan di email Supabase (pemulihan sandi, konfirmasi akun) mendarat di web ini dengan token di bagian # alamat,
// misalnya  https://nama.github.io/ruang-nalar/#access_token=...&refresh_token=...&type=recovery
// Web memakai HashRouter, jadi bagian # itu harus ditangkap SEBELUM router menyala, lalu alamatnya dirapikan.
// Token tidak pernah ditulis ke penyimpanan; hanya dipegang di memori sampai ditukar menjadi sesi.

import type { JenisTautan, TautanAuth } from './tipe'

export type HasilTautan = { tipe: 'sesi'; tautan: TautanAuth } | { tipe: 'galat'; kode: string; pesan: string }

const JENIS: Record<string, JenisTautan> = {
  recovery: 'pemulihan',
  signup: 'konfirmasi',
  email_change: 'konfirmasi',
  invite: 'konfirmasi',
  magiclink: 'konfirmasi',
}

const POLA_JWT = /^[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}$/

const PESAN_GALAT: Record<string, string> = {
  otp_expired: 'Tautan sudah kedaluwarsa atau sudah pernah dipakai. Minta tautan baru, ya.',
  access_denied: 'Tautan ini ditolak. Kemungkinan sudah kedaluwarsa atau sudah dipakai.',
}

/** Baca bagian # alamat. Mengembalikan null kalau isinya bukan tautan auth (misalnya rute biasa "#/baca/..."). */
export function bacaTautanAuth(hash: string): HasilTautan | null {
  const h = hash.startsWith('#') ? hash.slice(1) : hash
  if (!h || h.startsWith('/') || h.length > 4000) return null
  let p: URLSearchParams
  try {
    p = new URLSearchParams(h)
  } catch {
    return null
  }
  const at = p.get('access_token')
  const rt = p.get('refresh_token')
  if (at && rt) {
    if (!POLA_JWT.test(at) || rt.length > 600) return null
    return { tipe: 'sesi', tautan: { jenis: JENIS[p.get('type') ?? ''] ?? 'lainnya', accessToken: at, refreshToken: rt } }
  }
  const galat = p.get('error_code') || p.get('error')
  if (galat && (p.has('error') || p.has('error_code'))) {
    const kode = galat.slice(0, 60)
    return { tipe: 'galat', kode, pesan: PESAN_GALAT[kode] ?? 'Tautan ini tidak bisa dipakai. Minta tautan baru, ya.' }
  }
  return null
}

let tertangkap: HasilTautan | null = null

/** Dipanggil sekali sebelum React menyala. Kalau alamat berisi tautan auth: simpan di memori dan ganti alamat menjadi "#/tautan". */
export function tangkapTautanAuth(lokasi: Pick<Location, 'hash' | 'pathname' | 'search'> = location, riwayat: Pick<History, 'replaceState'> = history): HasilTautan | null {
  const hasil = bacaTautanAuth(lokasi.hash)
  if (!hasil) return null
  tertangkap = hasil
  try {
    riwayat.replaceState(null, '', lokasi.pathname + lokasi.search + '#/tautan')
  } catch {
    /* abaikan */
  }
  return hasil
}

export const ambilTautanTertangkap = (): HasilTautan | null => tertangkap

export function lupakanTautan(): void {
  tertangkap = null
}
