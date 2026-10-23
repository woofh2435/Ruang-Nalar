import { beforeEach, describe, expect, it } from 'vitest'
import { bacaPilihan, bolehAnalitik, KUNCI_COOKIE, lupakanPilihanCookie, muatUlangCookie, perluTanya, setPilihanCookie, susunPersetujuanDaftar } from '../src/lib/persetujuan'
import { VERSI_KEBIJAKAN } from '../src/lib/legal/versi'
import { buatBackendDemo, EMAIL_ADMIN_DEMO } from '../src/lib/toko/demo'
import { GalatToko } from '../src/lib/toko/tipe'

class PenyimpanPalsu {
  d = new Map<string, string>()
  getItem(k: string) {
    return this.d.has(k) ? (this.d.get(k) as string) : null
  }
  setItem(k: string, v: string) {
    this.d.set(k, String(v))
  }
  removeItem(k: string) {
    this.d.delete(k)
  }
}
let ls: PenyimpanPalsu
beforeEach(() => {
  ls = new PenyimpanPalsu()
  ;(globalThis as unknown as { localStorage: unknown }).localStorage = ls
  lupakanPilihanCookie() // juga membersihkan cadangan memori dari tes sebelumnya
  muatUlangCookie()
})

const galat = async (p: Promise<unknown>) => {
  try {
    await p
  } catch (e) {
    return e as GalatToko
  }
  return null
}

describe('pilihan cookie (opt-in)', () => {
  it('awalnya belum memilih: banner harus tampil dan analitik TIDAK boleh', () => {
    expect(perluTanya(null)).toBe(true)
    expect(bolehAnalitik()).toBe(false)
  })
  it('menolak: tersimpan, banner hilang, analitik tetap tidak boleh', () => {
    const p = setPilihanCookie(false, new Date('2026-10-23T01:00:00Z'))
    expect(p).toEqual({ versi: VERSI_KEBIJAKAN, analitik: false, waktu: '2026-10-23T01:00:00.000Z' })
    expect(perluTanya(p)).toBe(false)
    expect(bolehAnalitik()).toBe(false)
    expect(JSON.parse(ls.getItem(KUNCI_COOKIE) as string).analitik).toBe(false)
  })
  it('menerima: analitik boleh, dan bertahan setelah muat ulang', () => {
    setPilihanCookie(true)
    expect(bolehAnalitik()).toBe(true)
    muatUlangCookie()
    expect(bolehAnalitik()).toBe(true)
  })
  it('pilihan untuk versi kebijakan lama: ditanya lagi dan analitik tidak berlaku', () => {
    const lama = { versi: '2020-01-01', analitik: true, waktu: '2020-01-01T00:00:00Z' }
    ls.setItem(KUNCI_COOKIE, JSON.stringify(lama))
    muatUlangCookie()
    expect(perluTanya(bacaPilihan(lama))).toBe(true)
    expect(bolehAnalitik()).toBe(false)
  })
  it('data rusak atau tidak masuk akal diabaikan', () => {
    for (const x of ['', '{', 'null', '[]', '"teks"', JSON.stringify({ versi: '', analitik: true }), JSON.stringify({ versi: 'x', analitik: 'ya' }), JSON.stringify({ versi: 'x'.repeat(21), analitik: true })]) {
      expect(bacaPilihan(x), x).toBeNull()
    }
    expect(bacaPilihan(undefined)).toBeNull()
    expect(bacaPilihan({ versi: 'v1', analitik: false, waktu: 'bukan tanggal' })?.waktu).toBe(new Date(0).toISOString())
  })
  it('lupakan pilihan mengembalikan ke keadaan belum memilih', () => {
    setPilihanCookie(true)
    lupakanPilihanCookie()
    expect(bolehAnalitik()).toBe(false)
    expect(ls.getItem(KUNCI_COOKIE)).toBeNull()
  })
  it('tetap bekerja bila localStorage ditolak (mode privat)', () => {
    ;(globalThis as unknown as { localStorage: unknown }).localStorage = {
      getItem() {
        throw new Error('ditolak')
      },
      setItem() {
        throw new Error('ditolak')
      },
      removeItem() {
        throw new Error('ditolak')
      },
    }
    muatUlangCookie()
    expect(() => setPilihanCookie(true)).not.toThrow()
    expect(bolehAnalitik()).toBe(true)
  })
  it('isi persetujuan pendaftaran: promo sesuai centang, analitik mengikuti banner', () => {
    expect(susunPersetujuanDaftar(false)).toEqual({ versi: VERSI_KEBIJAKAN, promo: false, analitik: false })
    setPilihanCookie(true)
    expect(susunPersetujuanDaftar(true)).toEqual({ versi: VERSI_KEBIJAKAN, promo: true, analitik: true })
  })
})

