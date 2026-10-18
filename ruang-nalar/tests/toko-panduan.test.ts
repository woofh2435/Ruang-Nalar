import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  ALAMAT_WEB_CONTOH,
  PANDUAN_TOKO,
  PENGGANTI_ALAMAT,
  SEMUA_ID_LANGKAH,
  SEMUA_LANGKAH,
  alamatWeb,
  bacaCentang,
  hitungKemajuan,
  isiNilai,
  langkahOtomatis,
} from '../src/lib/toko/panduan'

const akar = join(__dirname, '..')
const baca = (p: string) => readFileSync(join(akar, p), 'utf8')
const semuaTeks = JSON.stringify(PANDUAN_TOKO)

describe('Panduan toko: isi data', () => {
  it('ID tahap dan langkah unik, tidak kosong', () => {
    expect(new Set(SEMUA_ID_LANGKAH).size).toBe(SEMUA_ID_LANGKAH.length)
    expect(new Set(PANDUAN_TOKO.map((t) => t.id)).size).toBe(PANDUAN_TOKO.length)
    for (const t of PANDUAN_TOKO) {
      expect(t.judul.trim()).not.toBe('')
      expect(t.langkah.length).toBeGreaterThan(0)
    }
    for (const l of SEMUA_LANGKAH) {
      expect(l.id).toMatch(/^[a-z0-9-]+$/)
      expect(l.judul.trim()).not.toBe('')
      expect(l.isi.trim().length).toBeGreaterThan(20)
    }
  })
  it('tidak ada kunci atau rahasia yang tertulis di panduan', () => {
    expect(semuaTeks).not.toMatch(/SB-Mid-server-[A-Za-z0-9]{6,}/)
    expect(semuaTeks).not.toMatch(/Mid-server-[A-Za-z0-9]{10,}/)
    expect(semuaTeks).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}/) // JWT (anon/service_role)
    expect(semuaTeks).not.toMatch(/sb_secret_[A-Za-z0-9]/)
    expect(semuaTeks).not.toMatch(/sb_publishable_[A-Za-z0-9]{8,}/)
  })
  it('semua tautan https ke situs yang dikenal', () => {
    const boleh = new Set(['supabase.com', 'midtrans.com', 'docs.midtrans.com', 'oss.go.id'])
    const url = SEMUA_LANGKAH.flatMap((l) => l.tautan ?? []).map((t) => t.url)
    expect(url.length).toBeGreaterThan(0)
    for (const u of url) {
      const x = new URL(u)
      expect(x.protocol).toBe('https:')
      expect(boleh.has(x.hostname)).toBe(true)
    }
  })
  it('hanya bentuk {ALAMAT_WEB} yang dipakai sebagai pengganti', () => {
    const sisa = semuaTeks.replace(new RegExp(PENGGANTI_ALAMAT.replace(/[{}]/g, '\\$&'), 'g'), '')
    expect(sisa).not.toMatch(/\{[A-Z_]+\}/)
  })
  it('langkah yang menyalin nilai hanya memuat keterangan atau nilai yang tidak rahasia', () => {
    for (const l of SEMUA_LANGKAH) for (const s of l.salin ?? []) expect(s.nilai.trim()).not.toBe('')
    const keterangan = SEMUA_LANGKAH.flatMap((l) => l.salin ?? []).filter((s) => s.bisaSalin === false)
    expect(keterangan.length).toBe(2) // "Server Key ..." sandbox dan produksi: tidak ada tombol Salin
  })
  it('tahap Sandbox memperingatkan soal ebook contoh', () => {
    const sandbox = PANDUAN_TOKO.find((t) => t.id === 'sandbox')!
    expect(sandbox.awas).toMatch(/CONTOH/)
    expect(sandbox.awas).toMatch(/simulator/i)
  })
})

