// Pustaka ebook = ebook publik (file .md di src/content/) + ebook lokal buatan admin (IndexedDB).

import { useMemo } from 'react'
import { NAMA_PENULIS_DEFAULT } from '../config'
import { namaPenulis, parseEbook } from './parser'
import { K, kvAmbil, useEbookLokal, useKv } from './store'
import { useEbookToko } from './toko/store'
import type { CatatanEbookLokal, Ebook, ParsedEbook } from './types'

// Semua .md di src/content/ dimuat saat build.
const modulMd = import.meta.glob('../content/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function slugDariPath(path: string): string {
  const nama = path.split('/').pop() ?? path
  return nama.replace(/\.md$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'ebook'
}

export const EBOOK_PUBLIK: Ebook[] = Object.entries(modulMd)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, raw]) => ({
    id: slugDariPath(path),
    sumber: 'publik' as const,
    raw,
    parsed: parseEbook(raw),
  }))

const cacheLokal = new WeakMap<CatatanEbookLokal, Ebook>()
export function ebookDariCatatan(rec: CatatanEbookLokal): Ebook {
  let e = cacheLokal.get(rec)
  if (!e) {
    e = { id: rec.id, sumber: 'lokal', raw: rec.raw, parsed: parseEbook(rec.raw), diperbarui: rec.diperbarui }
    cacheLokal.set(rec, e)
  }
  return e
}

/** Gabungkan dan urutkan sesuai daftar urutan (yang belum tercatat ditaruh di belakang). */
export function susunPustaka(lokal: CatatanEbookLokal[], urutan: string[]): Ebook[] {
  const semua = [...EBOOK_PUBLIK, ...lokal.map(ebookDariCatatan)]
  const posisi = new Map(urutan.map((id, i) => [id, i]))
  return semua
    .map((e, i) => ({ e, i }))
    .sort((a, b) => {
      const pa = posisi.has(a.e.id) ? (posisi.get(a.e.id) as number) : Number.MAX_SAFE_INTEGER
      const pb = posisi.has(b.e.id) ? (posisi.get(b.e.id) as number) : Number.MAX_SAFE_INTEGER
      return pa !== pb ? pa - pb : a.i - b.i
    })
    .map((x) => x.e)
}

/** Semua ebook (terbit + draf) berurutan. Dipakai admin. */
export function useSemuaEbook(): Ebook[] {
  const lokal = useEbookLokal()
  const [urutan] = useKv<string[]>(K.urutan, [])
  return useMemo(() => susunPustaka(lokal, urutan), [lokal, urutan])
}

/** Gabungkan ebook berbayar (toko) di belakang yang lain; id yang bentrok dengan ebook publik/lokal diabaikan. */
export function gabungToko(semua: Ebook[], toko: Ebook[]): Ebook[] {
  if (toko.length === 0) return semua
  const dipakai = new Set(semua.map((e) => e.id))
  return [...semua, ...toko.filter((e) => !dipakai.has(e.id))]
}

/** Hanya yang berstatus terbit (+ ebook berbayar dari toko, bila fitur toko aktif). Dipakai rak di beranda. */
export function useEbookTerbit(): Ebook[] {
  const semua = useSemuaEbook()
  const toko = useEbookToko()
  return useMemo(() => gabungToko(semua.filter((e) => e.parsed.meta.status === 'terbit'), toko), [semua, toko])
}

export function useEbook(id: string | undefined): Ebook | undefined {
  const semua = useSemuaEbook()
  const toko = useEbookToko()
  return useMemo(() => gabungToko(semua, toko).find((e) => e.id === id), [semua, toko, id])
}

export function penulisTampil(e: Ebook): string {
  return namaPenulis(e.parsed.meta.penulis, NAMA_PENULIS_DEFAULT)
}

/** Urutan terkini sebagai daftar id lengkap (dipakai saat menggeser posisi). */
export function urutanLengkap(lokal: CatatanEbookLokal[]): string[] {
  return susunPustaka(lokal, kvAmbil<string[]>(K.urutan, [])).map((e) => e.id)
}

// ---------- lencana rak ----------
export interface Lencana {
  selesaiDibaca: boolean
  kuisSempurna: boolean
}

export function hitungLencana(
  parsed: ParsedEbook,
  selesai: number[] | undefined,
  kuis: Record<string, { pertamaBenar: boolean }> | undefined,
): Lencana {
  const nBab = parsed.bab.length
  const selesaiDibaca = nBab > 0 && !!selesai && parsed.bab.every((_, i) => selesai.includes(i))
  let kuisSempurna = false
  if (parsed.jumlahKuis > 0 && kuis) {
    const ids: string[] = []
    for (const b of parsed.bab) for (const k of b.blok) if (k.tipe === 'kuis') ids.push(k.id)
    kuisSempurna = ids.every((id) => kuis[id]?.pertamaBenar === true)
  }
  return { selesaiDibaca, kuisSempurna }
}

export function useLencana(e: Ebook): Lencana {
  const [selesai] = useKv<number[]>(K.selesai(e.id), [])
  const [kuis] = useKv<Record<string, { pertamaBenar: boolean }>>(K.kuis(e.id), {})
  return useMemo(() => hitungLencana(e.parsed, selesai, kuis), [e.parsed, selesai, kuis])
}
