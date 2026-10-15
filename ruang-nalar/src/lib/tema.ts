import type { TemaGlobal, TemaId } from './types'

/** Warna kulit Nalar (kamuflase). */
export interface Kulit {
  dasar: string
  bayang: string
  terang: string
  bintik: string
}

export interface TemaPreset {
  id: TemaId
  nama: string
  /** warna dasar sampul / pita bab */
  dasar: string
  dasar2: string
  /** warna sorotan / hiasan */
  aksen: string
  /** warna teks di atas dasar (kontras AA, dicek di tests/) */
  teks: string
  motif: 'pusaran' | 'bunga-matahari' | 'iris' | 'almond' | 'matahari-api'
  kulit: Kulit
}

export const TEMA: Record<TemaId, TemaPreset> = {
  malam: {
    id: 'malam',
    nama: 'Malam Berbintang',
    dasar: '#1c2b6b',
    dasar2: '#2f4ba2',
    aksen: '#f6d24b',
    teks: '#f4e9cf',
    motif: 'pusaran',
    kulit: { dasar: '#3c9bb8', bayang: '#256f8c', terang: '#c4ecdc', bintik: '#f6d24b' },
  },
  siang: {
    id: 'siang',
    nama: 'Siang Ladang',
    dasar: '#f6d24b',
    dasar2: '#e8892b',
    aksen: '#4f7a3a',
    teks: '#1a1a2e',
    motif: 'bunga-matahari',
    kulit: { dasar: '#5c9a35', bayang: '#3d6f23', terang: '#e9f5a6', bintik: '#e8892b' },
  },
  iris: {
    id: 'iris',
    nama: 'Iris Ungu',
    dasar: '#5b4b9a',
    dasar2: '#2f4ba2',
    aksen: '#f6d24b',
    teks: '#f4e9cf',
    motif: 'iris',
    kulit: { dasar: '#8a70d2', bayang: '#5b4b9a', terang: '#e6dcfb', bintik: '#f6d24b' },
  },
  almond: {
    id: 'almond',
    nama: 'Almond Mekar',
    dasar: '#4aa3c7',
    dasar2: '#a9d9ea',
    aksen: '#f4e9cf',
    teks: '#1a1a2e',
    motif: 'almond',
    kulit: { dasar: '#e8939f', bayang: '#c0647a', terang: '#fde6ea', bintik: '#ffffff' },
  },
  api: {
    id: 'api',
    nama: 'Matahari Api',
    dasar: '#f26a1b',
    dasar2: '#e8892b',
    aksen: '#f6d24b',
    teks: '#1a1a2e',
    motif: 'matahari-api',
    kulit: { dasar: '#e25a22', bayang: '#a83a12', terang: '#ffd9a0', bintik: '#f6d24b' },
  },
}

export const DAFTAR_TEMA: TemaPreset[] = [TEMA.malam, TEMA.siang, TEMA.iris, TEMA.almond, TEMA.api]

export function normalisasiTema(x: string | undefined | null): TemaId | null {
  const s = (x ?? '').trim().toLowerCase()
  return s === 'malam' || s === 'siang' || s === 'iris' || s === 'almond' || s === 'api' ? s : null
}

/** Kulit Nalar mengikuti tema web saat berada di beranda. */
export function kulitTemaGlobal(t: TemaGlobal): Kulit {
  return t === 'malam' ? TEMA.malam.kulit : TEMA.siang.kulit
}

export const IKON_SAMPUL = [
  '🦎', '📚', '🌻', '🌙', '⭐', '🧠', '🏛️', '🎭', '🔥', '🌸', '⚖️', '🗣️', '🧩', '🌍', '🔍', '💡',
]
