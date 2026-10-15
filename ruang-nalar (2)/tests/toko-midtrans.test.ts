import { describe, expect, it } from 'vitest'
import { authBasic, buatOrderId, ebookIdValid, jumlahCocok, petaStatus, samaAman, sha512Hex, signatureValid, urlMidtrans, urlSelesai } from '../supabase/functions/_shared/midtrans'

const KUNCI = 'SB-Mid-server-RAHASIA'

describe('Midtrans: tanda tangan notifikasi', () => {
  it('SHA-512 sesuai vektor uji baku', async () => {
    expect(await sha512Hex('abc')).toBe(
      'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
    )
  })
  it('notifikasi dengan tanda tangan benar diterima', async () => {
    const n = { order_id: 'RN-abc-1', status_code: '200', gross_amount: '25000.00' }
    const signature_key = await sha512Hex(n.order_id + n.status_code + n.gross_amount + KUNCI)
    expect(await signatureValid({ ...n, signature_key }, KUNCI)).toBe(true)
    expect(await signatureValid({ ...n, signature_key: signature_key.toUpperCase() }, KUNCI)).toBe(true)
  })
  it('ditolak bila isi diubah, kunci salah, atau field hilang', async () => {
    const n = { order_id: 'RN-abc-1', status_code: '200', gross_amount: '25000.00' }
    const signature_key = await sha512Hex(n.order_id + n.status_code + n.gross_amount + KUNCI)
    expect(await signatureValid({ ...n, gross_amount: '1000.00', signature_key }, KUNCI)).toBe(false)
    expect(await signatureValid({ ...n, signature_key }, 'kunci-lain')).toBe(false)
    expect(await signatureValid({ ...n, signature_key }, '')).toBe(false)
    expect(await signatureValid({ order_id: n.order_id, signature_key }, KUNCI)).toBe(false)
    expect(await signatureValid({ ...n, signature_key: 123 as unknown as string }, KUNCI)).toBe(false)
    expect(await signatureValid({}, KUNCI)).toBe(false)
  })
  it('samaAman', () => {
    expect(samaAman('abc', 'abc')).toBe(true)
    expect(samaAman('abc', 'abd')).toBe(false)
    expect(samaAman('abc', 'abcd')).toBe(false)
  })
})

describe('Midtrans: pemetaan status', () => {
  it('hanya settlement dan capture+accept yang memberi akses', () => {
    expect(petaStatus('settlement')).toBe('lunas')
    expect(petaStatus('capture', 'accept')).toBe('lunas')
    expect(petaStatus('capture', 'challenge')).toBe('pending')
    expect(petaStatus('capture', 'deny')).toBe('gagal')
    expect(petaStatus('capture')).toBe('gagal')
  })
  it('status gagal', () => {
    for (const s of ['deny', 'cancel', 'expire', 'failure']) expect(petaStatus(s)).toBe('gagal')
  })
  it('pending/authorize/refund/ngawur TIDAK memberi akses', () => {
    for (const s of ['pending', 'authorize', 'refund', 'partial_refund', 'chargeback', '', undefined, 'apa-saja']) expect(petaStatus(s as string | undefined)).toBe('pending')
  })
})

describe('Midtrans: jumlah, order id, url', () => {
  it('jumlahCocok membandingkan persis', () => {
    expect(jumlahCocok('25000.00', 25000)).toBe(true)
    expect(jumlahCocok(25000, 25000)).toBe(true)
    expect(jumlahCocok('24999.00', 25000)).toBe(false)
    expect(jumlahCocok('25000.50', 25000)).toBe(false)
    expect(jumlahCocok('', 25000)).toBe(false)
    expect(jumlahCocok(undefined, 25000)).toBe(false)
    expect(jumlahCocok('abc', 25000)).toBe(false)
  })
  it('order_id aman dan ≤ 50 karakter', () => {
    const id = buatOrderId('123e4567-e89b-12d3-a456-426614174000', 'a1b2c3d4-e5f6-7890', 1700000000000)
    expect(id).toMatch(/^RN-[A-Za-z0-9]{1,8}-[a-z0-9]+-[A-Za-z0-9]{1,8}$/)
    expect(id.length).toBeLessThanOrEqual(50)
    expect(buatOrderId('x'.repeat(200), 'y'.repeat(200)).length).toBeLessThanOrEqual(50)
    expect(buatOrderId('u', 'a', 1)).not.toBe(buatOrderId('u', 'b', 1))
  })
  it('ebookIdValid', () => {
    expect(ebookIdValid('apa-itu-sosiologi')).toBe(true)
    for (const x of ['', 'Besar', '-awal', 'a b', 'a/b', "x'; drop table", 5, null, undefined, 'a'.repeat(61)]) expect(ebookIdValid(x)).toBe(false)
  })
  it('url sandbox vs production', () => {
    expect(urlMidtrans('production').snap).toBe('https://app.midtrans.com/snap/v1/transactions')
    expect(urlMidtrans('sandbox').snap).toContain('sandbox')
    expect(urlMidtrans(undefined).api).toContain('sandbox') // bawaan aman = sandbox
  })
  it('url selesai memakai HashRouter dan tidak menggandakan garis miring', () => {
    expect(urlSelesai('https://a.github.io/ruang-nalar/')).toBe('https://a.github.io/ruang-nalar/#/akun')
    expect(urlSelesai('https://a.github.io/ruang-nalar')).toBe('https://a.github.io/ruang-nalar/#/akun')
    expect(urlSelesai('https://a.github.io/ruang-nalar/#/')).toBe('https://a.github.io/ruang-nalar/#/akun')
  })
  it('authBasic = base64(kunci:)', () => expect(authBasic('abc')).toBe('Basic ' + btoa('abc:')))
})
