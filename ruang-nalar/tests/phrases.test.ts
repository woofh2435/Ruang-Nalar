import { describe, expect, it } from 'vitest'
import { FRASA, SEMUA_FRASA, jumlahKata, pilihFrasa } from '../src/lib/phrases'

const MOOD = ['senang', 'mikir', 'kaget', 'ngantuk', 'semangat', 'sedih', 'bangga', 'kedip-nakal']

describe('frasa Nalar', () => {
  it('minimal 40 kalimat', () => expect(SEMUA_FRASA.length).toBeGreaterThanOrEqual(40))
  it('tiap kalimat maksimal 12 kata', () => {
    for (const f of SEMUA_FRASA) expect(jumlahKata(f.t), f.t).toBeLessThanOrEqual(12)
  })
  it('semua mood valid dan semua 8 mood terpakai', () => {
    const dipakai = new Set(SEMUA_FRASA.map((f) => f.mood))
    for (const m of dipakai) expect(MOOD).toContain(m)
    for (const m of MOOD) expect(dipakai.has(m as never), m).toBe(true)
  })
  it('tidak ada kalimat ganda', () => {
    const t = SEMUA_FRASA.map((f) => f.t)
    expect(new Set(t).size).toBe(t.length)
  })
  it('kalimat contoh dari spesifikasi ada dengan mood yang benar', () => {
    expect(FRASA.idle.find((f) => f.t === 'Zzz... bangunin pas ada yang seru ya')?.mood).toBe('ngantuk')
    expect(FRASA.kuisBenar.find((f) => f.t === 'Nah! Nalarmu jalan!')?.mood).toBe('bangga')
    expect(FRASA.kuisSalah.find((f) => f.t === 'Hmm, coba lihat dari sudut pandang lain.')).toBeTruthy()
    expect(FRASA.kuisSalah.every((f) => f.mood === 'kaget' || f.mood === 'sedih')).toBe(true)
    expect(FRASA.babBaru.every((f) => f.mood === 'semangat')).toBe(true)
    expect(FRASA.idle.every((f) => f.mood === 'ngantuk')).toBe(true)
    expect(FRASA.klikBeruntun.length).toBeGreaterThanOrEqual(3)
  })
  it('pilihFrasa tidak mengulang kalimat yang sama berturut-turut', () => {
    let prev = ''
    for (let i = 0; i < 200; i++) {
      const f = pilihFrasa('bintang')
      expect(f.t).not.toBe(prev)
      prev = f.t
    }
  })
})
