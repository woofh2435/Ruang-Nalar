import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseEbook, parseInline, pisahEbook, susunEbook, teksPolos, kumpulPara } from '../src/lib/parser'

const CONTOH = readFileSync(join(__dirname, '../src/content/apa-itu-sosiologi.md'), 'utf8')

// Contoh PERSIS dari spesifikasi
const SPEC = `---
judul: Apa Itu Sosiologi?
subjudul: Catatan Minggu 1
penulis: [NAMA PENULIS]
tema: malam
ikon: 🦎
tag: [pengantar, teori]
status: terbit
deskripsi: Catatan singkat pengantar sosiologi.
---

# Bab 1: Imajinasi Sosiologis

Paragraf biasa dengan **tebal**, *miring*, dan istilah [[Anomie|keadaan ketika norma tidak jelas]].

:::catatan tipe=penting
Isi kotak catatan. Tipe: penting | tips | awas
:::

:::tokoh nama="Émile Durkheim" tahun="1858–1917"
Satu paragraf singkat tentang tokoh.
:::

:::kartu
Depan: Fakta sosial
Belakang: Cara bertindak, berpikir, dan merasa yang berada di luar individu dan memaksanya.
:::

:::kuis
Q: Contoh pertanyaan kuis?
- Pilihan salah
- [x] Pilihan benar
- Pilihan salah lain
Penjelasan: Alasan jawaban benar.
:::

:::refleksi
Pertanyaan renungan untuk pembaca, jawabannya disimpan lokal.
:::
`

describe('contoh persis dari spesifikasi', () => {
  const p = parseEbook(SPEC)
  it('tanpa peringatan', () => expect(p.peringatan).toEqual([]))
  it('meta benar', () => {
    expect(p.meta.judul).toBe('Apa Itu Sosiologi?')
    expect(p.meta.subjudul).toBe('Catatan Minggu 1')
    expect(p.meta.penulis).toBe('[NAMA PENULIS]')
    expect(p.meta.tema).toBe('malam')
    expect(p.meta.ikon).toBe('🦎')
    expect(p.meta.tag).toEqual(['pengantar', 'teori'])
    expect(p.meta.status).toBe('terbit')
  })
  it('satu bab dengan semua jenis blok', () => {
    expect(p.bab).toHaveLength(1)
    expect(p.bab[0].judul).toBe('Bab 1: Imajinasi Sosiologis')
    expect(p.bab[0].blok.map((b) => b.tipe)).toEqual(['p', 'catatan', 'tokoh', 'kartu', 'kuis', 'refleksi'])
  })
  it('detail blok', () => {
    const [para, cat, tokoh, kartu, kuis] = p.bab[0].blok
    expect(para.tipe === 'p' && para.para.inline.map((t) => t.k)).toEqual(['teks', 'teks', 'teks', 'teks', 'teks', 'istilah', 'teks'])
    expect(cat.tipe === 'catatan' && cat.jenis).toBe('penting')
    expect(tokoh.tipe === 'tokoh' && [tokoh.nama, tokoh.tahun]).toEqual(['Émile Durkheim', '1858–1917'])
    expect(kartu.tipe === 'kartu' && kartu.depan.teks).toBe('Fakta sosial')
    if (kuis.tipe !== 'kuis') throw new Error('bukan kuis')
    expect(kuis.opsi.map((o) => o.benar)).toEqual([false, true, false])
    expect(kuis.penjelasan?.teks).toBe('Alasan jawaban benar.')
  })
})

