// Rancangan sampul ebook: komposisi dan variasi gambar dipilih dari judul + id, jadi tiap buku tampil berbeda tetapi
// buku yang sama selalu tampil sama. Fungsi murni supaya mudah diuji (tests/variasi.test.ts).

import { acak } from './rng'

export type KomposisiSampul = 'klasik' | 'bingkai' | 'atas' | 'medalion' | 'diagonal'

export const KOMPOSISI: readonly KomposisiSampul[] = ['klasik', 'bingkai', 'atas', 'medalion', 'diagonal']

export interface RancanganSampul {
  komposisi: KomposisiSampul
  /** gambar dicerminkan kiri-kanan */
  cermin: boolean
  /** pembesaran gambar, 1..1.18 */
  skala: number
  /** pergeseran gambar dalam persen lebar/tinggi */
  geserX: number
  geserY: number
}

export function rancangSampul(judul: string, id: string): RancanganSampul {
  const r = acak('rancang|' + judul + '|' + id)
  const komposisi = KOMPOSISI[Math.floor(r() * KOMPOSISI.length)]
  return {
    komposisi,
    cermin: r() < 0.5,
    skala: 1 + r() * 0.18,
    geserX: (r() - 0.5) * 8,
    geserY: (r() - 0.5) * 6,
  }
}