describe('backend demo: log persetujuan dan hapus akun', () => {
  it('mendaftar mencatat tiga baris: syarat (wajib), promo, analitik', async () => {
    const b = buatBackendDemo()
    await b.daftar('a@b.co', 'sandi-panjang-1', { versi: VERSI_KEBIJAKAN, promo: true, analitik: false })
    const r = await b.riwayatPersetujuan()
    expect(r.map((x) => [x.jenis, x.status]).sort()).toEqual([['analitik', false], ['promo', true], ['syarat_privasi', true]])
    expect(new Set(r.map((x) => x.versi))).toEqual(new Set([VERSI_KEBIJAKAN]))
    for (const x of r) expect(Number.isNaN(Date.parse(x.dibuat))).toBe(false)
  })
  it('mendaftar tanpa persetujuan (klien lama) tidak mencatat apa pun', async () => {
    const b = buatBackendDemo()
    await b.daftar('a@b.co', 'sandi-panjang-1')
    expect(await b.riwayatPersetujuan()).toEqual([])
  })
  it('menarik persetujuan menambah baris baru (tidak menimpa), terbaru di urutan pertama', async () => {
    const b = buatBackendDemo()
    await b.daftar('a@b.co', 'sandi-panjang-1', { versi: VERSI_KEBIJAKAN, promo: true, analitik: false })
    await b.catatPersetujuan('promo', false, VERSI_KEBIJAKAN)
    const r = await b.riwayatPersetujuan()
    expect(r.length).toBe(4)
    expect(r[0]).toMatchObject({ jenis: 'promo', status: false })
    expect(r.filter((x) => x.jenis === 'promo').length).toBe(2)
  })
  it('riwayat hanya milik akun yang masuk', async () => {
    const b = buatBackendDemo()
    await b.daftar('a@b.co', 'sandi-panjang-1', { versi: VERSI_KEBIJAKAN, promo: true, analitik: true })
    await b.keluar()
    await b.daftar('c@d.co', 'sandi-panjang-1', { versi: VERSI_KEBIJAKAN, promo: false, analitik: false })
    const r = await b.riwayatPersetujuan()
    expect(r.find((x) => x.jenis === 'promo')?.status).toBe(false)
    expect(r.length).toBe(3)
  })
  it('wajib masuk untuk melihat atau mencatat', async () => {
    const b = buatBackendDemo()
    expect((await galat(b.riwayatPersetujuan()))?.kode).toBe('belum_login')
    expect((await galat(b.catatPersetujuan('promo', true, 'v')))?.kode).toBe('belum_login')
  })
  it('hapus akun: sesi berakhir, tidak bisa masuk lagi, data dan persetujuan hilang, email bisa dipakai ulang', async () => {
    const b = buatBackendDemo()
    await b.daftar('a@b.co', 'sandi-panjang-1', { versi: VERSI_KEBIJAKAN, promo: true, analitik: true })
    await b.hapusAkun()
    expect(await b.sesiSaatIni()).toBeNull()
    expect((await galat(b.masuk('a@b.co', 'sandi-panjang-1')))?.kode).toBe('kredensial_salah')
    await b.daftar('a@b.co', 'sandi-baru-123')
    expect(await b.riwayatPersetujuan()).toEqual([])
  })
  it('hapus akun milik satu orang tidak mengganggu orang lain', async () => {
    const b = buatBackendDemo()
    await b.daftar('a@b.co', 'sandi-panjang-1', { versi: VERSI_KEBIJAKAN, promo: true, analitik: true })
    await b.keluar()
    await b.daftar('c@d.co', 'sandi-panjang-1', { versi: VERSI_KEBIJAKAN, promo: false, analitik: false })
    await b.hapusAkun()
    await b.masuk('a@b.co', 'sandi-panjang-1')
    expect((await b.riwayatPersetujuan()).length).toBe(3)
  })
  it('admin tidak bisa menghapus akunnya sendiri', async () => {
    const b = buatBackendDemo()
    await b.masuk(EMAIL_ADMIN_DEMO, 'admin-demo-123')
    expect((await galat(b.hapusAkun()))?.kode).toBe('admin_tidak_bisa')
    expect((await b.sesiSaatIni())?.admin).toBe(true)
  })
  it('wajib masuk untuk menghapus akun', async () => {
    expect((await galat(buatBackendDemo().hapusAkun()))?.kode).toBe('belum_login')
  })
})
