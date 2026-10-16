import { beforeEach, describe, expect, it } from 'vitest'
import { gabungToko } from '../src/lib/library'
import { tentukanMode } from '../src/lib/toko/mode'
import { buatBackendDemo, EMAIL_ADMIN_DEMO } from '../src/lib/toko/demo'
import { bangunEbookToko, buatToko, dimiliki } from '../src/lib/toko/store'
import { petaGalat } from '../src/lib/toko/supabase'
import { GalatToko, emailValid, idEbookValid, rupiah } from '../src/lib/toko/tipe'
import type { Ebook } from '../src/lib/types'

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

beforeEach(() => {
  ;(globalThis as unknown as { localStorage: unknown }).localStorage = new PenyimpanPalsu()
})

const galat = async (p: Promise<unknown>) => {
  try {
    await p
  } catch (e) {
    return e as GalatToko
  }
  return null
}

describe('mode toko', () => {
  it('nyata bila URL dan kunci keduanya terisi', () => {
    expect(tentukanMode('https://x.supabase.co', 'kunci', false, 'nama.github.io')).toBe('nyata')
    expect(tentukanMode('https://x.supabase.co', 'kunci', false, 'localhost')).toBe('nyata')
  })
  it('mati di web publik bila belum diisi (web tetap seperti sebelumnya)', () => {
    expect(tentukanMode('', '', false, 'nama.github.io')).toBe('mati')
    expect(tentukanMode('https://x.supabase.co', '', false, 'nama.github.io')).toBe('mati')
    expect(tentukanMode('   ', ' ', false, 'contoh.com')).toBe('mati')
  })
  it('demo bila TOKO_DEMO menyala atau dijalankan di komputer sendiri', () => {
    expect(tentukanMode('', '', true, 'nama.github.io')).toBe('demo')
    expect(tentukanMode('', '', false, 'localhost')).toBe('demo')
    expect(tentukanMode('', '', false, '127.0.0.1')).toBe('demo')
  })
})

describe('pembantu tipe', () => {
  it('rupiah', () => {
    expect(rupiah(25000)).toBe('Rp 25.000')
    expect(rupiah(1500000)).toBe('Rp 1.500.000')
    expect(rupiah(999)).toBe('Rp 999')
  })
  it('email dan id ebook', () => {
    expect(emailValid('a@b.co')).toBe(true)
    expect(emailValid('a@b')).toBe(false)
    expect(emailValid('a b@c.com')).toBe(false)
    expect(idEbookValid('sosiologi-1')).toBe(true)
    expect(idEbookValid('Sosiologi')).toBe(false)
    expect(idEbookValid('-a')).toBe(false)
    expect(idEbookValid('a'.repeat(61))).toBe(false)
  })
})

describe('pemetaan galat Supabase → pesan Indonesia', () => {
  it('kasus umum', () => {
    expect(petaGalat(new Error('Invalid login credentials')).kode).toBe('kredensial_salah')
    expect(petaGalat(new Error('User already registered')).kode).toBe('email_terdaftar')
    expect(petaGalat(new Error('Email not confirmed')).kode).toBe('email_belum_konfirmasi')
    expect(petaGalat(new Error('Password should be at least 6 characters')).kode).toBe('sandi_lemah')
    expect(petaGalat(new Error('Failed to fetch')).kode).toBe('jaringan')
    expect(petaGalat({ message: 'email rate limit exceeded' }).kode).toBe('terlalu_sering')
    expect(petaGalat({ message: 'x', code: '42501' }).kode).toBe('ditolak')
    expect(petaGalat({ message: 'x', code: '23503' }).kode).toBe('ditolak')
    expect(petaGalat('aneh').kode).toBe('lainnya')
  })
  it('GalatToko dikembalikan apa adanya, dan pesan tidak membocorkan teks teknis', () => {
    const g = new GalatToko('sudah_dibeli', 'halo')
    expect(petaGalat(g)).toBe(g)
    expect(petaGalat(new Error('relation "public.pembelian" does not exist')).message).not.toMatch(/relation|public\./)
  })
})

