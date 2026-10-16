// Uji Edge Function memakai Deno SUNGGUHAN dengan Supabase dan Midtrans TIRUAN (di dalam proses, tanpa jaringan).
//
// Jalankan:  deno test --allow-env --allow-read supabase/tests/edge_test.ts
// Versi satu-berkas (Dashboard):  EDGE_BUNDEL=1 deno test --allow-env --allow-read supabase/tests/edge_test.ts
// (Deno bisa dipasang lewat `npm i -g deno`; paket npm supabase-js diunduh otomatis saat pertama kali jalan.)
//
// Yang diuji: kode fungsi yang SAMA dengan yang di-deploy, memanggil klien supabase-js asli.
// Yang tidak teruji: server Supabase/Midtrans sungguhan. Tetap uji di sandbox Midtrans sebelum membuka toko.

import { sha512Hex } from '../functions/_shared/midtrans.ts'

// pembantu pernyataan kecil (tanpa unduhan dari jsr.io supaya bisa jalan di mana saja)
function assert(kondisi: unknown, pesan = 'pernyataan gagal'): asserts kondisi {
  if (!kondisi) throw new Error(pesan)
}
function assertEquals(a: unknown, b: unknown, pesan = '') {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${pesan} diharapkan ${JSON.stringify(b)} tetapi dapat ${JSON.stringify(a)}`.trim())
}
function assertMatch(teks: string, pola: RegExp) {
  if (!pola.test(teks)) throw new Error(`"${teks}" tidak cocok dengan ${pola}`)
}

const URL_SB = 'http://sb.test'
const SERVER_KEY = 'SB-Mid-server-RAHASIA-UJI'
const SITE = 'https://nama.github.io/ruang-nalar/'

Deno.env.set('SUPABASE_URL', URL_SB)
Deno.env.set('SUPABASE_ANON_KEY', 'anon-uji')
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'service-uji')
Deno.env.set('MIDTRANS_SERVER_KEY', SERVER_KEY)
Deno.env.set('MIDTRANS_ENV', 'sandbox')
Deno.env.set('SITE_URL', SITE)

// ---------- database tiruan ----------
type Baris = Record<string, unknown>
const db: Record<string, Baris[]> = { ebook_berbayar: [], pembelian: [] }
const pengguna: Record<string, { id: string; email: string }> = {
  'tok-ani': { id: '11111111-1111-1111-1111-111111111111', email: 'ani@contoh.com' },
  'tok-budi': { id: '22222222-2222-2222-2222-222222222222', email: 'budi@contoh.com' },
}
const flag = { gagalUpdate: false, snapStatus: 200 as number, statusApi: null as null | Record<string, unknown>, statusApiMati: false }
const log = { snap: [] as Record<string, unknown>[], snapAuth: [] as string[], statusDicek: [] as string[] }

function reset() {
  db.ebook_berbayar = [
    { id: 'buku-a', judul: 'Buku A', harga: 25000, terbit: true },
    { id: 'buku-draf', judul: 'Draf', harga: 10000, terbit: false },
  ]
  db.pembelian = []
  flag.gagalUpdate = false
  flag.snapStatus = 200
  flag.statusApi = null
  flag.statusApiMati = false
  log.snap = []
  log.snapAuth = []
  log.statusDicek = []
}

function cocok(b: Baris, params: URLSearchParams): boolean {
  for (const [k, v] of params) {
    if (['select', 'order', 'limit', 'columns', 'on_conflict'].includes(k)) continue
    const m = /^(eq|neq)\.(.*)$/.exec(v)
    if (!m) continue
    const sama = String(b[k]) === m[2]
    if (m[1] === 'eq' ? !sama : sama) return false
  }
  return true
}
const resp = (isi: unknown, status = 200, h: Record<string, string> = {}) => new Response(JSON.stringify(isi), { status, headers: { 'Content-Type': 'application/json', ...h } })

async function fetchTiruan(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const req = input instanceof Request ? input : new Request(input, init)
  const u = new URL(req.url)
  // --- Supabase Auth ---
  if (u.origin === URL_SB && u.pathname === '/auth/v1/user') {
    const tok = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    const p = pengguna[tok]
    return p ? resp({ id: p.id, email: p.email, aud: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' }) : resp({ code: 401, msg: 'invalid JWT' }, 401)
  }
  // --- Supabase REST ---
  if (u.origin === URL_SB && u.pathname.startsWith('/rest/v1/')) {
    const tabel = u.pathname.replace('/rest/v1/', '')
    const baris = db[tabel]
    if (!baris) return resp({ code: '42P01', message: 'relation does not exist' }, 404)
    const tunggal = (req.headers.get('Accept') ?? '').includes('pgrst.object+json')
    if (req.method === 'GET') {
      const hasil = baris.filter((b) => cocok(b, u.searchParams))
      if (tunggal) {
        if (hasil.length !== 1) return resp({ code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: `The result contains ${hasil.length} rows` }, 406)
        return resp(hasil[0])
      }
      return resp(hasil)
    }
    if (req.method === 'POST') {
      const isi = (await req.json()) as Baris
      if (tabel === 'pembelian') {
        if (db.pembelian.some((b) => b.order_id === isi.order_id)) return resp({ code: '23505', message: 'duplicate key value violates unique constraint "pembelian_order_id_key"' }, 409)
        db.pembelian.push({ dibuat: new Date().toISOString(), dibayar: null, ...isi })
      } else baris.push(isi)
      return new Response(null, { status: 201 })
    }
    if (req.method === 'PATCH') {
      if (flag.gagalUpdate) return resp({ code: 'XX000', message: 'database sedang bermasalah' }, 500)
      const isi = (await req.json()) as Baris
      const kena = baris.filter((b) => cocok(b, u.searchParams))
      for (const b of kena) {
        if (tabel === 'pembelian' && isi.status === 'lunas' && db.pembelian.some((x) => x !== b && x.user_id === b.user_id && x.ebook_id === b.ebook_id && x.status === 'lunas')) {
          return resp({ code: '23505', message: 'duplicate key value violates unique constraint "pembelian_satu_lunas"' }, 409)
        }
        Object.assign(b, isi)
      }
      return new Response(null, { status: 204 })
    }
  }
  // --- Midtrans ---
  if (u.href === 'https://app.sandbox.midtrans.com/snap/v1/transactions' && req.method === 'POST') {
    log.snapAuth.push(req.headers.get('Authorization') ?? '')
    const isi = (await req.json()) as Record<string, unknown>
    log.snap.push(isi)
    if (flag.snapStatus !== 200) return resp({ error_messages: ['Access denied due to unauthorized transaction'] }, flag.snapStatus)
    const token = 'tok-' + log.snap.length
    return resp({ token, redirect_url: `https://app.sandbox.midtrans.com/snap/v4/redirection/${token}` }, 201)
  }
  const ms = /^https:\/\/api\.sandbox\.midtrans\.com\/v2\/([^/]+)\/status$/.exec(u.href)
  if (ms) {
    log.statusDicek.push(decodeURIComponent(ms[1]))
    if (flag.statusApiMati) return resp({ status_code: '500' }, 500)
    return resp(flag.statusApi ?? { transaction_status: 'pending', gross_amount: '25000.00' })
  }
  throw new Error('Permintaan jaringan tak terduga: ' + req.method + ' ' + req.url)
}
globalThis.fetch = fetchTiruan as typeof fetch

