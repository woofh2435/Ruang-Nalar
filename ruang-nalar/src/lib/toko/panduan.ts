// Panduan membuka toko (daftar centang di Ruang Redaksi). Isinya data murni supaya bisa dites.
// PENTING: berkas ini TIDAK boleh berisi kunci/rahasia apa pun. Hanya nama secret dan contoh.

import type { ModeToko } from './mode'

/** Nilai yang bisa disalin. Teks `{ALAMAT_WEB}` diganti alamat web yang sedang dibuka (lihat `isiNilai`). */
export interface NilaiSalin {
  label: string
  nilai: string
  /** true = beberapa baris (mis. perintah SQL), ditampilkan sebagai blok kode */
  blok?: boolean
  /** false = hanya keterangan (mis. "Server Key dari Midtrans"), tidak ada tombol Salin */
  bisaSalin?: boolean
}

export interface TautanPanduan {
  teks: string
  url: string
}

export interface LangkahPanduan {
  id: string
  judul: string
  isi: string
  salin?: NilaiSalin[]
  tautan?: TautanPanduan[]
  /** langkah dianggap selesai otomatis kalau toko web ini sudah berada di mode itu */
  otomatisJikaMode?: ModeToko
}

export interface TahapPanduan {
  id: string
  judul: string
  ringkas: string
  /** peringatan yang ditampilkan di atas daftar langkah tahap ini */
  awas?: string
  langkah: LangkahPanduan[]
}

export const KUNCI_PANDUAN = 'rn-panduan-toko'
export const PENGGANTI_ALAMAT = '{ALAMAT_WEB}'
export const ALAMAT_WEB_CONTOH = 'https://NAMAMU.github.io/ruang-nalar/'

const SQL_ADMIN = `insert into public.admin_users (user_id)
select id from auth.users where email = 'emailmu@contoh.com'
on conflict do nothing;`

const SQL_REFUND = `update public.pembelian set status = 'gagal' where order_id = 'ORDER-ID-DARI-AKUNKU';`

