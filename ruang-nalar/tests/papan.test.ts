import { describe, expect, it } from 'vitest'
import { parseEbook } from '../src/lib/parser'
import { hitungPapan, indeksBabInti, indeksBabUntuk, kunciJalurEbook, nomorDariJudul, POIN_BAB, POIN_KUIS, progresModal, TINGKAT } from '../src/lib/papan'

const EBOOK = `---
judul: Uji Papan
---

# Kata Pembuka

Halo.

# Bab 1: Awal

:::kuis
Q: Satu?
- [x] ya
- tidak
:::

:::misi judul="Misi 1" xp=10
Tugas.
:::

:::karier jalur="Peneliti sosial"
Penjelasan.
:::

# Bab 2: Tengah

:::kuis
Q: Dua?
- ya
- [x] tidak
:::

:::misi judul="Misi 2" xp=20
Tugas.
:::

# Bab 3: Akhir

:::peta-karier
- Peneliti sosial | kerja | tempat | bab 1, 3
- Analis | kerja | tempat | bab 2
- Dosen | kerja | tempat
:::

# Penutup
Selesai.
`

describe('nomorDariJudul / indeksBabUntuk / indeksBabInti', () => {
  it('mengenali "Bab N" dengan berbagai pemisah dan huruf besar', () => {
    expect(nomorDariJudul('Bab 3: Metode')).toBe(3)
    expect(nomorDariJudul('BAB 12 -- Akhir')).toBe(12)
    expect(nomorDariJudul('  bab 7')).toBe(7)
    expect(nomorDariJudul('Babak baru')).toBeNull()
    expect(nomorDariJudul('Kata Pembuka')).toBeNull()
    expect(nomorDariJudul('Bab')).toBeNull()
  })
  it('memetakan nomor ke indeks lewat judul, bukan urutan', () => {
    const bab = [{ judul: 'Kata Pembuka' }, { judul: 'Bab 1: A' }, { judul: 'Bab 2: B' }, { judul: 'Penutup' }]
    expect(indeksBabUntuk(bab, 1)).toBe(1)
    expect(indeksBabUntuk(bab, 2)).toBe(2)
    expect(indeksBabUntuk(bab, 3)).toBe(-1)
    expect(indeksBabInti(bab)).toEqual([1, 2])
  })
  it('tanpa judul "Bab N": pakai urutan ke-N dan semua bab dianggap inti', () => {
    const bab = [{ judul: 'Satu' }, { judul: 'Dua' }]
    expect(indeksBabUntuk(bab, 2)).toBe(1)
    expect(indeksBabUntuk(bab, 3)).toBe(-1)
    expect(indeksBabUntuk(bab, 0)).toBe(-1)
    expect(indeksBabInti(bab)).toEqual([0, 1])
  })
})

describe('progresModal', () => {
  const bab = [{ judul: 'Kata Pembuka' }, { judul: 'Bab 1: A' }, { judul: 'Bab 2: B' }, { judul: 'Bab 3: C' }]
  it('menghitung bab modal yang sudah selesai berdasarkan indeks sebenarnya', () => {
    const r = progresModal({ bab: [1, 3] }, bab, [1])
    expect(r.total).toBe(2)
    expect(r.selesai).toBe(1)
    expect(r.bab.map((b) => [b.nomor, b.idx, b.selesai])).toEqual([[1, 1, true], [3, 3, false]])
  })
  it('bab modal kosong berarti semua bab bernomor', () => {
    const r = progresModal({ bab: [] }, bab, [1, 2, 3])
    expect(r.total).toBe(3)
    expect(r.selesai).toBe(3)
  })
  it('nomor yang tidak ada diabaikan', () => {
    expect(progresModal({ bab: [9] }, bab, [1]).total).toBe(0)
  })
})

