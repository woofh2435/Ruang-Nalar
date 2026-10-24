import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { kebijakanPrivasi, noticeHakCipta, syaratKetentuan, type DataLegal, type DokLegal } from '../src/lib/legal/dokumen'
import { bangunEksporData, cocokKonfirmasiHapus, LABEL_JENIS, namaBerkasEkspor, statusTerkini } from '../src/lib/legal/ekspor'
import { gabungIdentitas, IDENTITAS_BAWAAN } from '../src/lib/legal/identitas'
import { RIWAYAT_PERUBAHAN, TANGGAL_BERLAKU, VERSI_KEBIJAKAN } from '../src/lib/legal/versi'
import type { CatatanPersetujuan } from '../src/lib/toko/tipe'

const D: DataLegal = { nama: 'Ruang Nalar', pengelola: 'Eko Pujiono', email: 'halo@contoh.id', kota: 'Surabaya' }
const KOSONG: DataLegal = { ...D, email: '', kota: '' }

const semuaTeks = (d: DokLegal) => [d.judul, d.deskripsi, d.pembuka, ...d.ringkas, ...d.bagian.flatMap((b) => [b.judul, ...b.paragraf, ...(b.daftar ?? [])])].join('\n')

describe('Kebijakan Privasi: 8 poin wajib dari brief', () => {
  const dok = kebijakanPrivasi(D)
  const id = dok.bagian.map((b) => b.id)
  it('memuat pengendali, data, tujuan, dasar, penyimpanan, pihak ketiga, hak pengguna, dan kontak', () => {
    for (const w of ['pengendali', 'data', 'tujuan', 'dasar', 'simpan', 'pihak-ketiga', 'hak', 'kontak']) expect(id, w).toContain(w)
  })
  it('juga memuat cookie, keamanan, usia, dan riwayat perubahan', () => {
    for (const w of ['cookie', 'keamanan', 'usia', 'perubahan']) expect(id, w).toContain(w)
  })
  it('menyebut dasar hukum UU PDP dan batas notifikasi kebocoran 3 x 24 jam', () => {
    const t = semuaTeks(dok)
    expect(t).toMatch(/UU No\. 27 Tahun 2022/)
    expect(t).toMatch(/3 x 24 jam/)
  })
  it('menyebut pihak ketiga yang benar-benar dipakai (Supabase, Midtrans, hosting, Google Fonts)', () => {
    const t = semuaTeks(dok)
    for (const k of ['Supabase', 'Midtrans', 'hosting', 'Google Fonts']) expect(t, k).toContain(k)
  })
  it('jujur: tidak mengaku ada analitik, dan menyebut data kartu tidak disimpan', () => {
    const t = semuaTeks(dok)
    expect(t).toMatch(/tidak memasang analitik/)
    expect(t).toMatch(/Data kartu, rekening, atau dompet digital tidak kami terima/)
  })
  it('hak pengguna lengkap: akses, unduh, koreksi, tarik persetujuan, hapus', () => {
    const hak = dok.bagian.find((b) => b.id === 'hak')!
    const t = (hak.daftar ?? []).join('\n')
    for (const k of ['Mengakses', 'Mengunduh', 'Mengoreksi', 'Menarik persetujuan', 'Menghapus']) expect(t, k).toContain(k)
  })
  it('petunjuk di dalam dokumen cocok dengan tombol yang ada di aplikasi', () => {
    const t = semuaTeks(dok)
    expect(t).toContain('Unduh data akun saya')
    expect(t).toContain('Hapus akun saya')
    expect(t).toContain('Pengaturan cookie')
  })
})

