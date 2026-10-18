import { describe, expect, it } from 'vitest'
import { PROFIL_BAWAAN, gabungProfil, saringTautan, urlAman } from '../src/lib/profil'

describe('profil situs', () => {
  it('urlAman hanya menerima https dengan domain', () => {
    expect(urlAman('https://instagram.com/akun')).toBe(true)
    expect(urlAman('http://instagram.com/akun')).toBe(false)
    expect(urlAman('javascript:alert(1)')).toBe(false)
    expect(urlAman('data:text/html,<b>x</b>')).toBe(false)
    expect(urlAman('https://localhost')).toBe(false)
    expect(urlAman('bukan url')).toBe(false)
  })
  it('saringTautan membuang yang tidak valid, memotong label, dan membatasi jumlah', () => {
    const banyak = Array.from({ length: 10 }, (_, i) => ({ label: 'L' + i, url: `https://a${i}.com` }))
    expect(saringTautan(banyak).length).toBe(6)
    expect(saringTautan([{ label: '', url: 'https://a.com' }, { label: 'x', url: 'javascript:1' }, null, 5])).toEqual([])
    expect(saringTautan('bukan daftar')).toEqual([])
    expect(saringTautan([{ label: 'x'.repeat(100), url: 'https://a.com' }])[0].label.length).toBe(40)
  })
  it('gabungProfil: berkas menang bila valid, kosong/rusak → nilai bawaan', () => {
    const bawaan = { tentang: 'bawaan', kontakEmail: 'a@b.co', tautan: [{ label: 'X', url: 'https://x.com' }] }
    expect(gabungProfil(bawaan, null)).toEqual(bawaan)
    expect(gabungProfil(bawaan, { TENTANG_PEMBUAT: '  cerita baru  ', KONTAK_EMAIL: 'c@d.id' })).toEqual({ tentang: 'cerita baru', kontakEmail: 'c@d.id', tautan: bawaan.tautan })
    expect(gabungProfil(bawaan, { KONTAK_EMAIL: 'bukan-email', TENTANG_PEMBUAT: '' }).kontakEmail).toBe('a@b.co')
    expect(gabungProfil(bawaan, { TENTANG_PEMBUAT: 'x'.repeat(5000) }).tentang.length).toBe(1200)
  })
  it('TAUTAN di berkas, termasuk daftar kosong, menggantikan bawaan', () => {
    const bawaan = { tentang: 't', kontakEmail: '', tautan: [{ label: 'X', url: 'https://x.com' }] }
    expect(gabungProfil(bawaan, { TAUTAN: [] }).tautan).toEqual([])
    expect(gabungProfil(bawaan, { TAUTAN: [{ label: 'IG', url: 'https://instagram.com/u' }, { label: 'jahat', url: 'javascript:1' }] }).tautan).toEqual([{ label: 'IG', url: 'https://instagram.com/u' }])
  })
  it('profil bawaan aman dipakai', () => {
    expect(PROFIL_BAWAAN.tentang.length).toBeGreaterThan(10)
    for (const t of PROFIL_BAWAAN.tautan) expect(urlAman(t.url)).toBe(true)
  })
})
