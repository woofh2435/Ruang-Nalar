// Menentukan mode fitur toko:
//  'mati'  → tidak ada akun/pembayaran sama sekali (web persis seperti sebelumnya)
//  'demo'  → semua alur jalan di browser dengan data palsu, TIDAK ada uang sungguhan
//  'nyata' → memakai Supabase + Midtrans (kunci diisi di src/config.ts)

export type ModeToko = 'mati' | 'demo' | 'nyata'

export function hostLokal(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host.endsWith('.localhost')
}

export function tentukanMode(url: string, kunci: string, demo: boolean, host: string): ModeToko {
  if (url.trim() && kunci.trim()) return 'nyata'
  if (demo || hostLokal(host)) return 'demo'
  return 'mati'
}
