import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// Menguji supabase/patch/01-persetujuan.sql di Postgres sungguhan (PGlite): tabel log, RLS, dan trigger saat mendaftar.

const SKEMA = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8')
const PATCH = readFileSync(new URL('../supabase/patch/01-persetujuan.sql', import.meta.url), 'utf8')
const PENANDA = '-- ===== (dari supabase/patch/01-persetujuan.sql) ====='
const AKHIR = '-- ============================================================\n--  LANGKAH MANUAL'
const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'
const ADM = '33333333-3333-4333-8333-333333333333'

const norm = (s: string) => s.split('\n').map((l) => l.trimEnd()).join('\n').trim()
const badanPatch = norm(PATCH.slice(PATCH.indexOf('-- ---------- log persetujuan')))
const mulaiBlok = SKEMA.indexOf(PENANDA)
const akhirBlok = SKEMA.indexOf(AKHIR)
const blokDiSkema = norm(SKEMA.slice(mulaiBlok + PENANDA.length, akhirBlok))
const skemaLama = SKEMA.slice(0, mulaiBlok) + SKEMA.slice(akhirBlok) // skema SEBELUM patch ada

let db: PGlite
async function sebagai<T>(peran: 'anon' | 'authenticated' | 'service_role', sub: string | null, f: () => Promise<T>): Promise<T> {
  await db.exec(`set role ${peran}; select set_config('request.jwt.claim.sub', '${sub ?? ''}', false);`)
  try {
    return await f()
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`)
  }
}
const q = async (sql: string) => (await db.query<Record<string, unknown>>(sql)).rows
const gagal = async (f: () => Promise<unknown>) => {
  try {
    await f()
    return null
  } catch (e) {
    return String((e as Error).message)
  }
}

async function siapkan(skema: string): Promise<PGlite> {
  const d = new PGlite()
  await d.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated, service_role;
  `)
  await d.exec(skema)
  return d
}

describe('berkas patch', () => {
  it('blok di schema.sql identik dengan isi patch (pemasangan baru dan pemasangan lewat patch sama persis)', () => {
    expect(mulaiBlok).toBeGreaterThan(0)
    expect(akhirBlok).toBeGreaterThan(mulaiBlok)
    expect(blokDiSkema).toBe(badanPatch)
  })
  it('skema lama (tanpa patch) tidak punya tabel persetujuan', () => {
    expect(skemaLama).not.toContain('persetujuan')
  })
})

describe('patch dipasang di atas skema lama', () => {
  beforeAll(async () => {
    db = await siapkan(skemaLama)
    await db.exec(`insert into auth.users (id, email) values ('${A}','a@x.id')`)
    await db.exec(PATCH)
    await db.exec(`
      grant usage on schema public to anon, authenticated, service_role;
      grant all on all tables in schema public to anon, authenticated, service_role;
    `)
  })
  afterAll(async () => db.close())

  it('bisa dijalankan ulang tanpa galat (idempoten)', async () => {
    expect(await gagal(() => db.exec(PATCH))).toBeNull()
    expect(await gagal(() => db.exec(PATCH))).toBeNull()
  })
  it('akun lama yang sudah ada tidak berubah dan tidak punya catatan', async () => {
    expect(await q('select * from persetujuan')).toEqual([])
    expect((await q('select id from auth.users')).length).toBe(1)
  })
})

