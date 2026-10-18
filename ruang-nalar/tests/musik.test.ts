import { describe, expect, it } from 'vitest'
import { FRASA } from '../src/lib/phrases'
import {
  DAFTAR_MUSIK,
  JENIS_MUSIK,
  MUSIK_BAWAAN,
  PENYETARA,
  POLA_DRUM,
  SKALA_AMBIEN,
  VOLUME_BAWAAN,
  cariLagu,
  detikPerLangkah,
  frekAkor,
  frekMidi,
  geserAyun,
  laguValid,
  volumeValid,
} from '../src/lib/musik'
import { KEUNGGULAN } from '../src/components/landing/Promosi'

describe('daftar musik latar', () => {
  it('id unik, nama terisi, jenis dikenal', () => {
    const ids = DAFTAR_MUSIK.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const l of DAFTAR_MUSIK) {
      expect(l.nama.length).toBeGreaterThan(2)
      expect(l.ket.length).toBeGreaterThan(10)
      expect(Object.keys(JENIS_MUSIK)).toContain(l.jenis)
    }
  })
  it('semua jenis yang dijanjikan landing page ada (lo-fi, ambien, hujan, alam)', () => {
    const jenis = new Set(DAFTAR_MUSIK.map((l) => l.jenis))
    for (const j of ['lofi', 'ambien', 'hujan', 'alam'] as const) expect(jenis.has(j), j).toBe(true)
    const k = KEUNGGULAN.find((x) => x.judul.toLowerCase().includes('musik'))!
    expect(k.isi.toLowerCase()).toMatch(/lo-fi/)
    expect(k.isi.toLowerCase()).toMatch(/hujan/)
    expect(k.isi.toLowerCase()).toMatch(/alam/)
    expect(k.isi.toLowerCase()).toMatch(/ambient|ambien/)
  })
  it('lagu bawaan ada, dan setiap jenis punya pengali penyeragam kenyaringan yang wajar', () => {
    expect(cariLagu(MUSIK_BAWAAN)).toBeTruthy()
    for (const j of Object.keys(JENIS_MUSIK) as (keyof typeof JENIS_MUSIK)[]) {
      expect(PENYETARA[j], j).toBeGreaterThan(0.3)
      expect(PENYETARA[j], j).toBeLessThan(4)
    }
  })
  it('laguValid dan volumeValid menolak data rusak', () => {
    expect(laguValid('lofi-kafe')).toBe('lofi-kafe')
    for (const x of ['nggak-ada', 5, null, undefined, {}]) expect(laguValid(x)).toBe(MUSIK_BAWAAN)
    expect(volumeValid(0.5)).toBe(0.5)
    expect(volumeValid(7)).toBe(1)
    expect(volumeValid(-1)).toBe(0)
    for (const x of ['x', NaN, Infinity, null]) expect(volumeValid(x)).toBe(VOLUME_BAWAAN)
  })
})

describe('data lo-fi', () => {
  const lofi = DAFTAR_MUSIK.filter((l) => l.jenis === 'lofi')
  it('ada minimal dua lagu lo-fi dengan tempo santai dan progresi empat akor', () => {
    expect(lofi.length).toBeGreaterThanOrEqual(2)
    for (const l of lofi) {
      const p = l.lofi!
      expect(p.bpm).toBeGreaterThanOrEqual(55)
      expect(p.bpm).toBeLessThanOrEqual(90)
      expect(p.ayun).toBeGreaterThanOrEqual(0)
      expect(p.ayun).toBeLessThanOrEqual(0.4)
      expect(p.progresi.length).toBe(4)
      expect(p.melodi.length).toBeGreaterThanOrEqual(4)
    }
  })
  it('semua nada di rentang yang enak didengar (bas 28–55, akor 48–72, melodi 60–88)', () => {
    for (const l of lofi) {
      for (const a of l.lofi!.progresi) {
        expect(a.bas).toBeGreaterThanOrEqual(28)
        expect(a.bas).toBeLessThanOrEqual(55)
        expect(a.nada.length).toBeGreaterThanOrEqual(3)
        for (const n of a.nada) {
          expect(n).toBeGreaterThanOrEqual(48)
          expect(n).toBeLessThanOrEqual(72)
        }
        for (const f of frekAkor(a)) expect(Number.isFinite(f) && f > 30 && f < 1500).toBe(true)
      }
      for (const n of l.lofi!.melodi) {
        expect(n).toBeGreaterThanOrEqual(60)
        expect(n).toBeLessThanOrEqual(88)
      }
    }
  })
  it('frekMidi: A4 = 440 Hz, oktaf = dua kali', () => {
    expect(frekMidi(69)).toBeCloseTo(440, 6)
    expect(frekMidi(81)).toBeCloseTo(880, 6)
    expect(frekMidi(60)).toBeCloseTo(261.6256, 3)
  })
  it('ketukan: satu langkah = 1/16 dan hanya 1/8 lemah yang diayun', () => {
    expect(detikPerLangkah(60)).toBeCloseTo(0.25, 9)
    expect(geserAyun(0, 120, 0.3)).toBe(0)
    expect(geserAyun(4, 120, 0.3)).toBe(0)
    expect(geserAyun(1, 120, 0.3)).toBe(0)
    expect(geserAyun(2, 120, 0.3)).toBeCloseTo(0.3 * detikPerLangkah(120) * 2, 9)
    expect(geserAyun(6, 120, 0)).toBe(0)
  })
  it('pola drum: langkah di dalam birama 16 dan snare tidak bertumpuk dengan kick', () => {
    const semua = [...POLA_DRUM.kick, ...POLA_DRUM.snare, ...Object.keys(POLA_DRUM.hat).map(Number)]
    for (const s of semua) {
      expect(s).toBeGreaterThanOrEqual(0)
      expect(s).toBeLessThan(16)
    }
    for (const s of POLA_DRUM.snare) expect(POLA_DRUM.kick).not.toContain(s)
    for (const v of Object.values(POLA_DRUM.hat)) expect(v > 0 && v <= 1).toBe(true)
  })
  it('skala ambien: frekuensi naik dan wajar', () => {
    for (let i = 1; i < SKALA_AMBIEN.length; i++) expect(SKALA_AMBIEN[i]).toBeGreaterThan(SKALA_AMBIEN[i - 1])
  })
})

describe('kalimat Nalar untuk musik', () => {
  it('musikPilih ada dan lebih dari satu variasi', () => {
    expect(FRASA.musikPilih.length).toBeGreaterThanOrEqual(2)
  })
})
