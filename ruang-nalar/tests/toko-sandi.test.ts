import { beforeEach, describe, expect, it } from 'vitest'
import { buatBackendDemo } from '../src/lib/toko/demo'
import { buatToko } from '../src/lib/toko/store'
import { petaGalat } from '../src/lib/toko/supabase'
import { bacaTautanAuth, tangkapTautanAuth, ambilTautanTertangkap, lupakanTautan } from '../src/lib/toko/tautan'
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

beforeEach(() => {
  ;(globalThis as unknown as { localStorage: unknown }).localStorage = new PenyimpanPalsu()
  lupakanTautan()
})

const galat = async (p: Promise<unknown>) => {
  try {
    await p
  } catch (e) {
    return e as GalatToko
  }
  return null
}

// JWT palsu hanya untuk bentuk (tiga bagian base64url)
const JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.c2lnbmF0dXJl'

describe('tautan email Supabase (bagian # alamat)', () => {
  it('tautan pemulihan sandi dikenali', () => {
    const h = bacaTautanAuth(`#access_token=${JWT}&expires_in=3600&refresh_token=abc123&token_type=bearer&type=recovery`)
    expect(h).toEqual({ tipe: 'sesi', tautan: { jenis: 'pemulihan', accessToken: JWT, refreshToken: 'abc123' } })
  })
  it('tautan konfirmasi akun dikenali (signup, magiclink, email_change, invite)', () => {
    for (const t of ['signup', 'magiclink', 'email_change', 'invite']) {
      const h = bacaTautanAuth(`#access_token=${JWT}&refresh_token=rt&type=${t}`)
      expect(h?.tipe === 'sesi' && h.tautan.jenis).toBe('konfirmasi')
    }
  })
  it('tipe tak dikenal → jenis "lainnya"', () => {
    const h = bacaTautanAuth(`#access_token=${JWT}&refresh_token=rt&type=aneh`)
    expect(h?.tipe === 'sesi' && h.tautan.jenis).toBe('lainnya')
  })
  it('galat dari Supabase (tautan kedaluwarsa) menghasilkan pesan ramah', () => {
    const h = bacaTautanAuth('#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired')
    expect(h?.tipe).toBe('galat')
    if (h?.tipe === 'galat') {
      expect(h.kode).toBe('otp_expired')
      expect(h.pesan).toMatch(/kedaluwarsa/)
      expect(h.pesan).not.toMatch(/Email link is invalid/)
    }
  })
  it('rute biasa dan hash kosong BUKAN tautan auth', () => {
    expect(bacaTautanAuth('')).toBeNull()
    expect(bacaTautanAuth('#')).toBeNull()
    expect(bacaTautanAuth('#/baca/apa-itu-sosiologi?bab=2')).toBeNull()
    expect(bacaTautanAuth('#/akun?order_id=ORDER-1')).toBeNull()
    expect(bacaTautanAuth('#/admin')).toBeNull()
  })
  it('token yang bentuknya bukan JWT ditolak (bukan sesi)', () => {
    expect(bacaTautanAuth('#access_token=bukan-jwt&refresh_token=rt&type=recovery')).toBeNull()
    expect(bacaTautanAuth(`#access_token=${JWT}&type=recovery`)).toBeNull() // tanpa refresh token
    expect(bacaTautanAuth('#access_token=' + 'a'.repeat(5000))).toBeNull()
  })
  it('tangkapTautanAuth menyimpan di memori dan merapikan alamat (token tidak tertinggal di riwayat)', () => {
    const dipanggil: string[] = []
    const h = tangkapTautanAuth(
      { hash: `#access_token=${JWT}&refresh_token=rt&type=recovery`, pathname: '/ruang-nalar/', search: '' },
      { replaceState: (_d: unknown, _t: string, url?: string | URL | null) => void dipanggil.push(String(url)) },
    )
    expect(h?.tipe).toBe('sesi')
    expect(dipanggil).toEqual(['/ruang-nalar/#/tautan'])
    expect(dipanggil[0]).not.toContain('access_token')
    expect(ambilTautanTertangkap()).toEqual(h)
    lupakanTautan()
    expect(ambilTautanTertangkap()).toBeNull()
  })
  it('tangkapTautanAuth tidak mengubah apa pun untuk alamat biasa', () => {
    const dipanggil: string[] = []
    const h = tangkapTautanAuth({ hash: '#/akun', pathname: '/', search: '' }, { replaceState: (_d: unknown, _t: string, url?: string | URL | null) => void dipanggil.push(String(url)) })
    expect(h).toBeNull()
    expect(dipanggil).toEqual([])
    expect(ambilTautanTertangkap()).toBeNull()
  })
})

