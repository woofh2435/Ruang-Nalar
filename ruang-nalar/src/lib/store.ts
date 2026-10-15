// Penyimpanan data aplikasi: ebook buatan admin + semua data pembaca.
// Cara kerja: salinan di memori (cepat, dibaca React lewat useSyncExternalStore),
// setiap perubahan langsung ditulis ke IndexedDB.

import { useCallback, useRef, useSyncExternalStore } from 'react'
import * as db from './db'
import type { CatatanEbookLokal, TemaGlobal } from './types'

export interface StoreState {
  siap: boolean
  penyimpanan: db.JenisPenyimpanan
  ebook: CatatanEbookLokal[]
  kv: Record<string, unknown>
}

let state: StoreState = { siap: false, penyimpanan: 'memori', ebook: [], kv: {} }
const pendengar = new Set<() => void>()

function ubah(next: Partial<StoreState>) {
  state = { ...state, ...next }
  pendengar.forEach((f) => f())
}

export const subscribe = (f: () => void) => {
  pendengar.add(f)
  return () => {
    pendengar.delete(f)
  }
}
export const ambilState = () => state

let janjiMulai: Promise<void> | null = null
export function mulaiStore(): Promise<void> {
  if (!janjiMulai) {
    janjiMulai = db
      .muatSemua()
      .then(({ penyimpanan, ebook, kv }) => {
        ubah({ siap: true, penyimpanan, ebook: [...ebook].sort((a, b) => a.dibuat - b.dibuat), kv: { ...state.kv, ...kv } })
      })
      .catch(() => ubah({ siap: true }))
  }
  return janjiMulai
}

// ---------- kunci data pembaca ----------
export const K = {
  urutan: 'urutan',
  tema: 'tema',
  fontBaca: 'ukuranHuruf',
  nalarKecil: 'nalarDiminimalkan',
  posisi: (id: string) => `pos:${id}`,
  sorot: (id: string) => `sorot:${id}`,
  catatan: (id: string) => `catatan:${id}`,
  penanda: (id: string) => `penanda:${id}`,
  selesai: (id: string) => `selesai:${id}`,
  kuis: (id: string) => `kuis:${id}`,
  refleksi: (id: string) => `refleksi:${id}`,
}
const AWALAN_DATA_BACA = ['pos', 'sorot', 'catatan', 'penanda', 'selesai', 'kuis', 'refleksi']

// ---------- kv ----------
export function kvAmbil<T>(kunci: string, awal: T): T {
  const v = state.kv[kunci]
  return v === undefined ? awal : (v as T)
}

export function kvSimpan(kunci: string, nilai: unknown) {
  ubah({ kv: { ...state.kv, [kunci]: nilai } })
  void db.simpanKv(kunci, nilai)
}

export function kvHapus(kunci: string) {
  if (!(kunci in state.kv)) return
  const kv = { ...state.kv }
  delete kv[kunci]
  ubah({ kv })
  void db.hapusKv(kunci)
}

export function useKv<T>(kunci: string, awal: T): [T, (n: T | ((p: T) => T)) => void] {
  const awalRef = useRef(awal)
  const nilai = useSyncExternalStore(
    subscribe,
    () => {
      const v = state.kv[kunci]
      return (v === undefined ? awalRef.current : v) as T
    },
    () => awalRef.current,
  )
  const set = useCallback(
    (n: T | ((p: T) => T)) => {
      const prev = kvAmbil<T>(kunci, awalRef.current)
      kvSimpan(kunci, typeof n === 'function' ? (n as (p: T) => T)(prev) : n)
    },
    [kunci],
  )
  return [nilai, set]
}

export function useStoreSiap(): boolean {
  return useSyncExternalStore(subscribe, () => state.siap, () => false)
}

export function useEbookLokal(): CatatanEbookLokal[] {
  return useSyncExternalStore(subscribe, () => state.ebook, () => state.ebook)
}

export function usePenyimpanan(): db.JenisPenyimpanan {
  return useSyncExternalStore(subscribe, () => state.penyimpanan, () => 'memori' as const)
}

// ---------- ebook lokal ----------
export function buatId(): string {
  return 'lokal-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export function simpanEbookLokal(rec: CatatanEbookLokal) {
  const ada = state.ebook.some((e) => e.id === rec.id)
  ubah({ ebook: ada ? state.ebook.map((e) => (e.id === rec.id ? rec : e)) : [...state.ebook, rec] })
  void db.simpanEbook(rec)
}

export function hapusDataBaca(id: string) {
  for (const a of AWALAN_DATA_BACA) kvHapus(`${a}:${id}`)
}

export function hapusEbookLokal(id: string) {
  ubah({ ebook: state.ebook.filter((e) => e.id !== id) })
  void db.hapusEbook(id)
  hapusDataBaca(id)
  const urutan = kvAmbil<string[]>(K.urutan, [])
  if (urutan.includes(id)) kvSimpan(K.urutan, urutan.filter((x) => x !== id))
}

// ---------- tema web (Malam Berbintang / Ladang Matahari) ----------
export function terapkanTema(t: TemaGlobal) {
  try {
    document.documentElement.setAttribute('data-theme', t)
    const m = document.querySelector('meta[name="theme-color"]')
    if (m) m.setAttribute('content', t === 'malam' ? '#1c2b6b' : '#f6d24b')
  } catch {
    /* abaikan */
  }
  try {
    localStorage.setItem('rn-tema', t)
  } catch {
    /* abaikan */
  }
}

export function temaSaatIni(): TemaGlobal {
  const k = state.kv[K.tema]
  if (k === 'malam' || k === 'ladang') return k
  const a = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : null
  return a === 'ladang' ? 'ladang' : 'malam'
}

export function useTemaGlobal(): [TemaGlobal, (t: TemaGlobal) => void] {
  const t = useSyncExternalStore(subscribe, temaSaatIni, () => 'malam' as TemaGlobal)
  const set = useCallback((n: TemaGlobal) => {
    kvSimpan(K.tema, n)
    terapkanTema(n)
  }, [])
  return [t, set]
}

// ---------- kunci admin (hanya selama tab terbuka) ----------
// Pengunci ringan di sisi klien, bukan keamanan sungguhan (lihat src/config.ts).
const KUNCI_SESI_ADMIN = 'rn-admin-terbuka'
export function adminTerbuka(): boolean {
  try {
    return sessionStorage.getItem(KUNCI_SESI_ADMIN) === '1'
  } catch {
    return false
  }
}
export function setAdminTerbuka(v: boolean) {
  try {
    if (v) sessionStorage.setItem(KUNCI_SESI_ADMIN, '1')
    else sessionStorage.removeItem(KUNCI_SESI_ADMIN)
  } catch {
    /* abaikan */
  }
}
