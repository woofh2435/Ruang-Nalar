// Tipe data bersama untuk seluruh aplikasi Ruang Nalar.

export type TemaId = 'malam' | 'siang' | 'iris' | 'almond' | 'api'
/** Tema tampilan seluruh web (tombol di pojok). */
export type TemaGlobal = 'malam' | 'ladang'
export type CatatanTipe = 'penting' | 'tips' | 'awas'
export type StatusEbook = 'terbit' | 'draf'

// ---------- isi ebook (hasil parser) ----------

export interface InlineTeks {
  k: 'teks'
  s: string
  tebal: boolean
  miring: boolean
}
export interface InlineIstilah {
  k: 'istilah'
  s: string
  def: string
  tebal: boolean
  miring: boolean
}
export type Inline = InlineTeks | InlineIstilah

/** Satu paragraf: token inline + teks polos (dipakai untuk posisi sorotan). */
export interface Para {
  id: string
  inline: Inline[]
  teks: string
}

export interface OpsiKuis {
  para: Para
  benar: boolean
}

export type Blok =
  | { tipe: 'p'; id: string; para: Para }
  | { tipe: 'sub'; id: string; level: 2 | 3; para: Para }
  | { tipe: 'daftar'; id: string; item: Para[] }
  | { tipe: 'catatan'; id: string; jenis: CatatanTipe; paras: Para[] }
  | { tipe: 'tokoh'; id: string; nama: string; tahun: string; paras: Para[] }
  | { tipe: 'kartu'; id: string; depan: Para; belakang: Para }
  | {
      tipe: 'kuis'
      id: string
      tanya: Para
      opsi: OpsiKuis[]
      penjelasan: Para | null
    }
  | { tipe: 'refleksi'; id: string; paras: Para[] }

export interface Bab {
  id: string
  nomor: number
  judul: string
  /** nomor baris (1-based) heading bab di file sumber */
  baris: number
  blok: Blok[]
}

export interface Peringatan {
  /** nomor baris di teks sumber (1-based) */
  baris: number
  pesan: string
}

export interface EbookMeta {
  judul: string
  subjudul: string
  penulis: string
  tema: TemaId
  ikon: string
  tag: string[]
  status: StatusEbook
  deskripsi: string
}

export interface ParsedEbook {
  meta: EbookMeta
  bab: Bab[]
  peringatan: Peringatan[]
  jumlahKuis: number
}

// ---------- ebook di pustaka ----------

export type SumberEbook = 'publik' | 'lokal' | 'toko'

export interface Ebook {
  id: string
  sumber: SumberEbook
  raw: string
  parsed: ParsedEbook
  /** hanya untuk ebook lokal */
  diperbarui?: number
  /** hanya untuk ebook toko (berbayar): harga rupiah */
  harga?: number
  /** ebook toko yang isinya belum bisa dibaca (belum login / belum beli / belum termuat) */
  terkunci?: boolean
}

/** Bentuk yang disimpan di IndexedDB untuk ebook buatan admin. */
export interface CatatanEbookLokal {
  id: string
  raw: string
  dibuat: number
  diperbarui: number
}

// ---------- data pembaca (semua di IndexedDB) ----------

export type WarnaSorot = 1 | 2 | 3

export interface Sorotan {
  id: string
  /** id paragraf, mis. b0-3 atau b0-5.1 */
  para: string
  mulai: number
  akhir: number
  warna: WarnaSorot
}

export interface PosisiBaca {
  bab: number
  /** 0..1 posisi gulir di dalam bab */
  pct: number
  t: number
}

export interface JawabanKuis {
  pilih: number
  benar: boolean
  /** jawaban PERTAMA benar? dipakai untuk lencana "Kuis Sempurna" */
  pertamaBenar: boolean
}

export type MoodNalar =
  | 'senang'
  | 'mikir'
  | 'kaget'
  | 'ngantuk'
  | 'semangat'
  | 'sedih'
  | 'bangga'
  | 'kedip-nakal'