describe('backend demo', () => {
  it('validasi pendaftaran', async () => {
    const b = buatBackendDemo()
    expect((await galat(b.daftar('bukan-email', 'sandi-panjang-1')))?.kode).toBe('email_tidak_valid')
    expect((await galat(b.daftar('a@b.co', 'pendek')))?.kode).toBe('sandi_lemah')
    expect(await b.sesiSaatIni()).toBeNull()
  })
  it('daftar → langsung masuk; email sama tidak bisa dua kali; keluar menghapus sesi', async () => {
    const b = buatBackendDemo()
    const h = await b.daftar('Budi@Contoh.com', 'sandi-panjang-1')
    expect(h.perluKonfirmasi).toBe(false)
    const s = await b.sesiSaatIni()
    expect(s?.email).toBe('budi@contoh.com')
    expect(s?.admin).toBe(false)
    expect((await galat(b.daftar('budi@contoh.com', 'sandi-panjang-1')))?.kode).toBe('email_terdaftar')
    await b.keluar()
    expect(await b.sesiSaatIni()).toBeNull()
  })
  it('masuk: sandi salah ditolak, benar diterima, tidak peduli huruf besar di email', async () => {
    const b = buatBackendDemo()
    await b.daftar('ani@contoh.com', 'sandi-panjang-1')
    await b.keluar()
    expect((await galat(b.masuk('ani@contoh.com', 'salah-salah')))?.kode).toBe('kredensial_salah')
    await b.masuk(' ANI@contoh.com ', 'sandi-panjang-1')
    expect((await b.sesiSaatIni())?.email).toBe('ani@contoh.com')
  })
  it('katalog publik; data pribadi wajib login', async () => {
    const b = buatBackendDemo()
    const k = await b.katalog()
    expect(k.length).toBeGreaterThan(0)
    expect(k[0]).not.toHaveProperty('raw')
    expect((await galat(b.pembelianSaya()))?.kode).toBe('belum_login')
    expect((await galat(b.bacaIsi(k[0].id)))?.kode).toBe('belum_login')
    expect((await galat(b.mulaiBayar(k[0].id)))?.kode).toBe('belum_login')
  })
  it('isi terkunci sebelum beli, terbuka sesudah, dan tidak bisa dibeli dua kali', async () => {
    const b = buatBackendDemo()
    await b.daftar('ani@contoh.com', 'sandi-panjang-1')
    const id = (await b.katalog())[0].id
    expect(await b.bacaIsi(id)).toBeNull()
    expect(await b.mulaiBayar(id)).toEqual({ jenis: 'selesai' })
    const p = await b.pembelianSaya()
    expect(p).toHaveLength(1)
    expect(p[0].status).toBe('lunas')
    expect(p[0]).not.toHaveProperty('dibuatOleh')
    expect(await b.bacaIsi(id)).toContain('# Bab 1')
    expect((await galat(b.mulaiBayar(id)))?.kode).toBe('sudah_dibeli')
  })
  it('pembelian satu orang tidak membuka isi untuk orang lain', async () => {
    const b = buatBackendDemo()
    await b.daftar('ani@contoh.com', 'sandi-panjang-1')
    const id = (await b.katalog())[0].id
    await b.mulaiBayar(id)
    await b.keluar()
    await b.daftar('budi@contoh.com', 'sandi-panjang-1')
    expect(await b.bacaIsi(id)).toBeNull()
    expect(await b.pembelianSaya()).toEqual([])
  })
  it('data bertahan antar muatan ulang (localStorage)', async () => {
    const a = buatBackendDemo()
    await a.daftar('ani@contoh.com', 'sandi-panjang-1')
    const id = (await a.katalog())[0].id
    await a.mulaiBayar(id)
    const b = buatBackendDemo() // seperti membuka ulang halaman
    expect((await b.sesiSaatIni())?.email).toBe('ani@contoh.com')
    expect(await b.bacaIsi(id)).toContain('# Bab 1')
  })
  it('tetap jalan bila localStorage tidak tersedia (mode privat)', async () => {
    ;(globalThis as unknown as { localStorage: unknown }).localStorage = {
      getItem() {
        throw new Error('diblokir')
      },
      setItem() {
        throw new Error('diblokir')
      },
      removeItem() {
        throw new Error('diblokir')
      },
    }
    const b = buatBackendDemo()
    await b.daftar('ani@contoh.com', 'sandi-panjang-1')
    expect((await b.sesiSaatIni())?.email).toBe('ani@contoh.com')
  })
  it('admin: hanya akun admin demo; pengguna biasa ditolak', async () => {
    const b = buatBackendDemo()
    await b.daftar('ani@contoh.com', 'sandi-panjang-1')
    expect((await galat(b.adminDaftar()))?.kode).toBe('bukan_admin')
    expect((await galat(b.adminAtur('contoh-berbayar-demo', { harga: 1000 })))?.kode).toBe('bukan_admin')
    expect((await galat(b.adminHapus('contoh-berbayar-demo')))?.kode).toBe('bukan_admin')
    await b.keluar()
    await b.masuk(EMAIL_ADMIN_DEMO, 'admin-demo-123')
    expect((await b.sesiSaatIni())?.admin).toBe(true)
    expect((await b.adminDaftar()).length).toBeGreaterThan(0)
  })
  it('admin: tambah, ubah harga, sembunyikan, hapus; yang sudah dibeli tidak boleh dihapus', async () => {
    const b = buatBackendDemo()
    await b.masuk(EMAIL_ADMIN_DEMO, 'admin-demo-123')
    await b.adminSimpan({
      item: { id: 'buku-baru', judul: 'Buku Baru', subjudul: '', penulis: 'X', tema: 'iris', ikon: '📘', tag: [], deskripsi: '', harga: 50000, terbit: true },
      raw: '# Bab 1\n\nisi rahasia',
    })
    expect((await b.katalog()).some((k) => k.id === 'buku-baru')).toBe(true)
    expect((await galat(b.adminAtur('buku-baru', { harga: 500 })))?.kode).toBe('ditolak')
    await b.adminAtur('buku-baru', { harga: 75000 })
    expect((await b.adminDaftar()).find((k) => k.id === 'buku-baru')?.harga).toBe(75000)
    await b.adminAtur('buku-baru', { terbit: false })
    expect((await b.katalog()).some((k) => k.id === 'buku-baru')).toBe(false)
    expect((await b.adminDaftar()).some((k) => k.id === 'buku-baru')).toBe(true)
    await b.adminHapus('buku-baru')
    expect((await b.adminDaftar()).some((k) => k.id === 'buku-baru')).toBe(false)
    expect((await galat(b.adminSimpan({ item: { id: 'Salah ID', judul: 'x', subjudul: '', penulis: '', tema: 'malam', ikon: '', tag: [], deskripsi: '', harga: 5000, terbit: true }, raw: '' })))?.kode).toBe('ditolak')
    // beli lalu coba hapus
    await b.keluar()
    await b.daftar('ani@contoh.com', 'sandi-panjang-1')
    await b.mulaiBayar('contoh-berbayar-demo')
    await b.keluar()
    await b.masuk(EMAIL_ADMIN_DEMO, 'admin-demo-123')
    expect((await galat(b.adminHapus('contoh-berbayar-demo')))?.kode).toBe('ditolak')
  })
})

