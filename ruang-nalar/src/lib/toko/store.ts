// Penyimpan global fitur toko (akun, katalog berbayar, pembelian, isi ebook yang sudah dibeli).
// Isi ebook berbayar HANYA disimpan di memori (tidak ke IndexedDB/localStorage) dan dibuang saat keluar akun.

import { useMemo, useSyncExternalStore } from 'react'
import { SUPABASE_ANON_KEY, SUPABASE_URL, TOKO_DEMO } from '../../config'
import { parseEbook } from '../parser'
import { PROFIL_BAWAAN, gabungProfil, setProfil } from '../profil'
import type { Ebook, EbookMeta } from '../types'
import { buatBackendDemo } from './demo'
import { bacaKonfig } from './konfig'
import { tentukanMode, type ModeToko } from './mode'
import { buatBackendSupabase, petaGalat } from './supabase'
import { GalatToko, type Backend, type HasilBayar, type HasilReset, type ItemKatalog, type MasukanEbookToko, type Pembelian, type Sesi, type TautanAuth } from './tipe'

export type StatusMuat = 'belum' | 'memuat' | 'siap' | 'galat'
export type StatusIsi = 'memuat' | 'siap' | 'tidak_berhak' | 'galat'

export interface StateToko {
  mode: ModeToko
  /** konfigurasi toko (toko-config.json) sudah dibaca; sebelum itu web belum tahu fitur toko menyala atau tidak */
  konfigSiap: boolean
  /** sesi awal (pemulihan login) sudah dicek */
  siap: boolean
  sesi: Sesi | null
  katalog: ItemKatalog[]
  katalogStatus: StatusMuat
  pembelian: Pembelian[]
  pembelianStatus: StatusMuat
  /** isi mentah ebook yang berhak dibaca (hanya di memori) */
  isi: Record<string, string>
  isiStatus: Record<string, StatusIsi>
  /** daftar lengkap (termasuk draf) untuk admin */
  adminItem: ItemKatalog[]
}

const STATE_AWAL = (mode: ModeToko, konfigSiap = true): StateToko => ({
  mode,
  konfigSiap,
  siap: mode === 'mati',
  sesi: null,
  katalog: [],
  katalogStatus: mode === 'mati' ? 'siap' : 'belum',
  pembelian: [],
  pembelianStatus: 'belum',
  isi: {},
  isiStatus: {},
  adminItem: [],
})

export function dimiliki(s: Pick<StateToko, 'sesi' | 'pembelian'>, ebookId: string): boolean {
  if (!s.sesi) return false
  return s.sesi.admin || s.pembelian.some((p) => p.ebookId === ebookId && p.status === 'lunas')
}

const metaDari = (k: ItemKatalog): EbookMeta => ({
  judul: k.judul,
  subjudul: k.subjudul,
  penulis: k.penulis,
  tema: k.tema,
  ikon: k.ikon,
  tag: k.tag,
  status: 'terbit',
  deskripsi: k.deskripsi,
})

const cacheEbook = new WeakMap<ItemKatalog, { raw: string | undefined; ebook: Ebook }>()

/** Ebook di rak: kalau isi belum ada → "kerangka terkunci" (tanpa bab, raw kosong). */
export function ebookDariItem(k: ItemKatalog, raw: string | undefined): Ebook {
  const c = cacheEbook.get(k)
  if (c && c.raw === raw) return c.ebook
  let ebook: Ebook
  if (raw === undefined) {
    ebook = { id: k.id, sumber: 'toko', raw: '', parsed: { meta: metaDari(k), bab: [], peringatan: [], jumlahKuis: 0 }, harga: k.harga, terkunci: true }
  } else {
    const p = parseEbook(raw)
    // metadata sampul mengikuti katalog supaya sampul tidak berubah setelah dibeli
    ebook = { id: k.id, sumber: 'toko', raw, parsed: { ...p, meta: metaDari(k) }, harga: k.harga, terkunci: false }
  }
  cacheEbook.set(k, { raw, ebook })
  return ebook
}

export function bangunEbookToko(katalog: ItemKatalog[], isi: Record<string, string>): Ebook[] {
  return [...katalog].sort((a, b) => a.urutan - b.urutan).map((k) => ebookDariItem(k, isi[k.id]))
}

