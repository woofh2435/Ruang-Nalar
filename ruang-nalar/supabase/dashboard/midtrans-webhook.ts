// Edge Function: midtrans-webhook
// Alamat ini didaftarkan di Midtrans Dashboard → Settings → Payment → Notification URL:
//   https://<ID-PROYEK>.supabase.co/functions/v1/midtrans-webhook
// Deploy dengan:  supabase functions deploy midtrans-webhook --no-verify-jwt --use-api --project-ref <ID-PROYEK>
// (--no-verify-jwt WAJIB: Midtrans tidak membawa JWT Supabase. Keamanannya dijaga oleh pemeriksaan tanda tangan di bawah.)
//
// Pertahanan berlapis sebelum memberi akses:
//   1) signature_key harus valid (SHA512 dengan Server Key rahasia);
//   2) status dikonfirmasi ulang langsung ke API Midtrans (bukan percaya isi notifikasi);
//   3) jumlah bayar harus sama persis dengan harga yang tercatat di pesanan.
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

/** Saluran bayar bawaan: dompet digital (GoPay, ShopeePay) + QRIS. Ini nama saluran resmi di Snap Midtrans (Snap Preference API). */
const METODE_BAWAAN: readonly string[] = ['gopay', 'shopeepay', 'other_qris']

/**
 * Mengubah secret MIDTRANS_METODE (daftar dipisah koma) menjadi daftar `enabled_payments` untuk Snap.
 * - kosong / tidak diisi → METODE_BAWAAN (e-wallet + QRIS)
 * - "semua" → daftar null: jangan membatasi, Snap memakai semua metode yang aktif di dashboard Midtrans
 * - nama yang bentuknya ngawur dibuang dan dilaporkan di `abaikan` (supaya salah ketik tidak merusak permintaan)
 * Metode yang belum aktif di akun Midtrans tidak akan muncul di halaman bayar, berapa pun isi daftar ini.
 */
function metodeBayar(teks: string | undefined | null): { daftar: string[] | null; abaikan: string[] } {
  const mentah = (teks ?? '').trim()
  if (!mentah) return { daftar: [...METODE_BAWAAN], abaikan: [] }
  if (/^(semua|all)$/i.test(mentah)) return { daftar: null, abaikan: [] }
  const daftar: string[] = []
  const abaikan: string[] = []
  for (const bagian of mentah.split(',')) {
    const nama = bagian.trim()
    if (!nama) continue
    if (/^[A-Za-z][A-Za-z0-9_]{1,30}$/.test(nama)) {
      if (!daftar.includes(nama)) daftar.push(nama)
    } else abaikan.push(nama.slice(0, 40))
  }
  return daftar.length ? { daftar, abaikan } : { daftar: [...METODE_BAWAAN], abaikan }
}

// ---------- fungsi ----------
const json = (isi: unknown, status = 200) => new Response(JSON.stringify(isi), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'metode_tidak_didukung' }, 405)
  const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY')
  if (!serverKey) return json({ error: 'server_belum_diatur' }, 500)

  let notif: Record<string, string>
  try {
    notif = await req.json()
  } catch {
    return json({ error: 'permintaan_rusak' }, 400)
  }

  // 1) tanda tangan
  if (!(await signatureValid(notif, serverKey))) return json({ error: 'tanda_tangan_salah' }, 401)

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const orderId = notif.order_id
  const { data: pesanan } = await admin.from('pembelian').select('id, status, jumlah').eq('order_id', orderId).maybeSingle()
  if (!pesanan) return json({ ok: true, diabaikan: 'pesanan_tidak_dikenal' }) // 200 supaya Midtrans berhenti mengulang

  // 2) konfirmasi ulang ke Midtrans
  const { api } = urlMidtrans(Deno.env.get('MIDTRANS_ENV'))
  let status: { transaction_status?: string; fraud_status?: string; gross_amount?: string } | null = null
  try {
    const r = await fetch(`${api}/v2/${encodeURIComponent(orderId)}/status`, { headers: { Accept: 'application/json', Authorization: authBasic(serverKey) } })
    if (r.ok) status = await r.json()
  } catch (e) {
    console.error('Gagal cek status ke Midtrans:', e)
  }
  if (!status) return json({ error: 'gagal_cek_status' }, 502) // 5xx → Midtrans akan mengirim ulang nanti

  // 3) jumlah harus cocok
  if (!jumlahCocok(status.gross_amount, pesanan.jumlah)) {
    console.error('Jumlah tidak cocok', { orderId, dari_midtrans: status.gross_amount, di_database: pesanan.jumlah })
    return json({ error: 'jumlah_tidak_cocok' }, 400)
  }

  const hasil = petaStatus(status.transaction_status, status.fraud_status)
  if (hasil === 'lunas') {
    if (pesanan.status !== 'lunas') {
      const { error } = await admin.from('pembelian').update({ status: 'lunas', dibayar: new Date().toISOString() }).eq('order_id', orderId).neq('status', 'lunas')
      if (error) {
        // 23505 = pelanggaran indeks unik: pembeli yang sama sudah punya pembelian lunas untuk ebook ini (bayar ganda).
        // Akses sudah ada, jadi cukup dicatat (perlu refund manual) dan dijawab 200 supaya Midtrans tidak mengulang.
        if (error.code === '23505') console.error('Bayar ganda, perlu refund manual:', orderId)
        else {
          // kegagalan lain (mis. database sedang bermasalah): jawab 5xx supaya Midtrans mengirim ulang notifikasi nanti
          console.error('Gagal menandai lunas:', orderId, error.message)
          return json({ error: 'gagal_menyimpan' }, 500)
        }
      }
    }
  } else if (hasil === 'gagal') {
    const { error } = await admin.from('pembelian').update({ status: 'gagal' }).eq('order_id', orderId).eq('status', 'pending')
    if (error) {
      console.error('Gagal menandai gagal:', orderId, error.message)
      return json({ error: 'gagal_menyimpan' }, 500)
    }
  }
  return json({ ok: true })
})