describe('penyimpan toko', () => {
  const BAB = (e: Ebook) => e.parsed.bab.length

  it('mode mati: tidak melakukan apa pun', async () => {
    const t = buatToko(null, 'mati')
    await t.mulai()
    const s = t.getState()
    expect(s.mode).toBe('mati')
    expect(s.siap).toBe(true)
    expect(s.katalog).toEqual([])
    expect(bangunEbookToko(s.katalog, s.isi)).toEqual([])
    expect((await galat(t.masuk('a@b.co', 'sandi-panjang-1')))?.kode).toBe('ditolak')
  })

  it('katalog tampil sebagai sampul terkunci tanpa isi sama sekali', async () => {
    const t = buatToko(buatBackendDemo(), 'demo')
    await t.mulai()
    await new Promise((r) => setTimeout(r, 120))
    const s = t.getState()
    expect(s.siap).toBe(true)
    expect(s.katalogStatus).toBe('siap')
    const [e] = bangunEbookToko(s.katalog, s.isi)
    expect(e.sumber).toBe('toko')
    expect(e.terkunci).toBe(true)
    expect(e.raw).toBe('')
    expect(BAB(e)).toBe(0)
    expect(e.harga).toBe(25000)
    expect(e.parsed.meta.judul).toBe('Contoh Ebook Berbayar')
    expect(JSON.stringify(s)).not.toContain('Selamat, kamu sudah')
  })

  it('alur lengkap: daftar → beli → isi terbuka → keluar → terkunci lagi dan isi hilang dari memori', async () => {
    const t = buatToko(buatBackendDemo(), 'demo')
    await t.mulai()
    await new Promise((r) => setTimeout(r, 120))
    await t.daftar('ani@contoh.com', 'sandi-panjang-1')
    expect(t.getState().sesi?.email).toBe('ani@contoh.com')
    const id = t.getState().katalog[0].id
    expect(dimiliki(t.getState(), id)).toBe(false)
    await t.muatIsi(id)
    expect(t.getState().isiStatus[id]).toBe('tidak_berhak')
    const h = await t.beli(id)
    expect(h).toEqual({ jenis: 'selesai' })
    const s = t.getState()
    expect(dimiliki(s, id)).toBe(true)
    const [e] = bangunEbookToko(s.katalog, s.isi)
    expect(e.terkunci).toBe(false)
    expect(BAB(e)).toBe(2)
    expect(e.parsed.jumlahKuis).toBe(1)
    expect(e.parsed.meta.judul).toBe('Contoh Ebook Berbayar')
    await t.keluar()
    const s2 = t.getState()
    expect(s2.sesi).toBeNull()
    expect(s2.pembelian).toEqual([])
    expect(s2.isi).toEqual({})
    expect(JSON.stringify(s2)).not.toContain('Selamat, kamu sudah')
    expect(bangunEbookToko(s2.katalog, s2.isi)[0].terkunci).toBe(true)
  })

  it('ganti akun: pembelian akun lama tidak ikut terbawa', async () => {
    const t = buatToko(buatBackendDemo(), 'demo')
    await t.mulai()
    await new Promise((r) => setTimeout(r, 120))
    await t.daftar('ani@contoh.com', 'sandi-panjang-1')
    const id = t.getState().katalog[0].id
    await t.beli(id)
    await t.keluar()
    await t.daftar('budi@contoh.com', 'sandi-panjang-1')
    await t.muatPembelian()
    expect(dimiliki(t.getState(), id)).toBe(false)
    await t.muatIsi(id)
    expect(t.getState().isi[id]).toBeUndefined()
  })

  it('pesan galat dari backend diteruskan sebagai GalatToko', async () => {
    const t = buatToko(buatBackendDemo(), 'demo')
    await t.mulai()
    expect((await galat(t.masuk('x@y.co', 'salah-salah')))?.kode).toBe('kredensial_salah')
    expect((await galat(t.daftar('jelek', 'sandi-panjang-1')))?.kode).toBe('email_tidak_valid')
  })

  it('admin: simpan ebook → muncul di katalog dan terkunci untuk pembaca; ubah/hapus memperbarui daftar', async () => {
    const t = buatToko(buatBackendDemo(), 'demo')
    await t.mulai()
    await t.masuk(EMAIL_ADMIN_DEMO, 'admin-demo-123')
    expect(t.getState().sesi?.admin).toBe(true)
    await t.adminSimpan({
      item: { id: 'catatan-2', judul: 'Catatan 2', subjudul: '', penulis: '', tema: 'api', ikon: '🔥', tag: ['a'], deskripsi: '', harga: 30000, terbit: true },
      raw: '# Bab 1\n\nrahasia',
    })
    expect(t.getState().adminItem.some((k) => k.id === 'catatan-2')).toBe(true)
    expect(t.getState().katalog.some((k) => k.id === 'catatan-2')).toBe(true)
    await t.adminAtur('catatan-2', { terbit: false })
    expect(t.getState().katalog.some((k) => k.id === 'catatan-2')).toBe(false)
    expect(t.getState().adminItem.some((k) => k.id === 'catatan-2')).toBe(true)
    await t.adminHapus('catatan-2')
    expect(t.getState().adminItem.some((k) => k.id === 'catatan-2')).toBe(false)
  })

  it('pelanggan biasa tidak bisa memakai fungsi admin', async () => {
    const t = buatToko(buatBackendDemo(), 'demo')
    await t.mulai()
    await t.daftar('ani@contoh.com', 'sandi-panjang-1')
    expect((await galat(t.adminMuat()))?.kode).toBe('bukan_admin')
  })

  it('pengikut perubahan diberi kabar', async () => {
    const t = buatToko(buatBackendDemo(), 'demo')
    let n = 0
    const stop = t.subscribe(() => n++)
    await t.mulai()
    await t.daftar('ani@contoh.com', 'sandi-panjang-1')
    expect(n).toBeGreaterThan(0)
    const sebelum = n
    stop()
    await t.keluar()
    expect(n).toBe(sebelum)
  })
})