export const PANDUAN_TOKO: TahapPanduan[] = [
  {
    id: 'sandbox',
    judul: 'Tahap 1 · Pasang toko di Sandbox',
    ringkas: 'Gratis dan belum memakai uang sungguhan. Bisa dikerjakan sekarang, tanpa menunggu persetujuan Midtrans.',
    awas: 'Selama Midtrans masih Sandbox, siapa pun yang tahu simulator Midtrans bisa “membayar” tanpa uang. Jadi untuk ebook yang kamu terbitkan sekarang, pakai ebook CONTOH berisi pendek (bukan isi aslimu). Isi asli baru diterbitkan di Tahap 4.',
    langkah: [
      {
        id: 'supabase',
        judul: 'Buat proyek Supabase',
        isi: 'Daftar di supabase.com, buat proyek baru (paket gratis cukup, region Singapore). Catat Project URL dan kunci anon / publishable dari pengaturan API proyek.',
        tautan: [{ teks: 'Buka supabase.com', url: 'https://supabase.com' }],
      },
      {
        id: 'skema',
        judul: 'Jalankan skema database',
        isi: 'Di Supabase: SQL Editor → New query. Tempel seluruh isi file 1-supabase-schema.sql (di repo: supabase/schema.sql), lalu klik Run. Aman dijalankan ulang.',
      },
      {
        id: 'midtrans-sandbox',
        judul: 'Ambil Server Key Sandbox dari Midtrans',
        isi: 'Daftar di midtrans.com. Login pertama selalu masuk ke dashboard Sandbox. Ambil Server Key sandbox (diawali SB-Mid-server-) di menu pengaturan akses. Nama menunya bisa berubah.',
        tautan: [{ teks: 'Buka midtrans.com', url: 'https://midtrans.com' }],
      },
      {
        id: 'fungsi',
        judul: 'Pasang dua fungsi pembayaran',
        isi: 'Supabase → Edge Functions → Deploy a new function → Via Editor. Buat dua fungsi dengan nama persis di bawah. Isi fungsi pertama dengan file 2-fungsi-buat-transaksi.ts dan fungsi kedua dengan 3-fungsi-midtrans-webhook.ts (di repo: supabase/dashboard/), lalu Deploy. Di pengaturan masing-masing fungsi, matikan “Verify JWT”.',
        salin: [
          { label: 'Nama fungsi 1', nilai: 'buat-transaksi' },
          { label: 'Nama fungsi 2', nilai: 'midtrans-webhook' },
        ],
      },
      {
        id: 'rahasia',
        judul: 'Isi Secrets di Supabase',
        isi: 'Edge Functions → Secrets. Server Key hanya boleh ada di sini: jangan taruh di GitHub, toko-config.json, atau chat. MIDTRANS_METODE bersifat opsional; kalau kosong, halaman bayar hanya menampilkan e-wallet dan QRIS.',
        salin: [
          { label: 'Secret 1', nilai: 'MIDTRANS_SERVER_KEY' },
          { label: 'Isi secret 1', nilai: 'Server Key sandbox dari Midtrans (diawali SB-Mid-server-)', bisaSalin: false },
          { label: 'Secret 2', nilai: 'MIDTRANS_ENV' },
          { label: 'Isi secret 2', nilai: 'sandbox' },
          { label: 'Secret 3', nilai: 'SITE_URL' },
          { label: 'Isi secret 3 (alamat web ini)', nilai: PENGGANTI_ALAMAT },
        ],
      },
      {
        id: 'webhook',
        judul: 'Daftarkan alamat notifikasi di Midtrans Sandbox',
        isi: 'Di dashboard Midtrans (mode Sandbox) buka Settings → Payment Settings dan cari kolom Payment Notification URL (dokumentasi Midtrans lama menyebutnya Settings → Configuration; di HP, buka menu ☰ dulu). Kolom lain di halaman itu tidak perlu diisi. Isi dengan alamat di bawah. Ganti ID_PROYEK dengan bagian depan Project URL Supabase-mu.',
        salin: [{ label: 'Payment Notification URL', nilai: 'https://ID_PROYEK.supabase.co/functions/v1/midtrans-webhook' }],
      },
      {
        id: 'sambung',
        judul: 'Sambungkan web ini ke Supabase',
        isi: 'Edit file toko-config.json di samping index.html (di GitHub, ikon pensil, lalu Commit). Isi SUPABASE_URL dengan alamat depan proyekmu saja (https://xxxx.supabase.co, tanpa /rest/v1/) dan SUPABASE_ANON_KEY dengan kunci anon / publishable saja. JANGAN memasukkan kunci service_role atau sb_secret_. Tunggu beberapa menit, lalu muat ulang halaman ini. Langkah ini tercentang sendiri kalau web sudah tersambung.',
        otomatisJikaMode: 'nyata',
      },
      {
        id: 'jadi-admin',
        judul: 'Jadikan akunmu admin toko',
        isi: 'Sebelum daftar, buka Supabase → Authentication → URL Configuration dan isi Site URL dengan alamat web ini lengkap dengan nama repo, dan tambahkan alamat yang sama di Redirect URLs, supaya tautan di email konfirmasi dan email lupa kata sandi tidak berujung “Not found” (kalau sudah terlanjur, coba langsung masuk karena emailnya biasanya sudah terverifikasi). Lalu daftar akun lewat tombol akun di web ini. Di Supabase SQL Editor jalankan perintah di bawah (ganti emailnya), kemudian muat ulang halaman atau masuk lagi. Hasil “0 rows” berarti akunmu sudah ada di daftar admin.',
        salin: [{ label: 'Perintah SQL', nilai: SQL_ADMIN, blok: true }],
      },
      {
        id: 'uji-sandbox',
        judul: 'Uji beli satu ebook contoh',
        isi: 'Di bagian “Toko ebook berbayar” buat ebook CONTOH berharga murah (minimal Rp 1.000, isi pendek), centang Terbit. Beli dengan simulator Midtrans Sandbox. Pastikan statusnya berubah jadi Lunas di halaman Akunku dan ebook terbuka.',
      },
    ],
  },
  {
    id: 'siap',
    judul: 'Tahap 2 · Siapkan web sebelum diperiksa',
    ringkas: 'Midtrans memeriksa website atau katalog produkmu. Ini saran, bukan syarat tertulis dari Midtrans.',
    langkah: [
      {
        id: 'produk-contoh',
        judul: 'Tampilkan produk dengan harga jelas',
        isi: 'Pastikan ebook contoh dari Tahap 1 sudah Terbit, punya judul, deskripsi, dan harga yang terlihat di rak beranda. Isi aslinya tetap disimpan dulu.',
      },
      {
        id: 'alamat-publik',
        judul: 'Pastikan alamat web bisa dibuka siapa saja',
        isi: 'Buka alamat web-mu dari HP lain atau jendela samaran. Siapkan juga akun media sosial atau katalog produk sebagai tautan pendukung.',
        salin: [{ label: 'Alamat web ini', nilai: PENGGANTI_ALAMAT }],
      },
    ],
  },
  {
    id: 'daftar',
    judul: 'Tahap 3 · Daftar Midtrans produksi (usaha mikro)',
    ringkas: 'Didaftarkan sebagai perorangan. Pembayaran yang disasar: e-wallet dan QRIS.',
    langkah: [
      {
        id: 'dokumen',
        judul: 'Siapkan dokumen',
        isi: 'KTP dan NPWP pribadi. Dokumen perorangan di dokumentasi Midtrans: KTP pemilik bisnis dan NPWP, sedangkan halaman pendaftarannya menyebut paket awal (transfer bank, GoPay, QRIS) cukup KTP. Siapkan keduanya. NIB tidak tercantum sebagai syarat untuk perorangan.',
        tautan: [
          { teks: 'Dokumen legalitas Midtrans', url: 'https://docs.midtrans.com/docs/apa-saja-dokumen-legalitas-yang-diperlukan-untuk-registrasi-akun-midtrans' },
          { teks: 'Pendaftaran dan aktivasi akun', url: 'https://midtrans.com/passport' },
        ],
      },
      {
        id: 'nib',
        judul: 'Urus NIB (opsional, disarankan)',
        isi: 'Di oss.go.id pilih skala usaha mikro dan pelaku perseorangan. Data yang diminta antara lain NIK, NPWP pribadi, email, nomor HP, dan alamat sesuai KTP. Berguna sebagai bukti usaha, tetapi bukan syarat Midtrans untuk perorangan.',
        tautan: [{ teks: 'Buka oss.go.id', url: 'https://oss.go.id' }],
      },
      {
        id: 'ajukan',
        judul: 'Daftar dan ajukan aktivasi akun',
        isi: 'Verifikasi email, selesaikan banner registrasi di dashboard Midtrans, pilih jenis usaha perorangan, isi data, unggah dokumen, lalu klik Ajukan. Jangan memilih kategori usaha yang dilarang Midtrans. Cantumkan alamat web, media sosial, atau katalog produk.',
      },
      {
        id: 'tunggu',
        judul: 'Tunggu kabar persetujuan',
        isi: 'Kabar datang lewat email. Midtrans bisa meminta dokumen tambahan. Lama prosesnya tidak dijamin; kartu kredit/debit butuh KTP dan NPWP dan bisa memakan 14–30 hari kerja, tetapi kamu tidak memerlukannya untuk e-wallet dan QRIS.',
      },
    ],
  },
  {
    id: 'produksi',
    judul: 'Tahap 4 · Pindah ke uang sungguhan',
    ringkas: 'Dikerjakan setelah akun produksi disetujui. Tidak perlu mengubah toko-config.json.',
    langkah: [
      {
        id: 'metode-aktif',
        judul: 'Aktifkan metode bayar di dashboard Production',
        isi: 'Di dashboard Midtrans mode Production, aktifkan GoPay dan QRIS (dan ShopeePay kalau tersedia untuk akunmu). Metode yang belum aktif tidak akan muncul di halaman bayar.',
      },
      {
        id: 'kunci-produksi',
        judul: 'Ganti secret ke kunci produksi',
        isi: 'Di Supabase → Edge Functions → Secrets, ubah dua nilai berikut. Server Key produksi berbeda dari kunci sandbox.',
        salin: [
          { label: 'Secret', nilai: 'MIDTRANS_SERVER_KEY' },
          { label: 'Isi', nilai: 'Server Key PRODUKSI dari Midtrans', bisaSalin: false },
          { label: 'Secret', nilai: 'MIDTRANS_ENV' },
          { label: 'Isi', nilai: 'production' },
        ],
      },
      {
        id: 'webhook-produksi',
        judul: 'Isi alamat notifikasi di dashboard Production',
        isi: 'Dashboard Sandbox dan Production terpisah, jadi Payment Notification URL (Settings → Payment Settings) harus diisi lagi di mode Production dengan alamat yang sama.',
        salin: [{ label: 'Payment Notification URL', nilai: 'https://ID_PROYEK.supabase.co/functions/v1/midtrans-webhook' }],
      },
      {
        id: 'uji-nyata',
        judul: 'Uji satu transaksi sungguhan',
        isi: 'Beli ebook contohmu sendiri seharga Rp 1.000 dengan uang sungguhan. Pastikan statusnya Lunas dan transaksinya muncul di dashboard Midtrans Production. Setelah itu jadikan ebook contoh Draf.',
      },
      {
        id: 'buka-toko',
        judul: 'Terbitkan ebook asli',
        isi: 'Baru sekarang isi ebook asli diterbitkan (buat baru, atau pakai Ubah pada ebook contoh). Catatan: belum ada tombol refund. Kalau kamu mengembalikan uang pembeli lewat dashboard Midtrans, cabut aksesnya dengan perintah SQL di bawah. Belum ada fitur lupa kata sandi; atur ulang lewat Supabase → Authentication → Users.',
        salin: [{ label: 'Cabut akses setelah refund', nilai: SQL_REFUND, blok: true }],
      },
    ],
  },
]

