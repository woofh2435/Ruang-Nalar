// Jalur pesan kecil antara komponen dan lapisan efek (FxLayer): percikan & hujan kelopak.

export type PesanFx =
  | { jenis: 'percik'; x: number; y: number; warna?: string[] }
  | { jenis: 'kelopak' }

type Pendengar = (e: PesanFx) => void
const daftar = new Set<Pendengar>()

export const fx = {
  /** dengarkan semua efek; mengembalikan fungsi untuk berhenti */
  pantau(f: Pendengar) {
    daftar.add(f)
    return () => {
      daftar.delete(f)
    }
  },
  /** percikan cat di titik layar (x, y) */
  percik(x: number, y: number, warna?: string[]) {
    daftar.forEach((f) => f({ jenis: 'percik', x, y, warna }))
  },
  /** hujan kelopak bunga matahari */
  kelopak() {
    daftar.forEach((f) => f({ jenis: 'kelopak' }))
  },
}
