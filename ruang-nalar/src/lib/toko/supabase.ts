// Backend NYATA: Supabase (login + database + Edge Functions) dan pembayaran lewat Midtrans.
// Semua aturan akses dipaksa oleh Row Level Security di database (supabase/schema.sql), bukan oleh kode ini.

import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { GalatToko, SANDI_MIN, emailValid, idEbookValid, type Backend, type CatatanPersetujuan, type ItemKatalog, type JenisPersetujuan, type KodeGalat, type MasukanEbookToko, type Pembelian, type Sesi } from './tipe'

/** Ubah galat Supabase (bahasa Inggris) menjadi GalatToko berbahasa Indonesia yang ramah. */
export function petaGalat(e: unknown): GalatToko {
  if (e instanceof GalatToko) return e
  const pesan = String((e as { message?: string } | null)?.message ?? e ?? '')
  const kodeApi = String((e as { code?: string } | null)?.code ?? '')
  const baris = (k: KodeGalat, p: string) => new GalatToko(k, p)
  if (/invalid login credentials/i.test(pesan)) return baris('kredensial_salah', 'Email atau kata sandi salah.')
  if (/already registered|already been registered|user_already_exists/i.test(pesan + kodeApi)) return baris('email_terdaftar', 'Email ini sudah terdaftar. Coba masuk.')
  if (/email not confirmed|email_not_confirmed/i.test(pesan + kodeApi)) return baris('email_belum_konfirmasi', 'Email belum dikonfirmasi. Cek kotak masuk (dan folder spam) lalu klik tautan konfirmasinya.')
  if (/password.*(at least|short|weak)|weak_password/i.test(pesan + kodeApi)) return baris('sandi_lemah', `Kata sandi terlalu lemah. Pakai minimal ${SANDI_MIN} karakter.`)
  if (/unable to validate email|invalid.*email|email_address_invalid/i.test(pesan + kodeApi)) return baris('email_tidak_valid', 'Alamat email belum benar.')
  if (/same_password|different from the old password/i.test(pesan + kodeApi)) return baris('sandi_sama', 'Kata sandi baru harus berbeda dari yang lama.')
  if (/otp_expired|token has expired|expired or is invalid|invalid refresh token|refresh_token_not_found/i.test(pesan + kodeApi)) return baris('tautan_kedaluwarsa', 'Tautan sudah kedaluwarsa atau sudah pernah dipakai. Minta tautan baru, ya.')
  if (/auth session missing|session_not_found|not authenticated|jwt expired/i.test(pesan + kodeApi)) return baris('belum_login', 'Sesi habis. Buka lagi tautan dari emailmu, atau masuk dulu.')
  if (/over_email_send_rate_limit|email rate limit/i.test(pesan + kodeApi)) return baris('terlalu_sering', 'Batas pengiriman email sedang penuh karena terlalu banyak percobaan. Tunggu sekitar satu jam lalu coba lagi. Kalau emailmu sudah pernah dikonfirmasi, langsung saja masuk.')
  if (/rate limit|too many|over_.*_rate_limit|429/i.test(pesan + kodeApi)) return baris('terlalu_sering', 'Terlalu sering mencoba. Tunggu beberapa menit lalu coba lagi.')
  if (/failed to fetch|networkerror|network request failed|load failed|fetch/i.test(pesan)) return baris('jaringan', 'Tidak bisa terhubung ke server. Periksa koneksi internetmu.')
  if (/row-level security|permission denied|42501/i.test(pesan + kodeApi)) return baris('ditolak', 'Akses ditolak.')
  if (/foreign key|23503/i.test(pesan + kodeApi)) return baris('ditolak', 'Ebook ini sudah pernah dibeli, jadi tidak bisa dihapus. Sembunyikan saja (jadikan Draf).')
  if (/duplicate key|23505/i.test(pesan + kodeApi)) return baris('ditolak', 'Data dengan ID itu sudah ada.')
  return baris('lainnya', 'Terjadi kesalahan. Coba lagi sebentar lagi.')
}

const keItem = (r: Record<string, unknown>): ItemKatalog => ({
  id: String(r.id),
  judul: String(r.judul ?? ''),
  subjudul: String(r.subjudul ?? ''),
  penulis: String(r.penulis ?? ''),
  tema: (['malam', 'siang', 'iris', 'almond', 'api'].includes(String(r.tema)) ? r.tema : 'malam') as ItemKatalog['tema'],
  ikon: String(r.ikon ?? '📖'),
  tag: Array.isArray(r.tag) ? (r.tag as unknown[]).map(String) : [],
  deskripsi: String(r.deskripsi ?? ''),
  harga: Number(r.harga ?? 0),
  terbit: Boolean(r.terbit),
  urutan: Number(r.urutan ?? 0),
})