describe('Panduan toko: cocok dengan kode sungguhan', () => {
  const fungsiBuat = baca('supabase/functions/buat-transaksi/index.ts')
  const nilaiSalin = SEMUA_LANGKAH.flatMap((l) => l.salin ?? []).map((s) => s.nilai)

  it('nama fungsi sama dengan folder di supabase/functions', () => {
    const folder = readdirSync(join(akar, 'supabase', 'functions')).filter((n) => !n.startsWith('_'))
    const disebut = nilaiSalin.filter((n) => /^[a-z]+(-[a-z]+)+$/.test(n))
    expect(disebut.sort()).toEqual(['buat-transaksi', 'midtrans-webhook'])
    for (const n of disebut) expect(folder).toContain(n)
  })
  it('nama secret yang disebut benar-benar dibaca fungsi', () => {
    const webhook = baca('supabase/functions/midtrans-webhook/index.ts')
    const kode = fungsiBuat + webhook
    for (const nama of ['MIDTRANS_SERVER_KEY', 'MIDTRANS_ENV', 'SITE_URL']) {
      expect(nilaiSalin).toContain(nama)
      expect(kode).toContain(`Deno.env.get('${nama}')`)
    }
    expect(semuaTeks).toContain('MIDTRANS_METODE')
    expect(fungsiBuat).toContain("Deno.env.get('MIDTRANS_METODE')")
  })
  it('nilai MIDTRANS_ENV yang disarankan dikenali fungsi', () => {
    expect(nilaiSalin).toContain('sandbox')
    expect(nilaiSalin).toContain('production')
    expect(baca('supabase/functions/_shared/midtrans.ts')).toContain("env === 'production'")
  })
  it('alamat webhook memakai nama fungsi yang benar', () => {
    expect(nilaiSalin).toContain('https://ID_PROYEK.supabase.co/functions/v1/midtrans-webhook')
  })
  it('perintah SQL memakai tabel yang ada di schema.sql', () => {
    const skema = baca('supabase/schema.sql')
    const sql = SEMUA_LANGKAH.flatMap((l) => l.salin ?? []).filter((s) => s.blok)
    expect(sql.length).toBe(2)
    expect(sql.map((s) => s.nilai).join('\n')).toContain('public.admin_users')
    expect(sql.map((s) => s.nilai).join('\n')).toContain('public.pembelian')
    expect(skema).toMatch(/create table if not exists public\.admin_users/i)
    expect(skema).toMatch(/create table if not exists public\.pembelian/i)
    expect(skema).toMatch(/'lunas'/)
    expect(skema).toMatch(/'gagal'/)
  })
  it('kolom di SQL refund dan admin ada di schema.sql', () => {
    const skema = baca('supabase/schema.sql')
    for (const kolom of ['user_id', 'order_id', 'status']) expect(skema).toContain(kolom)
  })
})

describe('Panduan toko: centang tersimpan', () => {
  it('membaca daftar ID yang sah, membuang yang asing dan duplikat', () => {
    const t = JSON.stringify([SEMUA_ID_LANGKAH[0], SEMUA_ID_LANGKAH[0], 'ngawur', 5, null, SEMUA_ID_LANGKAH[2]])
    expect(bacaCentang(t)).toEqual([SEMUA_ID_LANGKAH[0], SEMUA_ID_LANGKAH[2]])
  })
  it('data rusak atau bentuk lain menghasilkan daftar kosong', () => {
    for (const x of [null, undefined, '', '{bukan json', '{"a":1}', '"teks"', '42', 'null']) expect(bacaCentang(x)).toEqual([])
  })
  it('ID kunci prototipe tidak lolos', () => {
    expect(bacaCentang(JSON.stringify(['__proto__', 'constructor', 'toString']))).toEqual([])
  })
})

describe('Panduan toko: kemajuan dan otomatis', () => {
  it('langkah "sambung" tercentang sendiri hanya di mode nyata', () => {
    expect(langkahOtomatis('nyata')).toEqual(['sambung'])
    expect(langkahOtomatis('mati')).toEqual([])
    expect(langkahOtomatis('demo')).toEqual([])
  })
  it('hitungKemajuan menggabungkan centang dan otomatis tanpa menghitung dua kali', () => {
    expect(hitungKemajuan([], []).selesai).toBe(0)
    expect(hitungKemajuan([], []).total).toBe(SEMUA_LANGKAH.length)
    expect(hitungKemajuan(['sambung', 'skema'], ['sambung']).selesai).toBe(2)
    expect(hitungKemajuan(['tidak-ada'], []).selesai).toBe(0)
    expect(hitungKemajuan(SEMUA_ID_LANGKAH, []).selesai).toBe(SEMUA_LANGKAH.length)
  })
  it('hitungKemajuan per tahap', () => {
    const t = PANDUAN_TOKO[0]
    expect(hitungKemajuan([t.langkah[0].id], [], t.langkah)).toEqual({ selesai: 1, total: t.langkah.length })
  })
})

describe('Panduan toko: alamat web', () => {
  it('mengambil alamat dasar untuk SITE_URL', () => {
    expect(alamatWeb('https://nama.github.io/ruang-nalar/index.html#/admin')).toBe('https://nama.github.io/ruang-nalar/')
    expect(alamatWeb('https://nama.github.io/ruang-nalar#/admin')).toBe('https://nama.github.io/ruang-nalar/')
    expect(alamatWeb('https://nama.github.io/ruang-nalar/?a=1#/admin')).toBe('https://nama.github.io/ruang-nalar/')
    expect(alamatWeb('https://contoh.id/#/admin')).toBe('https://contoh.id/')
    expect(alamatWeb('http://localhost:5173/#/admin')).toBe('http://localhost:5173/')
  })
  it('bukan http(s) atau rusak → null', () => {
    for (const x of ['file:///a/b.html', 'about:blank', 'blob:https://a/1', 'bukan url', '']) expect(alamatWeb(x)).toBeNull()
  })
  it('isiNilai mengganti pengganti dan memakai contoh bila alamat tidak diketahui', () => {
    expect(isiNilai(PENGGANTI_ALAMAT, 'https://a.id/x/')).toBe('https://a.id/x/')
    expect(isiNilai(PENGGANTI_ALAMAT, null)).toBe(ALAMAT_WEB_CONTOH)
    expect(isiNilai('tanpa pengganti', 'https://a.id/')).toBe('tanpa pengganti')
  })
})