describe('Syarat & Ketentuan: 7 poin wajib dari brief', () => {
  const dok = syaratKetentuan(D)
  it('memuat layanan, hak cipta, aturan akun, pembayaran/refund, batas tanggung jawab, hukum, dan pelaporan', () => {
    const id = dok.bagian.map((b) => b.id)
    for (const w of ['layanan', 'hak-cipta', 'akun', 'pembayaran', 'tanggung-jawab', 'hukum', 'lapor']) expect(id, w).toContain(w)
  })
  it('hak cipta: lisensi pribadi, larangan menyebar, rujukan UU Hak Cipta', () => {
    const b = dok.bagian.find((x) => x.id === 'hak-cipta')!
    const t = b.paragraf.join(' ')
    expect(t).toMatch(/UU No\. 28 Tahun 2014/)
    expect(t).toMatch(/lisensi pribadi/)
    expect(t).toMatch(/tidak boleh menyalin, membagikan/)
  })
  it('akun: larangan berbagi login dan batas usia', () => {
    const t = semuaTeks({ ...dok, bagian: dok.bagian.filter((b) => b.id === 'akun') })
    expect(t).toMatch(/Dilarang membagikan login/)
    expect(t).toMatch(/18 tahun/)
  })
  it('pembayaran: metode sesuai Midtrans dan kebijakan refund yang tegas', () => {
    const t = semuaTeks({ ...dok, bagian: dok.bagian.filter((b) => b.id === 'pembayaran') })
    expect(t).toMatch(/GoPay, ShopeePay, atau QRIS/)
    expect(t).toMatch(/tidak bisa dikembalikan/)
    expect(t).toMatch(/Order ID/)
  })
})

