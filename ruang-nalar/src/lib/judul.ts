// Judul tab browser per halaman. Dikembalikan ke judul semula saat halaman ditinggalkan.

import { useEffect } from 'react'
import { NAMA_WEB } from '../config'

export function judulHalaman(judul: string): string {
  return judul ? `${judul} — ${NAMA_WEB}` : NAMA_WEB
}

export function useJudulHalaman(judul: string) {
  useEffect(() => {
    const lama = document.title
    document.title = judulHalaman(judul)
    return () => {
      document.title = lama
    }
  }, [judul])
}
