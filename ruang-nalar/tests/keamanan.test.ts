import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { bangunCsp, pluginCsp, sha256Skrip, skripInline, SUMBER } from '../scripts/csp'
import { namaBerkasTeksValid, periksaIsiTeks } from '../src/lib/berkas'
import { bacaKunciCaptcha, kunciCaptchaValid } from '../src/lib/toko/captcha'
import {
  AMBANG_GAGAL, JEDA_DASAR_MS, JEDA_MAKS_MS, KUNCI_COBA, LUPA_SETELAH_MS, ambilKeadaanCoba, bacaKeadaanCoba, catatBerhasilMasuk, catatGagal, catatGagalMasuk, jedaUntuk,
  KOSONG, muatUlangCoba, pesanJeda, resetCoba, sisaJeda, tahanKarenaServer, tahanPaksa,
} from '../src/lib/toko/cooldown'
import { petaGalat } from '../src/lib/toko/supabase'

const akar = join(__dirname, '..')
const baca = (p: string) => readFileSync(join(akar, p), 'utf8')

describe('jeda login setelah salah berkali-kali', () => {
  it('jeda mulai pada percobaan salah kelima dan berlipat dua, maksimal 15 menit', () => {
    for (let n = 0; n < AMBANG_GAGAL; n++) expect(jedaUntuk(n), String(n)).toBe(0)
    expect(jedaUntuk(5)).toBe(JEDA_DASAR_MS)
    expect(jedaUntuk(6)).toBe(JEDA_DASAR_MS * 2)
    expect(jedaUntuk(7)).toBe(JEDA_DASAR_MS * 4)
    expect(jedaUntuk(8)).toBe(JEDA_DASAR_MS * 8)
    expect(jedaUntuk(50)).toBe(JEDA_MAKS_MS)
    expect(jedaUntuk(1000)).toBe(JEDA_MAKS_MS)
  })
  it('empat kali salah belum dijeda, kelima kalinya dijeda 30 detik', () => {
    let k = KOSONG
    const t = 1_000_000
    for (let i = 1; i <= 4; i++) {
      k = catatGagal(k, t + i)
      expect(sisaJeda(k, t + i)).toBe(0)
    }
    k = catatGagal(k, t + 5)
    expect(k.gagal).toBe(5)
    expect(sisaJeda(k, t + 5)).toBe(JEDA_DASAR_MS)
    expect(sisaJeda(k, t + 5 + JEDA_DASAR_MS)).toBe(0)
  })
  it('hitungan salah dilupakan bila sudah lama tidak mencoba', () => {
    let k = KOSONG
    for (let i = 0; i < 4; i++) k = catatGagal(k, 1000 + i)
    const lama = 1003 + LUPA_SETELAH_MS + 1
    k = catatGagal(k, lama)
    expect(k.gagal).toBe(1)
    expect(sisaJeda(k, lama)).toBe(0)
  })
  it('hitungan TIDAK dilupakan selama masih dijeda', () => {
    let k = KOSONG
    for (let i = 0; i < 5; i++) k = catatGagal(k, 1000)
    expect(k.gagal).toBe(5)
    k = catatGagal(k, 1000 + JEDA_DASAR_MS)
    expect(k.gagal).toBe(6)
  })
  it('server menjawab "terlalu sering": jeda ditambah tanpa menambah hitungan, dan tidak memperpendek jeda yang ada', () => {
    const k = tahanPaksa(KOSONG, 5000, 60_000)
    expect(k.gagal).toBe(0)
    expect(sisaJeda(k, 5000)).toBe(60_000)
    const panjang = { gagal: 9, sampai: 5000 + 500_000, terakhir: 5000 }
    expect(tahanPaksa(panjang, 5000, 60_000).sampai).toBe(panjang.sampai)
  })
  it('pesan jeda memakai detik, lalu menit', () => {
    expect(pesanJeda(29_100)).toBe('Terlalu banyak percobaan. Coba lagi dalam 30 detik.')
    expect(pesanJeda(90_000)).toBe('Terlalu banyak percobaan. Coba lagi dalam 90 detik.')
    expect(pesanJeda(5 * 60_000)).toBe('Terlalu banyak percobaan. Coba lagi dalam 5 menit.')
  })
  it('data tersimpan yang rusak atau diubah-ubah dianggap kosong atau dibatasi', () => {
    for (const x of ['', '{', 'null', '[]', '"a"', 42, null, undefined]) expect(bacaKeadaanCoba(x), String(x)).toEqual(KOSONG)
    expect(bacaKeadaanCoba({ gagal: -5, sampai: 'x', terakhir: NaN })).toEqual(KOSONG)
    expect(bacaKeadaanCoba({ gagal: 1e9, sampai: 1, terakhir: 2 }).gagal).toBe(0)
    expect(bacaKeadaanCoba(JSON.stringify({ gagal: 6, sampai: 100, terakhir: 50 }))).toEqual({ gagal: 6, sampai: 100, terakhir: 50 })
  })
})

