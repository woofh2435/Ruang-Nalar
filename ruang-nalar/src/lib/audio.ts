// Musik latar dan umpan balik bunyi, semuanya disintesis dengan WebAudio (tanpa berkas audio). Default MATI.
// Hanya berjalan setelah pengguna menekan tombol suara (aturan autoplay browser).
// Lagu-lagunya didefinisikan di musik.ts (data) dan penghasilMusik.ts (sintesis).

import { DAFTAR_MUSIK, MUSIK_BAWAAN, SKALA_AMBIEN, VOLUME_BAWAAN, cariLagu, laguValid, volumeValid } from './musik'
import { buatPenghasil, denting, type Sesi } from './penghasilMusik'

type PeluruAudio = typeof AudioContext

/** Skala tingkat kenyaringan: master = SKALA_MASTER × volume pilihan pengguna. */
const SKALA_MASTER = 0.62
/** Seberapa jauh ke depan (detik) bunyi dijadwalkan. Cukup besar supaya tab di latar belakang (timer ~1 dtk) tidak putus-putus. */
const LOOKAHEAD = 1.6
const JEDA_JADWAL_MS = 250

let ctx: AudioContext | null = null
let master: GainNode | null = null
let sesi: Sesi | null = null
let pewaktu: ReturnType<typeof setInterval> | undefined
let nyala = false
let laguId = MUSIK_BAWAAN
let volume = VOLUME_BAWAAN

const pendengar = new Set<() => void>()
const kabari = () => pendengar.forEach((f) => f())

/** Berlangganan perubahan (nyala/mati, lagu, volume). Mengembalikan fungsi berhenti. */
export function langgananBunyi(cb: () => void): () => void {
  pendengar.add(cb)
  return () => {
    pendengar.delete(cb)
  }
}

export const bunyiNyala = () => nyala
export const laguAktif = () => laguId
export const volumeAktif = () => volume
export const bunyiDidukung = () =>
  typeof window !== 'undefined' &&
  !!((window as unknown as { AudioContext?: PeluruAudio; webkitAudioContext?: PeluruAudio }).AudioContext ||
    (window as unknown as { webkitAudioContext?: PeluruAudio }).webkitAudioContext)

function buatCtx(): AudioContext | null {
  if (ctx) return ctx
  try {
    const W = window as unknown as { AudioContext?: PeluruAudio; webkitAudioContext?: PeluruAudio }
    const C = W.AudioContext ?? W.webkitAudioContext
    if (!C) return null
    ctx = new C()
    return ctx
  } catch {
    return null
  }
}

const targetMaster = () => Math.max(0.0002, SKALA_MASTER * volume)

function mulai(): boolean {
  const c = buatCtx()
  if (!c) return false
  try {
    void c.resume()
    const m = c.createGain()
    m.gain.value = 0.0001
    m.connect(c.destination)
    const lagu = cariLagu(laguId) ?? DAFTAR_MUSIK[0]
    const s = buatPenghasil(lagu)(c, m)
    master = m
    sesi = s
    nyala = true

    const t = c.currentTime
    m.gain.setValueAtTime(0.0001, t)
    m.gain.exponentialRampToValueAtTime(targetMaster(), t + 2.2)
    s.jadwal(t + LOOKAHEAD)
    clearInterval(pewaktu)
    pewaktu = setInterval(() => {
      if (sesi === s) s.jadwal(c.currentTime + LOOKAHEAD)
    }, JEDA_JADWAL_MS)
    return true
  } catch {
    sesi?.henti()
    sesi = null
    master = null
    nyala = false
    return false
  }
}

function henti() {
  nyala = false
  clearInterval(pewaktu)
  const c = ctx
  const m = master
  const s = sesi
  master = null
  sesi = null
  if (!c || !m) {
    s?.henti()
    return
  }
  try {
    const t = c.currentTime
    m.gain.cancelScheduledValues(t)
    m.gain.setValueAtTime(Math.max(m.gain.value, 0.0001), t)
    m.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
  } catch {
    /* abaikan */
  }
  // pembersihan milik sesi ini sendiri (tidak terbatalkan oleh sesi baru yang mulai sebelum fade selesai)
  setTimeout(() => {
    s?.henti()
    try {
      m.disconnect()
    } catch {
      /* abaikan */
    }
    if (!nyala && c.state === 'running') void c.suspend()
  }, 750)
}

/** Nyalakan / matikan suara. Mengembalikan keadaan akhir. */
export function setBunyi(on: boolean): boolean {
  if (on && !nyala) mulai()
  else if (!on && nyala) henti()
  kabari()
  return nyala
}

/** Pilih lagu. Kalau sedang bermain, lagu berganti dengan halus. Id tak dikenal → lagu bawaan. */
export function setLagu(id: unknown): string {
  const baru = laguValid(id)
  if (baru === laguId) return laguId
  laguId = baru
  if (nyala) {
    henti()
    mulai()
  }
  kabari()
  return laguId
}

/** Atur volume 0..1. Berlaku langsung walau sedang bermain. */
export function setVolume(v: unknown): number {
  volume = volumeValid(v)
  if (nyala && ctx && master) {
    try {
      const t = ctx.currentTime
      master.gain.cancelScheduledValues(t)
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), t)
      master.gain.exponentialRampToValueAtTime(targetMaster(), t + 0.15)
    } catch {
      /* abaikan */
    }
  }
  kabari()
  return volume
}

/** Denting kecil untuk umpan balik (kuis benar, bintang) — hanya terdengar kalau suara dinyalakan. */
export function dentingKecil(indeks = 0) {
  if (!nyala || !ctx || !master) return
  try {
    denting(ctx, master, SKALA_AMBIEN[Math.abs(indeks) % SKALA_AMBIEN.length], 0.07)
  } catch {
    /* abaikan */
  }
}