// ---------- tangkap handler Deno.serve ----------
const handlers: ((r: Request) => Promise<Response> | Response)[] = []
// deno-lint-ignore no-explicit-any
;(Deno as any).serve = (h: (r: Request) => Promise<Response> | Response) => {
  handlers.push(h)
  return {}
}
// EDGE_BUNDEL=1 → uji versi satu-berkas untuk Dashboard (supabase/dashboard/), bukan folder functions/
const bundel = Deno.env.get('EDGE_BUNDEL') === '1'
await import(bundel ? '../dashboard/buat-transaksi.ts' : '../functions/buat-transaksi/index.ts')
await import(bundel ? '../dashboard/midtrans-webhook.ts' : '../functions/midtrans-webhook/index.ts')
const [buat, webhook] = handlers
assertEquals(handlers.length, 2, 'kedua fungsi harus memanggil Deno.serve')

const panggilBuat = (token: string | null, isi: unknown, metode = 'POST') =>
  buat(new Request('http://fn.test/buat-transaksi', { method: metode, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: metode === 'POST' ? JSON.stringify(isi) : undefined }))

async function notif(orderId: string, o: { status_code?: string; gross_amount?: string; kunci?: string; signature?: string } = {}) {
  const status_code = o.status_code ?? '200'
  const gross_amount = o.gross_amount ?? '25000.00'
  const signature_key = o.signature ?? (await sha512Hex(orderId + status_code + gross_amount + (o.kunci ?? SERVER_KEY)))
  return webhook(new Request('http://fn.test/midtrans-webhook', { method: 'POST', body: JSON.stringify({ order_id: orderId, status_code, gross_amount, signature_key, transaction_status: 'settlement' }) }))
}
const pesananDari = async (token: string, ebook = 'buku-a') => {
  const r = await panggilBuat(token, { ebook_id: ebook })
  assertEquals(r.status, 200)
  return ((await r.json()) as { order_id: string }).order_id
}

