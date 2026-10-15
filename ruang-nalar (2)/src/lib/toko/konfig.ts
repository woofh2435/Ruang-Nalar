// Konfigurasi toko saat web dibuka. Nilai dari src/config.ts (diisi saat build) bisa DITIMPA oleh file
// "toko-config.json" di samping index.html, supaya pemilik web bisa menyalakan akun & pembayaran
// cukup dengan mengedit satu file kecil di GitHub, tanpa membangun ulang web-nya.
//
// Isinya hanya URL dan kunci "anon/publishable" Supabase (memang publik). Kunci rahasia DITOLAK di sini.

export interface KonfigToko {
  url: string
  kunci: string
  demo: boolean
}

export interface HasilKonfig {
  konfig: KonfigToko
  /** peringatan ramah untuk pemilik web (ditulis ke konsol) */
  peringatan: string[]
}

/** Dekode payload JWT (tanpa verifikasi; hanya untuk mengenali kunci yang salah tempat). */
function payloadJwt(kunci: string): Record<string, unknown> | null {
  const bagian = kunci.split('.')
  if (bagian.length !== 3) return null
  try {
    const b64 = bagian[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = typeof atob === 'function' ? atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)) : Buffer.from(b64, 'base64').toString('utf8')
    const p = JSON.parse(json) as unknown
    return p && typeof p === 'object' ? (p as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/** true bila kunci ini AMAN dipasang di browser (bukan kunci rahasia). */
export function kunciAman(kunci: string): boolean {
  const k = kunci.trim()
  if (!k) return false
  if (/^sb_secret_/i.test(k)) return false
  const p = payloadJwt(k)
  if (p && p.role === 'service_role') return false
  return true
}

export function urlSupabaseValid(url: string): boolean {
  try {
    const u = new URL(url.trim())
    if (u.protocol === 'https:') return true
    return u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')
  } catch {
    return false
  }
}

const teks = (x: unknown): string => (typeof x === 'string' ? x.trim() : '')

/** Gabungkan nilai bawaan (config.ts) dengan isi toko-config.json. Nilai berkas menang bila tidak kosong. */
export function gabungKonfig(bawaan: KonfigToko, berkas: unknown): HasilKonfig {
  const peringatan: string[] = []
  const b = berkas && typeof berkas === 'object' ? (berkas as Record<string, unknown>) : {}
  let url = teks(b.SUPABASE_URL) || bawaan.url.trim()
  let kunci = teks(b.SUPABASE_ANON_KEY) || bawaan.kunci.trim()
  const demo = typeof b.TOKO_DEMO === 'boolean' ? b.TOKO_DEMO : bawaan.demo

  if (kunci && !kunciAman(kunci)) {
    peringatan.push(
      'SUPABASE_ANON_KEY berisi kunci RAHASIA (service_role / sb_secret). Kunci itu TIDAK dipakai. Segera buat ulang (rotate) kunci tersebut di dashboard Supabase, lalu isi dengan kunci "anon" atau "publishable".',
    )
    kunci = ''
  }
  if (url && !urlSupabaseValid(url)) {
    peringatan.push('SUPABASE_URL tidak valid (harus diawali https://). Fitur akun dimatikan.')
    url = ''
  }
  if ((url && !kunci) || (!url && kunci)) {
    if (url || kunci) peringatan.push('SUPABASE_URL dan SUPABASE_ANON_KEY harus diisi keduanya. Fitur akun dimatikan.')
    url = ''
    kunci = ''
  }
  return { konfig: { url, kunci, demo }, peringatan }
}

/** Ambil toko-config.json (jika ada). Gagal/rusak/lama → pakai nilai bawaan saja. */
export async function bacaKonfig(bawaan: KonfigToko, ambil: typeof fetch = fetch, batasMs = 2500): Promise<HasilKonfig> {
  let isi: unknown = null
  const pengendali = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = pengendali ? setTimeout(() => pengendali.abort(), batasMs) : null
  try {
    const r = await ambil('toko-config.json', { cache: 'no-store', signal: pengendali?.signal })
    if (r.ok) isi = await r.json()
  } catch {
    // tidak ada berkas / offline / bukan JSON: wajar, pakai bawaan
  } finally {
    if (timer) clearTimeout(timer)
  }
  return gabungKonfig(bawaan, isi)
}
