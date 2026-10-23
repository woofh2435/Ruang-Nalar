// Versi dokumen hukum. Naikkan VERSI_KEBIJAKAN setiap kali isi Kebijakan Privasi atau Syarat & Ketentuan berubah
// supaya pembaca ditanya lagi (banner cookie) dan catatan persetujuan tahu "menyetujui versi yang mana".

/** Maksimal 20 karakter (batas kolom di database). Format tanggal ISO supaya mudah diurutkan. */
export const VERSI_KEBIJAKAN = '2026-10-23'
export const TANGGAL_BERLAKU = '23 Oktober 2026'

export interface PerubahanKebijakan {
  versi: string
  tanggal: string
  ringkas: string
}

/** Terbaru di atas. Tambahkan baris baru setiap kali VERSI_KEBIJAKAN dinaikkan. */
export const RIWAYAT_PERUBAHAN: PerubahanKebijakan[] = [
  { versi: '2026-10-23', tanggal: '23 Oktober 2026', ringkas: 'Versi pertama Kebijakan Privasi dan Syarat & Ketentuan, bersamaan dengan pilihan persetujuan dan pengaturan cookie.' },
]
