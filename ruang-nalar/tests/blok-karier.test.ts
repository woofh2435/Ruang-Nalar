import { describe, expect, it } from 'vitest'
import { kunciJalur, nomorBabDariTeks, parseEbook } from '../src/lib/parser'

const bungkus = (isi: string) => `---\njudul: Uji\ntema: siang\n---\n\n# Bab 1: Satu\n\n${isi}\n`
const blokPertama = (raw: string) => parseEbook(raw).bab[0].blok.filter((b) => b.tipe !== 'p')[0]

describe('blok :::misi', () => {
  it('membaca judul, xp, tugas, dan arah jawaban', () => {
    const p = parseEbook(bungkus(':::misi judul="Misi 1: Coba" xp=15\nKerjakan sesuatu.\n\nLalu tulis hasilnya.\nArah: Jawaban baik spesifik.\n:::'))
    expect(p.peringatan).toEqual([])
    const m = p.bab[0].blok[0]
    expect(m.tipe).toBe('misi')
    if (m.tipe !== 'misi') return
    expect(m.judul).toBe('Misi 1: Coba')
    expect(m.xp).toBe(15)
    expect(m.paras.map((x) => x.teks)).toEqual(['Kerjakan sesuatu.', 'Lalu tulis hasilnya.'])
    expect(m.arah?.teks).toBe('Jawaban baik spesifik.')
  })
  it('xp bawaan 10, arah boleh tidak ada', () => {
    const m = blokPertama(bungkus(':::misi judul="A"\nTugas.\n:::'))
    expect(m.tipe === 'misi' && m.xp).toBe(10)
    expect(m.tipe === 'misi' && m.arah).toBeNull()
  })
  it('xp tidak valid memberi peringatan dan memakai 10', () => {
    for (const xp of ['0', '101', 'abc', '2.5']) {
      const p = parseEbook(bungkus(`:::misi judul="A" xp=${xp}\nTugas.\n:::`))
      expect(p.peringatan.some((w) => /xp/.test(w.pesan)), xp).toBe(true)
      const m = p.bab[0].blok[0]
      expect(m.tipe === 'misi' && m.xp).toBe(10)
    }
  })
  it('tanpa judul: peringatan, tetap tampil; tanpa tugas atau kosong: dilewati', () => {
    const a = parseEbook(bungkus(':::misi\nTugas.\n:::'))
    expect(a.peringatan.length).toBe(1)
    expect(a.bab[0].blok[0].tipe).toBe('misi')
    const b = parseEbook(bungkus(':::misi judul="A"\nArah: hanya arah\n:::'))
    expect(b.peringatan.some((w) => /belum punya tugas/.test(w.pesan))).toBe(true)
    expect(b.bab[0].blok.some((x) => x.tipe === 'misi')).toBe(false)
    const c = parseEbook(bungkus(':::misi judul="A"\n:::'))
    expect(c.bab[0].blok.some((x) => x.tipe === 'misi')).toBe(false)
  })
})

describe('blok :::karier', () => {
  it('membaca jalur, kunci, penjelasan, dan Coba', () => {
    const p = parseEbook(bungkus(':::karier jalur="HR (sumber daya manusia)"\nPenjelasan satu.\n\nPenjelasan dua.\nCoba: Lakukan ini.\n:::'))
    expect(p.peringatan).toEqual([])
    const k = p.bab[0].blok[0]
    expect(k.tipe).toBe('karier')
    if (k.tipe !== 'karier') return
    expect(k.kunci).toBe('hr-sumber-daya-manusia')
    expect(k.paras.length).toBe(2)
    expect(k.coba?.teks).toBe('Lakukan ini.')
  })
  it('tanpa jalur, tanpa penjelasan, atau jalur tanpa huruf: dilewati dengan peringatan', () => {
    expect(parseEbook(bungkus(':::karier\nIsi.\n:::')).peringatan.some((w) => /nama jalur/.test(w.pesan))).toBe(true)
    expect(parseEbook(bungkus(':::karier jalur="A"\nCoba: saja\n:::')).peringatan.some((w) => /penjelasan/.test(w.pesan))).toBe(true)
    expect(parseEbook(bungkus(':::karier jalur="---"\nIsi.\n:::')).peringatan.some((w) => /huruf atau angka/.test(w.pesan))).toBe(true)
  })
})