describe('log persetujuan (skema lengkap)', () => {
  beforeAll(async () => {
    db = await siapkan(SKEMA)
    await db.exec(`
      grant usage on schema public to anon, authenticated, service_role;
      grant all on all tables in schema public to anon, authenticated, service_role;
      grant execute on all functions in schema public to anon, authenticated, service_role;
    `)
    // pengguna lama (sebelum trigger bekerja) dan satu admin
    await db.exec(`insert into auth.users (id, email) values ('${A}','a@x.id'),('${ADM}','adm@x.id')`)
    await db.exec(`insert into public.admin_users values ('${ADM}')`)
  })
  afterAll(async () => db.close())

  it('skema bisa dijalankan ulang', async () => {
    expect(await gagal(() => db.exec(SKEMA))).toBeNull()
  })

  it('pengguna menambah catatan miliknya sendiri', async () => {
    expect(await sebagai('authenticated', A, () => gagal(() => db.exec(`insert into persetujuan (user_id, jenis, status, versi_kebijakan) values ('${A}','promo',true,'2026-10-23')`)))).toBeNull()
  })
  it('tidak bisa mencatat atas nama orang lain', async () => {
    expect(await sebagai('authenticated', A, () => gagal(() => db.exec(`insert into persetujuan (user_id, jenis, status, versi_kebijakan) values ('${ADM}','promo',true,'v')`)))).toMatch(/row-level security/)
  })
  it('anon tidak bisa menulis maupun membaca', async () => {
    expect(await sebagai('anon', null, () => gagal(() => db.exec(`insert into persetujuan (user_id, jenis, status, versi_kebijakan) values ('${A}','promo',true,'v')`)))).toMatch(/row-level security|permission/)
    expect(await sebagai('anon', null, () => q('select * from persetujuan'))).toEqual([])
  })
  it('catatan tidak bisa diubah atau dihapus oleh pemiliknya (jejak bukti utuh)', async () => {
    const u = await sebagai('authenticated', A, () => db.query(`update persetujuan set status = false`))
    const d = await sebagai('authenticated', A, () => db.query(`delete from persetujuan`))
    expect(u.affectedRows).toBe(0)
    expect(d.affectedRows).toBe(0)
    expect((await q(`select count(*)::int as n from persetujuan where user_id='${A}'`))[0].n).toBe(1)
  })
  it('menarik persetujuan = baris baru, dan keduanya tetap ada', async () => {
    await sebagai('authenticated', A, () => db.exec(`insert into persetujuan (user_id, jenis, status, versi_kebijakan) values ('${A}','promo',false,'2026-10-23')`))
    const r = await sebagai('authenticated', A, () => q(`select status from persetujuan where jenis='promo' order by id`))
    expect(r.map((x) => x.status)).toEqual([true, false])
  })
  it('batas isi: jenis tidak dikenal dan versi kosong atau kepanjangan ditolak', async () => {
    const tambah = (jenis: string, versi: string) => sebagai('service_role', null, () => gagal(() => db.exec(`insert into persetujuan (user_id, jenis, status, versi_kebijakan) values ('${A}','${jenis}',true,'${versi}')`)))
    expect(await tambah('lain', 'v')).toMatch(/check/)
    expect(await tambah('promo', '')).toMatch(/check/)
    expect(await tambah('promo', 'x'.repeat(21))).toMatch(/check/)
  })
  it('admin bisa membaca semua, pengguna hanya miliknya', async () => {
    await db.exec(`insert into auth.users (id, email) values ('${B}','b@x.id')`)
    await sebagai('authenticated', B, () => db.exec(`insert into persetujuan (user_id, jenis, status, versi_kebijakan) values ('${B}','analitik',true,'v')`))
    const a = await sebagai('authenticated', A, () => q('select distinct user_id from persetujuan'))
    expect(a.map((x) => x.user_id)).toEqual([A])
    const adm = await sebagai('authenticated', ADM, () => q('select distinct user_id from persetujuan order by user_id'))
    expect(adm.map((x) => x.user_id)).toEqual([A, B])
  })
  it('catatan ikut terhapus saat akun dihapus (cascade)', async () => {
    await db.exec(`delete from auth.users where id = '${B}'`)
    expect(await q(`select * from persetujuan where user_id = '${B}'`)).toEqual([])
  })
})

