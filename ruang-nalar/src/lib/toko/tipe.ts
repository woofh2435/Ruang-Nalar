// Tipe bersama untuk fitur akun & ebook berbayar ("toko").

import type { TemaId } from '../types'

export interface Sesi {
  id: string
  email: string
  /** ditentukan server (tabel admin_users); hanya dipakai untuk menampilkan menu admin */
  admin: boolean
}

/** Metadata publik satu ebook berbayar (tanpa isi). */
export interface ItemKatalog {
  id: string
  judul: string
  subjudul: string
  penulis: string
  tema: TemaId
  ikon: string
  tag: string[]
  deskripsi: string
  /** rupiah */
  harga: number
  terbit: boolean
  urutan: number
}

export type StatusPembelian = 'pending' | 'lunas' | 'gagal'

export interface Pembelian {
  id: string
  ebookId: string
  orderId: string
  status: StatusPembelian
  jumlah: number
  dibuat: string
  dibayar: string | null
}

/** Hasil memulai pembayaran: alihkan ke halaman bayar, atau (mode demo) langsung selesai. */
export type HasilBayar = { jenis: 'alihkan'; url: string } | { jenis: 'selesai' }

export type KodeGalat =
  | 'belum_login'
  | 'kredensial_salah'
  | 'email_terdaftar'
  | 'sandi_lemah'
  | 'email_tidak_valid'
  | 'email_belum_konfirmasi'
  | 'terlalu_sering'
  | 'jaringan'
  | 'sudah_dibeli'
  | 'tidak_ditemukan'
  | 'bukan_admin'
  | 'server_belum_diatur'
  | 'ditolak'
  | 'sandi_sama'
  | 'tautan_kedaluwarsa'
  | 'admin_tidak_bisa'
  | 'lainnya'

export class GalatToko extends Error {
  kode: KodeGalat
  constructor(kode: KodeGalat, pesan: string) {
    super(pesan)
    this.name = 'GalatToko'
    this.kode = kode
  }
}

/** Tautan dari email Supabase (pemulihan sandi, konfirmasi akun) yang sudah dibaca dari alamat web. */
export type JenisTautan = 'pemulihan' | 'konfirmasi' | 'lainnya'
export interface TautanAuth {
  jenis: JenisTautan
  accessToken: string
  refreshToken: string
}
/** Hasil meminta atur ulang sandi. Hanya mode demo yang mengisi `tautanDemo` (pengganti email sungguhan). */
export interface HasilReset {
  tautanDemo?: TautanAuth
}

/** Jenis persetujuan yang dicatat (UU PDP): wajib untuk akun, serta dua yang opsional. */
export type JenisPersetujuan = 'syarat_privasi' | 'promo' | 'analitik'

/** Pilihan pengguna yang dikirim saat mendaftar. `versi` = versi kebijakan yang ia baca dan setujui. */
export interface PersetujuanDaftar {
  versi: string
  promo: boolean
  analitik: boolean
}

/** Satu baris log persetujuan (hanya bertambah; menarik persetujuan = baris baru berstatus false). */
export interface CatatanPersetujuan {
  id: string
  jenis: JenisPersetujuan
  status: boolean
  versi: string
  dibuat: string
}

export interface MasukanEbookToko {
  item: Omit<ItemKatalog, 'urutan'> & { urutan?: number }
  raw: string
}

export interface Backend {
  readonly mode: 'demo' | 'nyata'
  sesiSaatIni(): Promise<Sesi | null>
  /** mengembalikan fungsi berhenti-mendengar */
  onSesi(cb: (s: Sesi | null) => void): () => void
  /** `persetujuan` dikirim bersama pendaftaran dan dicatat server (log persetujuan). */
  daftar(email: string, sandi: string, persetujuan?: PersetujuanDaftar): Promise<{ perluKonfirmasi: boolean }>
  masuk(email: string, sandi: string): Promise<void>
  keluar(): Promise<void>
  /** Kirim email atur ulang sandi. Hasilnya sama untuk email terdaftar maupun tidak (mencegah orang menebak email pengguna). */
  kirimResetSandi(email: string): Promise<HasilReset>
  /** Tukar token dari tautan email menjadi sesi masuk. */
  pulihkanDariTautan(t: TautanAuth): Promise<void>
  /** Ganti sandi akun yang sedang masuk. */
  ubahSandi(sandiBaru: string): Promise<void>
  /** Log persetujuan milik akun yang sedang masuk (terbaru dulu). */
  riwayatPersetujuan(): Promise<CatatanPersetujuan[]>
  /** Tambah satu baris log persetujuan (mis. menarik persetujuan promo). */
  catatPersetujuan(jenis: JenisPersetujuan, status: boolean, versi: string): Promise<void>
  /** Hapus akun yang sedang masuk beserta datanya di server. */
  hapusAkun(): Promise<void>
  katalog(): Promise<ItemKatalog[]>
  pembelianSaya(): Promise<Pembelian[]>
  /** isi mentah (.md); null bila belum berhak */
  bacaIsi(ebookId: string): Promise<string | null>
  mulaiBayar(ebookId: string): Promise<HasilBayar>
  // ---- admin (di Supabase dipaksa oleh RLS: hanya admin_users) ----
  adminDaftar(): Promise<ItemKatalog[]>
  adminBacaIsi(ebookId: string): Promise<string | null>
  adminSimpan(m: MasukanEbookToko): Promise<void>
  adminAtur(id: string, p: { harga?: number; terbit?: boolean }): Promise<void>
  adminHapus(id: string): Promise<void>
}

/** Format rupiah Indonesia: 25000 → "Rp 25.000". */
export function rupiah(n: number): string {
  return 'Rp ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export const SANDI_MIN = 8
const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const emailValid = (e: string) => e.length <= 254 && POLA_EMAIL.test(e)
export const idEbookValid = (id: string) => /^[a-z0-9][a-z0-9-]{0,59}$/.test(id)

/**
 * Tujuan "lanjut" setelah masuk. Hanya jalur di dalam web ini yang diterima
 * (mencegah pengalihan ke situs lain lewat tautan buatan orang).
 */
export function amanLanjut(p: string | null | undefined, cadangan = '/akun'): string {
  if (!p || p.length > 200) return cadangan
  if (!/^\/[A-Za-z0-9/_\-.?=&%]*$/.test(p)) return cadangan
  if (p.startsWith('//') || p.includes('..')) return cadangan
  return p
}