describe('gabungToko', () => {
  const buat = (id: string): Ebook => ({ id, sumber: 'publik', raw: '', parsed: { meta: { judul: id, subjudul: '', penulis: '', tema: 'malam', ikon: '', tag: [], status: 'terbit', deskripsi: '' }, bab: [], peringatan: [], jumlahKuis: 0 } })
  it('toko ditaruh di belakang dan id yang bentrok diabaikan', () => {
    const semua = [buat('a'), buat('b')]
    const toko = [{ ...buat('b'), sumber: 'toko' as const }, { ...buat('c'), sumber: 'toko' as const }]
    const g = gabungToko(semua, toko)
    expect(g.map((e) => e.id)).toEqual(['a', 'b', 'c'])
    expect(g[1].sumber).toBe('publik')
    expect(gabungToko(semua, [])).toBe(semua)
  })
})

import { amanLanjut } from '../src/lib/toko/tipe'
describe('amanLanjut', () => {
  it('menerima jalur internal', () => {
    expect(amanLanjut('/baca/contoh-berbayar-demo')).toBe('/baca/contoh-berbayar-demo')
    expect(amanLanjut('/akun?order_id=RN-abc_1')).toBe('/akun?order_id=RN-abc_1')
    expect(amanLanjut('/admin')).toBe('/admin')
  })
  it('menolak alamat luar atau aneh', () => {
    for (const x of ['https://jahat.com', '//jahat.com', 'javascript:alert(1)', '/..//x', '/a b', '/<script>', 'http://x', '', null, undefined]) {
      expect(amanLanjut(x as string | null)).toBe('/akun')
    }
    expect(amanLanjut('https://jahat.com', '/')).toBe('/')
    expect(amanLanjut('/' + 'a'.repeat(300))).toBe('/akun')
  })
})