describe('ebook contoh bawaan (src/content)', () => {
  const p = parseEbook(CONTOH)
  it('tidak ada peringatan', () => expect(p.peringatan).toEqual([]))
  it('3 bab', () => expect(p.bab).toHaveLength(3))
  it('memuat semua jenis blok', () => {
    const tipe = new Set(p.bab.flatMap((b) => b.blok.map((k) => k.tipe)))
    for (const t of ['p', 'sub', 'daftar', 'catatan', 'tokoh', 'kartu', 'kuis', 'refleksi']) expect(tipe.has(t as never)).toBe(true)
  })
  it('ditandai CONTOH', () => {
    expect(p.meta.tag).toContain('contoh')
    expect(p.meta.deskripsi).toContain('CONTOH, boleh dihapus')
  })
  it('id paragraf unik', () => {
    const ids = p.bab.flatMap((b) => kumpulPara(b).map((x) => x.id))
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('inline', () => {
  it('tebal, miring, istilah', () => {
    const t = parseInline('a **b** *c* [[D|dd]] e')
    expect(t.map((x) => [x.k, x.s, x.tebal, x.miring])).toEqual([
      ['teks', 'a ', false, false],
      ['teks', 'b', true, false],
      ['teks', ' ', false, false],
      ['teks', 'c', false, true],
      ['teks', ' ', false, false],
      ['istilah', 'D', false, false],
      ['teks', ' e', false, false],
    ])
    expect(t.find((x) => x.k === 'istilah')).toMatchObject({ def: 'dd' })
  })
  it('bersarang & ***', () => {
    expect(parseInline('**tebal *miring* lagi**').map((x) => [x.s, x.tebal, x.miring])).toEqual([
      ['tebal ', true, false],
      ['miring', true, true],
      [' lagi', true, false],
    ])
    expect(teksPolos(parseInline('***penting***'))).toBe('penting')
  })
  it('tanda tidak berpasangan tampil apa adanya', () => {
    expect(teksPolos(parseInline('2 * 3 = 6 dan **belum ditutup'))).toBe('2 * 3 = 6 dan **belum ditutup')
    expect(teksPolos(parseInline('[[x'))).toBe('[[x')
  })
  it('escape', () => {
    expect(teksPolos(parseInline('\\*bukan miring\\*'))).toBe('*bukan miring*')
  })
  it('istilah tanpa definisi diberi peringatan', () => {
    const w: string[] = []
    const t = parseInline('[[Saja]] dan [[A|]]', (m) => w.push(m))
    expect(w).toHaveLength(2)
    expect(t.every((x) => x.k === 'teks')).toBe(true)
  })
})

describe('input rusak: dilewati + peringatan bernomor baris, tidak crash', () => {
  const kasus = (isi: string) => parseEbook('---\njudul: T\n---\n\n# Bab\n\n' + isi)
  const baris = (p: ReturnType<typeof parseEbook>) => p.peringatan.map((x) => x.baris)

  it('blok kosong', () => {
    const p = kasus(':::kuis\n:::\n\n:::catatan\n:::')
    expect(p.bab[0].blok).toHaveLength(0)
    expect(p.peringatan).toHaveLength(2)
    expect(baris(p)).toEqual([7, 10])
  })
  it('kuis tanpa jawaban benar / kurang opsi / tanpa Q', () => {
    expect(kasus(':::kuis\nQ: x?\n- a\n- b\n:::').peringatan[0].pesan).toMatch(/jawaban benar/)
    expect(kasus(':::kuis\nQ: x?\n- [x] a\n:::').peringatan[0].pesan).toMatch(/minimal 2/)
    expect(kasus(':::kuis\n- a\n- [x] b\n:::').peringatan[0].pesan).toMatch(/pertanyaan/)
    expect(kasus(':::kuis\nQ: x?\n- a\n- b\n:::').bab[0].blok).toHaveLength(0)
  })
  it('kuis dengan dua jawaban benar: hanya yang pertama dipakai', () => {
    const p = kasus(':::kuis\nQ: x?\n- [x] a\n- [x] b\n:::')
    const k = p.bab[0].blok[0]
    expect(k.tipe === 'kuis' && k.opsi.map((o) => o.benar)).toEqual([true, false])
    expect(p.peringatan).toHaveLength(1)
  })
  it('kartu tidak lengkap', () => {
    const p = kasus(':::kartu\nDepan: saja\n:::')
    expect(p.bab[0].blok).toHaveLength(0)
    expect(p.peringatan[0].pesan).toMatch(/Belakang/)
  })
  it('tokoh tanpa nama / tanpa isi', () => {
    expect(kasus(':::tokoh\nisi\n:::').peringatan[0].pesan).toMatch(/nama/)
    expect(kasus(':::tokoh nama="A"\n:::').peringatan[0].pesan).toMatch(/isi/)
  })
  it('blok tidak ditutup: ditutup otomatis sebelum heading berikutnya', () => {
    const p = parseEbook('# A\n\n:::catatan tipe=tips\nisi tanpa penutup\n\n# B\n\nlanjut')
    expect(p.bab).toHaveLength(2)
    expect(p.bab[0].blok[0].tipe).toBe('catatan')
    const w = p.peringatan.find((x) => /tidak ditutup/.test(x.pesan))
    expect(w?.baris).toBe(3)
    expect(p.bab[1].blok[0].tipe).toBe('p')
  })
  it('jenis blok tidak dikenal & penutup nyasar', () => {
    const p = kasus(':::aneh\nx\n:::\n\n:::')
    expect(p.peringatan).toHaveLength(2)
    expect(p.bab[0].blok).toHaveLength(0)
  })
  it('tipe catatan salah -> penting + peringatan', () => {
    const p = kasus(':::catatan tipe=biru\nisi\n:::')
    expect(p.bab[0].blok[0]).toMatchObject({ tipe: 'catatan', jenis: 'penting' })
    expect(p.peringatan).toHaveLength(1)
  })
  it('isi sebelum bab pertama masuk bab "Pembuka"', () => {
    const p = parseEbook('halo\n\n# Bab 1\n\nx')
    expect(p.bab[0].judul).toBe('Pembuka')
    expect(p.bab).toHaveLength(2)
    expect(p.peringatan.length).toBeGreaterThan(0)
  })
  it('tanpa bab sama sekali', () => {
    expect(parseEbook('').bab).toHaveLength(0)
    expect(parseEbook('').peringatan.length).toBeGreaterThan(0)
  })
  it('frontmatter tidak ditutup / kunci aneh / tema & status salah', () => {
    const a = parseEbook('---\njudul: A\ntema: pelangi\nstatus: entah\nwarna: merah\n\n# Bab\n\nx')
    expect(a.bab).toHaveLength(1)
    expect(a.meta.judul).toBe('A')
    expect(a.meta.tema).toBe('malam')
    expect(a.meta.status).toBe('terbit')
    expect(a.peringatan.length).toBeGreaterThanOrEqual(4)
  })
  it('CRLF dan BOM', () => {
    const p = parseEbook('﻿---\r\njudul: X\r\n---\r\n\r\n# Bab\r\n\r\nisi\r\n')
    expect(p.meta.judul).toBe('X')
    expect(p.bab[0].blok).toHaveLength(1)
    expect(p.peringatan).toEqual([])
  })
  it('input bukan string tidak membuat crash', () => {
    expect(() => parseEbook(undefined as unknown as string)).not.toThrow()
    expect(() => parseEbook(null as unknown as string)).not.toThrow()
  })
})

describe('fuzz: tidak pernah melempar error', () => {
  const potongan = ['---', '# ', '## ', '### ', ':::', ':::kuis', ':::kartu', ':::catatan tipe=tips', ':::tokoh nama="X"', ':::refleksi', 'Q: ', 'Depan: ', 'Belakang: ', 'Penjelasan: ', '- ', '- [x] ', '**', '*', '[[', ']]', '|', '\\', 'teks', ' ', '\n', '\n\n', 'judul: A', 'tag: [a, b]', '🦎', '“', '”']
  let seed = 12345
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
  it('3000 teks acak', () => {
    for (let i = 0; i < 3000; i++) {
      let s = ''
      const n = 1 + Math.floor(rnd() * 40)
      for (let k = 0; k < n; k++) s += potongan[Math.floor(rnd() * potongan.length)]
      const p = parseEbook(s)
      expect(Array.isArray(p.bab)).toBe(true)
      expect(Array.isArray(p.peringatan)).toBe(true)
      for (const w of p.peringatan) expect(w.baris).toBeGreaterThanOrEqual(1)
      const ids = p.bab.flatMap((b) => b.blok.map((x) => x.id))
      expect(new Set(ids).size).toBe(ids.length)
    }
  })
})

describe('susunEbook / pisahEbook', () => {
  it('bolak-balik tanpa kehilangan data', () => {
    const p = parseEbook(CONTOH)
    const { raw, offset } = susunEbook(p.meta, '# A\n\nisi')
    expect(offset).toBe(11)
    const u = pisahEbook(raw)
    expect(u.adaFrontmatter).toBe(true)
    expect(u.meta).toEqual(p.meta)
    expect(u.isi).toBe('# A\n\nisi\n')
    // baris di isi + offset = baris di raw
    const q = parseEbook(raw)
    expect(q.bab[0].baris).toBe(1 + offset)
  })
})
