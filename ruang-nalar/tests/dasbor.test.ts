import { describe, expect, it } from 'vitest'
import { FILTER_KOSONG, cariEbook, cocokKata, filterAktif, normal, semuaTag, temaTerpakai } from '../src/lib/cari'
import { daftarPenanda, riwayatBaca, ringkasBaca, sapaanWaktu } from '../src/lib/dasbor'
import { geserId, saringId } from '../src/lib/koleksi'
import { UKURAN_HURUF, UKURAN_HURUF_BAWAAN, ukuranValid } from '../src/lib/huruf'
import { parseEbook } from '../src/lib/parser'
import { K } from '../src/lib/store'
import type { Ebook } from '../src/lib/types'

const buat = (id: string, md: string, sumber: Ebook['sumber'] = 'publik'): Ebook => ({ id, sumber, raw: md, parsed: parseEbook(md) })

const A = buat(
  'durkheim',
  `---
judul: Solidaritas Sosial
penulis: Ayu
tema: malam
tag: [teori, Durkheim]
status: terbit
deskripsi: Catatan tentang Émile Durkheim.
---
# Bab 1

Paragraf satu tentang solidaritas.

Paragraf dua.

:::kuis
Q: Satu tambah satu?
- 1
- [x] 2
Penjelasan: Dua.
:::

:::kartu
Depan: Anomie
Belakang: Norma tidak jelas.
:::

# Bab 2

Isi bab dua.
`,
)
const B = buat(
  'weber',
  `---
judul: Tindakan Sosial
tema: siang
tag: [teori, weber]
status: terbit
---
# Bab 1

Verstehen.
`,
  'toko',
)
const C = buat(
  'ruang',
  `---
judul: Ruang Publik
tema: malam
tag: [kota]
status: terbit
---
# Bab 1

Isi.
`,
)
const SEMUA = [A, B, C]

describe('pencarian ebook', () => {
  it('normal: tanpa aksen, huruf kecil, spasi dirapikan', () => {
    expect(normal('  Émile   DURKHEIM ')).toBe('emile durkheim')
  })
  it('cocokKata: semua kata harus ada, urutan bebas; kosong = cocok', () => {
    expect(cocokKata('Solidaritas sosial Durkheim', 'durkheim solidaritas')).toBe(true)
    expect(cocokKata('Solidaritas sosial', 'durkheim')).toBe(false)
    expect(cocokKata('apa saja', '   ')).toBe(true)
  })
  it('mencari lewat judul, penulis, deskripsi (tanpa aksen), tag, dan nama tema', () => {
    expect(cariEbook(SEMUA, { ...FILTER_KOSONG, q: 'solidaritas' }).map((e) => e.id)).toEqual(['durkheim'])
    expect(cariEbook(SEMUA, { ...FILTER_KOSONG, q: 'ayu' }).map((e) => e.id)).toEqual(['durkheim'])
    expect(cariEbook(SEMUA, { ...FILTER_KOSONG, q: 'emile' }).map((e) => e.id)).toEqual(['durkheim'])
    expect(cariEbook(SEMUA, { ...FILTER_KOSONG, q: 'kota' }).map((e) => e.id)).toEqual(['ruang'])
    expect(cariEbook(SEMUA, { ...FILTER_KOSONG, q: 'siang' }).map((e) => e.id)).toEqual(['weber'])
  })
  it('saringan tema, tag (tak peka huruf besar), dan akses', () => {
    expect(cariEbook(SEMUA, { ...FILTER_KOSONG, tema: 'malam' }).map((e) => e.id)).toEqual(['durkheim', 'ruang'])
    expect(cariEbook(SEMUA, { ...FILTER_KOSONG, tag: 'DURKHEIM' }).map((e) => e.id)).toEqual(['durkheim'])
    expect(cariEbook(SEMUA, { ...FILTER_KOSONG, akses: 'berbayar' }).map((e) => e.id)).toEqual(['weber'])
    expect(cariEbook(SEMUA, { ...FILTER_KOSONG, akses: 'gratis' }).map((e) => e.id)).toEqual(['durkheim', 'ruang'])
  })
  it('saringan digabung (dan)', () => {
    expect(cariEbook(SEMUA, { q: 'teori', tema: 'malam', tag: '', akses: 'gratis' }).map((e) => e.id)).toEqual(['durkheim'])
    expect(cariEbook(SEMUA, { q: 'teori', tema: 'malam', tag: '', akses: 'berbayar' })).toEqual([])
  })
  it('semuaTag urut dari yang paling sering; temaTerpakai urut sesuai TEMA', () => {
    expect(semuaTag(SEMUA)[0].toLowerCase()).toBe('teori')
    expect(semuaTag(SEMUA).length).toBe(4)
    expect(temaTerpakai(SEMUA)).toEqual(['malam', 'siang'])
  })
  it('filterAktif', () => {
    expect(filterAktif(FILTER_KOSONG)).toBe(false)
    expect(filterAktif({ ...FILTER_KOSONG, q: ' x ' })).toBe(true)
    expect(filterAktif({ ...FILTER_KOSONG, akses: 'gratis' })).toBe(true)
  })
})

