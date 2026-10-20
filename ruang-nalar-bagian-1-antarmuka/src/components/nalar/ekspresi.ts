import type { MoodNalar } from '../../lib/types'

// Bentuk mulut: semua memakai struktur path yang sama (M C C Z) supaya bisa dianimasikan mulus.
const M = (p: [number, number, number, number, number, number, number, number, number, number, number, number]) =>
  `M${p[0]} ${p[1]} C${p[2]} ${p[3]} ${p[4]} ${p[5]} ${p[6]} ${p[7]} C${p[8]} ${p[9]} ${p[10]} ${p[11]} ${p[0]} ${p[1]} Z`

export const MULUT = {
  senang: M([322, 190, 338, 200, 356, 200, 372, 184, 356, 203, 338, 203]),
  semangat: M([322, 190, 338, 200, 356, 200, 372, 184, 362, 222, 332, 222]),
  kaget: M([346, 180, 366, 184, 366, 208, 346, 212, 326, 208, 326, 184]),
  sedih: M([324, 197, 338, 181, 356, 181, 370, 195, 356, 185, 338, 185]),
  mikir: M([326, 192, 340, 197, 354, 184, 370, 186, 354, 187, 340, 200]),
  ngantuk: M([346, 187, 357, 189, 357, 205, 346, 206, 335, 205, 335, 189]),
  bangga: M([320, 192, 338, 205, 360, 201, 374, 176, 360, 204, 338, 208]),
  nakal: M([322, 190, 340, 202, 358, 198, 372, 180, 358, 201, 340, 205]),
}

export type Ekstra = 'zzz' | 'tanya' | 'keringat' | 'airMata' | 'kilau' | null

export interface Ekspresi {
  /** 0 = mata terbuka, 1 = tertutup (kiri, kanan) */
  lidK: number
  lidB: number
  /** kemiringan kelopak (derajat), positif = sisi luar turun (sedih) */
  miring: number
  /** mata melengkung ^ ^ */
  busur: boolean
  pupil: number
  mata: number
  mulut: string
  pipi: number
  kepala: number
  /** periode goyang ekor (detik) */
  ekor: number
  ekstra: Ekstra
  lidahNakal: boolean
  /** paksa arah pandang pupil (x, y) dalam satuan SVG */
  tatap: [number, number] | null
  label: string
}

export const EKSPRESI: Record<MoodNalar, Ekspresi> = {
  senang: { lidK: 0, lidB: 0, miring: 0, busur: false, pupil: 1, mata: 1, mulut: MULUT.senang, pipi: 0.35, kepala: 0, ekor: 3.4, ekstra: null, lidahNakal: false, tatap: null, label: 'senang' },
  mikir: { lidK: 0.28, lidB: 0, miring: 0, busur: false, pupil: 1, mata: 1, mulut: MULUT.mikir, pipi: 0, kepala: -4, ekor: 4.8, ekstra: 'tanya', lidahNakal: false, tatap: [-6, -6.5], label: 'berpikir' },
  kaget: { lidK: 0, lidB: 0, miring: 0, busur: false, pupil: 0.55, mata: 1.16, mulut: MULUT.kaget, pipi: 0, kepala: 0, ekor: 0.9, ekstra: 'keringat', lidahNakal: false, tatap: null, label: 'kaget' },
  ngantuk: { lidK: 0.72, lidB: 0.72, miring: 0, busur: false, pupil: 0.9, mata: 1, mulut: MULUT.ngantuk, pipi: 0.15, kepala: 6, ekor: 7.5, ekstra: 'zzz', lidahNakal: false, tatap: [0, 4], label: 'mengantuk' },
  semangat: { lidK: 0, lidB: 0, miring: 0, busur: false, pupil: 1.15, mata: 1.05, mulut: MULUT.semangat, pipi: 0.5, kepala: 0, ekor: 1.1, ekstra: 'kilau', lidahNakal: false, tatap: null, label: 'semangat' },
  sedih: { lidK: 0.3, lidB: 0.3, miring: 16, busur: false, pupil: 1.15, mata: 1, mulut: MULUT.sedih, pipi: 0, kepala: 5, ekor: 6.5, ekstra: 'airMata', lidahNakal: false, tatap: [0, 4], label: 'sedih' },
  bangga: { lidK: 1, lidB: 1, miring: 0, busur: true, pupil: 1, mata: 1, mulut: MULUT.bangga, pipi: 0.55, kepala: -3, ekor: 2.4, ekstra: 'kilau', lidahNakal: false, tatap: null, label: 'bangga' },
  'kedip-nakal': { lidK: 0, lidB: 1, miring: 0, busur: false, pupil: 1, mata: 1, mulut: MULUT.nakal, pipi: 0.5, kepala: -2, ekor: 2.6, ekstra: null, lidahNakal: true, tatap: null, label: 'nakal' },
}