import { itemDariRaw, periksaIsian } from '../src/lib/toko/susun'
describe('admin toko: susun & periksa', () => {
  const RAW = '---\njudul: Buku Uji\nsubjudul: Sub\npenulis: Ani\ntema: iris\nikon: 📘\ntag: [a, b]\nstatus: draf\ndeskripsi: Deskripsi.\n---\n\n# Bab 1\n\nIsi.\n'
  it('metadata katalog diambil dari frontmatter; status frontmatter diabaikan (pakai pilihan admin)', () => {
    const i = itemDariRaw(RAW, { id: 'buku-uji', harga: 30000, terbit: true })
    expect(i).toMatchObject({ id: 'buku-uji', judul: 'Buku Uji', subjudul: 'Sub', penulis: 'Ani', tema: 'iris', ikon: '📘', tag: ['a', 'b'], deskripsi: 'Deskripsi.', harga: 30000, terbit: true })
    expect(i).not.toHaveProperty('urutan')
    expect(itemDariRaw(RAW, { id: 'x', harga: 1000, terbit: false, urutan: 3 }).urutan).toBe(3)
  })
  const ok = { id: 'buku-uji', hargaTeks: '25000', raw: RAW, idTerpakai: ['lain'], baru: true }
  it('isian benar → tanpa galat', () => {
    expect(periksaIsian(ok)).toEqual([])
    expect(periksaIsian({ ...ok, hargaTeks: '25.000' })).toEqual([])
  })
  it('menolak ID jelek, ID bentrok (hanya untuk baru), harga tak wajar, isi kosong/tanpa bab', () => {
    expect(periksaIsian({ ...ok, id: 'Buku Uji' }).length).toBe(1)
    expect(periksaIsian({ ...ok, id: 'lain' }).join()).toMatch(/sudah dipakai/)
    expect(periksaIsian({ ...ok, id: 'lain', baru: false })).toEqual([])
    expect(periksaIsian({ ...ok, hargaTeks: '500' }).join()).toMatch(/minimal/i)
    expect(periksaIsian({ ...ok, hargaTeks: '12,5' }).join()).toMatch(/angka/)
    expect(periksaIsian({ ...ok, hargaTeks: '' }).join()).toMatch(/angka/)
    expect(periksaIsian({ ...ok, hargaTeks: '999999999999' }).join()).toMatch(/terlalu besar/)
    expect(periksaIsian({ ...ok, raw: '  ' }).join()).toMatch(/kosong/)
    expect(periksaIsian({ ...ok, raw: '---\njudul: X\n---\n' }).join()).toMatch(/belum punya bab/)
    expect(periksaIsian({ ...ok, raw: RAW + 'x'.repeat(2 * 1024 * 1024) }).join()).toMatch(/terlalu besar/)
  })
})