export const SEMUA_LANGKAH: LangkahPanduan[] = PANDUAN_TOKO.flatMap((t) => t.langkah)
export const SEMUA_ID_LANGKAH: string[] = SEMUA_LANGKAH.map((l) => l.id)

/** Membaca centang tersimpan secara aman: hanya ID langkah yang dikenal, tanpa duplikat. */
export function bacaCentang(teks: string | null | undefined): string[] {
  if (!teks) return []
  try {
    const x: unknown = JSON.parse(teks)
    if (!Array.isArray(x)) return []
    const sah = new Set(SEMUA_ID_LANGKAH)
    return [...new Set(x.filter((i): i is string => typeof i === 'string' && sah.has(i)))]
  } catch {
    return []
  }
}

/** Langkah yang tercentang sendiri berdasarkan mode toko saat ini. */
export function langkahOtomatis(mode: ModeToko): string[] {
  return SEMUA_LANGKAH.filter((l) => l.otomatisJikaMode === mode).map((l) => l.id)
}

export function hitungKemajuan(selesai: string[], otomatis: string[], langkah: LangkahPanduan[] = SEMUA_LANGKAH): { selesai: number; total: number } {
  const tanda = new Set([...selesai, ...otomatis])
  return { selesai: langkah.filter((l) => tanda.has(l.id)).length, total: langkah.length }
}

