// Ringkasan data baca untuk dasbor. Semua dihitung dari isi kv (IndexedDB) dan daftar ebook, tanpa menyimpan apa pun.

import { cariPara } from './parser'
import { K } from './store'
import type { Ebook, JawabanKuis, PosisiBaca, Sorotan } from './types'

type Kv = Record<string, unknown>

const daftarAngka = (x: unknown): number[] => (Array.isArray(x) ? x.filter((n): n is number => Number.isInteger(n)) : [])
const daftarTeks = (x: unknown): string[] => (Array.isArray(x) ? x.filter((s): s is string => typeof s === 'string') : [])
const objek = (x: unknown): Record<string, unknown> => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {})

function bacaPosisi(x: unknown): PosisiBaca | null {
  const o = objek(x)
  if (typeof o.bab !== 'number' || typeof o.pct !== 'number' || typeof o.t !== 'number') return null
  return { bab: o.bab, pct: o.pct, t: o.t }
}

export interface RiwayatItem {
  ebook: Ebook
  /** waktu terakhir dibaca (ms) */
  terakhir: number
  babTerakhir: number
  babSelesai: number
  totalBab: number
  /** 0..100: bab selesai ditambah sisa bab yang sedang dibaca */
  persen: number
}

/** Ebook yang pernah dibuka (punya posisi baca atau bab selesai), terbaru dulu. */
export function riwayatBaca(ebooks: readonly Ebook[], kv: Kv): RiwayatItem[] {
  const hasil: RiwayatItem[] = []
  for (const e of ebooks) {
    const total = e.parsed.bab.length
    if (total === 0) continue
    const pos = bacaPosisi(kv[K.posisi(e.id)])
    const selesai = new Set(daftarAngka(kv[K.selesai(e.id)]).filter((i) => i >= 0 && i < total))
    if (!pos && selesai.size === 0) continue
    const sedang = pos && pos.bab >= 0 && pos.bab < total && !selesai.has(pos.bab) ? Math.min(1, Math.max(0, pos.pct)) : 0
    hasil.push({
      ebook: e,
      terakhir: pos?.t ?? 0,
      babTerakhir: pos && pos.bab >= 0 && pos.bab < total ? pos.bab : 0,
      babSelesai: selesai.size,
      totalBab: total,
      persen: Math.round(((selesai.size + sedang) / total) * 100),
    })
  }
  return hasil.sort((a, b) => b.terakhir - a.terakhir)
}

export interface RingkasBaca {
  ebookDibuka: number
  ebookSelesai: number
  babSelesai: number
  kuisSempurna: number
  sorotan: number
  catatan: number
  penanda: number
}

export function ringkasBaca(ebooks: readonly Ebook[], kv: Kv): RingkasBaca {
  const r: RingkasBaca = { ebookDibuka: 0, ebookSelesai: 0, babSelesai: 0, kuisSempurna: 0, sorotan: 0, catatan: 0, penanda: 0 }
  for (const e of ebooks) {
    const total = e.parsed.bab.length
    const selesai = new Set(daftarAngka(kv[K.selesai(e.id)]).filter((i) => i >= 0 && i < total))
    const sorot = Array.isArray(kv[K.sorot(e.id)]) ? (kv[K.sorot(e.id)] as Sorotan[]).length : 0
    const catatan = Object.keys(objek(kv[K.catatan(e.id)])).length
    const penanda = daftarTeks(kv[K.penanda(e.id)]).length
    if (total > 0 && (bacaPosisi(kv[K.posisi(e.id)]) || selesai.size > 0)) r.ebookDibuka++
    if (total > 0 && selesai.size === total) r.ebookSelesai++
    r.babSelesai += selesai.size
    r.sorotan += sorot
    r.catatan += catatan
    r.penanda += penanda
    if (e.parsed.jumlahKuis > 0) {
      const jawab = objek(kv[K.kuis(e.id)]) as Record<string, JawabanKuis>
      const ids: string[] = []
      for (const b of e.parsed.bab) for (const k of b.blok) if (k.tipe === 'kuis') ids.push(k.id)
      if (ids.length > 0 && ids.every((id) => jawab[id]?.pertamaBenar === true)) r.kuisSempurna++
    }
  }
  return r
}

export interface PenandaItem {
  ebook: Ebook
  paraId: string
  babIdx: number
  cuplikan: string
}

/** Semua penanda (bookmark paragraf) dari semua ebook, dikelompokkan per ebook mengikuti urutan pustaka. */
export function daftarPenanda(ebooks: readonly Ebook[], kv: Kv): PenandaItem[] {
  const hasil: PenandaItem[] = []
  for (const e of ebooks) {
    for (const id of daftarTeks(kv[K.penanda(e.id)])) {
      const h = cariPara(e.parsed, id)
      if (!h) continue
      const t = h.para.teks
      hasil.push({ ebook: e, paraId: id, babIdx: h.babIdx, cuplikan: t.length > 110 ? t.slice(0, 110).trimEnd() + '…' : t })
    }
  }
  return hasil.sort((a, b) => a.babIdx - b.babIdx || a.paraId.localeCompare(b.paraId, undefined, { numeric: true }))
}

/** Sapaan menurut jam (waktu perangkat). */
export function sapaanWaktu(jam: number): string {
  if (jam < 4) return 'Masih terjaga'
  if (jam < 11) return 'Selamat pagi'
  if (jam < 15) return 'Selamat siang'
  if (jam < 19) return 'Selamat sore'
  return 'Selamat malam'
}
