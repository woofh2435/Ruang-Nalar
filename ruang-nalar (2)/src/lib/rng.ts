// Pengacak berbiji (seeded): gambar procedural selalu sama untuk biji yang sama.

/** Pembuat angka acak 0..1 yang deterministik (mulberry32). */
export function acak(biji: number | string): () => number {
  let a = (typeof biji === 'string' ? hashBiji(biji) : biji) >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Bilangan di antara min dan max memakai pengacak `r`. */
export const antara = (r: () => number, min: number, max: number) => min + r() * (max - min)

/** Ubah teks menjadi biji bilangan (untuk gambar yang konsisten per judul / id). */
export function hashBiji(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