/** Alamat dasar web dari alamat yang sedang dibuka (tanpa #, ?, dan index.html, selalu diakhiri /). null bila bukan http(s). */
export function alamatWeb(href: string): string | null {
  try {
    const u = new URL(href)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
    let p = u.pathname.replace(/index\.html?$/i, '')
    if (!p.endsWith('/')) p += '/'
    return u.origin + p
  } catch {
    return null
  }
}

/** Mengganti {ALAMAT_WEB} dengan alamat web yang sedang dibuka (atau contoh bila tidak diketahui). */
export function isiNilai(nilai: string, alamat: string | null): string {
  return nilai.split(PENGGANTI_ALAMAT).join(alamat ?? ALAMAT_WEB_CONTOH)
}

export const LABEL_MODE: Record<ModeToko, { judul: string; rinci: string }> = {
  mati: { judul: 'Belum tersambung', rinci: 'Toko mati: web berjalan seperti biasa dan belum memakai Supabase.' },
  demo: { judul: 'Mode demo', rinci: 'Latihan di browser ini dengan data palsu. Belum ada Supabase atau uang sungguhan.' },
  nyata: { judul: 'Tersambung ke Supabase', rinci: 'Akun dan pembayaran memakai Supabase dan Midtrans (Sandbox atau Production tergantung secret-mu).' },
}
