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

import { createClient } from 'npm:@supabase/supabase-js@2'
import { authBasic, buatOrderId, ebookIdValid, urlMidtrans, urlSelesai } from '../_shared/midtrans.ts'

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
