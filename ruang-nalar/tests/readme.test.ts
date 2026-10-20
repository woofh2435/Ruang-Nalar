import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseEbook } from '../src/lib/parser'

// Contoh format ebook di README harus selalu lolos parser tanpa peringatan,
// supaya pengguna yang menyalinnya tidak langsung kena galat.
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8')
const m = readme.match(/````markdown\n([\s\S]*?)\n````/)

describe('contoh format ebook di README', () => {
  it('ada di README', () => expect(m).toBeTruthy())
  const p = parseEbook(m![1])
  it('tanpa peringatan', () => expect(p.peringatan.map((w) => w.pesan)).toEqual([]))
  it('metadata terbaca', () => {
    expect(p.meta.judul).toBe('Judul Ebook')
    expect(p.meta.tema).toBe('malam')
    expect(p.meta.status).toBe('terbit')
    expect(p.meta.tag).toEqual(['pengantar', 'teori'])
  })
  it('2 bab, 1 kuis, semua jenis blok terbaca', () => {
    expect(p.bab.length).toBe(2)
    expect(p.jumlahKuis).toBe(1)
    const jenis = new Set(p.bab.flatMap((b) => b.blok.map((k) => k.tipe)))
    for (const j of ['catatan', 'tokoh', 'kartu', 'kuis', 'refleksi']) expect(jenis.has(j as never), j).toBe(true)
  })
})

// Contoh blok interaktif (misi, karier, peta-karier, papan) juga harus lolos parser tanpa peringatan.
const semua = [...readme.matchAll(/````markdown\n([\s\S]*?)\n````/g)].map((x) => x[1])

describe('contoh blok interaktif di README', () => {
  it('ada blok contoh kedua', () => expect(semua.length).toBeGreaterThanOrEqual(2))
  const p = parseEbook(semua[1] ?? '')
  it('tanpa peringatan', () => expect(p.peringatan.map((w) => w.pesan)).toEqual([]))
  it('keempat blok terbaca, dan baris peta memakai kolom bab yang benar', () => {
    const blok = p.bab.flatMap((b) => b.blok)
    for (const j of ['misi', 'karier', 'peta', 'papan']) expect(blok.some((k) => k.tipe === j), j).toBe(true)
    const peta = blok.find((k) => k.tipe === 'peta')
    expect(peta && peta.tipe === 'peta' ? peta.jalur.map((j) => j.bab) : null).toEqual([[1, 2], []])
  })
})
