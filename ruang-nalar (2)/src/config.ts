// ============================================================
//  PENGATURAN UTAMA — ubah nilai di bawah ini sesuai kebutuhanmu
// ============================================================

/** Nama web yang tampil di judul, beranda, dan tab browser. */
export const NAMA_WEB = 'Ruang Nalar'

/**
 * Nama penulis bawaan. Dipakai kalau ebook tidak mengisi `penulis:`
 * atau masih berisi placeholder [NAMA PENULIS].
 * >>> GANTI dengan namamu. <<<
 */
export const NAMA_PENULIS_DEFAULT = 'Pemilik Ruang Nalar'

/** Kalimat pendek di bawah judul beranda. */
export const TAGLINE = 'Perpustakaan ebook interaktif catatan kuliah Sosiologi'

/**
 * Kode sandi halaman admin ("Ruang Redaksi", alamat #/admin).
 *
 * PENTING — BACA INI:
 * Ini HANYA pengunci ringan di sisi klien (browser), BUKAN keamanan sungguhan.
 * Nilainya ikut terkirim ke browser setiap pengunjung (siapa pun yang membuka
 * kode sumber / DevTools bisa membacanya). Gunanya sekadar mencegah orang iseng
 * tidak sengaja masuk. Jangan dipakai untuk melindungi data penting, dan jangan
 * pakai sandi yang sama dengan akun lain milikmu.
 *
 * Ebook yang ditambah lewat admin juga hanya tersimpan di browser tempat kamu
 * menulisnya (IndexedDB), jadi pengunjung lain memang tidak melihatnya.
 */
export const ADMIN_PASSCODE = 'GANTI_INI'

/** Placeholder penulis di contoh format ebook. */
export const PLACEHOLDER_PENULIS = '[NAMA PENULIS]'

/** Teks petunjuk di halaman admin (persis sesuai permintaan). */
export const PETUNJUK_ADMIN =
  'Ebook yang kamu tambah di sini tersimpan di browser ini saja. Untuk dipublikasikan ke semua pembaca, unduh .md lalu taruh di src/content/'

// ============================================================
//  AKUN & EBOOK BERBAYAR (opsional) — lihat README bagian "Akun & pembayaran"
// ============================================================

/**
 * Alamat proyek Supabase-mu, mis. "https://abcdefgh.supabase.co".
 * Kosongkan untuk MEMATIKAN fitur akun & pembayaran (web berjalan seperti biasa).
 */
export const SUPABASE_URL = ''

/**
 * Kunci "anon / publishable" Supabase. Kunci ini MEMANG publik (aman ada di kode web),
 * karena keamanan data dijaga Row Level Security di database.
 * JANGAN PERNAH menaruh kunci "service_role" atau Server Key Midtrans di file ini atau di mana pun di repo.
 */
export const SUPABASE_ANON_KEY = ''

/**
 * true = tampilkan toko versi DEMO (akun & pembayaran palsu di browser, tanpa uang sungguhan).
 * Hanya untuk mencoba. Biarkan false di web yang dipublikasikan.
 * (Saat dijalankan di komputer lewat `npm run dev` / `npm run preview`, mode demo otomatis menyala.)
 */
export const TOKO_DEMO = false