describe('jeda login: penyimpanan di perangkat', () => {
  class Palsu {
    d = new Map<string, string>()
    getItem(k: string) { return this.d.has(k) ? (this.d.get(k) as string) : null }
    setItem(k: string, v: string) { this.d.set(k, String(v)) }
    removeItem(k: string) { this.d.delete(k) }
  }
  let ls: Palsu
  beforeEach(() => {
    ls = new Palsu()
    ;(globalThis as unknown as { localStorage: unknown }).localStorage = ls
    resetCoba()
  })
  it('tersimpan, bertahan setelah muat ulang, dan hilang setelah berhasil masuk', () => {
    const t = Date.now()
    for (let i = 0; i < 5; i++) catatGagalMasuk(t)
    expect(ambilKeadaanCoba().gagal).toBe(5)
    expect(ls.getItem(KUNCI_COBA)).toContain('"gagal":5')
    muatUlangCoba()
    expect(ambilKeadaanCoba().gagal).toBe(5)
    catatBerhasilMasuk()
    expect(ambilKeadaanCoba()).toEqual(KOSONG)
    expect(ls.getItem(KUNCI_COBA)).toBeNull()
  })
  it('tahanKarenaServer menyimpan jeda tanpa menambah hitungan', () => {
    tahanKarenaServer(Date.now(), 45_000)
    const k = ambilKeadaanCoba()
    expect(k.gagal).toBe(0)
    expect(sisaJeda(k, Date.now())).toBeGreaterThan(40_000)
  })
  it('tetap bekerja bila localStorage ditolak', () => {
    ;(globalThis as unknown as { localStorage: unknown }).localStorage = { getItem() { throw new Error('x') }, setItem() { throw new Error('x') }, removeItem() { throw new Error('x') } }
    expect(() => catatGagalMasuk()).not.toThrow()
    expect(ambilKeadaanCoba().gagal).toBe(1)
  })
})

