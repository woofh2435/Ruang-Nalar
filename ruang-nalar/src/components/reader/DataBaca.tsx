// Data milik pembaca untuk satu ebook: sorotan, catatan tempel, penanda, jawaban kuis,
// jawaban refleksi, dan bab yang selesai. Semua disimpan di IndexedDB (lewat store).
// Mode pratinjau admin memakai versi di memori (tidak menyimpan apa pun).

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { K, useKv } from '../../lib/store'
import type { JawabanKuis, Sorotan, WarnaSorot } from '../../lib/types'

export interface DataBaca {
  /** true = tersimpan di IndexedDB; false = hanya di memori (pratinjau admin) */
  persist: boolean
  sorotan: Sorotan[]
  tambahSorot: (para: string, mulai: number, akhir: number, warna: WarnaSorot) => void
  hapusSorot: (id: string) => void
  catatan: Record<string, string>
  setCatatan: (para: string, teks: string) => void
  /** paragraf yang kotak catatannya sedang dibuka (walau masih kosong) */
  catatanTerbuka: string[]
  bukaCatatan: (para: string, buka: boolean) => void
  penanda: string[]
  togglePenanda: (para: string) => boolean
  kuis: Record<string, JawabanKuis>
  jawab: (id: string, pilih: number, benar: boolean) => void
  ulangiKuis: (id: string) => void
  refleksi: Record<string, string>
  setRefleksi: (id: string, teks: string) => void
  selesai: number[]
  tandaiSelesai: (bab: number) => void
}

const Ctx = createContext<DataBaca | null>(null)

export function useDataBaca(): DataBaca {
  const c = useContext(Ctx)
  if (!c) throw new Error('useDataBaca harus dipakai di dalam <DataBacaProvider>')
  return c
}

/** Pilih antara penyimpanan permanen (useKv) dan memori sementara (useState). */
function useData<T>(kunci: string, awal: T, persist: boolean): [T, (n: T | ((p: T) => T)) => void] {
  const kv = useKv<T>(kunci, awal)
  const lokal = useState<T>(awal)
  return (persist ? kv : lokal) as [T, (n: T | ((p: T) => T)) => void]
}

const idBaru = () => 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

export function DataBacaProvider({ ebookId, children }: { ebookId: string | null; children: ReactNode }) {
  const persist = ebookId !== null
  const id = ebookId ?? '__pratinjau__'

  const [sorotan, setSorotan] = useData<Sorotan[]>(K.sorot(id), [], persist)
  const [catatan, setCatatanMap] = useData<Record<string, string>>(K.catatan(id), {}, persist)
  const [penanda, setPenanda] = useData<string[]>(K.penanda(id), [], persist)
  const [kuis, setKuis] = useData<Record<string, JawabanKuis>>(K.kuis(id), {}, persist)
  const [refleksi, setRefleksiMap] = useData<Record<string, string>>(K.refleksi(id), {}, persist)
  const [selesai, setSelesai] = useData<number[]>(K.selesai(id), [], persist)
  const [catatanTerbuka, setTerbuka] = useState<string[]>([])

  const tambahSorot = useCallback(
    (para: string, mulai: number, akhir: number, warna: WarnaSorot) =>
      setSorotan((p) => [...p, { id: idBaru(), para, mulai, akhir, warna }]),
    [setSorotan],
  )
  const hapusSorot = useCallback((sid: string) => setSorotan((p) => p.filter((s) => s.id !== sid)), [setSorotan])

  const setCatatan = useCallback(
    (para: string, teks: string) =>
      setCatatanMap((p) => {
        const n = { ...p }
        if (teks.trim()) n[para] = teks
        else delete n[para]
        return n
      }),
    [setCatatanMap],
  )
  const bukaCatatan = useCallback(
    (para: string, buka: boolean) =>
      setTerbuka((p) => (buka ? (p.includes(para) ? p : [...p, para]) : p.filter((x) => x !== para))),
    [],
  )

  const togglePenanda = useCallback(
    (para: string) => {
      const ada = penanda.includes(para)
      setPenanda((p) => (p.includes(para) ? p.filter((x) => x !== para) : [...p, para]))
      return !ada
    },
    [penanda, setPenanda],
  )

  const jawab = useCallback(
    (kid: string, pilih: number, benar: boolean) =>
      setKuis((p) => ({ ...p, [kid]: { pilih, benar, pertamaBenar: p[kid] ? p[kid].pertamaBenar : benar } })),
    [setKuis],
  )
  const ulangiKuis = useCallback(
    (kid: string) =>
      setKuis((p) => (p[kid] ? { ...p, [kid]: { ...p[kid], pilih: -1, benar: false } } : p)),
    [setKuis],
  )

  const setRefleksi = useCallback(
    (rid: string, teks: string) =>
      setRefleksiMap((p) => {
        const n = { ...p }
        if (teks.trim()) n[rid] = teks
        else delete n[rid]
        return n
      }),
    [setRefleksiMap],
  )

  const tandaiSelesai = useCallback(
    (bab: number) => setSelesai((p) => (p.includes(bab) ? p : [...p, bab].sort((a, b) => a - b))),
    [setSelesai],
  )

  const nilai = useMemo<DataBaca>(
    () => ({
      persist,
      sorotan,
      tambahSorot,
      hapusSorot,
      catatan,
      setCatatan,
      catatanTerbuka,
      bukaCatatan,
      penanda,
      togglePenanda,
      kuis,
      jawab,
      ulangiKuis,
      refleksi,
      setRefleksi,
      selesai,
      tandaiSelesai,
    }),
    [persist, sorotan, tambahSorot, hapusSorot, catatan, setCatatan, catatanTerbuka, bukaCatatan, penanda, togglePenanda, kuis, jawab, ulangiKuis, refleksi, setRefleksi, selesai, tandaiSelesai],
  )

  return <Ctx.Provider value={nilai}>{children}</Ctx.Provider>
}