describe('isi dokumen umum', () => {
  const dokumen = [kebijakanPrivasi(D), syaratKetentuan(D), kebijakanPrivasi(KOSONG), syaratKetentuan(KOSONG)]
  it('tiap bagian punya id unik, judul, dan isi', () => {
    for (const dok of dokumen) {
      const id = dok.bagian.map((b) => b.id)
      expect(new Set(id).size).toBe(id.length)
      for (const b of dok.bagian) {
        expect(b.judul.length).toBeGreaterThan(3)
        expect(b.paragraf.length + (b.daftar?.length ?? 0)).toBeGreaterThan(0)
        expect(b.id).toMatch(/^[a-z-]+$/)
      }
    }
  })
  it('judul bagian diberi nomor berurutan', () => {
    for (const dok of dokumen) dok.bagian.forEach((b, i) => expect(b.judul.startsWith(`${i + 1}. `), b.judul).toBe(true))
  })
  it('tidak ada tanda kurung sudut, placeholder, atau teks "undefined"', () => {
    for (const dok of dokumen) {
      const t = semuaTeks(dok)
      expect(t).not.toMatch(/[<>]/)
      expect(t).not.toMatch(/undefined|null|TODO|\[isi|\{\{/i)
    }
  })
  it('ada ringkasan untuk dibacakan Nalar (3 sampai 6 poin, tiap poin satu kalimat)', () => {
    for (const dok of dokumen) {
      expect(dok.ringkas.length).toBeGreaterThanOrEqual(3)
      expect(dok.ringkas.length).toBeLessThanOrEqual(6)
      for (const r of dok.ringkas) expect(r.endsWith('.'), r).toBe(true)
    }
  })
  it('deskripsi meta cukup pendek untuk hasil pencarian', () => {
    for (const dok of dokumen) expect(dok.deskripsi.length).toBeLessThanOrEqual(220)
  })
  it('jalur sesuai rute aplikasi', () => {
    expect(kebijakanPrivasi(D).jalur).toBe('/kebijakan-privasi')
    expect(syaratKetentuan(D).jalur).toBe('/syarat-ketentuan')
  })
})

describe('data dinamis', () => {
  it('nama pengelola, email, dan kota muncul bila diisi', () => {
    const k = semuaTeks(kebijakanPrivasi(D))
    expect(k).toContain('Eko Pujiono')
    expect(k).toContain('halo@contoh.id')
    const s = semuaTeks(syaratKetentuan(D))
    expect(s).toContain('Pengadilan Negeri Surabaya')
    expect(s).toContain('halo@contoh.id')
  })
  it('bila email dan kota kosong, dokumen tetap utuh dan menunjuk jalur kontak lain', () => {
    const k = semuaTeks(kebijakanPrivasi(KOSONG))
    expect(k).toContain('About Me')
    expect(k).not.toContain('Kirim email ke')
    expect(semuaTeks(syaratKetentuan(KOSONG))).toContain('pengadilan yang berwenang di Indonesia')
  })
  it('notice hak cipta', () => {
    expect(noticeHakCipta('Eko Pujiono', 2026)).toBe('© 2026 Eko Pujiono. Seluruh hak dilindungi UU No. 28 Tahun 2014 tentang Hak Cipta.')
  })
})

describe('versi kebijakan', () => {
  it('versi muat di kolom database (maks 20 karakter) dan berformat tanggal', () => {
    expect(VERSI_KEBIJAKAN.length).toBeLessThanOrEqual(20)
    expect(VERSI_KEBIJAKAN).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
  it('riwayat perubahan memuat versi aktif sebagai yang terbaru, dan terurut menurun', () => {
    expect(RIWAYAT_PERUBAHAN[0].versi).toBe(VERSI_KEBIJAKAN)
    const v = RIWAYAT_PERUBAHAN.map((r) => r.versi)
    expect([...v].sort().reverse()).toEqual(v)
    expect(new Set(v).size).toBe(v.length)
  })
  it('tanggal berlaku (teks) cocok dengan versi aktif', () => {
    const [th, bl, tg] = VERSI_KEBIJAKAN.split('-').map(Number)
    const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    expect(TANGGAL_BERLAKU).toBe(`${tg} ${bulan[bl - 1]} ${th}`)
  })
  it('dokumen menampilkan riwayat perubahan', () => {
    const b = kebijakanPrivasi(D).bagian.find((x) => x.id === 'perubahan')!
    expect(b.daftar?.length).toBe(RIWAYAT_PERUBAHAN.length)
    expect(b.paragraf.join(' ')).toContain(VERSI_KEBIJAKAN)
  })
})

describe('identitas pengelola', () => {
  it('bawaan terisi dan aman', () => {
    expect(IDENTITAS_BAWAAN.pengelola.length).toBeGreaterThan(0)
    expect(IDENTITAS_BAWAAN.tahun).toBeGreaterThanOrEqual(2026)
  })
  it('berkas konfigurasi menimpa nilai bawaan bila valid, dan tanda kurung sudut dibuang', () => {
    const i = gabungIdentitas(IDENTITAS_BAWAAN, { NAMA_PENGELOLA: ' <b>Nama Baru</b> ', KOTA_DOMISILI: 'Malang', TAHUN_HAK_CIPTA: 2027 })
    expect(i).toEqual({ pengelola: 'bNama Baru/b', kota: 'Malang', tahun: 2027 })
  })
  it('nilai aneh diabaikan', () => {
    const i = gabungIdentitas(IDENTITAS_BAWAAN, { NAMA_PENGELOLA: 42, TAHUN_HAK_CIPTA: 'dua ribu', KOTA_DOMISILI: 7 })
    expect(i.pengelola).toBe(IDENTITAS_BAWAAN.pengelola)
    expect(i.tahun).toBe(IDENTITAS_BAWAAN.tahun)
    expect(i.kota).toBe('')
    expect(gabungIdentitas(IDENTITAS_BAWAAN, null)).toEqual(IDENTITAS_BAWAAN)
    expect(gabungIdentitas(IDENTITAS_BAWAAN, { TAHUN_HAK_CIPTA: 1 }).tahun).toBe(IDENTITAS_BAWAAN.tahun)
  })
  it('kota boleh dikosongkan lewat berkas', () => {
    const asal = { ...IDENTITAS_BAWAAN, kota: 'Jakarta' }
    expect(gabungIdentitas(asal, { KOTA_DOMISILI: '' }).kota).toBe('')
    expect(gabungIdentitas(asal, {}).kota).toBe('Jakarta')
  })
})

const C = (id: string, jenis: CatatanPersetujuan['jenis'], status: boolean, dibuat: string, versi = '2026-10-23'): CatatanPersetujuan => ({ id, jenis, status, versi, dibuat })

describe('status persetujuan terkini', () => {
  it('memakai baris paling baru untuk tiap jenis, apa pun urutan masukannya', () => {
    const r = [C('1', 'promo', true, '2026-10-20T01:00:00Z'), C('3', 'promo', false, '2026-10-22T01:00:00Z'), C('2', 'promo', true, '2026-10-21T01:00:00Z'), C('4', 'analitik', true, '2026-10-21T00:00:00Z')]
    const s = statusTerkini(r)
    expect(s.promo?.status).toBe(false)
    expect(s.analitik?.status).toBe(true)
    expect(s.syarat_privasi).toBeNull()
  })
  it('kosong → semua null', () => expect(statusTerkini([])).toEqual({ syarat_privasi: null, promo: null, analitik: null }))
  it('setiap jenis punya label', () => {
    for (const j of ['syarat_privasi', 'promo', 'analitik'] as const) expect(LABEL_JENIS[j].length).toBeGreaterThan(3)
  })
})

describe('ekspor data akun', () => {
  const sesi = { id: 'u-1', email: 'a@b.co', admin: false }
  const sekarang = new Date('2026-10-23T10:00:00Z')
  const json = bangunEksporData({
    sesi,
    pembelian: [{ id: 'p', ebookId: 'buku-a', orderId: 'RN-1', status: 'lunas', jumlah: 49000, dibuat: '2026-10-22T07:40:00Z', dibayar: '2026-10-22T07:41:00Z' }],
    riwayat: [C('1', 'promo', false, '2026-10-22T01:00:00Z')],
    cookie: { versi: '2026-10-23', analitik: false, waktu: '2026-10-23T09:00:00Z' },
    sekarang,
  })
  const o = JSON.parse(json)
  it('JSON valid berisi akun, pembelian, persetujuan, dan pilihan cookie', () => {
    expect(o.diekspor).toBe('2026-10-23T10:00:00.000Z')
    expect(o.akun).toEqual({ id: 'u-1', email: 'a@b.co', peran: 'pembaca' })
    expect(o.pembelian[0]).toMatchObject({ order_id: 'RN-1', status: 'lunas', jumlah_rupiah: 49000 })
    expect(o.persetujuan[0]).toMatchObject({ jenis: 'promo', setuju: false })
    expect(o.pilihan_cookie_di_perangkat_ini.analitik).toBe(false)
  })
  it('tidak memuat kata sandi atau token', () => {
    expect(json).not.toMatch(/sandi"|password|token|access_token|refresh/i)
  })
  it('pilihan cookie boleh kosong; nama berkas memuat tanggal', () => {
    const j = JSON.parse(bangunEksporData({ sesi: { ...sesi, admin: true }, pembelian: [], riwayat: [], cookie: null, sekarang }))
    expect(j.pilihan_cookie_di_perangkat_ini).toBeNull()
    expect(j.akun.peran).toBe('admin')
    expect(namaBerkasEkspor(sekarang)).toBe('data-akun-ruang-nalar-2026-10-23.json')
  })
  it('konfirmasi hapus harus persis HAPUS (huruf besar)', () => {
    expect(cocokKonfirmasiHapus('HAPUS')).toBe(true)
    expect(cocokKonfirmasiHapus('  HAPUS ')).toBe(true)
    for (const s of ['hapus', 'Hapus', 'HAPUS AKUN', '', 'HAPU']) expect(cocokKonfirmasiHapus(s), s).toBe(false)
  })
})

describe('notice hak cipta di pembaca', () => {
  const baca = (p: string) => readFileSync(new URL('../' + p, import.meta.url), 'utf8')
  it('dipasang di tiap bab (Reader) dan di footer, dengan kalimat persis dari brief', () => {
    expect(baca('src/pages/Reader.tsx')).toMatch(/<NoticeHakCipta penulis=\{penulisTampil\(ebook\)\} \/>/)
    expect(baca('src/components/Footer.tsx')).toContain('Seluruh hak dilindungi UU No. 28 Tahun 2014 tentang Hak Cipta.')
    expect(noticeHakCipta('Nama Penulis', 2026)).toBe('© 2026 Nama Penulis. Seluruh hak dilindungi UU No. 28 Tahun 2014 tentang Hak Cipta.')
  })
  it('notice berada di dalam artikel bab, sebelum ajakan lanjut', () => {
    const r = baca('src/pages/Reader.tsx')
    expect(r.indexOf('<NoticeHakCipta')).toBeGreaterThan(r.indexOf('aria-label="Pindah bab"'))
    expect(r.indexOf('<NoticeHakCipta')).toBeLessThan(r.indexOf('<AjakanLanjut />'))
  })
})
