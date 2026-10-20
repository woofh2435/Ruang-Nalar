import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { SampulGambar } from '../src/components/art/Sampul'
import { susunJudul } from '../src/components/art/SampulKolase'
import { KANJI } from '../src/lib/kanjiSampul'
import { KOMPOSISI, mintaKolase, rancangSampul, TAG_SAMPUL_KOLASE, tagTampil } from '../src/lib/sampul'
import type { EbookMeta } from '../src/lib/types'

const meta = (tag: string[], judul = 'Jalur Sosiologi'): EbookMeta => ({ judul, subjudul: 'Dari Maba sampai Karier', penulis: 'eko chan', tema: 'siang', ikon: '🧭', tag, status: 'terbit', deskripsi: '' })

describe('tag sampul-kolase', () => {
  it('tag meminta komposisi kolase; tanpa tag tetap acak dari KOMPOSISI', () => {
    expect(TAG_SAMPUL_KOLASE).toBe('sampul-kolase')
    expect(rancangSampul('Judul', 'id', ['x', ' Sampul-Kolase ']).komposisi).toBe('kolase')
    for (let i = 0; i < 60; i++) expect(KOMPOSISI).toContain(rancangSampul('J' + i, 'i' + i, ['sosiologi']).komposisi)
    expect(KOMPOSISI).not.toContain('kolase')
  })
  it('kolase tidak mengubah hasil acak untuk buku tanpa tag (pembagian komposisi lama tetap sama)', () => {
    for (let i = 0; i < 40; i++) {
      expect(rancangSampul('Buku ' + i, 'b' + i)).toEqual(rancangSampul('Buku ' + i, 'b' + i, []))
    }
  })
  it('mintaKolase menangani tag kosong dan undefined', () => {
    expect(mintaKolase(undefined)).toBe(false)
    expect(mintaKolase([])).toBe(false)
    expect(mintaKolase(['sampul'])).toBe(false)
  })
  it('tagTampil menyembunyikan semua tag berawalan sampul-', () => {
    expect(tagTampil(['sosiologi', 'sampul-kolase', 'Sampul-Lain', 'karier'])).toEqual(['sosiologi', 'karier'])
    expect(tagTampil([])).toEqual([])
  })
})

describe('susunJudul', () => {
  it('judul pendek dibagi dua baris besar', () => {
    const r = susunJudul('Jalur Sosiologi')
    expect(r.baris).toEqual(['JALUR', 'SOSIOLOGI'])
    expect(r.ukuran).toBeGreaterThan(30)
  })
  it('selalu 1-3 baris, kata utuh, ukuran dibatasi, dan tidak ada kata yang hilang (sampai 9 kata)', () => {
    const contoh = ['Sosiologi', 'Apa Itu Sosiologi dan Kenapa Penting?', 'A', 'Panduan Cerdas untuk Mahasiswa Baru yang Malas Baca Buku', 'Pneumonoultramicroscopicsilicovolcanoconiosis', '   ']
    for (const j of contoh) {
      const r = susunJudul(j)
      expect(r.baris.length).toBeGreaterThanOrEqual(1)
      expect(r.baris.length).toBeLessThanOrEqual(3)
      expect(r.ukuran).toBeGreaterThanOrEqual(13)
      expect(r.ukuran).toBeLessThanOrEqual(46)
      const kata = j.toUpperCase().split(/\s+/).filter(Boolean).slice(0, 9)
      expect(r.baris.join(' ').split(' ').filter(Boolean)).toEqual(kata)
    }
  })
  it('judul panjang memakai huruf lebih kecil daripada judul pendek', () => {
    expect(susunJudul('Apa Itu Sosiologi dan Kenapa Penting Bagi Kita').ukuran).toBeLessThan(susunJudul('Jalur Sosiologi').ukuran)
  })
})

describe('data kanji', () => {
  it('ada path untuk tiap huruf yang dipakai sampul', () => {
    for (const k of '進路社会未来') expect(KANJI[k], k).toMatch(/^M[\d. -]+/)
  })
})

describe('SampulGambar kolase', () => {
  it('menampilkan komposisi kolase dengan judul untuk pembaca layar, gambar dekoratif, dan tanpa tag teknis', () => {
    const html = renderToStaticMarkup(createElement(SampulGambar, { meta: meta(['sosiologi', 'sampul-kolase']), id: 'jalur-sosiologi' }))
    expect(html).toContain('data-komposisi="kolase"')
    expect(html).toContain('<h3 class="sr-only">Jalur Sosiologi</h3>')
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('JALUR')
    expect(html).toContain('SOSIOLOGI')
    expect(html).toContain('DARI MABA SAMPAI KARIER')
    expect(html).toContain('EKO CHAN')
    expect(html).not.toContain('sampul-kolase')
  })
  it('id SVG unik per sampul (tidak bentrok saat banyak sampul di satu halaman)', () => {
    const a = renderToStaticMarkup(createElement('div', null, createElement(SampulGambar, { meta: meta(['sampul-kolase']), id: 'a' }), createElement(SampulGambar, { meta: meta(['sampul-kolase']), id: 'b' })))
    const ids = [...a.matchAll(/ id="([^"]+)"/g)].map((m) => m[1])
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('buku tanpa tag tetap memakai komposisi lama', () => {
    const html = renderToStaticMarkup(createElement(SampulGambar, { meta: meta(['sosiologi']), id: 'x' }))
    expect(html).not.toContain('data-komposisi="kolase"')
  })
  it('teks sampul tidak menyisipkan HTML dari judul (di-escape)', () => {
    const html = renderToStaticMarkup(createElement(SampulGambar, { meta: meta(['sampul-kolase'], '<img src=x onerror=1> Judul'), id: 'x' }))
    expect(html).not.toContain('<img src=x')
  })
})
