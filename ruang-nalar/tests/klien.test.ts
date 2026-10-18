import { describe, expect, it } from 'vitest'
import { CATATAN_TEKNIS, LABEL_STATUS, barisFitur, statistikKonten } from '../src/lib/klien'
import { DAFTAR_MUSIK } from '../src/lib/musik'
import { parseEbook } from '../src/lib/parser'
import type { Ebook } from '../src/lib/types'

const buat = (id: string, md: string, kunci = false): Ebook => ({ id, sumber: 'publik', raw: md, parsed: parseEbook(md), ...(kunci ? { terkunci: true } : {}) })

const E1 = buat(
  'satu',
  `---
judul: Satu
tema: malam
tag: [Teori, teori, kota]
status: terbit
---
# Bab 1

Isi.

:::kuis
Q: A?
- [x] ya
- tidak
Penjelasan: ok.
:::

:::kartu
Depan: D
Belakang: B
:::

:::refleksi
Pikirkan.
:::

# Bab 2

Isi.
`,
)
const E2 = buat('dua', `---\njudul: Dua\ntema: siang\ntag: [kota]\nstatus: terbit\n---\n# Bab 1\n\nIsi.\n`)
const KUNCI = buat('kunci', `---\njudul: Terkunci\ntema: iris\nstatus: terbit\n---\n`, true)

describe('statistik konten untuk halaman klien', () => {
  it('menghitung ebook, bab, kuis, kartu, refleksi, tema, dan topik unik', () => {
    expect(statistikKonten([E1, E2])).toEqual({ ebook: 2, bab: 3, kuis: 1, kartu: 1, refleksi: 1, tema: 2, topik: 2 })
  })
  it('ebook berbayar yang masih terkunci tidak dihitung', () => {
    expect(statistikKonten([E1, KUNCI])).toEqual(statistikKonten([E1]))
  })
  it('pustaka kosong → semua nol', () => {
    expect(Object.values(statistikKonten([])).every((n) => n === 0)).toBe(true)
  })
})

describe('tabel status fitur', () => {
  const namaFitur = (m: Parameters<typeof barisFitur>[0], nama: string) => barisFitur(m).find((b) => b.nama === nama)!

  it('semua status punya label dan keterangan terisi', () => {
    for (const mode of ['mati', 'demo', 'nyata'] as const) {
      for (const b of barisFitur(mode)) {
        expect(Object.keys(LABEL_STATUS)).toContain(b.status)
        expect(b.ket.length).toBeGreaterThan(15)
      }
    }
  })
  it('akun dan pembayaran mengikuti mode toko', () => {
    expect(namaFitur('mati', 'Akun pembaca').status).toBe('nonaktif')
    expect(namaFitur('mati', 'Pembayaran ebook').status).toBe('nonaktif')
    expect(namaFitur('demo', 'Akun pembaca').status).toBe('demo')
    expect(namaFitur('demo', 'Pembayaran ebook').ket).toMatch(/tidak ada uang sungguhan/)
    expect(namaFitur('nyata', 'Akun pembaca').status).toBe('tersedia')
    expect(namaFitur('nyata', 'Pembayaran ebook').status).toBe('tersedia')
  })
  it('keterbatasan yang diketahui ditulis jujur sebagai "Belum ada"', () => {
    const belum = barisFitur('nyata').filter((b) => b.status === 'belum-ada').map((b) => b.nama)
    expect(belum).toEqual(expect.arrayContaining(['Sinkron bacaan antar perangkat', 'Pengembalian dana', 'Perlindungan salin (DRM)']))
  })
  it('baris musik menyebut semua lagu yang benar-benar ada', () => {
    const m = namaFitur('mati', 'Musik latar')
    for (const l of DAFTAR_MUSIK) expect(m.ket).toContain(l.nama)
    expect(m.ket).toContain(`${DAFTAR_MUSIK.length} pilihan`)
  })
  it('nama fitur unik', () => {
    const n = barisFitur('nyata').map((b) => b.nama)
    expect(new Set(n).size).toBe(n.length)
  })
})

describe('catatan teknis', () => {
  it('terisi dan tidak menyebut nilai rahasia', () => {
    expect(CATATAN_TEKNIS.length).toBeGreaterThanOrEqual(5)
    for (const c of CATATAN_TEKNIS) {
      expect(c.isi.length).toBeGreaterThan(20)
      expect(c.isi).not.toMatch(/sb_secret|eyJ|SERVER_KEY=|Mid-server/)
    }
  })
})
