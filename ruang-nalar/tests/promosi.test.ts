import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { KEUNGGULAN, TANYA_JAWAB } from '../src/components/landing/Promosi'
import { EBOOK_PERCOBAAN } from '../src/lib/library'
import { DAFTAR_MUSIK, JENIS_MUSIK, MUSIK_BAWAAN } from '../src/lib/musik'
import { rancangSampul } from '../src/lib/sampul'
import { bunyiNyala } from '../src/lib/audio'
import { MENU_DASBOR } from '../src/components/dasbor/DasborLayout'
import { hitungLencana } from '../src/lib/library'

// Klaim di bagian promosi beranda harus benar-benar ada di web. Tes ini menjaga supaya teks pemasaran
// tidak melenceng dari fitur yang sebenarnya (dan tidak berisi angka atau testimoni karangan).

const baca = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const semuaTeks = [...KEUNGGULAN.flatMap((k) => [k.judul, k.isi]), ...TANYA_JAWAB(true).flatMap((t) => [t.t, t.j]), ...TANYA_JAWAB(false).flatMap((t) => [t.t, t.j])]

describe('promosi: bentuk data', () => {
  it('enam keunggulan, masing-masing berisi dan berjudul unik', () => {
    expect(KEUNGGULAN.length).toBe(6)
    expect(new Set(KEUNGGULAN.map((k) => k.judul)).size).toBe(6)
    for (const k of KEUNGGULAN) {
      expect(k.judul.trim().length).toBeGreaterThan(3)
      expect(k.isi.trim().length).toBeGreaterThan(20)
    }
  })
  it('tanpa angka karangan (statistik, jumlah pengguna, harga)', () => {
    for (const t of semuaTeks) expect(t, t).not.toMatch(/\d/)
  })
  it('tanpa kata testimoni atau klaim berlebihan', () => {
    for (const t of semuaTeks) expect(t.toLowerCase(), t).not.toMatch(/terbaik|nomor (satu|1)|ribuan|jutaan|dipercaya|testimoni|garansi/)
  })
})

describe('promosi: klaim fitur baca', () => {
  it('sorot punya tiga warna', () => {
    const src = baca('src/components/reader/SorotToolbar.tsx')
    const blok = src.slice(src.indexOf('const WARNA'), src.indexOf(']\n', src.indexOf('const WARNA')))
    expect(blok.match(/\{ w: \d/g)?.length).toBe(3)
  })
  it('catatan tempel, istilah yang bisa diketuk, dan penanda ada di kode', () => {
    expect(baca('src/components/reader/ParaView.tsx')).toContain('catatan-tempel')
    expect(baca('src/components/reader/TeksInline.tsx')).toMatch(/istilah/i)
    expect(baca('src/pages/Reader.tsx')).toContain('Penanda')
  })
  it('ebook percobaan: tiap bab punya kuis dan kartu balik, plus istilah', () => {
    expect(EBOOK_PERCOBAAN).toBeTruthy()
    const p = EBOOK_PERCOBAAN!.parsed
    expect(p.bab.length).toBeGreaterThan(0)
    expect(p.jumlahKuis).toBeGreaterThan(0)
    const jenis = new Set(p.bab.flatMap((b) => b.blok.map((k) => k.tipe)))
    for (const j of ['kuis', 'kartu', 'refleksi']) expect(jenis.has(j as never), j).toBe(true)
  })
  it('lencana Selesai Dibaca dan Kuis Sempurna dihitung dan ditampilkan', () => {
    const p = EBOOK_PERCOBAAN!.parsed
    const semuaBab = p.bab.map((_, i) => i)
    expect(hitungLencana(p, semuaBab, undefined).selesaiDibaca).toBe(true)
    expect(hitungLencana(p, [], undefined).selesaiDibaca).toBe(false)
    const sampul = baca('src/components/art/Sampul.tsx')
    expect(sampul).toContain('Selesai Dibaca')
    expect(sampul).toContain('Kuis Sempurna')
  })
  it('ukuran huruf bacaan bisa diubah dari dalam ebook', () => {
    expect(baca('src/pages/Reader.tsx')).toContain('Ukuran huruf bacaan')
  })
  it('sampul tiap buku berbeda: rancangan bergantung pada judul dan id', () => {
    const a = JSON.stringify(rancangSampul('Satu', 'a'))
    const adaBeda = ['b', 'c', 'd', 'e', 'f', 'g'].some((id) => JSON.stringify(rancangSampul('Dua ' + id, id)) !== a)
    expect(adaBeda).toBe(true)
  })
})

describe('promosi: dua suasana dan musik latar', () => {
  it('dua tema global bernama Malam Berbintang dan Ladang Matahari ada di tombol tema', () => {
    const src = baca('src/components/Pojok.tsx')
    expect(src).toContain('Malam Berbintang')
    expect(src).toContain('Ladang Matahari')
  })
  it('musik: lo-fi, ambien, hujan, dan alam semuanya ada', () => {
    const jenis = new Set(DAFTAR_MUSIK.map((l) => l.jenis))
    for (const j of ['lofi', 'ambien', 'hujan', 'alam'] as const) expect(jenis.has(j), j).toBe(true)
    expect(Object.keys(JENIS_MUSIK).sort()).toEqual(['alam', 'ambien', 'hujan', 'lofi'])
    const klaim = KEUNGGULAN.find((k) => k.ikon === 'suara')!
    expect(klaim.isi.toLowerCase()).toContain('lo-fi')
    expect(klaim.isi.toLowerCase()).toContain('hujan')
  })
  it('musik bawaan hening (mati) dan lagu bawaan valid', () => {
    expect(bunyiNyala()).toBe(false)
    expect(DAFTAR_MUSIK.some((l) => l.id === MUSIK_BAWAAN)).toBe(true)
    expect(KEUNGGULAN.find((k) => k.ikon === 'suara')!.isi).toMatch(/hening/i)
  })
})

describe('promosi: tanya-jawab', () => {
  it('toko mati: tanpa kata Midtrans, QRIS, bayar, beli, atau harga', () => {
    for (const t of TANYA_JAWAB(false)) {
      const s = `${t.t} ${t.j}`.toLowerCase()
      expect(s, s).not.toMatch(/midtrans|qris|bayar|beli|harga/)
    }
  })
  it('toko aktif: ada tanya-jawab pembayaran yang menyebut Midtrans, dan tetap mengaku data baca per perangkat', () => {
    const t = TANYA_JAWAB(true)
    expect(t.length).toBe(TANYA_JAWAB(false).length + 1)
    expect(t.some((x) => /midtrans/i.test(x.j))).toBe(true)
    const simpan = t.find((x) => /disimpan di mana/i.test(x.t))!
    expect(simpan.j).toMatch(/browser/i)
    expect(simpan.j).toMatch(/tidak ikut pindah/i)
  })
  it('klaim e-wallet/QRIS cocok dengan metode bawaan di Edge Function', () => {
    const fn = baca('supabase/functions/buat-transaksi/index.ts')
    expect(fn).toMatch(/gopay/)
    expect(fn).toMatch(/other_qris/)
  })
})

describe('promosi: dasbor member', () => {
  it('menu dasbor memuat Akun, Rak, dan About Me sesuai permintaan', () => {
    const label = MENU_DASBOR.map((m) => m.label)
    for (const wajib of ['Akun', 'Rak', 'About Me']) expect(label.some((l) => l.includes(wajib)), wajib).toBe(true)
  })
  it('tiap menu punya rute unik', () => {
    const rute = MENU_DASBOR.map((m) => m.to)
    expect(new Set(rute).size).toBe(rute.length)
  })
})
