// Edge Function: buat-transaksi
// Dipanggil dari web oleh pembeli yang sudah login. Membuat pesanan "pending" di database lalu
// meminta halaman bayar (Snap redirect_url) ke Midtrans. Harga SELALU dibaca dari database.
//
// Deploy:  supabase functions deploy buat-transaksi --no-verify-jwt --use-api --project-ref <ID-PROYEK>
// (--no-verify-jwt aman: fungsi ini memeriksa sendiri token pembeli lewat auth.getUser(token) sebelum melakukan apa pun,
//  dan opsi ini menghindari masalah preflight CORS serta perbedaan jenis kunci JWT di gerbang Supabase.)
//
// Secrets yang dibutuhkan (supabase secrets set ...):
//   MIDTRANS_SERVER_KEY, MIDTRANS_ENV (sandbox | production), SITE_URL (alamat webmu, mis. https://nama.github.io/ruang-nalar/)
// SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY sudah tersedia otomatis di Supabase.
//
// VERSI SATU-BERKAS untuk Dashboard Supabase (Edge Functions → fungsi → Code). Dibuat otomatis oleh
// scripts/bundel-fungsi.mjs dari supabase/functions/. JANGAN diedit di sini; ubah sumbernya lalu jalankan ulang skripnya.

import { createClient } from 'npm:@supabase/supabase-js@2'

// ---------- kode bersama (dari _shared/midtrans.ts) ----------
type StatusBayar = 'lunas' | 'gagal' | 'pending'

interface NotifMidtrans {
  order_id: string
  status_code: string
  gross_amount: string
  signature_key: string
}

async function sha512Hex(teks: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(teks))
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Perbandingan waktu-tetap supaya tidak bocor lewat selisih waktu. */
function samaAman(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

/** signature_key = SHA512(order_id + status_code + gross_amount + ServerKey) */
async function signatureValid(n: Partial<NotifMidtrans>, serverKey: string): Promise<boolean> {
  if (typeof n.order_id !== 'string' || typeof n.status_code !== 'string' || typeof n.gross_amount !== 'string' || typeof n.signature_key !== 'string') return false
  if (!serverKey) return false
  const harapan = await sha512Hex(n.order_id + n.status_code + n.gross_amount + serverKey)
  return samaAman(harapan, n.signature_key.toLowerCase())
}

/** Petakan status transaksi Midtrans ke status internal. Hanya settlement / capture+accept yang dianggap lunas. */
function petaStatus(transactionStatus: string | undefined, fraudStatus?: string): StatusBayar {
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
function jumlahCocok(grossAmount: string | number | undefined, harga: number): boolean {
  const n = typeof grossAmount === 'number' ? grossAmount : Number.parseFloat(String(grossAmount ?? ''))
  return Number.isFinite(n) && Math.round(n * 100) === Math.round(harga * 100)
}

/** order_id: huruf/angka/tanda hubung, maksimal 50 karakter (batas Midtrans). */
function buatOrderId(userId: string, acak: string, sekarang = Date.now()): string {
  const u = userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)
  const a = acak.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)
  return `RN-${u}-${sekarang.toString(36)}-${a}`.slice(0, 50)
}

function ebookIdValid(id: unknown): id is string {
  return typeof id === 'string' && /^[a-z0-9][a-z0-9-]{0,59}$/.test(id)
}

function urlMidtrans(env: string | undefined): { snap: string; api: string } {
  return env === 'production'
    ? { snap: 'https://app.midtrans.com/snap/v1/transactions', api: 'https://api.midtrans.com' }
    : { snap: 'https://app.sandbox.midtrans.com/snap/v1/transactions', api: 'https://api.sandbox.midtrans.com' }
}

function authBasic(serverKey: string): string {
  return 'Basic ' + btoa(serverKey + ':')
}

/** Alamat web setelah pembayaran (HashRouter). Midtrans menambahkan ?order_id=... sendiri. */
function urlSelesai(siteUrl: string): string {
  return siteUrl.replace(/#.*$/, '').replace(/\/?$/, '/') + '#/akun'
}

// ---------- fungsi ----------
const siteUrl = Deno.env.get('SITE_URL') ?? ''
const asal = siteUrl ? new URL(siteUrl).origin : '*'
const cors = {
  'Access-Control-Allow-Origin': asal,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
}
const json = (isi: unknown, status = 200) => new Response(JSON.stringify(isi), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'metode_tidak_didukung' }, 405)

  const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY')
  if (!serverKey || !siteUrl) return json({ error: 'server_belum_diatur', pesan: 'MIDTRANS_SERVER_KEY atau SITE_URL belum diisi.' }, 500)

  // 1. siapa yang memanggil? (JWT pembeli)
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return json({ error: 'belum_login' }, 401)
  const urlSupabase = Deno.env.get('SUPABASE_URL')!
  const klienPengguna = createClient(urlSupabase, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: dataUser, error: galatUser } = await klienPengguna.auth.getUser(token)
  const user = dataUser?.user
  if (galatUser || !user) return json({ error: 'belum_login' }, 401)

  // 2. masukan
  let masukan: { ebook_id?: unknown }
  try {
    masukan = await req.json()
  } catch {
    return json({ error: 'permintaan_rusak' }, 400)
  }
  if (!ebookIdValid(masukan.ebook_id)) return json({ error: 'ebook_tidak_valid' }, 400)
  const ebookId = masukan.ebook_id

  // 3. baca harga dari database (service role)
  const admin = createClient(urlSupabase, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: ebook } = await admin.from('ebook_berbayar').select('id, judul, harga, terbit').eq('id', ebookId).maybeSingle()
  if (!ebook || !ebook.terbit) return json({ error: 'ebook_tidak_ditemukan' }, 404)

  const { data: sudah } = await admin.from('pembelian').select('id').eq('user_id', user.id).eq('ebook_id', ebookId).eq('status', 'lunas').maybeSingle()
  if (sudah) return json({ error: 'sudah_dibeli' }, 409)

  // 4. catat pesanan pending
  const orderId = buatOrderId(user.id, crypto.randomUUID())
  const { error: galatSimpan } = await admin.from('pembelian').insert({ user_id: user.id, ebook_id: ebookId, order_id: orderId, status: 'pending', jumlah: ebook.harga })
  if (galatSimpan) return json({ error: 'gagal_mencatat' }, 500)

  // 5. minta halaman bayar ke Midtrans
  const { snap } = urlMidtrans(Deno.env.get('MIDTRANS_ENV'))
  let hasil: { token?: string; redirect_url?: string; error_messages?: string[] } | null = null
  try {
    const r = await fetch(snap, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: authBasic(serverKey) },
      body: JSON.stringify({
        transaction_details: { order_id: orderId, gross_amount: ebook.harga },
        item_details: [{ id: ebook.id, price: ebook.harga, quantity: 1, name: String(ebook.judul).slice(0, 50) }],
        customer_details: { email: user.email },
        callbacks: { finish: urlSelesai(siteUrl) },
      }),
    })
    hasil = await r.json()
    if (!r.ok || !hasil?.redirect_url) throw new Error(hasil?.error_messages?.join(', ') ?? 'Midtrans menolak permintaan')
  } catch (e) {
    await admin.from('pembelian').update({ status: 'gagal' }).eq('order_id', orderId).eq('status', 'pending')
    console.error('Midtrans gagal:', e)
    return json({ error: 'gateway_gagal' }, 502)
  }

  return json({ order_id: orderId, redirect_url: hasil.redirect_url, token: hasil.token })
})