describe('trigger saat mendaftar', () => {
  const C = '44444444-4444-4444-8444-444444444444'
  const masuk = (id: string, meta: string) => db.exec(`insert into auth.users (id, email, raw_user_meta_data) values ('${id}','${id.slice(0, 4)}@x.id', ${meta})`)
  const catatan = (id: string) => q(`select jenis, status, versi_kebijakan from persetujuan where user_id='${id}' order by jenis`)

  beforeAll(async () => {
    db = await siapkan(SKEMA)
  })
  afterAll(async () => db.close())

  it('mencatat syarat, promo, dan analitik sesuai pilihan di metadata pendaftaran', async () => {
    await masuk(C, `'{"persetujuan":{"versi":"2026-10-23","syarat":true,"promo":true,"analitik":false}}'::jsonb`)
    expect(await catatan(C)).toEqual([
      { jenis: 'analitik', status: false, versi_kebijakan: '2026-10-23' },
      { jenis: 'promo', status: true, versi_kebijakan: '2026-10-23' },
      { jenis: 'syarat_privasi', status: true, versi_kebijakan: '2026-10-23' },
    ])
  })
  it('waktu dicatat oleh server, bukan dikirim dari browser', async () => {
    const id = '55555555-5555-4555-8555-555555555555'
    await masuk(id, `'{"persetujuan":{"versi":"v1","syarat":true,"promo":false,"analitik":false,"dibuat":"1999-01-01"}}'::jsonb`)
    const r = await q(`select extract(year from dibuat)::int as thn from persetujuan where user_id='${id}'`)
    expect(r.length).toBe(3)
    for (const x of r) expect(x.thn).toBeGreaterThanOrEqual(2024)
  })
  it('tanpa syarat=true, baris syarat tidak dibuat (persetujuan wajib tidak bisa dipalsukan oleh data kosong)', async () => {
    const id = '66666666-6666-4666-8666-666666666666'
    await masuk(id, `'{"persetujuan":{"versi":"v1","promo":true,"analitik":true}}'::jsonb`)
    const j = (await catatan(id)).map((x) => x.jenis)
    expect(j).toEqual(['analitik', 'promo'])
  })
  it('tanpa metadata, metadata aneh, atau tanpa versi: tidak mencatat dan pendaftaran tetap berhasil', async () => {
    const kasus: [string, string][] = [
      ['77777777-7777-4777-8777-777777777777', 'null'],
      ['88888888-8888-4888-8888-888888888888', `'{}'::jsonb`],
      ['99999999-9999-4999-8999-999999999999', `'{"persetujuan":"ya"}'::jsonb`],
      ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', `'{"persetujuan":{"syarat":true,"promo":true}}'::jsonb`],
      ['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', `'{"persetujuan":[1,2]}'::jsonb`],
    ]
    for (const [id, meta] of kasus) {
      expect(await gagal(() => masuk(id, meta)), meta).toBeNull()
      expect(await catatan(id), meta).toEqual([])
      expect((await q(`select id from auth.users where id='${id}'`)).length).toBe(1)
    }
  })
  it('versi kepanjangan dipotong 20 karakter, dan kegagalan mencatat tidak menggagalkan pendaftaran', async () => {
    const id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
    expect(await gagal(() => masuk(id, `'{"persetujuan":{"versi":"${'v'.repeat(40)}","syarat":true,"promo":false,"analitik":false}}'::jsonb`))).toBeNull()
    const r = await catatan(id)
    expect(r.length).toBe(3)
    for (const x of r) expect(String(x.versi_kebijakan).length).toBe(20)
  })
  it('fungsi trigger tidak bisa dipanggil langsung oleh pengguna', async () => {
    await db.exec(`grant usage on schema public to anon, authenticated`)
    await db.exec(`set role authenticated`)
    const e = await gagal(() => db.query(`select public.catat_persetujuan_daftar()`))
    await db.exec(`reset role`)
    expect(e).toMatch(/permission denied/)
  })
})