describe('petaGalat: pesan terkait sandi dan tautan', () => {
  it('sandi baru sama dengan yang lama', () => {
    const g = petaGalat({ message: 'New password should be different from the old password.', code: 'same_password' })
    expect(g.kode).toBe('sandi_sama')
    expect(g.message).toMatch(/berbeda/)
  })
  it('tautan kedaluwarsa', () => {
    expect(petaGalat({ message: 'Email link is invalid or has expired', code: 'otp_expired' }).kode).toBe('tautan_kedaluwarsa')
    expect(petaGalat({ message: 'Invalid Refresh Token: Refresh Token Not Found' }).kode).toBe('tautan_kedaluwarsa')
  })
  it('sesi hilang saat ganti sandi', () => {
    expect(petaGalat({ message: 'Auth session missing!' }).kode).toBe('belum_login')
  })
  it('batas permintaan email tetap dikenali', () => {
    expect(petaGalat({ message: 'For security purposes, you can only request this after 60 seconds.', code: 'over_email_send_rate_limit' }).kode).toBe('terlalu_sering')
  })
})

describe('backend demo: lupa dan ganti sandi', () => {
  it('email salah format ditolak; email tak terdaftar tidak membocorkan apa pun', async () => {
    const b = buatBackendDemo()
    expect((await galat(b.kirimResetSandi('bukan-email')))?.kode).toBe('email_tidak_valid')
    expect(await b.kirimResetSandi('tidak-ada@contoh.com')).toEqual({})
  })
  it('alur lengkap: lupa → tautan demo → sesi pemulihan → sandi baru → masuk dengan sandi baru', async () => {
    const b = buatBackendDemo()
    await b.daftar('lupa@contoh.com', 'sandi-lama-123')
    await b.keluar()
    const h = await b.kirimResetSandi('LUPA@contoh.com')
    expect(h.tautanDemo?.jenis).toBe('pemulihan')
    expect(await b.sesiSaatIni()).toBeNull()
    await b.pulihkanDariTautan(h.tautanDemo!)
    expect((await b.sesiSaatIni())?.email).toBe('lupa@contoh.com')
    await b.ubahSandi('sandi-baru-456')
    await b.keluar()
    expect((await galat(b.masuk('lupa@contoh.com', 'sandi-lama-123')))?.kode).toBe('kredensial_salah')
    await b.masuk('lupa@contoh.com', 'sandi-baru-456')
    expect((await b.sesiSaatIni())?.email).toBe('lupa@contoh.com')
  })
  it('ubahSandi: wajib login, minimal 8 karakter, tidak boleh sama dengan yang lama', async () => {
    const b = buatBackendDemo()
    expect((await galat(b.ubahSandi('sandi-baru-456')))?.kode).toBe('belum_login')
    await b.daftar('ubah@contoh.com', 'sandi-lama-123')
    expect((await galat(b.ubahSandi('pendek')))?.kode).toBe('sandi_lemah')
    expect((await galat(b.ubahSandi('sandi-lama-123')))?.kode).toBe('sandi_sama')
  })
  it('token palsu atau akun yang sudah tidak ada → tautan kedaluwarsa, sesi tidak berubah', async () => {
    const b = buatBackendDemo()
    expect((await galat(b.pulihkanDariTautan({ jenis: 'pemulihan', accessToken: 'demo:tidak-ada', refreshToken: 'x' })))?.kode).toBe('tautan_kedaluwarsa')
    expect((await galat(b.pulihkanDariTautan({ jenis: 'pemulihan', accessToken: JWT, refreshToken: 'x' })))?.kode).toBe('tautan_kedaluwarsa')
    expect(await b.sesiSaatIni()).toBeNull()
  })
})

describe('penyimpan toko: lupa dan ganti sandi', () => {
  it('pulihkanDariTautan langsung menjadikan pengguna sebagai sesi aktif', async () => {
    const t = buatToko(buatBackendDemo(), 'demo')
    await t.mulai()
    await t.daftar('toko@contoh.com', 'sandi-lama-123')
    await t.keluar()
    expect(t.getState().sesi).toBeNull()
    const h = await t.kirimResetSandi('toko@contoh.com')
    await t.pulihkanDariTautan(h.tautanDemo!)
    expect(t.getState().sesi?.email).toBe('toko@contoh.com')
    await t.ubahSandi('sandi-baru-456')
  })
  it('galat dibungkus menjadi GalatToko berbahasa Indonesia', async () => {
    const t = buatToko(buatBackendDemo(), 'demo')
    await t.mulai()
    const g = await galat(t.ubahSandi('sandi-baru-456'))
    expect(g).toBeInstanceOf(GalatToko)
    expect(g?.kode).toBe('belum_login')
  })
})
