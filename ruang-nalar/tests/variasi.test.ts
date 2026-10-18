import { describe, expect, it } from 'vitest'
import { GAYA_BAB, GAYA_INISIAL, gayaBab } from '../src/lib/gayaBab'
import { KOMPOSISI, rancangSampul } from '../src/lib/sampul'

describe('rancangan sampul', () => {
  it('deterministik: judul + id yang sama selalu menghasilkan rancangan yang sama', () => {
    expect(rancangSampul('Apa Itu Sosiologi?', 'apa-itu')).toEqual(rancangSampul('Apa Itu Sosiologi?', 'apa-itu'))
  })
  it('semua nilai berada dalam rentang yang aman untuk tampilan', () => {
    for (let i = 0; i < 500; i++) {
      const r = rancangSampul('Judul ' + i, 'id-' + i)
      expect(KOMPOSISI).toContain(r.komposisi)
      expect(r.skala).toBeGreaterThanOrEqual(1)
      expect(r.skala).toBeLessThanOrEqual(1.18)
      expect(Math.abs(r.geserX)).toBeLessThanOrEqual(4)
      expect(Math.abs(r.geserY)).toBeLessThanOrEqual(3)
      expect(typeof r.cermin).toBe('boolean')
    }
  })
  it('kelima komposisi benar-benar terpakai dan sebarannya tidak timpang', () => {
    const hitung = new Map<string, number>()
    for (let i = 0; i < 1000; i++) {
      const k = rancangSampul('Buku nomor ' + i, 'buku-' + i).komposisi
      hitung.set(k, (hitung.get(k) ?? 0) + 1)
    }
    expect(hitung.size).toBe(KOMPOSISI.length)
    for (const n of hitung.values()) {
      expect(n).toBeGreaterThan(130)
      expect(n).toBeLessThan(270)
    }
  })
  it('cermin sekitar separuh, dan judul berbeda umumnya menghasilkan rancangan berbeda', () => {
    let cermin = 0
    const unik = new Set<string>()
    for (let i = 0; i < 400; i++) {
      const r = rancangSampul('J' + i, 'x' + i)
      if (r.cermin) cermin++
      unik.add(JSON.stringify(r))
    }
    expect(cermin).toBeGreaterThan(140)
    expect(cermin).toBeLessThan(260)
    expect(unik.size).toBeGreaterThan(390)
  })
})

describe('gaya kepala bab', () => {
  it('deterministik untuk ebook dan bab yang sama', () => {
    expect(gayaBab('ebook-a', 3)).toBe(gayaBab('ebook-a', 3))
  })
  it('dua bab berurutan tidak pernah memakai gaya yang sama, untuk ebook mana pun', () => {
    for (let e = 0; e < 200; e++) {
      for (let b = 0; b < 30; b++) expect(gayaBab('eb' + e, b), `eb${e} bab ${b}`).not.toBe(gayaBab('eb' + e, b + 1))
    }
  })
  it('lima bab berturut-turut memakai kelima gaya tepat sekali', () => {
    for (let e = 0; e < 100; e++) {
      const g = [0, 1, 2, 3, 4].map((b) => gayaBab('buku-' + e, b))
      expect(new Set(g).size).toBe(GAYA_BAB.length)
    }
  })
  it('ebook berbeda tidak semuanya mulai dari gaya yang sama', () => {
    const awal = new Set(Array.from({ length: 60 }, (_, e) => gayaBab('judul-' + e, 0)))
    expect(awal.size).toBeGreaterThanOrEqual(4)
  })
  it('indeks aneh tidak merusak: negatif dan pecahan dibulatkan', () => {
    expect(GAYA_BAB).toContain(gayaBab('x', -5))
    expect(gayaBab('x', 2.9)).toBe(gayaBab('x', 2))
  })
  it('gaya berhuruf awal besar adalah bagian dari daftar gaya', () => {
    for (const g of GAYA_INISIAL) expect(GAYA_BAB).toContain(g)
    expect(GAYA_INISIAL.size).toBeGreaterThan(0)
    expect(GAYA_INISIAL.size).toBeLessThan(GAYA_BAB.length)
  })
})