describe('koleksi (rak dan favorit)', () => {
  it('geserId menambah lalu membuang tanpa mengubah daftar asli', () => {
    const asal = ['a']
    const tambah = geserId(asal, 'b')
    expect(tambah).toEqual(['a', 'b'])
    expect(asal).toEqual(['a'])
    expect(geserId(tambah, 'a')).toEqual(['b'])
  })
  it('saringId membuang id yang tak ada lagi di pustaka dan menjaga urutan', () => {
    expect(saringId(['x', 'a', 'y', 'b'], new Set(['a', 'b']))).toEqual(['a', 'b'])
  })
  it('kunci penyimpanan koleksi dan musik tidak bentrok dengan data baca', () => {
    const kunci = [K.rak, K.favorit, K.musik, K.volumeMusik]
    expect(new Set(kunci).size).toBe(4)
    for (const k of kunci) expect(k).not.toMatch(/^(pos|sorot|catatan|penanda|selesai|kuis|refleksi):/)
  })
})

describe('ringkasan dasbor', () => {
  const p1 = A.parsed.bab[0].blok.find((b) => b.tipe === 'p')!.id
  const kuisId = A.parsed.bab[0].blok.find((b) => b.tipe === 'kuis')!.id
  const kv = {
    [K.posisi('durkheim')]: { bab: 1, pct: 0.5, t: 2000 },
    [K.selesai('durkheim')]: [0],
    [K.sorot('durkheim')]: [{ id: 's1' }, { id: 's2' }],
    [K.catatan('durkheim')]: { [p1]: 'catatan' },
    [K.penanda('durkheim')]: [p1, 'b9-9'],
    [K.kuis('durkheim')]: { [kuisId]: { pertamaBenar: true } },
    [K.posisi('ruang')]: { bab: 0, pct: 1, t: 5000 },
    [K.selesai('ruang')]: [0],
  }

  it('riwayatBaca: hanya yang pernah dibuka, terbaru dulu, persen dihitung dengan benar', () => {
    const r = riwayatBaca(SEMUA, kv)
    expect(r.map((x) => x.ebook.id)).toEqual(['ruang', 'durkheim'])
    expect(r[0].persen).toBe(100)
    // 1 dari 2 bab selesai + separuh bab ke-2 → (1 + 0.5) / 2 = 75%
    expect(r[1].persen).toBe(75)
    expect(r[1].babTerakhir).toBe(1)
    expect(riwayatBaca(SEMUA, {})).toEqual([])
  })
  it('riwayatBaca tahan data rusak', () => {
    const rusak = { [K.posisi('durkheim')]: 'aneh', [K.selesai('durkheim')]: 'x', [K.selesai('ruang')]: [99, -1, 0.5] }
    expect(riwayatBaca(SEMUA, rusak)).toEqual([])
  })
  it('ringkasBaca menghitung semua angka', () => {
    const r = ringkasBaca(SEMUA, kv)
    expect(r).toEqual({ ebookDibuka: 2, ebookSelesai: 1, babSelesai: 2, kuisSempurna: 1, sorotan: 2, catatan: 1, penanda: 2 })
  })
  it('ringkasBaca tanpa data → semua nol', () => {
    expect(Object.values(ringkasBaca(SEMUA, {})).every((n) => n === 0)).toBe(true)
  })
  it('daftarPenanda melewati penanda yang paragrafnya sudah tidak ada', () => {
    const d = daftarPenanda(SEMUA, kv)
    expect(d.length).toBe(1)
    expect(d[0].paraId).toBe(p1)
    expect(d[0].cuplikan).toContain('solidaritas')
  })
  it('sapaanWaktu menurut jam', () => {
    expect(sapaanWaktu(2)).toBe('Masih terjaga')
    expect(sapaanWaktu(8)).toBe('Selamat pagi')
    expect(sapaanWaktu(13)).toBe('Selamat siang')
    expect(sapaanWaktu(17)).toBe('Selamat sore')
    expect(sapaanWaktu(21)).toBe('Selamat malam')
  })
})

describe('ukuran huruf bacaan', () => {
  it('nilai valid dipertahankan, rusak → bawaan, di luar rentang dijepit', () => {
    expect(ukuranValid(20)).toBe(20)
    expect(ukuranValid('x')).toBe(UKURAN_HURUF_BAWAAN)
    expect(ukuranValid(NaN)).toBe(UKURAN_HURUF_BAWAAN)
    expect(ukuranValid(10)).toBe(UKURAN_HURUF[0])
    expect(ukuranValid(99)).toBe(UKURAN_HURUF[UKURAN_HURUF.length - 1])
    expect(UKURAN_HURUF).toContain(UKURAN_HURUF_BAWAAN)
  })
})
