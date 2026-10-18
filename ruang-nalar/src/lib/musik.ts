// Daftar musik latar dan aturan murninya (tanpa WebAudio, supaya bisa diuji di Node).
// Semua suara disintesis di browser (lihat penghasilMusik.ts): tidak ada berkas audio, tidak ada hak cipta pihak lain.

export type JenisMusik = 'ambien' | 'lofi' | 'hujan' | 'alam'

/** Satu akor: nada bas (nomor MIDI) dan nada-nada akor (nomor MIDI). */
export interface Akor {
  bas: number
  nada: number[]
}

export interface Lagu {
  id: string
  nama: string
  jenis: JenisMusik
  /** satu kalimat pendek untuk pemilih */
  ket: string
  /** hanya jenis lofi */
  lofi?: {
    bpm: number
    /** 0..0.4: seberapa jauh ketukan lemah "ditarik" ke belakang */
    ayun: number
    progresi: Akor[]
    /** nada melodi acak (nomor MIDI) */
    melodi: number[]
  }
}

export const JENIS_MUSIK: Record<JenisMusik, string> = {
  ambien: 'Ambien',
  lofi: 'Lo-fi',
  hujan: 'Hujan',
  alam: 'Alam',
}

export const DAFTAR_MUSIK: readonly Lagu[] = [
  {
    id: 'ambien',
    nama: 'Langit Berputar',
    jenis: 'ambien',
    ket: 'Pad lembut dengan denting pelan, cocok untuk fokus.',
  },
  {
    id: 'lofi-kafe',
    nama: 'Kafe Malam',
    jenis: 'lofi',
    ket: 'Lo-fi santai dengan piano listrik, drum lembut, dan desis piringan hitam.',
    lofi: {
      bpm: 74,
      ayun: 0.22,
      progresi: [
        { bas: 38, nada: [53, 57, 60, 64] }, // Dm9
        { bas: 43, nada: [53, 59, 62, 64] }, // G13
        { bas: 36, nada: [52, 55, 59, 62] }, // Cmaj9
        { bas: 45, nada: [52, 55, 59, 60] }, // Am9
      ],
      melodi: [72, 74, 76, 79, 81],
    },
  },
  {
    id: 'lofi-senja',
    nama: 'Senja Pelan',
    jenis: 'lofi',
    ket: 'Lo-fi lebih lambat dan hangat, seperti sore di beranda.',
    lofi: {
      bpm: 64,
      ayun: 0.3,
      progresi: [
        { bas: 41, nada: [57, 60, 64, 67] }, // Fmaj9
        { bas: 40, nada: [55, 59, 62, 64] }, // Em7
        { bas: 38, nada: [53, 57, 60, 64] }, // Dm9
        { bas: 36, nada: [55, 59, 62, 64] }, // Cmaj9
      ],
      melodi: [67, 69, 72, 74, 76],
    },
  },
  {
    id: 'hujan',
    nama: 'Hujan di Jendela',
    jenis: 'hujan',
    ket: 'Hujan rintik dengan tetes kecil dan guruh jauh yang jarang.',
  },
  {
    id: 'alam',
    nama: 'Hutan dan Sungai',
    jenis: 'alam',
    ket: 'Aliran sungai, angin lembut, dan kicau burung.',
  },
]

export const MUSIK_BAWAAN = 'ambien'
export const VOLUME_BAWAAN = 0.8

export const cariLagu = (id: unknown): Lagu | undefined => (typeof id === 'string' ? DAFTAR_MUSIK.find((l) => l.id === id) : undefined)

/** Id yang dikenal, selain itu kembali ke bawaan (data tersimpan bisa rusak atau berasal dari versi lama). */
export const laguValid = (id: unknown): string => cariLagu(id)?.id ?? MUSIK_BAWAAN

/** Volume 0..1; nilai rusak → bawaan. */
export function volumeValid(x: unknown): number {
  if (typeof x !== 'number' || !Number.isFinite(x)) return VOLUME_BAWAAN
  return Math.min(1, Math.max(0, x))
}

/** Nomor MIDI → frekuensi (Hz). A4 (69) = 440 Hz. */
export const frekMidi = (n: number): number => 440 * 2 ** ((n - 69) / 12)

/** Lama satu langkah 1/16 (detik) pada tempo tertentu. */
export const detikPerLangkah = (bpm: number): number => 60 / bpm / 4

/**
 * Pergeseran waktu (detik) untuk ketukan lemah 1/8 (langkah 2, 6, 10, 14 dari 16). Langkah lain tidak bergeser.
 * `ayun` 0 = lurus, 0.33 = ayunan tripel.
 */
export function geserAyun(langkah: number, bpm: number, ayun: number): number {
  return langkah % 4 === 2 ? ayun * detikPerLangkah(bpm) * 2 : 0
}

/** Pola drum lo-fi satu birama (16 langkah): langkah mana yang berbunyi. */
export const POLA_DRUM = {
  kick: [0, 7, 10],
  snare: [4, 12],
  /** 1/8 dengan kuat-lemah bergantian; angka = kekuatan 0..1 */
  hat: { 0: 0.8, 2: 0.45, 4: 0.7, 6: 0.45, 8: 0.8, 10: 0.45, 12: 0.7, 14: 0.55 } as Record<number, number>,
}

/** Frekuensi semua nada sebuah akor (bas + nada akor). */
export const frekAkor = (a: Akor): number[] => [a.bas, ...a.nada].map(frekMidi)

/** Nada denting ambien (D minor pentatonik, oktaf tinggi), Hz. */
export const SKALA_AMBIEN = [587.33, 698.46, 783.99, 880, 1046.5, 1174.66]

/**
 * Pengali penyeragam kenyaringan per jenis, hasil ukur render offline (RMS ±-24 dBFS di semua jenis).
 * Diuji di tests/musik.test.ts supaya tidak ada jenis yang tertinggal.
 */
export const PENYETARA: Record<JenisMusik, number> = { ambien: 1, lofi: 2.3, hujan: 0.95, alam: 2.2 }
