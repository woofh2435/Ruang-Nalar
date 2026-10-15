// Logika murni untuk Midtrans (tanpa API Deno), supaya bisa dites dengan vitest dan dipakai Edge Function.

export type StatusBayar = 'lunas' | 'gagal' | 'pending'

export interface NotifMidtrans {
  order_id: string
  status_code: string
  gross_amount: string
  signature_key: string
}

export async function sha512Hex(teks: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(teks))
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Perbandingan waktu-tetap supaya tidak bocor lewat selisih waktu. */
export function samaAman(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

/** signature_key = SHA512(order_id + status_code + gross_amount + ServerKey) */
export async function signatureValid(n: Partial<NotifMidtrans>, serverKey: string): Promise<boolean> {
  if (typeof n.order_id !== 'string' || typeof n.status_code !== 'string' || typeof n.gross_amount !== 'string' || typeof n.signature_key !== 'string') return false
  if (!serverKey) return false
  const harapan = await sha512Hex(n.order_id + n.status_code + n.gross_amount + serverKey)
  return samaAman(harapan, n.signature_key.toLowerCase())
}

/** Petakan status transaksi Midtrans ke status internal. Hanya settlement / capture+accept yang dianggap lunas. */
export function petaStatus(transactionStatus: string | undefined, fraudStatus?: string): StatusBayar {
  switch (transactionStatus) {
    case 'settlement':
      return 'lunas'
    case 'capture':
      return fraudStatus === 'accept' ? 'lunas' : fraudStatus === 'challenge' ? 'pending' : 'gagal'
    case 'deny':
    case 'cancel':
    case 'expire':
    case 'failure':
      return 'gagal'
    default:
      return 'pending' // pending, authorize, refund, dll. tidak memberi akses
  }
}

/** Jumlah dari Midtrans (mis. "25000.00") harus sama persis dengan harga di database. */
export function jumlahCocok(grossAmount: string | number | undefined, harga: number): boolean {
  const n = typeof grossAmount === 'number' ? grossAmount : Number.parseFloat(String(grossAmount ?? ''))
  return Number.isFinite(n) && Math.round(n * 100) === Math.round(harga * 100)
}

/** order_id: huruf/angka/tanda hubung, maksimal 50 karakter (batas Midtrans). */
export function buatOrderId(userId: string, acak: string, sekarang = Date.now()): string {
  const u = userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)
  const a = acak.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)
  return `RN-${u}-${sekarang.toString(36)}-${a}`.slice(0, 50)
}

export function ebookIdValid(id: unknown): id is string {
  return typeof id === 'string' && /^[a-z0-9][a-z0-9-]{0,59}$/.test(id)
}

export function urlMidtrans(env: string | undefined): { snap: string; api: string } {
  return env === 'production'
    ? { snap: 'https://app.midtrans.com/snap/v1/transactions', api: 'https://api.midtrans.com' }
    : { snap: 'https://app.sandbox.midtrans.com/snap/v1/transactions', api: 'https://api.sandbox.midtrans.com' }
}

export function authBasic(serverKey: string): string {
  return 'Basic ' + btoa(serverKey + ':')
}

/** Alamat web setelah pembayaran (HashRouter). Midtrans menambahkan ?order_id=... sendiri. */
export function urlSelesai(siteUrl: string): string {
  return siteUrl.replace(/#.*$/, '').replace(/\/?$/, '/') + '#/akun'
}
