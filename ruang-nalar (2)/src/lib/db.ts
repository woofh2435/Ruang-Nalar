// Lapisan penyimpanan: IndexedDB (utama), localStorage (cadangan), memori (pilihan terakhir).
// Semua fungsi menelan error: kalau penyimpanan gagal, aplikasi tetap jalan (hanya tidak tersimpan).

import type { CatatanEbookLokal } from './types'

export type JenisPenyimpanan = 'indexeddb' | 'localstorage' | 'memori'

const NAMA_DB = 'ruang-nalar'
const VERSI = 1
const S_EBOOK = 'ebook'
const S_KV = 'kv'
const LS_EBOOK = 'rn:ebook:'
const LS_KV = 'rn:kv:'

let janjiDb: Promise<IDBDatabase | null> | null = null
let jenis: JenisPenyimpanan = 'memori'
const memEbook = new Map<string, CatatanEbookLokal>()
const memKv = new Map<string, unknown>()

function bukaDb(): Promise<IDBDatabase | null> {
  if (janjiDb) return janjiDb
  janjiDb = new Promise((selesai) => {
    try {
      if (typeof indexedDB === 'undefined') return selesai(null)
      const req = indexedDB.open(NAMA_DB, VERSI)
      req.onupgradeneeded = () => {
        const d = req.result
        if (!d.objectStoreNames.contains(S_EBOOK)) d.createObjectStore(S_EBOOK, { keyPath: 'id' })
        if (!d.objectStoreNames.contains(S_KV)) d.createObjectStore(S_KV)
      }
      req.onsuccess = () => selesai(req.result)
      req.onerror = () => selesai(null)
      req.onblocked = () => selesai(null)
    } catch {
      selesai(null)
    }
  })
  return janjiDb
}

function minta<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((ok, gagal) => {
    req.onsuccess = () => ok(req.result)
    req.onerror = () => gagal(req.error)
  })
}

function lsBisa(): boolean {
  try {
    const k = '__rn_uji__'
    localStorage.setItem(k, '1')
    localStorage.removeItem(k)
    return true
  } catch {
    return false
  }
}

export async function muatSemua(): Promise<{
  penyimpanan: JenisPenyimpanan
  ebook: CatatanEbookLokal[]
  kv: Record<string, unknown>
}> {
  const d = await bukaDb()
  if (d) {
    try {
      const ebook = (await minta(d.transaction(S_EBOOK, 'readonly').objectStore(S_EBOOK).getAll())) as CatatanEbookLokal[]
      const kv: Record<string, unknown> = {}
      await new Promise<void>((ok, gagal) => {
        const req = d.transaction(S_KV, 'readonly').objectStore(S_KV).openCursor()
        req.onsuccess = () => {
          const c = req.result
          if (c) {
            kv[String(c.key)] = c.value
            c.continue()
          } else ok()
        }
        req.onerror = () => gagal(req.error)
      })
      jenis = 'indexeddb'
      return { penyimpanan: jenis, ebook, kv }
    } catch {
      /* jatuh ke cadangan */
    }
  }
  if (lsBisa()) {
    jenis = 'localstorage'
    const ebook: CatatanEbookLokal[] = []
    const kv: Record<string, unknown> = {}
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (!k) continue
        if (k.startsWith(LS_EBOOK)) ebook.push(JSON.parse(localStorage.getItem(k) ?? 'null'))
        else if (k.startsWith(LS_KV)) kv[k.slice(LS_KV.length)] = JSON.parse(localStorage.getItem(k) ?? 'null')
      }
    } catch {
      /* abaikan data rusak */
    }
    return { penyimpanan: jenis, ebook: ebook.filter(Boolean), kv }
  }
  jenis = 'memori'
  return { penyimpanan: jenis, ebook: [], kv: {} }
}

async function tulis(store: string, fn: (s: IDBObjectStore) => IDBRequest): Promise<boolean> {
  const d = await bukaDb()
  if (!d || jenis !== 'indexeddb') return false
  try {
    await minta(fn(d.transaction(store, 'readwrite').objectStore(store)))
    return true
  } catch {
    return false
  }
}

export async function simpanEbook(rec: CatatanEbookLokal): Promise<void> {
  if (await tulis(S_EBOOK, (s) => s.put(rec))) return
  if (jenis === 'localstorage') {
    try {
      localStorage.setItem(LS_EBOOK + rec.id, JSON.stringify(rec))
    } catch {
      /* penyimpanan penuh */
    }
  }
  memEbook.set(rec.id, rec)
}

export async function hapusEbook(id: string): Promise<void> {
  if (await tulis(S_EBOOK, (s) => s.delete(id))) return
  try {
    localStorage.removeItem(LS_EBOOK + id)
  } catch {
    /* abaikan */
  }
  memEbook.delete(id)
}

export async function simpanKv(kunci: string, nilai: unknown): Promise<void> {
  if (await tulis(S_KV, (s) => s.put(nilai, kunci))) return
  if (jenis === 'localstorage') {
    try {
      localStorage.setItem(LS_KV + kunci, JSON.stringify(nilai))
    } catch {
      /* penyimpanan penuh */
    }
  }
  memKv.set(kunci, nilai)
}

export async function hapusKv(kunci: string): Promise<void> {
  if (await tulis(S_KV, (s) => s.delete(kunci))) return
  try {
    localStorage.removeItem(LS_KV + kunci)
  } catch {
    /* abaikan */
  }
  memKv.delete(kunci)
}

export function jenisPenyimpanan(): JenisPenyimpanan {
  return jenis
}
