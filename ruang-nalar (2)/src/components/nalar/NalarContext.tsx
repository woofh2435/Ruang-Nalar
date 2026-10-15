// Otak Nalar: mood, gelembung ucapan, deteksi diam (idle) 30 detik, dan poin kunang-kunang.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { jumlahKata, pilihFrasa, type Kejadian } from '../../lib/phrases'
import type { MoodNalar } from '../../lib/types'

export interface Gelembung {
  id: number
  teks: string
}

export interface NalarApi {
  mood: MoodNalar
  gelembung: Gelembung | null
  poin: number
  /** Ganti ekspresi. Ekspresi sementara kembali ke "senang" setelah `ms` (0 = menetap). */
  setMood: (m: MoodNalar, ms?: number) => void
  /** Nalar berkomentar sesuai kejadian (mood ikut menyesuaikan). */
  katakan: (k: Kejadian) => void
  katakanTeks: (teks: string, mood?: MoodNalar) => void
  tambahPoin: (n?: number) => void
  tutupGelembung: () => void
}

const Ctx = createContext<NalarApi | null>(null)

declare global {
  interface Window {
    /** Pintasan untuk mencoba ekspresi dari konsol: nalar.setMood('kaget') */
    nalar?: Pick<NalarApi, 'setMood' | 'katakan' | 'katakanTeks'>
    __RN_IDLE_MS?: number
  }
}

export const SEMUA_MOOD: MoodNalar[] = ['senang', 'mikir', 'kaget', 'ngantuk', 'semangat', 'sedih', 'bangga', 'kedip-nakal']

export function NalarProvider({ children }: { children: ReactNode }) {
  const [mood, setMoodState] = useState<MoodNalar>('senang')
  const [gelembung, setGelembung] = useState<Gelembung | null>(null)
  const [poin, setPoin] = useState(0)

  const idle = useRef(false)
  const timerMood = useRef<ReturnType<typeof setTimeout>>()
  const timerGelembung = useRef<ReturnType<typeof setTimeout>>()
  const timerIdle = useRef<ReturnType<typeof setTimeout>>()
  const seq = useRef(0)

  const setMood = useCallback((m: MoodNalar, ms = 4200) => {
    clearTimeout(timerMood.current)
    setMoodState(m)
    if (ms > 0 && m !== 'senang' && m !== 'ngantuk') {
      timerMood.current = setTimeout(() => setMoodState(idle.current ? 'ngantuk' : 'senang'), ms)
    }
  }, [])

  const tampil = useCallback((teks: string, lama?: number) => {
    clearTimeout(timerGelembung.current)
    setGelembung({ id: ++seq.current, teks })
    const ms = lama ?? Math.min(6500, Math.max(3200, 2200 + jumlahKata(teks) * 380))
    timerGelembung.current = setTimeout(() => setGelembung(null), ms)
  }, [])

  const katakan = useCallback(
    (k: Kejadian) => {
      const f = pilihFrasa(k)
      setMood(f.mood, f.mood === 'ngantuk' ? 0 : 4200)
      tampil(f.t, f.mood === 'ngantuk' ? 7000 : undefined)
    },
    [setMood, tampil],
  )

  const katakanTeks = useCallback(
    (teks: string, m: MoodNalar = 'senang') => {
      setMood(m)
      tampil(teks)
    },
    [setMood, tampil],
  )

  const tambahPoin = useCallback((n = 1) => setPoin((p) => p + n), [])
  const tutupGelembung = useCallback(() => setGelembung(null), [])

  // ---- idle: 30 detik tanpa aktivitas -> ngantuk; aktivitas berikutnya -> bangun ----
  useEffect(() => {
    const batas = window.__RN_IDLE_MS ?? 30000
    const pasangIdle = () => {
      clearTimeout(timerIdle.current)
      timerIdle.current = setTimeout(() => {
        idle.current = true
        katakan('idle')
      }, batas)
    }
    const aktif = () => {
      if (idle.current) {
        idle.current = false
        katakan('bangun')
      }
      pasangIdle()
    }
    const peristiwa = ['pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart', 'wheel'] as const
    peristiwa.forEach((e) => window.addEventListener(e, aktif, { passive: true }))
    pasangIdle()
    return () => {
      peristiwa.forEach((e) => window.removeEventListener(e, aktif))
      clearTimeout(timerIdle.current)
    }
  }, [katakan])

  useEffect(
    () => () => {
      clearTimeout(timerMood.current)
      clearTimeout(timerGelembung.current)
    },
    [],
  )

  const api = useMemo<NalarApi>(
    () => ({ mood, gelembung, poin, setMood, katakan, katakanTeks, tambahPoin, tutupGelembung }),
    [mood, gelembung, poin, setMood, katakan, katakanTeks, tambahPoin, tutupGelembung],
  )

  useEffect(() => {
    window.nalar = { setMood, katakan, katakanTeks }
    return () => {
      delete window.nalar
    }
  }, [setMood, katakan, katakanTeks])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useNalar(): NalarApi {
  const c = useContext(Ctx)
  if (!c) throw new Error('useNalar harus dipakai di dalam <NalarProvider>')
  return c
}