const JENIS_PERSETUJUAN: JenisPersetujuan[] = ['syarat_privasi', 'promo', 'analitik']
const keCatatan = (r: Record<string, unknown>): CatatanPersetujuan => ({
  id: String(r.id),
  jenis: (JENIS_PERSETUJUAN.includes(r.jenis as JenisPersetujuan) ? r.jenis : 'syarat_privasi') as JenisPersetujuan,
  status: r.status === true,
  versi: String(r.versi_kebijakan ?? ''),
  dibuat: String(r.dibuat ?? ''),
})

const kePembelian = (r: Record<string, unknown>): Pembelian => ({
  id: String(r.id),
  ebookId: String(r.ebook_id),
  orderId: String(r.order_id),
  status: (['pending', 'lunas', 'gagal'].includes(String(r.status)) ? r.status : 'pending') as Pembelian['status'],
  jumlah: Number(r.jumlah ?? 0),
  dibuat: String(r.dibuat ?? ''),
  dibayar: r.dibayar ? String(r.dibayar) : null,
})

export function buatBackendSupabase(url: string, kunci: string): Backend {
  const klien: SupabaseClient = createClient(url.trim(), kunci.trim(), { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } })

  const cekAdmin = async (): Promise<boolean> => {
    const { data, error } = await klien.rpc('is_admin')
    return !error && data === true
  }
  const sesiDari = async (u: User | null | undefined): Promise<Sesi | null> => (u ? { id: u.id, email: u.email ?? '', admin: await cekAdmin() } : null)
  const lempar = (e: unknown): never => {
    throw petaGalat(e)
  }

  return {
    mode: 'nyata',
    async sesiSaatIni() {
      const { data, error } = await klien.auth.getSession()
      if (error) return null
      return sesiDari(data.session?.user)
    },
    onSesi(cb) {
      let nomor = 0
      const { data } = klien.auth.onAuthStateChange((_e, sesi) => {
        // jangan memanggil API Supabase langsung di dalam callback ini (bisa menahan antrean auth)
        const saya = ++nomor
        setTimeout(() => {
          // hanya kabar TERBARU yang dipakai (mencegah hasil lambat menimpa keadaan yang lebih baru, mis. setelah keluar)
          void sesiDari(sesi?.user).then(
            (s) => saya === nomor && cb(s),
            () => saya === nomor && cb(null),
          )
        }, 0)
      })
      return () => data.subscription.unsubscribe()
    },
    async daftar(email, sandi, persetujuan) {
      const e = email.trim().toLowerCase()
      if (!emailValid(e)) throw new GalatToko('email_tidak_valid', 'Alamat email belum benar.')
      if (sandi.length < SANDI_MIN) throw new GalatToko('sandi_lemah', `Kata sandi minimal ${SANDI_MIN} karakter.`)
      // tujuan tautan konfirmasi = alamat web ini (lengkap dengan nama repo). Harus ada di Supabase → Authentication → URL Configuration → Redirect URLs;
      // kalau tidak ada di sana, Supabase memakai Site URL.
      const tujuan = typeof location !== 'undefined' ? location.origin + location.pathname : undefined
      // pilihan persetujuan ikut sebagai metadata; trigger database (catat_persetujuan_daftar) mencatatnya dengan waktu server
      const data0 = persetujuan ? { persetujuan: { versi: persetujuan.versi, syarat: true, promo: persetujuan.promo, analitik: persetujuan.analitik } } : undefined
      const opsi = { ...(tujuan ? { emailRedirectTo: tujuan } : {}), ...(data0 ? { data: data0 } : {}) }
      const { data, error } = await klien.auth.signUp({ email: e, password: sandi, ...(Object.keys(opsi).length ? { options: opsi } : {}) })
      if (error) lempar(error)
      // email sudah terdaftar tetapi dikonfirmasi: Supabase mengembalikan user tanpa identities (anti-enumerasi)
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) throw new GalatToko('email_terdaftar', 'Email ini sudah terdaftar. Coba masuk.')
      return { perluKonfirmasi: !data.session }
    },
    async masuk(email, sandi) {
      const { error } = await klien.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: sandi })
      if (error) lempar(error)
    },
    async keluar() {
      const { error } = await klien.auth.signOut()
      if (error) lempar(error)
    },
    async kirimResetSandi(email) {
      const e = email.trim().toLowerCase()
      if (!emailValid(e)) throw new GalatToko('email_tidak_valid', 'Alamat email belum benar.')
      // tujuan = alamat web ini (harus ada di Supabase → Authentication → URL Configuration → Redirect URLs / Site URL)
      const tujuan = typeof location !== 'undefined' ? location.origin + location.pathname : undefined
      const { error } = await klien.auth.resetPasswordForEmail(e, tujuan ? { redirectTo: tujuan } : undefined)
      if (error) lempar(error)
      return {}
    },
    async pulihkanDariTautan(t) {
      const { error } = await klien.auth.setSession({ access_token: t.accessToken, refresh_token: t.refreshToken })
      if (error) lempar(error)
    },
    async ubahSandi(sandiBaru) {
      if (sandiBaru.length < SANDI_MIN) throw new GalatToko('sandi_lemah', `Kata sandi minimal ${SANDI_MIN} karakter.`)
      const { error } = await klien.auth.updateUser({ password: sandiBaru })
      if (error) lempar(error)
    },
    async riwayatPersetujuan() {
      const { data: ses } = await klien.auth.getSession()
      const uid = ses.session?.user.id
      if (!uid) return []
      const { data, error } = await klien.from('persetujuan').select('*').eq('user_id', uid).order('dibuat', { ascending: false }).order('id', { ascending: false }).limit(200)
      if (error) lempar(error)
      return (data ?? []).map(keCatatan)
    },
    async catatPersetujuan(jenis, status, versi) {
      const { data: ses } = await klien.auth.getSession()
      const uid = ses.session?.user.id
      if (!uid) throw new GalatToko('belum_login', 'Sesi masuk habis. Silakan masuk lagi.')
      if (!JENIS_PERSETUJUAN.includes(jenis)) throw new GalatToko('ditolak', 'Jenis persetujuan tidak dikenal.')
      const { error } = await klien.from('persetujuan').insert({ user_id: uid, jenis, status, versi_kebijakan: versi.slice(0, 20) })
      if (error) lempar(error)
    },
    async hapusAkun() {
      const { error } = await klien.functions.invoke('hapus-akun', { body: { konfirmasi: 'HAPUS' } })
      if (error) {
        let kode = ''
        let status = 0
        try {
          const ctx = (error as { context?: Response }).context
          status = ctx?.status ?? 0
          if (ctx && typeof ctx.json === 'function') kode = String(((await ctx.json()) as { error?: string }).error ?? '')
        } catch {
          /* abaikan */
        }
        if (kode === 'admin_tidak_bisa') throw new GalatToko('admin_tidak_bisa', 'Akun admin tidak bisa dihapus dari sini demi keamanan.')
        if (kode === 'belum_login') throw new GalatToko('belum_login', 'Sesi masuk habis. Silakan masuk lagi.')
        if (status === 404 || /not found|failed to send|fetch/i.test(String((error as Error).message))) {
          throw new GalatToko('server_belum_diatur', 'Penghapusan otomatis belum diaktifkan oleh pemilik web. Kirim permintaan hapus akun lewat email kontak.')
        }
        return lempar(error)
      }
      // sesi lokal sudah tidak berlaku (pengguna sudah terhapus di server)
      await klien.auth.signOut({ scope: 'local' }).catch(() => undefined)
    },
    async katalog() {
      const { data, error } = await klien.from('ebook_berbayar').select('*').eq('terbit', true).order('urutan', { ascending: true }).order('dibuat', { ascending: true })
      if (error) lempar(error)
      return (data ?? []).map(keItem)
    },
    async pembelianSaya() {
      // admin boleh MELIHAT semua pembelian lewat RLS, jadi saring eksplisit: "Pembelianku" hanya milik akun ini
      const { data: ses } = await klien.auth.getSession()
      const uid = ses.session?.user.id
      if (!uid) return []
      const { data, error } = await klien.from('pembelian').select('*').eq('user_id', uid).order('dibuat', { ascending: false })
      if (error) lempar(error)
      return (data ?? []).map(kePembelian)
    },
    async bacaIsi(ebookId) {
      const { data, error } = await klien.from('ebook_isi').select('raw').eq('ebook_id', ebookId).maybeSingle()
      if (error) lempar(error)
      return data ? String((data as { raw: unknown }).raw) : null
    },
    async mulaiBayar(ebookId) {
      if (!idEbookValid(ebookId)) throw new GalatToko('tidak_ditemukan', 'Ebook ini tidak ditemukan.')
      const { data, error } = await klien.functions.invoke('buat-transaksi', { body: { ebook_id: ebookId } })
      if (error) {
        // FunctionsHttpError membawa Response asli di .context
        let kode = ''
        try {
          const ctx = (error as { context?: Response }).context
          if (ctx && typeof ctx.json === 'function') kode = String(((await ctx.json()) as { error?: string }).error ?? '')
        } catch {
          /* abaikan */
        }
        if (kode === 'sudah_dibeli') throw new GalatToko('sudah_dibeli', 'Kamu sudah memiliki ebook ini.')
        if (kode === 'belum_login') throw new GalatToko('belum_login', 'Sesi masuk habis. Silakan masuk lagi.')
        if (kode === 'ebook_tidak_ditemukan') throw new GalatToko('tidak_ditemukan', 'Ebook ini sudah tidak dijual.')
        if (kode === 'server_belum_diatur') throw new GalatToko('server_belum_diatur', 'Pembayaran belum siap: pemilik web belum selesai mengatur Midtrans.')
        if (kode === 'gateway_gagal') throw new GalatToko('lainnya', 'Layanan pembayaran sedang bermasalah. Coba lagi sebentar lagi.')
        return lempar(error)
      }
      const tujuan = String((data as { redirect_url?: unknown } | null)?.redirect_url ?? '')
      let ok = false
      try {
        const u = new URL(tujuan)
        ok = u.protocol === 'https:' && /(^|\.)midtrans\.com$/.test(u.hostname)
      } catch {
        ok = false
      }
      if (!ok) throw new GalatToko('lainnya', 'Alamat pembayaran dari server tidak dikenali, dibatalkan demi keamanan.')
      return { jenis: 'alihkan', url: tujuan }
    },
    async adminDaftar() {
      const { data, error } = await klien.from('ebook_berbayar').select('*').order('urutan', { ascending: true }).order('dibuat', { ascending: true })
      if (error) lempar(error)
      return (data ?? []).map(keItem)
    },
    async adminBacaIsi(ebookId) {
      const { data, error } = await klien.from('ebook_isi').select('raw').eq('ebook_id', ebookId).maybeSingle()
      if (error) lempar(error)
      return data ? String((data as { raw: unknown }).raw) : null
    },
    async adminSimpan(m: MasukanEbookToko) {
      if (!idEbookValid(m.item.id)) throw new GalatToko('ditolak', 'ID ebook hanya boleh huruf kecil, angka, dan tanda hubung (maks. 60 karakter).')
      if (!Number.isInteger(m.item.harga) || m.item.harga < 1000) throw new GalatToko('ditolak', 'Harga minimal Rp 1.000.')
      const baris: Record<string, unknown> = {
        id: m.item.id,
        judul: m.item.judul,
        subjudul: m.item.subjudul,
        penulis: m.item.penulis,
        tema: m.item.tema,
        ikon: m.item.ikon,
        tag: m.item.tag,
        deskripsi: m.item.deskripsi,
        harga: m.item.harga,
        terbit: m.item.terbit,
      }
      if (m.item.urutan !== undefined) baris.urutan = m.item.urutan
      const a = await klien.from('ebook_berbayar').upsert(baris, { onConflict: 'id' })
      if (a.error) lempar(a.error)
      const b = await klien.from('ebook_isi').upsert({ ebook_id: m.item.id, raw: m.raw }, { onConflict: 'ebook_id' })
      if (b.error) lempar(b.error)
    },
    async adminAtur(id, p) {
      const ubah: Record<string, unknown> = {}
      if (p.harga !== undefined) {
        if (!Number.isInteger(p.harga) || p.harga < 1000) throw new GalatToko('ditolak', 'Harga minimal Rp 1.000.')
        ubah.harga = p.harga
      }
      if (p.terbit !== undefined) ubah.terbit = p.terbit
      const { error } = await klien.from('ebook_berbayar').update(ubah).eq('id', id)
      if (error) lempar(error)
    },
    async adminHapus(id) {
      const { error } = await klien.from('ebook_berbayar').delete().eq('id', id)
      if (error) lempar(error)
    },
  }
}