import { bacaKonfig, gabungKonfig, kunciAman, urlSupabaseValid } from '../src/lib/toko/konfig'
const b64u = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
const jwt = (role: string) => `${b64u({ alg: 'HS256', typ: 'JWT' })}.${b64u({ role, iss: 'supabase' })}.tandatangan`
describe('konfigurasi toko (toko-config.json)', () => {
  const KOSONG = { url: '', kunci: '', demo: false }
  it('kunci anon/publishable aman; service_role dan sb_secret ditolak', () => {
    expect(kunciAman(jwt('anon'))).toBe(true)
    expect(kunciAman('sb_publishable_abc123')).toBe(true)
    expect(kunciAman(jwt('service_role'))).toBe(false)
    expect(kunciAman('sb_secret_abc123')).toBe(false)
    expect(kunciAman('   ')).toBe(false)
  })
  it('URL: https atau localhost saja', () => {
    expect(urlSupabaseValid('https://abc.supabase.co')).toBe(true)
    expect(urlSupabaseValid('http://localhost:54321')).toBe(true)
    expect(urlSupabaseValid('http://abc.supabase.co')).toBe(false)
    expect(urlSupabaseValid('javascript:alert(1)')).toBe(false)
    expect(urlSupabaseValid('abc')).toBe(false)
  })
  it('berkas kosong / rusak → nilai bawaan dipakai', () => {
    expect(gabungKonfig(KOSONG, null).konfig).toEqual(KOSONG)
    expect(gabungKonfig(KOSONG, 'bukan objek').konfig).toEqual(KOSONG)
    expect(gabungKonfig(KOSONG, { SUPABASE_URL: '', SUPABASE_ANON_KEY: '' }).konfig).toEqual(KOSONG)
    const bawaan = { url: 'https://a.supabase.co', kunci: jwt('anon'), demo: false }
    expect(gabungKonfig(bawaan, {}).konfig).toEqual(bawaan)
  })
  it('isi berkas menimpa bawaan bila tidak kosong', () => {
    const h = gabungKonfig(KOSONG, { SUPABASE_URL: ' https://x.supabase.co ', SUPABASE_ANON_KEY: jwt('anon'), TOKO_DEMO: true })
    expect(h.konfig).toEqual({ url: 'https://x.supabase.co', kunci: jwt('anon'), demo: true })
    expect(h.peringatan).toEqual([])
  })
  it('kunci rahasia dibuang beserta URL-nya, dengan peringatan; fitur jadi mati', () => {
    const h = gabungKonfig(KOSONG, { SUPABASE_URL: 'https://x.supabase.co', SUPABASE_ANON_KEY: jwt('service_role') })
    expect(h.konfig.url).toBe('')
    expect(h.konfig.kunci).toBe('')
    expect(h.peringatan.join(' ')).toMatch(/RAHASIA/)
  })
  it('hanya salah satu terisi / URL jelek → mati dengan peringatan', () => {
    expect(gabungKonfig(KOSONG, { SUPABASE_URL: 'https://x.supabase.co' }).konfig).toEqual(KOSONG)
    expect(gabungKonfig(KOSONG, { SUPABASE_URL: 'https://x.supabase.co' }).peringatan.length).toBe(1)
    expect(gabungKonfig(KOSONG, { SUPABASE_URL: 'ftp://x', SUPABASE_ANON_KEY: jwt('anon') }).konfig.url).toBe('')
    expect(gabungKonfig(KOSONG, { SUPABASE_URL: 'ftp://x', SUPABASE_ANON_KEY: jwt('anon') }).peringatan.length).toBeGreaterThan(0)
  })
  it('TOKO_DEMO hanya boleh boolean sungguhan', () => {
    expect(gabungKonfig(KOSONG, { TOKO_DEMO: 'true' }).konfig.demo).toBe(false)
    expect(gabungKonfig({ ...KOSONG, demo: true }, { TOKO_DEMO: false }).konfig.demo).toBe(false)
  })
  it('bacaKonfig: berkas ada → dipakai; 404, bukan JSON, atau jaringan gagal → bawaan', async () => {
    const ok = (async () => new Response(JSON.stringify({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_ANON_KEY: jwt('anon') }), { status: 200 })) as unknown as typeof fetch
    expect((await bacaKonfig(KOSONG, ok)).konfig.url).toBe('https://x.supabase.co')
    const hilang = (async () => new Response('nope', { status: 404 })) as unknown as typeof fetch
    expect((await bacaKonfig(KOSONG, hilang)).konfig).toEqual(KOSONG)
    const html = (async () => new Response('<!doctype html><html></html>', { status: 200 })) as unknown as typeof fetch
    expect((await bacaKonfig(KOSONG, html)).konfig).toEqual(KOSONG)
    const putus = (async () => {
      throw new TypeError('Failed to fetch')
    }) as unknown as typeof fetch
    expect((await bacaKonfig(KOSONG, putus)).konfig).toEqual(KOSONG)
  })
  it('bacaKonfig: server menggantung → menyerah setelah batas waktu', async () => {
    const gantung = ((_u: unknown, o?: RequestInit) => new Promise((_ok, tolak) => o?.signal?.addEventListener('abort', () => tolak(new DOMException('abort', 'AbortError'))))) as unknown as typeof fetch
    const t0 = Date.now()
    const h = await bacaKonfig(KOSONG, gantung, 80)
    expect(h.konfig).toEqual(KOSONG)
    expect(Date.now() - t0).toBeLessThan(1500)
  })
})

describe('penyimpan toko: pasang() mengganti backend & mengosongkan data', () => {
  it('awalnya belum siap; setelah pasang demo → siap dan berfungsi; pasang ulang mengosongkan sesi', async () => {
    const t = buatToko(null, 'mati', { konfigSiap: false })
    expect(t.getState().konfigSiap).toBe(false)
    t.pasang(buatBackendDemo(), 'demo')
    expect(t.getState().konfigSiap).toBe(true)
    expect(t.getState().mode).toBe('demo')
    await t.mulai()
    await t.daftar('ani@contoh.com', 'sandi-panjang-1')
    expect(t.getState().sesi).not.toBeNull()
    t.pasang(null, 'mati')
    expect(t.getState().sesi).toBeNull()
    expect(t.getState().mode).toBe('mati')
    expect(t.getState().katalog).toEqual([])
  })
})
