// Pembantu murni untuk admin toko: ubah isi .md menjadi baris katalog, dan periksa isian sebelum dikirim.

import { BATAS_BERKAS } from '../berkas'
import { parseEbook } from '../parser'
import { idEbookValid, type ItemKatalog } from './tipe'

export const HARGA_MIN = 1000
export const HARGA_MAKS = 100_000_000

/** Metadata katalog diambil dari frontmatter ebook, supaya sampul dan isi selalu sepaham. */
export function itemDariRaw(raw: string, o: { id: string; harga: number; terbit: boolean; urutan?: number }): Omit<ItemKatalog, 'urutan'> & { urutan?: number } {
  const m = parseEbook(raw).meta
  const item: Omit<ItemKatalog, 'urutan'> & { urutan?: number } = {
    id: o.id,
    judul: m.judul,
    subjudul: m.subjudul,
    penulis: m.penulis,
    tema: m.tema,
    ikon: m.ikon,
    tag: m.tag,
    deskripsi: m.deskripsi,
    harga: o.harga,
    terbit: o.terbit,
  }
  if (o.urutan !== undefined) item.urutan = o.urutan
  return item
}

/** Mengembalikan daftar pesan galat (kosong = boleh disimpan). */
export function periksaIsian(o: { id: string; hargaTeks: string; raw: string; idTerpakai: string[]; baru: boolean }): string[] {
  const g: string[] = []
  if (!idEbookValid(o.id)) g.push('ID hanya boleh huruf kecil, angka, dan tanda hubung (maks. 60 karakter, tidak boleh diawali tanda hubung).')
  else if (o.baru && o.idTerpakai.includes(o.id)) g.push('ID ini sudah dipakai ebook lain di web ini. Pilih ID berbeda.')
  const harga = Number(o.hargaTeks.replace(/[.\s]/g, ''))
  if (!o.hargaTeks.trim() || !Number.isInteger(harga)) g.push('Harga harus berupa angka rupiah tanpa koma, mis. 25000.')
  else if (harga < HARGA_MIN) g.push('Harga minimal Rp 1.000.')
  else if (harga > HARGA_MAKS) g.push('Harga terlalu besar (maksimal Rp 100.000.000).')
  if (!o.raw.trim()) g.push('Isi ebook masih kosong.')
  else {
    if (new Blob([o.raw]).size > BATAS_BERKAS) g.push('Isi ebook terlalu besar (maksimal 2 MB).')
    if (parseEbook(o.raw).bab.length === 0) g.push('Ebook belum punya bab. Awali setiap bab dengan "# Judul bab".')
  }
  return g
}

export const hargaDariTeks = (t: string) => Number(t.replace(/[.\s]/g, ''))