describe('CAPTCHA opsional', () => {
  it('site key valid hanya huruf, angka, garis bawah, strip dengan panjang wajar', () => {
    expect(kunciCaptchaValid('0x4AAAAAAABkMYinukE8nzYS')).toBe(true)
    for (const x of ['', 'pendek', 'ada spasi di sini', '"><script>', 'a'.repeat(81), 42, null, undefined]) expect(kunciCaptchaValid(x), String(x)).toBe(false)
  })
  it('dibaca dari toko-config.json; kosong atau ngawur = CAPTCHA mati', () => {
    expect(bacaKunciCaptcha({ TURNSTILE_SITE_KEY: ' 0x4AAAAAAABkMYinukE8nzYS ' })).toBe('0x4AAAAAAABkMYinukE8nzYS')
    expect(bacaKunciCaptcha({})).toBe('')
    expect(bacaKunciCaptcha({ TURNSTILE_SITE_KEY: '<b>x</b>' })).toBe('')
    expect(bacaKunciCaptcha(null)).toBe('')
    expect(bacaKunciCaptcha('teks')).toBe('')
  })
  it('mati secara bawaan di berkas konfigurasi yang dikirim bersama web', () => {
    expect(bacaKunciCaptcha(JSON.parse(baca('public/toko-config.json')))).toBe('')
  })
  it('token diteruskan ke Supabase untuk masuk, daftar, dan atur ulang sandi', () => {
    const sb = baca('src/lib/toko/supabase.ts')
    expect(sb).toMatch(/signInWithPassword\(\{[^}]*options: \{ captchaToken \}/)
    expect(sb).toMatch(/captchaToken/)
    expect(sb).toMatch(/resetPasswordForEmail\(e, Object\.keys\(opsiReset\)/)
    expect(sb.match(/captchaToken/g)!.length).toBeGreaterThanOrEqual(6)
  })
  it('galat CAPTCHA dari Supabase dipetakan ke pesan ramah', () => {
    const g = petaGalat({ message: 'captcha verification process failed', code: 'captcha_failed' })
    expect(g.kode).toBe('captcha_gagal')
    expect(g.message).toMatch(/cek manusia/i)
  })
  it('halaman masuk dan lupa sandi memakai CAPTCHA, dan masuk memakai jeda', () => {
    for (const f of ['src/pages/Masuk.tsx', 'src/pages/LupaSandi.tsx']) {
      const s = baca(f)
      expect(s, f).toContain('<Captcha ref={captcha} onToken={setTokenCaptcha} />')
      expect(s, f).toContain('captcha.current?.reset()')
    }
    const m = baca('src/pages/Masuk.tsx')
    expect(m).toContain('useCooldownMasuk')
    expect(m).toMatch(/kredensial_salah[\s\S]*jeda\.gagal\(\)/)
    expect(m).toMatch(/terlalu_sering[\s\S]*jeda\.server\(\)/)
  })
})

describe('Content-Security-Policy', () => {
  const html = baca('index.html')
  const csp = bangunCsp(skripInline(html).map(sha256Skrip))
  const dir = (n: string) => csp.split('; ').find((d) => d.startsWith(n + ' ')) ?? ''
  it('hash SHA-256 dihitung benar (vektor uji "abc")', () => {
    expect(sha256Skrip('abc')).toBe("'sha256-ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0='")
  })
  it('skrip inline satu-satunya di index.html adalah pemasang tema', () => {
    const s = skripInline(html)
    expect(s.length).toBe(1)
    expect(s[0]).toContain("localStorage.getItem('rn-tema')")
  })
  it('skrip: tidak ada unsafe-inline, unsafe-eval, atau wildcard', () => {
    const d = dir('script-src')
    expect(d).toContain("'self'")
    expect(d).not.toMatch(/unsafe-inline|unsafe-eval|\*|\bhttp:|\bdata:/)
  })
  it('objek, base, dan form dikunci', () => {
    expect(dir('object-src')).toBe("object-src 'none'")
    expect(dir('base-uri')).toBe("base-uri 'self'")
    expect(dir('form-action')).toBe("form-action 'self'")
    expect(dir('default-src')).toBe("default-src 'self'")
  })
  it('koneksi hanya ke diri sendiri, Supabase, dan Turnstile', () => {
    const d = dir('connect-src').split(' ').slice(1)
    expect(new Set(d)).toEqual(new Set(["'self'", ...SUMBER.supabase, ...SUMBER.turnstile]))
  })
  it('semua sumber luar memakai https atau wss, tanpa http polos', () => {
    expect(csp).not.toMatch(/\bhttp:\/\//)
  })
  it('frame-ancestors tidak ada di versi <meta> (diabaikan browser), tetapi ada di _headers', () => {
    expect(csp).not.toContain('frame-ancestors')
    expect(baca('public/_headers')).toContain("frame-ancestors 'none'")
  })
  it('plugin Vite: hanya saat build, dipasang setelah <meta charset> dan sebelum skrip, dengan hash yang benar', () => {
    const p = pluginCsp() as unknown as { apply: string; transformIndexHtml: { order: string; handler: (h: string) => string } }
    expect(p.apply).toBe('build')
    const hasil = p.transformIndexHtml.handler(html)
    const iCharset = hasil.indexOf('<meta charset')
    const iCsp = hasil.indexOf('http-equiv="Content-Security-Policy"')
    const iSkrip = hasil.indexOf('<script')
    expect(iCharset).toBeGreaterThan(-1)
    expect(iCsp).toBeGreaterThan(iCharset)
    expect(iCsp).toBeLessThan(iSkrip)
    expect(iCsp).toBeLessThan(1024) // meta charset + CSP wajib ada di 1024 byte pertama dokumen
    expect(hasil).toContain(sha256Skrip(skripInline(html)[0]))
    expect(hasil).toContain('name="referrer"')
  })
  it('berkas _headers sinkron dengan scripts/csp.ts', () => {
    const harapan = `Content-Security-Policy: ${csp}; frame-ancestors 'none'`
    const baris = baca('public/_headers').split('\n').find((l) => l.trim().startsWith('Content-Security-Policy:'))?.trim()
    expect(baris, `Ganti baris di public/_headers dengan:\n  ${harapan}`).toBe(harapan)
  })
  it('header lain di _headers', () => {
    const h = baca('public/_headers')
    expect(h).toMatch(/X-Content-Type-Options: nosniff/)
    expect(h).toMatch(/X-Frame-Options: DENY/)
    expect(h).toMatch(/Referrer-Policy: strict-origin-when-cross-origin/)
    expect(h).toMatch(/Strict-Transport-Security: max-age=\d{7,}/)
    expect(h).not.toMatch(/preload/i)
  })
})

describe('skrip satu-berkas', () => {
  it('meng-inline CSS dan JS, menambah hash skrip ke CSP, dan tidak merusak tanda "$" di kode', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rn-satu-'))
    mkdirSync(join(dir, 'build', 'assets'), { recursive: true })
    const js = 'const a = "$&"; const b = `${1+1}`; const c = "$1 $$ $`"; console.log(a, b, c)'
    const css = 'body{background:#000}'
    writeFileSync(join(dir, 'build', 'assets', 'app.js'), js)
    writeFileSync(join(dir, 'build', 'assets', 'app.css'), css)
    writeFileSync(
      join(dir, 'build', 'index.html'),
      `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'sha256-TEMA='; object-src 'none'" /><script type="module" crossorigin src="./assets/app.js"></script><link rel="stylesheet" crossorigin href="./assets/app.css"></head><body></body></html>`,
    )
    execFileSync(process.execPath, [join(akar, 'scripts', 'satu-file.mjs'), join(dir, 'build'), join(dir, 'out.html')])
    const out = readFileSync(join(dir, 'out.html'), 'utf8')
    expect(out).toContain(`<script type="module">${js}</script>`)
    expect(out).toContain(`<style>${css}</style>`)
    expect(out).not.toContain('src="./assets')
    expect(out).toContain(`script-src 'self' 'sha256-TEMA=' ${sha256Skrip(js)}`)
    expect(out).toContain("object-src 'none'")
  })
})

describe('validasi berkas ebook yang diunggah', () => {
  it('nama berkas: hanya .md, .markdown, .txt', () => {
    for (const n of ['a.md', 'A.MD', 'catatan.markdown', 'b.txt', 'x y.TXT']) expect(namaBerkasTeksValid(n), n).toBe(true)
    for (const n of ['a.pdf', 'a.docx', 'a.md.exe', 'a.html', 'a.js', 'md', '.md.zip', 'a.svg']) expect(namaBerkasTeksValid(n), n).toBe(false)
  })
  it('teks biasa, termasuk BOM, emoji, dan tulisan non-Latin, diterima', () => {
    expect(periksaIsiTeks('# Judul\n\nIsi bab. 😀 社会\n\t- poin\r\n')).toBeNull()
    expect(periksaIsiTeks('﻿---\njudul: Tes\n---\n# Bab')).toBeNull()
    expect(periksaIsiTeks('')).toBeNull()
  })
  it('berkas yang menyamar sebagai .md ditolak: zip/docx, pdf, program, gambar', () => {
    for (const x of ['PK\u0003\u0004abc', '%PDF-1.7 ...', 'MZ\u0090\u0000', '\u007fELF\u0002', '\u0089PNG\r\n', 'GIF89a', 'ÿØÿà']) {
      expect(periksaIsiTeks(x), JSON.stringify(x.slice(0, 6))).toMatch(/bukan teks|biner/)
    }
  })
  it('byte NUL dan teks yang penuh karakter kontrol atau karakter pengganti ditolak', () => {
    expect(periksaIsiTeks('halo\u0000dunia')).toMatch(/biner/)
    expect(periksaIsiTeks('\u0001\u0002\u0003\u0004 abc')).toMatch(/UTF-8/)
    expect(periksaIsiTeks('�'.repeat(50) + 'abc')).toMatch(/UTF-8/)
    expect(periksaIsiTeks('teks wajar '.repeat(100) + '�')).toBeNull() // satu karakter rusak tidak menolak seluruh berkas
  })
  it('semua pintu unggah memakai validasi yang sama', () => {
    expect(baca('src/components/admin/Editor.tsx')).toContain('periksaIsiTeks(teks)')
    expect(baca('src/components/toko/TokoAdmin.tsx')).toContain('periksaIsiTeks(teksBerkas)')
    expect(baca('src/components/toko/TokoAdmin.tsx')).toContain('namaBerkasTeksValid(f.name)')
    expect(baca('src/components/admin/Editor.tsx')).toContain('namaBerkasTeksValid(file.name)')
  })
})

describe('audit kode: pola berbahaya', () => {
  const berkasSumber: string[] = []
  const jelajah = (d: string) => {
    for (const n of readdirSync(join(akar, d))) {
      const rel = join(d, n)
      if (statSync(join(akar, rel)).isDirectory()) jelajah(rel)
      else if (/\.(ts|tsx)$/.test(n)) berkasSumber.push(rel)
    }
  }
  jelajah('src')
  it('tidak ada innerHTML, dangerouslySetInnerHTML, eval, new Function, atau document.write', () => {
    expect(berkasSumber.length).toBeGreaterThan(50)
    for (const f of berkasSumber) {
      const s = baca(f)
      expect(s, f).not.toMatch(/dangerouslySetInnerHTML|\.innerHTML\s*=|insertAdjacentHTML|document\.write\(|\beval\(|new Function\(/)
    }
  })
  it('tautan target=_blank selalu memakai rel noopener', () => {
    for (const f of berkasSumber.filter((x) => x.endsWith('.tsx'))) {
      for (const baris of baca(f).split('\n')) {
        if (/target=["'{]_?blank|target: '_blank'/.test(baris)) expect(baris + f, f).toMatch(/noopener/)
      }
    }
  })
  it('kunci rahasia tidak ada di berkas yang ikut dipublikasikan', () => {
    for (const f of ['public/toko-config.json', 'src/config.ts', 'index.html']) {
      const s = baca(f)
      expect(s, f).not.toMatch(/sb_secret_[A-Za-z0-9]|SB-Mid-server-[A-Za-z0-9]{6}|eyJ[A-Za-z0-9_-]{30,}/)
    }
  })
  it('Dependabot aktif untuk npm dan GitHub Actions', () => {
    const d = baca('.github/dependabot.yml')
    expect(d).toMatch(/package-ecosystem: npm/)
    expect(d).toMatch(/package-ecosystem: github-actions/)
  })
})
