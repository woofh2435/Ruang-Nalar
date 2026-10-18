// Bahan untuk halaman "Tampilan Klien" (/klien): ringkasan formal untuk peninjau.
// Angka dihitung dari isi web yang sedang berjalan, dan baris fitur disusun dari keadaan nyata (mode toko, daftar musik),
// jadi tidak ada klaim yang terlepas dari kenyataan. Fungsi murni supaya bisa diuji (tests/klien.test.ts).

import { DAFTAR_MUSIK, JENIS_MUSIK } from './musik'
import { normal } from './cari'
import type { ModeToko } from './toko/mode'
import type { Ebook } from './types'

export interface StatistikKonten {
  ebook: number
  bab: number
  kuis: number
  kartu: number
  refleksi: number
  tema: number
  topik: number
}

/** Hitung isi pustaka. Ebook berbayar yang belum terbuka (tanpa bab) tidak ikut dihitung. */
export function statistikKonten(ebooks: readonly Ebook[]): StatistikKonten {
  const s: StatistikKonten = { ebook: 0, bab: 0, kuis: 0, kartu: 0, refleksi: 0, tema: 0, topik: 0 }
  const tema = new Set<string>()
  const topik = new Set<string>()
  for (const e of ebooks) {
    if (e.terkunci || e.parsed.bab.length === 0) continue
    s.ebook++
    s.bab += e.parsed.bab.length
    s.kuis += e.parsed.jumlahKuis
    for (const b of e.parsed.bab) {
      for (const k of b.blok) {
        if (k.tipe === 'kartu') s.kartu++
        else if (k.tipe === 'refleksi') s.refleksi++
      }
    }
    tema.add(e.parsed.meta.tema)
    for (const t of e.parsed.meta.tag) {
      const n = normal(t)
      if (n) topik.add(n)
    }
  }
  s.tema = tema.size
  s.topik = topik.size
  return s
}

export type StatusFitur = 'tersedia' | 'demo' | 'nonaktif' | 'belum-ada'

export const LABEL_STATUS: Record<StatusFitur, string> = {
  tersedia: 'Tersedia',
  demo: 'Mode demo',
  nonaktif: 'Nonaktif di web ini',
  'belum-ada': 'Belum ada',
}

export interface BarisFitur {
  nama: string
  status: StatusFitur
  ket: string
}

const daftarMusik = () => DAFTAR_MUSIK.map((l) => `${l.nama} (${JENIS_MUSIK[l.jenis].toLowerCase()})`).join(', ')

/** Tabel status fitur. Yang bergantung pada pengaturan pemilik (akun, pembayaran) mengikuti mode toko yang sedang berjalan. */
export function barisFitur(mode: ModeToko): BarisFitur[] {
  const turutMode = (nyata: string, demo: string): { status: StatusFitur; ket: string } =>
    mode === 'nyata' ? { status: 'tersedia', ket: nyata } : mode === 'demo' ? { status: 'demo', ket: demo } : { status: 'nonaktif', ket: 'Belum dinyalakan oleh pemilik web.' }

  return [
    {
      nama: 'Ebook interaktif',
      status: 'tersedia',
      ket: 'Sorot tiga warna, catatan tempel, penanda, istilah yang bisa diketuk, kartu balik, kuis, dan refleksi di tiap bab.',
    },
    {
      nama: 'Percobaan tanpa akun',
      status: 'tersedia',
      ket: 'Satu ebook percobaan dapat dibaca langsung dari beranda tanpa mendaftar.',
    },
    {
      nama: 'Akun pembaca',
      ...turutMode('Daftar, masuk, konfirmasi email, lupa kata sandi, dan ganti kata sandi.', 'Alurnya berjalan dengan data palsu di browser; tidak ada akun sungguhan.'),
    },
    {
      nama: 'Pembayaran ebook',
      ...turutMode(
        'QRIS, GoPay, dan ShopeePay lewat Midtrans. Ebook terbuka setelah server menerima konfirmasi lunas. Transaksi uji coba atau sungguhan bergantung pada kunci Midtrans yang dipasang pemilik.',
        'Pembayaran disimulasikan di browser; tidak ada uang sungguhan.',
      ),
    },
    {
      nama: 'Dasbor member',
      status: 'tersedia',
      ket: 'Ringkasan bacaan, rak pribadi, pencarian dengan saringan, favorit dan penanda, riwayat baca, serta pengaturan akun dan suara.',
    },
    {
      nama: 'Musik latar',
      status: 'tersedia',
      ket: `${DAFTAR_MUSIK.length} pilihan: ${daftarMusik()}. Disintesis di browser; bawaannya hening.`,
    },
    {
      nama: 'Aksesibilitas',
      status: 'tersedia',
      ket: 'Dapat dioperasikan dengan keyboard, tombol berlabel untuk pembaca layar, menghormati pengaturan kurangi gerakan, dan diperiksa dengan alat otomatis axe-core.',
    },
    {
      nama: 'Sinkron bacaan antar perangkat',
      status: 'belum-ada',
      ket: 'Sorotan, catatan, penanda, rak, dan riwayat tersimpan di browser perangkat yang dipakai dan tidak ikut pindah ke perangkat lain.',
    },
    {
      nama: 'Pengembalian dana',
      status: 'belum-ada',
      ket: 'Belum ada tombolnya di web. Pengembalian dana dilakukan manual lewat dasbor Midtrans oleh pemilik.',
    },
    {
      nama: 'Perlindungan salin (DRM)',
      status: 'belum-ada',
      ket: 'Isi ebook berbayar hanya dikirim ke pembeli yang sudah lunas, tetapi teks yang sudah terbuka dapat disalin oleh pembeli.',
    },
  ]
}

/** Susunan teknis yang ditampilkan di halaman klien. Dicocokkan dengan kode asli di repo. */
export const CATATAN_TEKNIS: { judul: string; isi: string }[] = [
  { judul: 'Aplikasi web', isi: 'React 18, TypeScript, Vite, Tailwind CSS, dan Framer Motion. Berupa situs statis yang dihosting di GitHub Pages.' },
  { judul: 'Akun dan data', isi: 'Supabase: autentikasi, database PostgreSQL dengan Row Level Security, dan Edge Functions untuk transaksi.' },
  { judul: 'Pembayaran', isi: 'Midtrans Snap. Status pembayaran hanya berubah lewat notifikasi server yang tanda tangannya (SHA-512) diverifikasi dengan Server Key.' },
  { judul: 'Isi ebook berbayar', isi: 'Disimpan di tabel terpisah dan hanya dapat dibaca akun yang sudah lunas atau admin (aturan database). Di browser, isinya hanya ada di memori dan dibuang saat keluar akun.' },
  { judul: 'Rahasia', isi: 'Kunci rahasia (service role dan Server Key Midtrans) hanya ada di pengaturan server. Kode web hanya memuat kunci publik Supabase.' },
  { judul: 'Data pembaca', isi: 'Sorotan, catatan, posisi baca, rak, dan favorit disimpan di IndexedDB perangkat pembaca, tidak dikirim ke server.' },
]