export interface Toko {
  getState(): StateToko
  subscribe(cb: () => void): () => void
  /** Pasang backend + mode (dipanggil setelah konfigurasi dibaca). Mengosongkan seluruh data lama. */
  pasang(be: Backend | null, mode: ModeToko): void
  mulai(): Promise<void>
  muatKatalog(): Promise<void>
  muatPembelian(): Promise<void>
  muatIsi(ebookId: string): Promise<void>
  daftar(email: string, sandi: string): Promise<{ perluKonfirmasi: boolean }>
  masuk(email: string, sandi: string): Promise<void>
  keluar(): Promise<void>
  kirimResetSandi(email: string): Promise<HasilReset>
  pulihkanDariTautan(t: TautanAuth): Promise<void>
  ubahSandi(sandiBaru: string): Promise<void>
  beli(ebookId: string): Promise<HasilBayar>
  adminMuat(): Promise<void>
  adminSimpan(m: MasukanEbookToko): Promise<void>
  adminBacaIsi(ebookId: string): Promise<string | null>
  adminAtur(id: string, p: { harga?: number; terbit?: boolean }): Promise<void>
  adminHapus(id: string): Promise<void>
}

/** Pabrik penyimpan (dipisah dari singleton supaya mudah diuji dengan backend palsu). */
export function buatToko(beAwal: Backend | null, modeAwal: ModeToko, opsi: { konfigSiap?: boolean } = {}): Toko {
  let be = beAwal
  let state = STATE_AWAL(modeAwal, opsi.konfigSiap ?? true)
  const pendengar = new Set<() => void>()
  let generasi = 0
  let sudahMulai: Promise<void> | null = null

  const set = (p: Partial<StateToko>) => {
    state = { ...state, ...p }
    pendengar.forEach((f) => f())
  }
  const bungkus = (e: unknown): GalatToko => petaGalat(e)
  const wajib = (): Backend => {
    if (!be) throw new GalatToko('ditolak', 'Fitur akun belum aktif.')
    return be
  }

  const terapkanSesi = (s: Sesi | null) => {
    const lama = state.sesi?.id ?? null
    const baru = s?.id ?? null
    if (lama === baru) {
      set({ sesi: s, siap: true })
      return
    }
    generasi++
    set({ sesi: s, siap: true, pembelian: [], pembelianStatus: 'belum', isi: {}, isiStatus: {}, adminItem: [] })
    if (s) void aksi.muatPembelian()
  }

  const aksi: Toko = {
    getState: () => state,
    subscribe(cb) {
      pendengar.add(cb)
      return () => pendengar.delete(cb)
    },
    pasang(baru, mode) {
      generasi++
      sudahMulai = null
      be = baru
      state = STATE_AWAL(mode, true)
      pendengar.forEach((f) => f())
    },
    mulai() {
      if (!be) return Promise.resolve()
      if (!sudahMulai) {
        const b = be
        b.onSesi((s) => terapkanSesi(s))
        sudahMulai = (async () => {
          void aksi.muatKatalog()
          try {
            terapkanSesi(await b.sesiSaatIni())
          } catch {
            terapkanSesi(null)
          }
        })()
      }
      return sudahMulai
    },
    async muatKatalog() {
      if (!be) return
      set({ katalogStatus: 'memuat' })
      try {
        const k = await be.katalog()
        set({ katalog: k, katalogStatus: 'siap' })
      } catch {
        set({ katalogStatus: 'galat' })
      }
    },
    async muatPembelian() {
      if (!be || !state.sesi) return
      const gen = generasi
      set({ pembelianStatus: 'memuat' })
      try {
        const p = await be.pembelianSaya()
        if (gen !== generasi) return
        set({ pembelian: p, pembelianStatus: 'siap' })
      } catch {
        if (gen !== generasi) return
        set({ pembelianStatus: 'galat' })
      }
    },
    async muatIsi(ebookId) {
      if (!be || !state.sesi) return
      if (state.isi[ebookId] !== undefined || state.isiStatus[ebookId] === 'memuat') return
      const gen = generasi
      set({ isiStatus: { ...state.isiStatus, [ebookId]: 'memuat' } })
      try {
        const raw = await be.bacaIsi(ebookId)
        if (gen !== generasi) return
        if (raw === null) set({ isiStatus: { ...state.isiStatus, [ebookId]: 'tidak_berhak' } })
        else set({ isi: { ...state.isi, [ebookId]: raw }, isiStatus: { ...state.isiStatus, [ebookId]: 'siap' } })
      } catch {
        if (gen !== generasi) return
        set({ isiStatus: { ...state.isiStatus, [ebookId]: 'galat' } })
      }
    },
    async daftar(email, sandi) {
      const b = wajib()
      try {
        const h = await b.daftar(email, sandi)
        if (!h.perluKonfirmasi) terapkanSesi(await b.sesiSaatIni())
        return h
      } catch (e) {
        throw bungkus(e)
      }
    },
    async masuk(email, sandi) {
      const b = wajib()
      try {
        await b.masuk(email, sandi)
        terapkanSesi(await b.sesiSaatIni())
      } catch (e) {
        throw bungkus(e)
      }
    },
    async keluar() {
      const b = wajib()
      try {
        await b.keluar()
      } catch (e) {
        throw bungkus(e)
      } finally {
        // apa pun hasilnya, bersihkan data di layar ini
        terapkanSesi(null)
      }
    },
    async kirimResetSandi(email) {
      const b = wajib()
      try {
        return await b.kirimResetSandi(email)
      } catch (e) {
        throw bungkus(e)
      }
    },
    async pulihkanDariTautan(t) {
      const b = wajib()
      try {
        await b.pulihkanDariTautan(t)
        terapkanSesi(await b.sesiSaatIni())
      } catch (e) {
        throw bungkus(e)
      }
    },
    async ubahSandi(sandiBaru) {
      const b = wajib()
      try {
        await b.ubahSandi(sandiBaru)
      } catch (e) {
        throw bungkus(e)
      }
    },
    async beli(ebookId) {
      const b = wajib()
      try {
        const h = await b.mulaiBayar(ebookId)
        if (h.jenis === 'selesai') {
          await aksi.muatPembelian()
          await aksi.muatIsi(ebookId)
        }
        return h
      } catch (e) {
        throw bungkus(e)
      }
    },
    async adminMuat() {
      const b = wajib()
      try {
        set({ adminItem: await b.adminDaftar() })
      } catch (e) {
        throw bungkus(e)
      }
    },
    async adminBacaIsi(ebookId) {
      const b = wajib()
      try {
        return await b.adminBacaIsi(ebookId)
      } catch (e) {
        throw bungkus(e)
      }
    },
    async adminSimpan(m) {
      const b = wajib()
      try {
        await b.adminSimpan(m)
      } catch (e) {
        throw bungkus(e)
      }
      const { [m.item.id]: _a, ...isiSisa } = state.isi
      const { [m.item.id]: _b, ...statusSisa } = state.isiStatus
      set({ isi: isiSisa, isiStatus: statusSisa })
      await Promise.all([aksi.adminMuat(), aksi.muatKatalog()])
    },
    async adminAtur(id, p) {
      const b = wajib()
      try {
        await b.adminAtur(id, p)
      } catch (e) {
        throw bungkus(e)
      }
      await Promise.all([aksi.adminMuat(), aksi.muatKatalog()])
    },
    async adminHapus(id) {
      const b = wajib()
      try {
        await b.adminHapus(id)
      } catch (e) {
        throw bungkus(e)
      }
      await Promise.all([aksi.adminMuat(), aksi.muatKatalog()])
    },
  }
  return aksi
}

