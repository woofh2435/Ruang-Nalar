// Edge Function: hapus-akun (OPSIONAL, untuk hak hapus data pada UU PDP)
// Dipanggil dari web oleh pengguna yang sedang masuk. Menghapus akunnya beserta data yang menempel padanya
// (pembelian dan catatan persetujuan ikut terhapus karena relasi "on delete cascade").
// Akun admin TIDAK bisa dihapus lewat fungsi ini (cegah kehilangan akses admin tanpa sengaja).
//
// Deploy:  supabase functions deploy hapus-akun --no-verify-jwt --use-api --project-ref <ID-PROYEK>
// (--no-verify-jwt aman: fungsi memeriksa sendiri token pengguna lewat auth.getUser(token) sebelum melakukan apa pun.)
// Secrets: SITE_URL (alamat webmu). SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY sudah tersedia otomatis.
//
// Catatan: catatan transaksi di sisi Midtrans tidak ikut terhapus; itu dikelola Midtrans sesuai kebijakannya.
//
// VERSI SATU-BERKAS untuk Dashboard Supabase (tidak memakai kode bersama, jadi isinya sama dengan supabase/functions/hapus-akun/index.ts).
// Dibuat otomatis oleh scripts/bundel-fungsi.mjs. JANGAN diedit di sini; ubah sumbernya lalu jalankan ulang skripnya.

import { createClient } from 'npm:@supabase/supabase-js@2'

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

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  if (!token) return json({ error: 'belum_login' }, 401)
  const urlSupabase = Deno.env.get('SUPABASE_URL')!
  const klienPengguna = createClient(urlSupabase, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: dataUser, error: galatUser } = await klienPengguna.auth.getUser(token)
  const user = dataUser?.user
  if (galatUser || !user) return json({ error: 'belum_login' }, 401)

  let masukan: { konfirmasi?: unknown }
  try {
    masukan = await req.json()
  } catch {
    return json({ error: 'permintaan_rusak' }, 400)
  }
  if (masukan.konfirmasi !== 'HAPUS') return json({ error: 'butuh_konfirmasi' }, 400)

  const admin = createClient(urlSupabase, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: adm } = await admin.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle()
  if (adm) return json({ error: 'admin_tidak_bisa' }, 403)

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    console.error('Gagal menghapus akun:', error.message)
    return json({ error: 'gagal_hapus' }, 500)
  }
  return json({ ok: true })
})
