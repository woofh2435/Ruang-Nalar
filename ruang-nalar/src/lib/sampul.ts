// Rancangan sampul ebook: komposisi dan variasi gambar dipilih dari judul + id, jadi tiap buku tampil berbeda tetapi
// buku yang sama selalu tampil sama. Fungsi murni supaya mudah diuji (tests/variasi.test.ts).

import { acak } from './rng'

export type KomposisiSampul = 'klasik' | 'bingkai' | 'atas' | 'medalion' | 'diagonal' | 'kolase'

/** Komposisi yang dipilih acak dari judul + id. 'kolase' sengaja tidak ikut: ia hanya dipakai kalau ebook meminta lewat tag. */
export const KOMPOSISI: readonly KomposisiSampul[] = ['klasik', 'bingkai', 'atas', 'medalion', 'diagonal']

/**
 * Tag khusus yang meminta sampul kolase. Dipakai sebagai tag supaya gaya sampul ikut terbawa ke katalog toko
 * (yang kolomnya tetap) tanpa mengubah skema database. Tag berawalan "sampul-" tidak ditampilkan ke pembaca.
 */
export const TAG_SAMPUL_KOLASE = 'sampul-kolase'

const awalanSampul = 'sampul-'

/** Tag yang boleh dilihat pembaca: tag teknis berawalan "sampul-" disembunyikan. */
export const tagTampil = (tag: readonly string[]): string[] => tag.filter((t) => !t.trim().toLowerCase().startsWith(awalanSampul))

export const mintaKolase = (tag: readonly string[] | undefined): boolean => !!tag && tag.some((t) => t.trim().toLowerCase() === TAG_SAMPUL_KOLASE)

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

export function rancangSampul(judul: string, id: string, tag?: readonly string[]): RancanganSampul {
  const r = acak('rancang|' + judul + '|' + id)
  const acakan = KOMPOSISI[Math.floor(r() * KOMPOSISI.length)]
  const komposisi: KomposisiSampul = mintaKolase(tag) ? 'kolase' : acakan
  return {
    komposisi,
    cermin: r() < 0.5,
    skala: 1 + r() * 0.18,
    geserX: (r() - 0.5) * 8,
    geserY: (r() - 0.5) * 6,
  }
}