// =============== buat-transaksi ===============
Deno.test('buat-transaksi: OPTIONS (CORS) hanya untuk asal web kita', async () => {
  reset()
  const r = await buat(new Request('http://fn.test/', { method: 'OPTIONS' }))
  assertEquals(r.headers.get('Access-Control-Allow-Origin'), 'https://nama.github.io')
})
Deno.test('buat-transaksi: tanpa/bukan token valid → 401', async () => {
  reset()
  assertEquals((await panggilBuat(null, { ebook_id: 'buku-a' })).status, 401)
  const r = await panggilBuat('tok-palsu', { ebook_id: 'buku-a' })
  assertEquals(r.status, 401)
  assertEquals(((await r.json()) as { error: string }).error, 'belum_login')
  assertEquals(db.pembelian.length, 0)
})
Deno.test('buat-transaksi: metode GET ditolak, JSON rusak dan id jelek ditolak', async () => {
  reset()
  assertEquals((await panggilBuat('tok-ani', null, 'GET')).status, 405)
  const rusak = await buat(new Request('http://fn.test/', { method: 'POST', headers: { Authorization: 'Bearer tok-ani' }, body: '{bukan json' }))
  assertEquals(rusak.status, 400)
  assertEquals((await panggilBuat('tok-ani', { ebook_id: 'Buku A!' })).status, 400)
  assertEquals((await panggilBuat('tok-ani', {})).status, 400)
})
Deno.test('buat-transaksi: ebook tidak ada / draf → 404', async () => {
  reset()
  assertEquals((await panggilBuat('tok-ani', { ebook_id: 'tidak-ada' })).status, 404)
  assertEquals((await panggilBuat('tok-ani', { ebook_id: 'buku-draf' })).status, 404)
  assertEquals(db.pembelian.length, 0)
})
Deno.test('buat-transaksi: sukses → pesanan pending dengan HARGA DARI DATABASE, bukan dari browser', async () => {
  reset()
  const r = await panggilBuat('tok-ani', { ebook_id: 'buku-a', harga: 1, gross_amount: 1, jumlah: 1 })
  assertEquals(r.status, 200)
  const j = (await r.json()) as { order_id: string; redirect_url: string }
  assertMatch(j.redirect_url, /^https:\/\/app\.sandbox\.midtrans\.com\/snap\/v4\/redirection\//)
  assert(j.order_id.length <= 50)
  assertEquals(db.pembelian.length, 1)
  assertEquals(db.pembelian[0].status, 'pending')
  assertEquals(db.pembelian[0].jumlah, 25000)
  assertEquals(db.pembelian[0].user_id, pengguna['tok-ani'].id)
  const kirim = log.snap[0] as { transaction_details: { order_id: string; gross_amount: number }; callbacks: { finish: string }; customer_details: { email: string } }
  assertEquals(kirim.transaction_details.gross_amount, 25000)
  assertEquals(kirim.transaction_details.order_id, j.order_id)
  assertEquals(kirim.callbacks.finish, 'https://nama.github.io/ruang-nalar/#/akun')
  assertEquals(kirim.customer_details.email, 'ani@contoh.com')
  assertEquals(log.snapAuth[0], 'Basic ' + btoa(SERVER_KEY + ':'))
})
Deno.test('buat-transaksi: Snap dibatasi ke e-wallet + QRIS (bawaan)', async () => {
  reset()
  Deno.env.delete('MIDTRANS_METODE')
  assertEquals((await panggilBuat('tok-ani', { ebook_id: 'buku-a' })).status, 200)
  assertEquals((log.snap[0] as { enabled_payments?: string[] }).enabled_payments, ['gopay', 'shopeepay', 'other_qris'])
})
Deno.test('buat-transaksi: MIDTRANS_METODE mengubah daftar; "semua" tidak membatasi; nama ngawur dibuang', async () => {
  reset()
  try {
    Deno.env.set('MIDTRANS_METODE', 'gopay, other_qris')
    assertEquals((await panggilBuat('tok-ani', { ebook_id: 'buku-a' })).status, 200)
    assertEquals((log.snap[0] as { enabled_payments?: string[] }).enabled_payments, ['gopay', 'other_qris'])

    Deno.env.set('MIDTRANS_METODE', 'semua')
    assertEquals((await panggilBuat('tok-budi', { ebook_id: 'buku-a' })).status, 200)
    assert(!('enabled_payments' in log.snap[1]), 'tidak boleh ada enabled_payments bila "semua"')

    Deno.env.set('MIDTRANS_METODE', 'shopeepay,"; drop table')
    assertEquals((await panggilBuat('tok-budi', { ebook_id: 'buku-a' })).status, 200)
    assertEquals((log.snap[2] as { enabled_payments?: string[] }).enabled_payments, ['shopeepay'])
  } finally {
    Deno.env.delete('MIDTRANS_METODE')
  }
})
Deno.test('buat-transaksi: sudah punya yang lunas → 409', async () => {
  reset()
  db.pembelian.push({ id: 'x', user_id: pengguna['tok-ani'].id, ebook_id: 'buku-a', order_id: 'o1', status: 'lunas', jumlah: 25000 })
  const r = await panggilBuat('tok-ani', { ebook_id: 'buku-a' })
  assertEquals(r.status, 409)
  assertEquals(((await r.json()) as { error: string }).error, 'sudah_dibeli')
  assertEquals(log.snap.length, 0)
  // orang lain tetap boleh beli
  assertEquals((await panggilBuat('tok-budi', { ebook_id: 'buku-a' })).status, 200)
})
Deno.test('buat-transaksi: Midtrans menolak → 502 dan pesanan ditandai gagal', async () => {
  reset()
  flag.snapStatus = 401
  const r = await panggilBuat('tok-ani', { ebook_id: 'buku-a' })
  assertEquals(r.status, 502)
  assertEquals(((await r.json()) as { error: string }).error, 'gateway_gagal')
  assertEquals(db.pembelian.map((b) => b.status), ['gagal'])
})
Deno.test('buat-transaksi: kunci Midtrans belum diatur → 500 server_belum_diatur', async () => {
  reset()
  Deno.env.delete('MIDTRANS_SERVER_KEY')
  try {
    const r = await panggilBuat('tok-ani', { ebook_id: 'buku-a' })
    assertEquals(r.status, 500)
    assertEquals(((await r.json()) as { error: string }).error, 'server_belum_diatur')
  } finally {
    Deno.env.set('MIDTRANS_SERVER_KEY', SERVER_KEY)
  }
})

// =============== midtrans-webhook ===============
Deno.test('webhook: bukan POST → 405; JSON rusak → 400', async () => {
  reset()
  assertEquals((await webhook(new Request('http://fn.test/', { method: 'GET' }))).status, 405)
  assertEquals((await webhook(new Request('http://fn.test/', { method: 'POST', body: 'x' }))).status, 400)
})
Deno.test('webhook: tanda tangan salah → 401, status tidak berubah, Midtrans tidak ditanya', async () => {
  reset()
  const o = await pesananDari('tok-ani')
  flag.statusApi = { transaction_status: 'settlement', gross_amount: '25000.00' }
  assertEquals((await notif(o, { signature: 'ngawur' })).status, 401)
  assertEquals((await notif(o, { kunci: 'kunci-lain' })).status, 401)
  assertEquals(db.pembelian[0].status, 'pending')
  assertEquals(log.statusDicek.length, 0)
})
Deno.test('webhook: pesanan tidak dikenal → 200 dan diabaikan', async () => {
  reset()
  const r = await notif('RN-tidak-ada')
  assertEquals(r.status, 200)
  assertEquals(((await r.json()) as { diabaikan?: string }).diabaikan, 'pesanan_tidak_dikenal')
})
Deno.test('webhook: settlement sah → lunas + waktu bayar; diulang tetap aman', async () => {
  reset()
  const o = await pesananDari('tok-ani')
  flag.statusApi = { transaction_status: 'settlement', gross_amount: '25000.00' }
  const r = await notif(o)
  assertEquals(r.status, 200)
  assertEquals(db.pembelian[0].status, 'lunas')
  assert(typeof db.pembelian[0].dibayar === 'string')
  assertEquals((await notif(o)).status, 200)
  assertEquals(db.pembelian[0].status, 'lunas')
  assertEquals(log.statusDicek[0], o, 'status harus dikonfirmasi ulang ke API Midtrans')
})
Deno.test('webhook: notifikasi bertanda tangan sah tapi API Midtrans bilang masih pending → tidak lunas', async () => {
  reset()
  const o = await pesananDari('tok-ani')
  flag.statusApi = { transaction_status: 'pending', gross_amount: '25000.00' }
  assertEquals((await notif(o)).status, 200)
  assertEquals(db.pembelian[0].status, 'pending')
})
Deno.test('webhook: jumlah dibayar tidak sama dengan harga di database → 400, tidak lunas', async () => {
  reset()
  const o = await pesananDari('tok-ani')
  flag.statusApi = { transaction_status: 'settlement', gross_amount: '1000.00' }
  assertEquals((await notif(o, { gross_amount: '1000.00' })).status, 400)
  assertEquals(db.pembelian[0].status, 'pending')
})
Deno.test('webhook: API status Midtrans mati → 502 (supaya Midtrans mengirim ulang)', async () => {
  reset()
  const o = await pesananDari('tok-ani')
  flag.statusApiMati = true
  assertEquals((await notif(o)).status, 502)
  assertEquals(db.pembelian[0].status, 'pending')
})
Deno.test('webhook: expire / deny / cancel → gagal; capture+challenge → tetap pending', async () => {
  for (const [st, hasil] of [['expire', 'gagal'], ['deny', 'gagal'], ['cancel', 'gagal']] as const) {
    reset()
    const o = await pesananDari('tok-ani')
    flag.statusApi = { transaction_status: st, gross_amount: '25000.00' }
    assertEquals((await notif(o)).status, 200)
    assertEquals(db.pembelian[0].status, hasil, st)
  }
  reset()
  const o = await pesananDari('tok-ani')
  flag.statusApi = { transaction_status: 'capture', fraud_status: 'challenge', gross_amount: '25000.00' }
  assertEquals((await notif(o)).status, 200)
  assertEquals(db.pembelian[0].status, 'pending')
})
Deno.test('webhook: pesanan yang sudah lunas tidak bisa diturunkan oleh notifikasi expire susulan', async () => {
  reset()
  const o = await pesananDari('tok-ani')
  flag.statusApi = { transaction_status: 'settlement', gross_amount: '25000.00' }
  await notif(o)
  flag.statusApi = { transaction_status: 'expire', gross_amount: '25000.00' }
  assertEquals((await notif(o)).status, 200)
  assertEquals(db.pembelian[0].status, 'lunas')
})
Deno.test('webhook: bayar ganda (sudah punya lunas) → 200, pesanan kedua tidak ikut lunas', async () => {
  reset()
  const o1 = await pesananDari('tok-ani')
  const o2 = await pesananDari('tok-ani') // dua pesanan pending untuk ebook sama
  flag.statusApi = { transaction_status: 'settlement', gross_amount: '25000.00' }
  assertEquals((await notif(o1)).status, 200)
  assertEquals((await notif(o2)).status, 200)
  assertEquals(db.pembelian.filter((b) => b.status === 'lunas').length, 1)
})
Deno.test('webhook: database error saat menyimpan → 500 (Midtrans akan mengulang)', async () => {
  reset()
  const o = await pesananDari('tok-ani')
  flag.statusApi = { transaction_status: 'settlement', gross_amount: '25000.00' }
  flag.gagalUpdate = true
  assertEquals((await notif(o)).status, 500)
  assertEquals(db.pembelian[0].status, 'pending')
  flag.gagalUpdate = false
  assertEquals((await notif(o)).status, 200)
  assertEquals(db.pembelian[0].status, 'lunas')
})
