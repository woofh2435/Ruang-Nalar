// Pencarian dan penyaringan ebook di dasbor. Fungsi murni supaya mudah diuji.

import { tagTampil } from './sampul'
import { TEMA } from './tema'
import type { Ebook, TemaId } from './types'

export type Akses = 'semua' | 'gratis' | 'berbayar'

export interface FilterCari {
  q: string
  tema: TemaId | ''
  tag: string
  akses: Akses
}

export const FILTER_KOSONG: FilterCari = { q: '', tema: '', tag: '', akses: 'semua' }

/** Huruf kecil, tanpa aksen, spasi dirapikan: "Émile  Durkheim" cocok dengan "emile durkheim". */
export function normal(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

const jerami = (e: Ebook): string => {
  const m = e.parsed.meta
  return normal([m.judul, m.subjudul, m.penulis, m.deskripsi, tagTampil(m.tag).join(' '), TEMA[m.tema].nama].join(' '))
}

/** Semua kata pencarian harus ada (urutan bebas). Pencarian kosong = semua cocok. */
export function cocokKata(teks: string, q: string): boolean {
  const kata = normal(q).split(' ').filter(Boolean)
  const j = normal(teks)
  return kata.every((k) => j.includes(k))
}

export function cariEbook(daftar: readonly Ebook[], f: FilterCari): Ebook[] {
  return daftar.filter((e) => {
    const m = e.parsed.meta
    if (f.tema && m.tema !== f.tema) return false
    if (f.tag && !m.tag.some((t) => normal(t) === normal(f.tag))) return false
    const berbayar = e.sumber === 'toko'
    if (f.akses === 'gratis' && berbayar) return false
    if (f.akses === 'berbayar' && !berbayar) return false
    return cocokKata(jerami(e), f.q)
  })
}

/** Tag unik dari semua ebook, diurutkan dari yang paling sering dipakai. */
export function semuaTag(daftar: readonly Ebook[]): string[] {
  const hitung = new Map<string, { teks: string; n: number }>()
  for (const e of daftar) {
    for (const t of tagTampil(e.parsed.meta.tag)) {
      const k = normal(t)
      if (!k) continue
      const ada = hitung.get(k)
      if (ada) ada.n++
      else hitung.set(k, { teks: t, n: 1 })
    }
  }
  return [...hitung.values()].sort((a, b) => b.n - a.n || a.teks.localeCompare(b.teks, 'id')).map((x) => x.teks)
}

/** Tema yang benar-benar dipakai di pustaka, urut sesuai urutan bawaan TEMA. */
export function temaTerpakai(daftar: readonly Ebook[]): TemaId[] {
  const pakai = new Set(daftar.map((e) => e.parsed.meta.tema))
  return (Object.keys(TEMA) as TemaId[]).filter((t) => pakai.has(t))
}

export const filterAktif = (f: FilterCari): boolean => !!(f.q.trim() || f.tema || f.tag || f.akses !== 'semua')