describe('blok :::peta-karier', () => {
  const peta = `:::peta-karier judul="Peta Uji"
- Peneliti sosial | Merancang riset | Lembaga riset | bab 3
- Analis kebijakan | Memetakan masalah | Kementerian | bab 5, 8-9
- Dosen | Mengajar | Kampus
:::`
  it('membaca baris jalur dengan bab, rentang, dan bab kosong', () => {
    const p = parseEbook(bungkus(peta))
    expect(p.peringatan).toEqual([])
    const b = p.bab[0].blok[0]
    expect(b.tipe).toBe('peta')
    if (b.tipe !== 'peta') return
    expect(b.judul).toBe('Peta Uji')
    expect(b.jalur.map((j) => j.bab)).toEqual([[3], [5, 8, 9], []])
    expect(b.jalur[0].kunci).toBe('peneliti-sosial')
  })
  it('baris rusak dan nama ganda dilewati dengan peringatan, nomor baris benar', () => {
    const p = parseEbook(bungkus(':::peta-karier\n- A | kerja | tempat | bab 1\n- B | hanya dua\n- A | ganda | tempat\nteks liar\n:::'))
    expect(p.peringatan.length).toBe(3)
    expect(p.peringatan.every((w) => w.baris > 5)).toBe(true)
    const b = p.bab[0].blok[0]
    expect(b.tipe === 'peta' && b.jalur.length).toBe(1)
    expect(b.tipe === 'peta' && b.judul).toBe('Peta Jalur Kariermu')
  })
  it('tanpa jalur valid: blok dilewati', () => {
    const p = parseEbook(bungkus(':::peta-karier\n:::'))
    expect(p.bab[0].blok.some((x) => x.tipe === 'peta')).toBe(false)
    expect(p.peringatan.length).toBe(1)
  })
  it('paling banyak 20 jalur', () => {
    const baris = Array.from({ length: 30 }, (_, i) => `- Jalur ${i + 1} | kerja | tempat`).join('\n')
    const b = blokPertama(bungkus(`:::peta-karier\n${baris}\n:::`))
    expect(b.tipe === 'peta' && b.jalur.length).toBe(20)
  })
})

describe('blok :::papan', () => {
  it('judul bawaan dan judul sendiri; isi kosong tidak masalah', () => {
    const a = parseEbook(bungkus(':::papan\n:::'))
    expect(a.peringatan).toEqual([])
    expect(a.bab[0].blok[0]).toMatchObject({ tipe: 'papan', judul: 'Papan Pencapaian' })
    const b = parseEbook(bungkus(':::papan judul="Papanku"\n:::'))
    expect(b.bab[0].blok[0]).toMatchObject({ tipe: 'papan', judul: 'Papanku' })
  })
})

describe('pesan blok tidak dikenal menyebut blok baru', () => {
  it('daftar blok yang tersedia lengkap', () => {
    const p = parseEbook(bungkus(':::aneh\nisi\n:::'))
    expect(p.peringatan[0].pesan).toMatch(/misi, karier, peta-karier, papan/)
  })
})

describe('kunciJalur dan nomorBabDariTeks', () => {
  it('kunci: huruf kecil, tanpa aksen, tanda hubung, maksimal 60', () => {
    expect(kunciJalur('Staf CSR / pemberdayaan masyarakat')).toBe('staf-csr-pemberdayaan-masyarakat')
    expect(kunciJalur('  Éngineer  Sosial!! ')).toBe('engineer-sosial')
    expect(kunciJalur('---')).toBe('')
    expect(kunciJalur('a'.repeat(100)).length).toBe(60)
  })
  it('bab: daftar, rentang, duplikat, dan angka di luar batas', () => {
    expect(nomorBabDariTeks('bab 3, 5-7')).toEqual([3, 5, 6, 7])
    expect(nomorBabDariTeks('Bab 5, 8 – 9')).toEqual([5, 8, 9])
    expect(nomorBabDariTeks('3, 3, 1')).toEqual([1, 3])
    expect(nomorBabDariTeks('')).toEqual([])
    expect(nomorBabDariTeks('bab 0, 1000, 9-5')).toEqual([])
    expect(nomorBabDariTeks('bab 1-200')).toEqual([])
  })
})
