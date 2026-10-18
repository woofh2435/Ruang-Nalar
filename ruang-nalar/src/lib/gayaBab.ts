// Gaya kepala bab. Tiap ebook punya urutan gayanya sendiri (dari id), dan dua bab yang berurutan tidak pernah sama,
// jadi halaman baca tidak monoton. Fungsi murni supaya mudah diuji (tests/variasi.test.ts).

import { acak } from './rng'

export type GayaBab = 'klasik' | 'angka' | 'pita' | 'tengah' | 'tepi'

export const GAYA_BAB: readonly GayaBab[] = ['klasik', 'angka', 'pita', 'tengah', 'tepi']

/** Gaya yang membuka bab dengan huruf awal besar (drop cap) pada paragraf pertama. */
export const GAYA_INISIAL: ReadonlySet<GayaBab> = new Set<GayaBab>(['angka', 'tengah'])

/**
 * Gaya untuk bab ke-`indeks` (mulai 0) pada ebook `idEbook`.
 * Langkah 1..4 saling prima dengan 5, jadi 5 bab berturut-turut memakai kelima gaya tepat satu kali.
 */
export function gayaBab(idEbook: string, indeks: number): GayaBab {
  const r = acak('gaya|' + idEbook)
  const awal = Math.floor(r() * GAYA_BAB.length)
  const langkah = 1 + Math.floor(r() * (GAYA_BAB.length - 1))
  const i = Math.max(0, Math.floor(indeks))
  return GAYA_BAB[(awal + i * langkah) % GAYA_BAB.length]
}
