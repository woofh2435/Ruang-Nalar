import { beforeEach, describe, expect, it, vi } from 'vitest'

const signUp = vi.fn()
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: { signUp, onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) }, rpc: async () => ({ data: false, error: null }) }),
}))

import { buatBackendSupabase, petaGalat } from '../src/lib/toko/supabase'

describe('daftar: tujuan tautan konfirmasi', () => {
  beforeEach(() => {
    signUp.mockReset()
    signUp.mockResolvedValue({ data: { user: { identities: [{}] }, session: null }, error: null })
    vi.stubGlobal('location', { origin: 'https://nama.github.io', pathname: '/ruang-nalar/' })
  })
  it('mengirim emailRedirectTo berisi alamat web lengkap dengan nama repo', async () => {
    const b = buatBackendSupabase('https://x.supabase.co', 'kunci')
    const h = await b.daftar('Ani@Contoh.com ', 'sandi-panjang-1')
    expect(h.perluKonfirmasi).toBe(true)
    expect(signUp).toHaveBeenCalledWith({ email: 'ani@contoh.com', password: 'sandi-panjang-1', options: { emailRedirectTo: 'https://nama.github.io/ruang-nalar/' } })
  })
  it('tanpa location (mis. lingkungan uji tanpa browser), pendaftaran tetap jalan tanpa emailRedirectTo', async () => {
    vi.stubGlobal('location', undefined)
    const b = buatBackendSupabase('https://x.supabase.co', 'kunci')
    await b.daftar('ani@contoh.com', 'sandi-panjang-1')
    expect(signUp).toHaveBeenCalledWith({ email: 'ani@contoh.com', password: 'sandi-panjang-1' })
  })
})

describe('petaGalat: batas pengiriman email', () => {
  it('batas email Supabase diberi pesan khusus tetapi tetap berkode terlalu_sering', () => {
    for (const e of [{ message: 'email rate limit exceeded' }, { message: 'x', code: 'over_email_send_rate_limit' }]) {
      const g = petaGalat(e)
      expect(g.kode).toBe('terlalu_sering')
      expect(g.message).toMatch(/pengiriman email/i)
      expect(g.message).toMatch(/satu jam/i)
    }
  })
  it('batas lain tetap memakai pesan umum', () => {
    expect(petaGalat({ message: 'Too many requests' }).message).toBe('Terlalu sering mencoba. Tunggu beberapa menit lalu coba lagi.')
  })
})