describe('hitungPapan', () => {
  const p = parseEbook(EBOOK)
  const awal = { selesai: [], misi: {}, kuis: {}, karier: {} }

  it('ebook uji bersih dari peringatan dan berisi blok yang diharapkan', () => {
    expect(p.peringatan).toEqual([])
    expect(p.jumlahKuis).toBe(2)
  })
  it('keadaan awal: nol poin, tingkat pertama', () => {
    const h = hitungPapan(p, awal)
    expect(h.poin).toBe(0)
    expect(h.persen).toBe(0)
    expect(h.tingkat).toBe(0)
    expect(h.bab).toEqual({ selesai: 0, total: 3 })
    expect(h.misi.total).toBe(2)
    expect(h.kuis.total).toBe(2)
    expect(h.poinMaks).toBe(10 + 20 + 2 * POIN_KUIS + 3 * POIN_BAB)
  })
  it('kunci jalur dari kartu dan peta digabung tanpa duplikat', () => {
    expect(kunciJalurEbook(p).sort()).toEqual(['analis', 'dosen', 'peneliti-sosial'])
  })
  it('bab pembuka dan penutup tidak dihitung sebagai bab inti', () => {
    const h = hitungPapan(p, { ...awal, selesai: [0, 4] })
    expect(h.bab.selesai).toBe(0)
    expect(h.poin).toBe(0)
  })
  it('poin dari misi, kuis pertama-benar, dan bab selesai', () => {
    const idMisi = p.bab.flatMap((b) => b.blok.filter((x) => x.tipe === 'misi').map((x) => x.id))
    const idKuis = p.bab.flatMap((b) => b.blok.filter((x) => x.tipe === 'kuis').map((x) => x.id))
    const h = hitungPapan(p, {
      selesai: [1, 2],
      misi: { [idMisi[1]]: { selesai: true, catatan: '' }, [idMisi[0]]: { selesai: false, catatan: 'draf' } },
      kuis: { [idKuis[0]]: { pilih: 0, benar: true, pertamaBenar: true }, [idKuis[1]]: { pilih: 1, benar: true, pertamaBenar: false } },
      karier: { 'peneliti-sosial': { minat: true, langkah: '' }, analis: { minat: false, langkah: 'x' } },
    })
    expect(h.misi).toEqual({ selesai: 1, total: 2, poin: 20 })
    expect(h.kuis).toEqual({ benar: 1, total: 2 })
    expect(h.bab.selesai).toBe(2)
    expect(h.karier).toEqual({ ditandai: 1, total: 3 })
    expect(h.poin).toBe(20 + POIN_KUIS + 2 * POIN_BAB)
  })
  it('semua tuntas: 100% dan tingkat tertinggi; persen tidak pernah lewat 1', () => {
    const idMisi = p.bab.flatMap((b) => b.blok.filter((x) => x.tipe === 'misi').map((x) => x.id))
    const idKuis = p.bab.flatMap((b) => b.blok.filter((x) => x.tipe === 'kuis').map((x) => x.id))
    const h = hitungPapan(p, {
      selesai: [0, 1, 2, 3, 4],
      misi: Object.fromEntries(idMisi.map((i) => [i, { selesai: true, catatan: '' }])),
      kuis: Object.fromEntries(idKuis.map((i) => [i, { pilih: 0, benar: true, pertamaBenar: true }])),
      karier: {},
    })
    expect(h.persen).toBe(1)
    expect(h.tingkat).toBe(TINGKAT.length - 1)
  })
  it('tingkat naik bertahap dan hanya tingkat terakhir yang menuntut 100%', () => {
    const ambil = (persen: number) => Math.min(TINGKAT.length - 2, Math.floor(persen * (TINGKAT.length - 1)))
    expect(ambil(0.99)).toBe(TINGKAT.length - 2)
    expect(ambil(0.2)).toBe(1)
  })
  it('ebook tanpa blok interaktif: tidak membagi dengan nol', () => {
    const kosong = parseEbook('---\njudul: K\n---\n\n# Satu\n\nHalo.\n')
    const h = hitungPapan(kosong, awal)
    expect(h.persen).toBeGreaterThanOrEqual(0)
    expect(Number.isFinite(h.persen)).toBe(true)
  })
})
