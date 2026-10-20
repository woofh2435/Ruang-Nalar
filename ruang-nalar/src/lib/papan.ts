// Hitungan murni untuk Papan Pencapaian dan Peta Karier (diuji di tests/papan.test.ts).
// Semua angka berasal dari data pembaca yang nyata: bab yang ditandai selesai, misi yang dicentang,
// kuis yang dijawab benar di percobaan pertama, dan jalur karier yang ditandai.

import type { Bab, DataKarier, DataMisi, JalurKarier, JawabanKuis, ParsedEbook } from './types'

export const POIN_KUIS = 5
export const POIN_BAB = 10

/** Nomor dari judul bab berbentuk "Bab 3: ..." atau "Bab 3 -- ...". null bila bukan bab bernomor. */
export function nomorDariJudul(judul: string): number | null {
  const m = /^\s*bab\s+(\d{1,3})\b/i.exec(judul)
  return m ? Number(m[1]) : null
}

/** Indeks bab bernomor (mis. "Bab 3") di dalam ebook. Bila ebook tidak memakai judul "Bab N", dipakai urutan ke-N. -1 bila tidak ada. */
export function indeksBabUntuk(bab: readonly Pick<Bab, 'judul'>[], nomor: number): number {
  const i = bab.findIndex((b) => nomorDariJudul(b.judul) === nomor)
  if (i >= 0) return i
  const adaBernomor = bab.some((b) => nomorDariJudul(b.judul) !== null)
  if (adaBernomor) return -1
  return nomor >= 1 && nomor <= bab.length ? nomor - 1 : -1
}

/** Indeks semua bab "inti": yang judulnya "Bab N", atau semua bab bila tidak ada yang bernomor. */
export function indeksBabInti(bab: readonly Pick<Bab, 'judul'>[]): number[] {
  const bernomor = bab.map((b, i) => (nomorDariJudul(b.judul) !== null ? i : -1)).filter((i) => i >= 0)
  return bernomor.length ? bernomor : bab.map((_, i) => i)
}

export interface BabModal {
  nomor: number
  idx: number
  judul: string
  selesai: boolean
}

export interface ProgresModal {
  total: number
  selesai: number
  bab: BabModal[]
}

/** Seberapa banyak bab "modal" sebuah jalur karier sudah ditandai selesai oleh pembaca. */
export function progresModal(jalur: Pick<JalurKarier, 'bab'>, bab: readonly Pick<Bab, 'judul'>[], selesai: readonly number[]): ProgresModal {
  const sudah = new Set(selesai)
  const daftar: BabModal[] = []
  const nomor = jalur.bab.length ? jalur.bab : indeksBabInti(bab).map((i) => nomorDariJudul(bab[i].judul) ?? i + 1)
  for (const n of nomor) {
    const idx = indeksBabUntuk(bab, n)
    if (idx < 0 || daftar.some((x) => x.idx === idx)) continue
    daftar.push({ nomor: n, idx, judul: bab[idx].judul, selesai: sudah.has(idx) })
  }
  return { total: daftar.length, selesai: daftar.filter((b) => b.selesai).length, bab: daftar }
}

export interface Tingkat {
  nama: string
  deskripsi: string
}

export const TINGKAT: readonly Tingkat[] = [
  { nama: 'Maba Penasaran', deskripsi: 'Kamu baru mulai. Satu bab, satu misi, pelan-pelan saja.' },
  { nama: 'Pengamat Sosial', deskripsi: 'Mata kamu mulai menangkap pola di sekitar.' },
  { nama: 'Peneliti Muda', deskripsi: 'Kamu sudah mulai menguji pikiranmu dengan data dan misi.' },
  { nama: 'Analis Sosial', deskripsi: 'Konsep-konsepnya sudah jadi alat, bukan sekadar hafalan.' },
  { nama: 'Sosiolog Lapangan', deskripsi: 'Hampir tuntas. Tinggal mengunci sisa misi dan kuis.' },
  { nama: 'Navigator Karier', deskripsi: 'Semua poin terkumpul. Saatnya memilih langkah nyatamu.' },
]

export interface Papan {
  bab: { selesai: number; total: number }
  misi: { selesai: number; total: number; poin: number }
  kuis: { benar: number; total: number }
  karier: { ditandai: number; total: number }
  poin: number
  poinMaks: number
  /** 0..1 */
  persen: number
  tingkat: number
}

export interface DataPembaca {
  selesai: readonly number[]
  misi: Record<string, DataMisi>
  kuis: Record<string, JawabanKuis>
  karier: Record<string, DataKarier>
}

/** Kunci semua jalur karier di ebook (dari Peta Karier dan kartu Jalur Karier di bab), tanpa duplikat. */
export function kunciJalurEbook(parsed: ParsedEbook): string[] {
  const k = new Set<string>()
  for (const b of parsed.bab)
    for (const x of b.blok) {
      if (x.tipe === 'peta') for (const j of x.jalur) k.add(j.kunci)
      if (x.tipe === 'karier') k.add(x.kunci)
    }
  return [...k]
}

export function hitungPapan(parsed: ParsedEbook, d: DataPembaca): Papan {
  const inti = indeksBabInti(parsed.bab)
  const babSelesai = inti.filter((i) => d.selesai.includes(i)).length

  const misi = parsed.bab.flatMap((b) => b.blok.filter((x) => x.tipe === 'misi'))
  const misiSelesai = misi.filter((m) => d.misi[m.id]?.selesai)
  const poinMisi = misiSelesai.reduce((a, m) => a + (m.tipe === 'misi' ? m.xp : 0), 0)
  const poinMisiMaks = misi.reduce((a, m) => a + (m.tipe === 'misi' ? m.xp : 0), 0)

  const kuis = parsed.bab.flatMap((b) => b.blok.filter((x) => x.tipe === 'kuis'))
  const kuisBenar = kuis.filter((q) => d.kuis[q.id]?.pertamaBenar === true).length

  const kunci = kunciJalurEbook(parsed)
  const ditandai = kunci.filter((k) => d.karier[k]?.minat).length

  const poin = poinMisi + kuisBenar * POIN_KUIS + babSelesai * POIN_BAB
  const poinMaks = poinMisiMaks + kuis.length * POIN_KUIS + inti.length * POIN_BAB
  const persen = poinMaks > 0 ? Math.min(1, poin / poinMaks) : 0
  const tingkat = persen >= 1 ? TINGKAT.length - 1 : Math.min(TINGKAT.length - 2, Math.floor(persen * (TINGKAT.length - 1)))

  return {
    bab: { selesai: babSelesai, total: inti.length },
    misi: { selesai: misiSelesai.length, total: misi.length, poin: poinMisi },
    kuis: { benar: kuisBenar, total: kuis.length },
    karier: { ditandai, total: kunci.length },
    poin,
    poinMaks,
    persen,
    tingkat,
  }
}
