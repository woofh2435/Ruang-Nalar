/** Pilihan ukuran huruf bacaan (px). Dipakai pembaca dan pengaturan di dasbor. */
export const UKURAN_HURUF = [15, 16, 17, 18, 20, 22, 24, 26]
export const UKURAN_HURUF_BAWAAN = 18

/** Ukuran yang valid terdekat (ke atas) dari nilai tersimpan; nilai rusak → bawaan. */
export function ukuranValid(x: unknown): number {
  if (typeof x !== 'number' || !Number.isFinite(x)) return UKURAN_HURUF_BAWAAN
  return UKURAN_HURUF.find((u) => u >= x) ?? UKURAN_HURUF[UKURAN_HURUF.length - 1]
}
