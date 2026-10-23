// Pembantu murni untuk halaman "Privasi & persetujuan": status terkini per jenis dan berkas ekspor data akun.

import type { CatatanPersetujuan, JenisPersetujuan, Pembelian, Sesi } from '../toko/tipe'
import type { PilihanCookie } from '../persetujuan'

export const LABEL_JENIS: Record<JenisPersetujuan, string> = {
  syarat_privasi: 'Kebijakan Privasi dan Syarat & Ketentuan',
  promo: 'Email kabar ebook dan promo',
  analitik: 'Analitik (cookie)',
}

export interface StatusJenis {
  status: boolean
  versi: string
  dibuat: string
}

/** Baris terbaru untuk tiap jenis persetujuan (log hanya bertambah, jadi yang terbaru yang berlaku). */
export function statusTerkini(riwayat: readonly CatatanPersetujuan[]): Record<JenisPersetujuan, StatusJenis | null> {
  const hasil: Record<JenisPersetujuan, StatusJenis | null> = { syarat_privasi: null, promo: null, analitik: null }
  for (const r of riwayat) {
    const lama = hasil[r.jenis]
    if (!lama || Date.parse(r.dibuat) > Date.parse(lama.dibuat)) hasil[r.jenis] = { status: r.status, versi: r.versi, dibuat: r.dibuat }
  }
  return hasil
}

export interface MasukanEkspor {
  sesi: Sesi
  pembelian: readonly Pembelian[]
  riwayat: readonly CatatanPersetujuan[]
  cookie: PilihanCookie | null
  sekarang?: Date
}

/** Isi berkas "Unduh data akun saya" (JSON). Tidak memuat kata sandi atau token. */
export function bangunEksporData(m: MasukanEkspor): string {
  const o = {
    diekspor: (m.sekarang ?? new Date()).toISOString(),
    catatan: 'Salinan data akunmu di server Ruang Nalar. Progres baca, sorotan, dan catatan tersimpan di perangkatmu sendiri, bukan di server.',
    akun: { id: m.sesi.id, email: m.sesi.email, peran: m.sesi.admin ? 'admin' : 'pembaca' },
    pembelian: m.pembelian.map((p) => ({ order_id: p.orderId, ebook_id: p.ebookId, status: p.status, jumlah_rupiah: p.jumlah, dibuat: p.dibuat, dibayar: p.dibayar })),
    persetujuan: m.riwayat.map((r) => ({ jenis: r.jenis, setuju: r.status, versi_kebijakan: r.versi, waktu: r.dibuat })),
    pilihan_cookie_di_perangkat_ini: m.cookie ? { analitik: m.cookie.analitik, versi_kebijakan: m.cookie.versi, waktu: m.cookie.waktu } : null,
  }
  return JSON.stringify(o, null, 2)
}

export function namaBerkasEkspor(sekarang: Date = new Date()): string {
  return `data-akun-ruang-nalar-${sekarang.toISOString().slice(0, 10)}.json`
}

export const KATA_KONFIRMASI_HAPUS = 'HAPUS'
export const cocokKonfirmasiHapus = (s: string): boolean => s.trim() === KATA_KONFIRMASI_HAPUS
