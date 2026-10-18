// Penghubung antara mesin suara (audio.ts) dan penyimpanan pilihan pengguna (IndexedDB) + hook React.
// Yang disimpan hanya PILIHAN (lagu, volume). Suara sendiri selalu mulai mati; browser mewajibkan ketukan pengguna.

import { useSyncExternalStore } from 'react'
import { bunyiNyala, laguAktif, langgananBunyi, setBunyi, setLagu, setVolume, volumeAktif } from './audio'
import { MUSIK_BAWAAN, VOLUME_BAWAAN } from './musik'
import { K, kvAmbil, kvSimpan } from './store'

export const useBunyiNyala = (): boolean => useSyncExternalStore(langgananBunyi, bunyiNyala, () => false)
export const useLaguAktif = (): string => useSyncExternalStore(langgananBunyi, laguAktif, () => MUSIK_BAWAAN)
export const useVolumeAktif = (): number => useSyncExternalStore(langgananBunyi, volumeAktif, () => VOLUME_BAWAAN)

/** Pasang pilihan tersimpan ke mesin suara (dipanggil sekali setelah penyimpanan siap). Tidak menyalakan suara. */
export function terapkanPilihanMusik() {
  setLagu(kvAmbil<unknown>(K.musik, MUSIK_BAWAAN))
  setVolume(kvAmbil<unknown>(K.volumeMusik, VOLUME_BAWAAN))
}

/** Ganti lagu dan simpan pilihannya. Mengembalikan id lagu yang berlaku. */
export function pilihLagu(id: string): string {
  const v = setLagu(id)
  kvSimpan(K.musik, v)
  return v
}

export function aturVolume(v: number): number {
  const n = setVolume(v)
  kvSimpan(K.volumeMusik, n)
  return n
}

export { setBunyi }
