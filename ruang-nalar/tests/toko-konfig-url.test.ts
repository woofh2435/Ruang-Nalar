import { describe, expect, it } from 'vitest'
import { gabungKonfig, rapikanUrlSupabase } from '../src/lib/toko/konfig'

const KOSONG = { url: '', kunci: '', demo: false }
const KUNCI = 'sb_publishable_contoh1234567890'

describe('rapikanUrlSupabase', () => {
  it('membuang jalur API yang tertempel dari dashboard', () => {
    for (const j of ['rest', 'auth', 'functions', 'storage', 'realtime', 'graphql']) {
      expect(rapikanUrlSupabase(`https://xucvnocersgpspmfnfrm.supabase.co/${j}/v1/`)).toBe('https://xucvnocersgpspmfnfrm.supabase.co')
      expect(rapikanUrlSupabase(`https://xucvnocersgpspmfnfrm.supabase.co/${j}/v1`)).toBe('https://xucvnocersgpspmfnfrm.supabase.co')
    }
    expect(rapikanUrlSupabase('https://x.supabase.co/rest/v1/ebook_berbayar?select=*')).toBe('https://x.supabase.co')
    expect(rapikanUrlSupabase('https://x.supabase.co/functions/v1/midtrans-webhook')).toBe('https://x.supabase.co')
  })
  it('alamat depan biasa tidak berubah (garis miring ujung dibuang)', () => {
    expect(rapikanUrlSupabase('https://x.supabase.co')).toBe('https://x.supabase.co')
    expect(rapikanUrlSupabase('https://x.supabase.co/')).toBe('https://x.supabase.co')
    expect(rapikanUrlSupabase('  https://x.supabase.co  ')).toBe('https://x.supabase.co')
    expect(rapikanUrlSupabase('http://localhost:54321/rest/v1/')).toBe('http://localhost:54321')
  })
  it('jalur awalan milik pemilik sendiri dibiarkan', () => {
    expect(rapikanUrlSupabase('https://api.contoh.id/supabase/rest/v1/')).toBe('https://api.contoh.id/supabase')
    expect(rapikanUrlSupabase('https://api.contoh.id/supabase')).toBe('https://api.contoh.id/supabase')
  })
  it('bukan URL → dikembalikan apa adanya', () => {
    expect(rapikanUrlSupabase('bukan url')).toBe('bukan url')
    expect(rapikanUrlSupabase('')).toBe('')
  })
})

describe('gabungKonfig dengan alamat API lengkap', () => {
  it('memakai alamat depan dan memberi peringatan', () => {
    const h = gabungKonfig(KOSONG, { SUPABASE_URL: 'https://xucvnocersgpspmfnfrm.supabase.co/rest/v1/', SUPABASE_ANON_KEY: KUNCI })
    expect(h.konfig.url).toBe('https://xucvnocersgpspmfnfrm.supabase.co')
    expect(h.konfig.kunci).toBe(KUNCI)
    expect(h.peringatan).toHaveLength(1)
    expect(h.peringatan[0]).toContain('https://xucvnocersgpspmfnfrm.supabase.co')
  })
  it('hanya garis miring di ujung: dirapikan tanpa peringatan', () => {
    const h = gabungKonfig(KOSONG, { SUPABASE_URL: 'https://x.supabase.co/', SUPABASE_ANON_KEY: KUNCI })
    expect(h.konfig.url).toBe('https://x.supabase.co')
    expect(h.peringatan).toEqual([])
  })
  it('juga merapikan nilai bawaan dari config.ts', () => {
    const h = gabungKonfig({ url: 'https://x.supabase.co/auth/v1', kunci: KUNCI, demo: false }, {})
    expect(h.konfig.url).toBe('https://x.supabase.co')
  })
  it('URL tidak valid tetap mematikan fitur, kunci rahasia tetap ditolak', () => {
    expect(gabungKonfig(KOSONG, { SUPABASE_URL: 'ftp://x/rest/v1/', SUPABASE_ANON_KEY: KUNCI }).konfig.url).toBe('')
    expect(gabungKonfig(KOSONG, { SUPABASE_URL: 'https://x.supabase.co/rest/v1/', SUPABASE_ANON_KEY: 'sb_secret_abc' }).konfig).toEqual(KOSONG)
  })
})
