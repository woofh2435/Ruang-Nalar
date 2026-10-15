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
  | 'lainnya'

export class GalatToko extends Error {
  kode: KodeGalat
  constructor(kode: KodeGalat, pesan: string) {
    super(pesan)
    this.name = 'GalatToko'
    this.kode = kode
  }
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
  daftar(email: string, sandi: string): Promise<{ perluKonfirmasi: boolean }>
  masuk(email: string, sandi: string): Promise<void>
  keluar(): Promise<void>
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
