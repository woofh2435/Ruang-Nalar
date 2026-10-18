// Koleksi pribadi pembaca: rak pribadi ("simpan") dan favorit. Hanya daftar id ebook, disimpan di perangkat ini (IndexedDB).

import { useCallback } from 'react'
import { K, useKv } from './store'

/** Tambah id kalau belum ada, buang kalau sudah ada. Tidak mengubah daftar aslinya. */
export function geserId(daftar: readonly string[], id: string): string[] {
  return daftar.includes(id) ? daftar.filter((x) => x !== id) : [...daftar, id]
}

/** Buang id yang sudah tidak ada di pustaka (ebook dihapus / tidak terbit lagi), tanpa mengubah urutan. */
export function saringId(daftar: readonly string[], ada: ReadonlySet<string>): string[] {
  return daftar.filter((x) => ada.has(x))
}

function useDaftarId(kunci: string): { ids: string[]; ada: (id: string) => boolean; geser: (id: string) => boolean } {
  const [ids, setIds] = useKv<string[]>(kunci, [])
  const geser = useCallback(
    (id: string) => {
      const sudah = ids.includes(id)
      setIds((p) => geserId(Array.isArray(p) ? p : [], id))
      return !sudah
    },
    [ids, setIds],
  )
  return { ids: Array.isArray(ids) ? ids : [], ada: (id) => ids.includes(id), geser }
}

export const useRak = () => useDaftarId(K.rak)
export const useFavorit = () => useDaftarId(K.favorit)
