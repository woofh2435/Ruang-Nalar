import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DAFTAR_TEMA } from '../src/lib/tema'

// Memeriksa kontras teks WCAG AA (4.5:1 untuk teks biasa) untuk pasangan warna yang dipakai aplikasi.
// Warna dibaca langsung dari src/index.css supaya tes ikut berubah kalau token diubah.

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')

function cahaya(hex: string): number {
  const h = hex.replace('#', '')
  const n = h.length === 3 ? h.split('').map((c) => c + c) : h.match(/../g)!
  const [r, g, b] = n.map((x) => {
    const v = parseInt(x, 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export function kontras(a: string, b: string): number {
  const [x, y] = [cahaya(a), cahaya(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

function blok(selektor: string): string {
  const i = css.indexOf(selektor + ' {')
  if (i < 0) throw new Error('Selektor tidak ditemukan di index.css: ' + selektor)
  return css.slice(i, css.indexOf('}', i))
}
const token: Record<string, string> = {}
for (const m of blok(':root').matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{3,6})\s*;/g)) token[m[1]] = m[2]
function nilai(blokTeks: string, nama: string): string {
  const m = blokTeks.match(new RegExp(`--${nama}:\\s*([^;]+);`))
  if (!m) throw new Error(`Variabel --${nama} tidak ditemukan`)
  const v = m[1].trim()
  const rujuk = v.match(/^var\(--([\w-]+)\)$/)
  if (rujuk) return token[rujuk[1]]
  return v
}

const AA = 4.5
const cek = (nama: string, fg: string, bg: string) => it(`${nama}: ${fg} di atas ${bg}`, () => expect(kontras(fg, bg), `${nama} ${fg}/${bg}`).toBeGreaterThanOrEqual(AA))

describe('kontras WCAG AA', () => {
  it('fungsi kontras benar (hitam/putih = 21)', () => expect(kontras('#000000', '#ffffff')).toBeCloseTo(21, 0))

  describe('5 preset tema ebook (sampul + pita bab)', () => {
    for (const t of DAFTAR_TEMA) {
      cek(`${t.id} teks/dasar`, t.teks, t.dasar)
      cek(`${t.id} teks/dasar2`, t.teks, t.dasar2)
    }
  })

  describe('tema global', () => {
    const malam = blok("html[data-theme='malam']")
    const ladang = blok("html[data-theme='ladang']")
    cek('malam teks/latar', nilai(malam, 'teks'), '#121c52')
    cek('malam teks/latar tengah', nilai(malam, 'teks'), '#1c2b6b')
    cek('malam teks/latar bawah', nilai(malam, 'teks'), '#24399a')
    cek('malam teks-redup/latar bawah', nilai(malam, 'teks-redup'), '#24399a')
    cek('malam aksen/latar bawah', nilai(malam, 'aksen'), '#24399a')
    for (const stop of ['#f9df78', '#f6d24b', '#f0b247', '#e8892b']) {
      cek(`ladang teks/${stop}`, nilai(ladang, 'teks'), stop)
      cek(`ladang teks-redup/${stop}`, nilai(ladang, 'teks-redup'), stop)
      cek(`ladang aksen/${stop}`, nilai(ladang, 'aksen'), stop)
    }
  })

  describe('panel kolase', () => {
    for (const w of ['kertas', 'biru', 'malam', 'kuning', 'jingga', 'ungu']) {
      const b = blok('.panel-' + w)
      cek(`panel-${w}`, nilai(b, 'p-fg'), nilai(b, 'p-bg'))
    }
  })

  describe('teks di atas kertas', () => {
    cek('tinta/kertas', token['tinta'], token['kertas'])
    cek('tinta-redup/kertas', token['tinta-redup'], token['kertas'])
    cek('tautan/kertas', token['tautan'], token['kertas'])
    cek('tinta/kolom input', token['tinta'], '#fffaf0')
    cek('tinta-redup/kolom input', token['tinta-redup'], '#fffaf0')
  })

  describe('sorotan teks (3 warna)', () => {
    for (const s of ['sorot-1', 'sorot-2', 'sorot-3']) cek(s, token['tinta'], token[s])
  })

  describe('lencana & tombol', () => {
    cek('"Selesai Dibaca"', token['tinta'], token['kuning-pusaran'])
    cek('"Kuis Sempurna"', token['kuning-pusaran'], token['tinta'])
    cek('tombol utama', token['tinta'], token['kuning-pusaran'])
    cek('tanda "Contoh"/"Draf" di sampul', token['tinta'], token['kertas'])
  })

  describe('pesan & chip di Ruang Redaksi', () => {
    cek('pesan galat', '#5a1306', '#fbd9c8')
    cek('pesan info', '#14275f', '#dbe7fb')
    cek('pesan sukses', '#1f4a12', '#e5f4d9')
    cek('chip Terbit', '#1f4a12', '#dff0d2')
    cek('chip Draf', '#5c3600', '#fde7b0')
    cek('chip peringatan/kertas', '#7a1608', token['kertas'])
    cek('chip penyimpanan/kertas', '#3b2f78', token['kertas'])
    cek('catatan petunjuk', token['tinta'], '#fff3d6')
    cek('judul kecil tulisan tangan/kertas', '#8a3d00', token['kertas'])
  })

  describe('gelembung bicara Nalar', () => {
    cek('tinta/gelembung', token['tinta'], '#fffaf0')
  })
})