// ---------- singleton aplikasi ----------

let tunggal: Toko | null = null
let berjalan: Promise<void> | null = null

/** Penyimpan tunggal aplikasi. Awalnya "mati" dan belum siap; diisi oleh mulaiToko() setelah konfigurasi dibaca. */
export function ambilToko(): Toko {
  if (!tunggal) tunggal = buatToko(null, 'mati', { konfigSiap: false })
  return tunggal
}

/** Dipanggil sekali saat aplikasi mulai: baca konfigurasi, pilih mode, pasang backend, mulai. Aman dipanggil berulang. */
export function mulaiToko(): Promise<void> {
  if (!berjalan) {
    const t = ambilToko()
    berjalan = (async () => {
      const host = typeof location !== 'undefined' ? location.hostname : ''
      const { konfig, peringatan, mentah } = await bacaKonfig({ url: SUPABASE_URL, kunci: SUPABASE_ANON_KEY, demo: TOKO_DEMO })
      for (const p of peringatan) console.error('[Ruang Nalar] ' + p)
      setProfil(gabungProfil(PROFIL_BAWAAN, mentah))
      const mode = tentukanMode(konfig.url, konfig.kunci, konfig.demo, host)
      const be = mode === 'nyata' ? buatBackendSupabase(konfig.url, konfig.kunci) : mode === 'demo' ? buatBackendDemo() : null
      t.pasang(be, mode)
      await t.mulai()
    })()
  }
  return berjalan
}

export function useToko(): StateToko {
  const t = ambilToko()
  return useSyncExternalStore(t.subscribe, t.getState, t.getState)
}

/** Ebook berbayar sebagai objek Ebook (terkunci bila belum berhak). */
export function useEbookToko(): Ebook[] {
  const { katalog, isi } = useToko()
  return useMemo(() => bangunEbookToko(katalog, isi), [katalog, isi])
}
