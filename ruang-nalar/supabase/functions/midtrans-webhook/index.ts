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

import { createClient } from 'npm:@supabase/supabase-js@2'
import { authBasic, jumlahCocok, petaStatus, signatureValid, urlMidtrans } from '../_shared/midtrans.ts'

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
