// Unduh, baca file, ekspor/impor cadangan JSON.

import type { CatatanEbookLokal } from './types'

export function slugify(s: string): string {
  return (
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'ebook'
  )
}

export function unduhTeks(namaBerkas: string, isi: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([isi], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = namaBerkas
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function bacaBerkas(file: File): Promise<string> {
  return new Promise((ok, gagal) => {
    const r = new FileReader()
    r.onload = () => ok(String(r.result ?? ''))
    r.onerror = () => gagal(r.error ?? new Error('Gagal membaca file'))
    r.readAsText(file, 'utf-8')
  })
}

export const BATAS_BERKAS = 2 * 1024 * 1024 // 2 MB per ebook

/** Hanya berkas teks yang diterima sebagai isi ebook. */
export const namaBerkasTeksValid = (nama: string): boolean => /\.(md|markdown|txt)$/i.test(nama)

// tanda awal berkas yang BUKAN teks (zip/docx/xlsx, pdf, program, gambar). Dicek pada isi, bukan hanya pada nama berkas.
const TANDA_BUKAN_TEKS: [string, string][] = [
  ['PK\u0003\u0004', 'ZIP/Word/Excel'],
  ['%PDF', 'PDF'],
  ['MZ', 'program'],
  ['\u007fELF', 'program'],
  ['\u0089PNG', 'gambar'],
  ['GIF8', 'gambar'],
  ['\u00ff\u00d8\u00ff', 'gambar'],
]

/**
 * Periksa isi berkas yang diunggah sebagai ebook. Mengembalikan pesan galat, atau null bila isinya wajar sebagai teks.
 * Ini pemeriksaan di browser untuk mencegah salah pilih berkas (dan berkas biner yang menyamar sebagai .md);
 * keamanan sebenarnya: isi ebook tidak pernah dirender sebagai HTML, jadi tidak ada skrip yang bisa ikut jalan.
 */
export function periksaIsiTeks(teks: string): string | null {
  const awal = teks.replace(/^\uFEFF/, '').slice(0, 8)
  for (const [tanda, jenis] of TANDA_BUKAN_TEKS) {
    if (awal.startsWith(tanda)) return `Isi file ini berupa ${jenis}, bukan teks. Pilih file .md atau .txt yang asli.`
  }
  if (teks.includes('\u0000')) return 'File ini mengandung data biner, bukan teks biasa. Pilih file .md atau .txt yang asli.'
  const contoh = teks.slice(0, 20000)
  let aneh = 0
  for (let i = 0; i < contoh.length; i++) {
    const c = contoh.charCodeAt(i)
    // karakter kontrol selain tab, baris baru, dan carriage return; juga karakter pengganti (U+FFFD) hasil salah baca encoding
    if ((c < 32 && c !== 9 && c !== 10 && c !== 13) || c === 0xfffd) aneh++
  }
  if (contoh.length > 0 && aneh / contoh.length > 0.02) return 'Isi file ini tidak terbaca sebagai teks UTF-8. Simpan ulang sebagai teks UTF-8 lalu coba lagi.'
  return null
}

export function bangunCadangan(ebook: CatatanEbookLokal[]): string {
  return JSON.stringify(
    {
      aplikasi: 'ruang-nalar',
      versi: 1,
      diekspor: new Date().toISOString(),
      ebook: ebook.map((e) => ({ id: e.id, raw: e.raw, dibuat: e.dibuat, diperbarui: e.diperbarui })),
    },
    null,
    2,
  )
}

export interface HasilImpor {
  diterima: CatatanEbookLokal[]
  dilewati: { nomor: number; alasan: string }[]
  galat?: string
}

/** Baca file cadangan JSON. Tidak pernah melempar error. */
export function bacaCadangan(teks: string, idBaru: () => string): HasilImpor {
  const hasil: HasilImpor = { diterima: [], dilewati: [] }
  let data: unknown
  try {
    data = JSON.parse(teks)
  } catch {
    hasil.galat = 'File ini bukan JSON yang valid. Pilih file cadangan yang diunduh dari Ruang Redaksi.'
    return hasil
  }
  const daftar: unknown = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { ebook?: unknown }).ebook)
      ? (data as { ebook: unknown[] }).ebook
      : null
  if (!daftar) {
    hasil.galat = 'Format cadangan tidak dikenali: tidak menemukan daftar "ebook" di dalam file.'
    return hasil
  }
  const arr = daftar as unknown[]
  if (arr.length > 500) {
    hasil.galat = 'Terlalu banyak ebook dalam satu file (maksimal 500).'
    return hasil
  }
  const dipakai = new Set<string>()
  arr.forEach((item, i) => {
    const nomor = i + 1
    if (!item || typeof item !== 'object') {
      hasil.dilewati.push({ nomor, alasan: 'bukan objek ebook' })
      return
    }
    const o = item as Record<string, unknown>
    if (typeof o.raw !== 'string' || !o.raw.trim()) {
      hasil.dilewati.push({ nomor, alasan: 'isi ebook ("raw") kosong atau bukan teks' })
      return
    }
    if (o.raw.length > BATAS_BERKAS) {
      hasil.dilewati.push({ nomor, alasan: 'ukuran ebook melebihi 2 MB' })
      return
    }
    let id = typeof o.id === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(o.id) ? o.id : idBaru()
    if (dipakai.has(id)) id = idBaru()
    dipakai.add(id)
    const sekarang = Date.now()
    hasil.diterima.push({
      id,
      raw: o.raw,
      dibuat: typeof o.dibuat === 'number' && isFinite(o.dibuat) ? o.dibuat : sekarang,
      diperbarui: typeof o.diperbarui === 'number' && isFinite(o.diperbarui) ? o.diperbarui : sekarang,
    })
  })
  if (!hasil.diterima.length && !hasil.dilewati.length) hasil.galat = 'File cadangan tidak berisi ebook.'
  return hasil
}
