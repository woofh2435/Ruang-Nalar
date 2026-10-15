import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// Menguji aturan keamanan (Row Level Security) di supabase/schema.sql pada Postgres sungguhan (PGlite),
// dengan meniru peran dan fungsi auth.uid() milik Supabase.

const SKEMA = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8')
const A = '11111111-1111-4111-8111-111111111111' // pembeli A
const B = '22222222-2222-4222-8222-222222222222' // pembeli B
const ADM = '33333333-3333-4333-8333-333333333333' // admin
let db: PGlite

async function sebagai<T>(peran: 'anon' | 'authenticated' | 'service_role', sub: string | null, f: () => Promise<T>): Promise<T> {
  await db.exec(`set role ${peran}; select set_config('request.jwt.claim.sub', '${sub ?? ''}', false);`)
  try {
    return await f()
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`)
  }
}
const q = async (sql: string, p: unknown[] = []) => (await db.query<Record<string, unknown>>(sql, p)).rows
const gagal = async (f: () => Promise<unknown>) => {
  try {
    await f()
    return null
  } catch (e) {
    return String((e as Error).message)
  }
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated, service_role;
    insert into auth.users values ('${A}','a@x.id'),('${B}','b@x.id'),('${ADM}','adm@x.id');
  `)
  await db.exec(SKEMA)
  await db.exec(`
    grant usage on schema public to anon, authenticated, service_role;
    grant all on all tables in schema public to anon, authenticated, service_role;
    insert into public.admin_users values ('${ADM}');
    insert into public.ebook_berbayar (id, judul, harga, terbit) values ('buku-a','Buku A',25000,true),('buku-draf','Draf',30000,false);
    insert into public.ebook_isi values ('buku-a','# Rahasia A'),('buku-draf','# Rahasia Draf');
  `)
})
afterAll(async () => {
  await db.close()
})

describe('skema dapat dijalankan ulang', () => {
  it('idempoten', async () => {
    expect(await gagal(() => db.exec(SKEMA))).toBeNull()
  })
})

describe('katalog publik', () => {
  it('anon hanya melihat yang terbit', async () => {
    const r = await sebagai('anon', null, () => q('select id from ebook_berbayar order by id'))
    expect(r.map((x) => x.id)).toEqual(['buku-a'])
  })
  it('pembeli biasa tidak melihat draf', async () => {
    const r = await sebagai('authenticated', A, () => q('select id from ebook_berbayar'))
    expect(r.map((x) => x.id)).toEqual(['buku-a'])
  })
  it('admin melihat semuanya', async () => {
    const r = await sebagai('authenticated', ADM, () => q('select id from ebook_berbayar order by id'))
    expect(r.map((x) => x.id)).toEqual(['buku-a', 'buku-draf'])
  })
  it('pembeli/anon tidak bisa menulis katalog', async () => {
    expect(await sebagai('authenticated', A, () => gagal(() => db.exec(`insert into ebook_berbayar (id,judul,harga,terbit) values ('curang','x',1000,true)`)))).toMatch(/row-level security/)
    expect(await sebagai('anon', null, () => gagal(() => db.exec(`insert into ebook_berbayar (id,judul,harga,terbit) values ('curang','x',1000,true)`)))).toMatch(/row-level security|permission/)
    const ubah = await sebagai('authenticated', A, () => db.query(`update ebook_berbayar set harga = 1000 where id = 'buku-a'`))
    expect(ubah.affectedRows).toBe(0)
    expect((await q(`select harga from ebook_berbayar where id='buku-a'`))[0].harga).toBe(25000)
  })
  it('admin bisa mengelola', async () => {
    expect(await sebagai('authenticated', ADM, () => gagal(() => db.exec(`insert into ebook_berbayar (id,judul,harga,terbit) values ('buku-baru','Baru',5000,false)`)))).toBeNull()
    await sebagai('authenticated', ADM, () => db.exec(`delete from ebook_berbayar where id='buku-baru'`))
  })
})

describe('isi ebook terkunci', () => {
  it('anon tidak bisa membaca isi', async () => {
    expect(await sebagai('anon', null, () => q('select * from ebook_isi'))).toEqual([])
  })
  it('pembeli yang belum bayar tidak bisa membaca', async () => {
    expect(await sebagai('authenticated', A, () => q('select * from ebook_isi'))).toEqual([])
  })
  it('pesanan pending tidak memberi akses', async () => {
    await sebagai('service_role', null, () => db.exec(`insert into pembelian (user_id, ebook_id, order_id, status, jumlah) values ('${A}','buku-a','ORD-PENDING','pending',25000)`))
    expect(await sebagai('authenticated', A, () => q('select * from ebook_isi'))).toEqual([])
  })
  it('setelah lunas: pembeli A bisa baca, pembeli B tetap tidak', async () => {
    await sebagai('service_role', null, () => db.exec(`update pembelian set status='lunas', dibayar=now() where order_id='ORD-PENDING'`))
    const a = await sebagai('authenticated', A, () => q('select ebook_id, raw from ebook_isi'))
    expect(a).toEqual([{ ebook_id: 'buku-a', raw: '# Rahasia A' }])
    expect(await sebagai('authenticated', B, () => q('select * from ebook_isi'))).toEqual([])
  })
  it('lunas untuk buku A tidak membuka draf/buku lain', async () => {
    const a = await sebagai('authenticated', A, () => q(`select * from ebook_isi where ebook_id = 'buku-draf'`))
    expect(a).toEqual([])
  })
  it('admin bisa membaca semua isi', async () => {
    expect((await sebagai('authenticated', ADM, () => q('select * from ebook_isi'))).length).toBe(2)
  })
  it('pembeli tidak bisa menulis/mengubah/menghapus isi', async () => {
    expect(await sebagai('authenticated', A, () => gagal(() => db.exec(`insert into ebook_isi values ('buku-a','x')`)))).toMatch(/duplicate|row-level security/)
    const u = await sebagai('authenticated', A, () => db.query(`update ebook_isi set raw='dirusak'`))
    const d = await sebagai('authenticated', A, () => db.query(`delete from ebook_isi`))
    expect(u.affectedRows).toBe(0)
    expect(d.affectedRows).toBe(0)
    expect((await q(`select raw from ebook_isi where ebook_id='buku-a'`))[0].raw).toBe('# Rahasia A')
  })
})

describe('pembelian tidak bisa dipalsukan oleh pembeli', () => {
  it('pembeli tidak bisa membuat pembelian lunas sendiri', async () => {
    expect(await sebagai('authenticated', B, () => gagal(() => db.exec(`insert into pembelian (user_id, ebook_id, order_id, status, jumlah) values ('${B}','buku-a','CURANG','lunas',1)`)))).toMatch(/row-level security/)
    expect(await sebagai('authenticated', B, () => q('select * from ebook_isi'))).toEqual([])
  })
  it('pembeli tidak bisa mengubah status pesanannya sendiri', async () => {
    await sebagai('service_role', null, () => db.exec(`insert into pembelian (user_id, ebook_id, order_id, status, jumlah) values ('${B}','buku-a','ORD-B','pending',25000)`))
    const u = await sebagai('authenticated', B, () => db.query(`update pembelian set status='lunas' where order_id='ORD-B'`))
    expect(u.affectedRows).toBe(0)
    expect(await sebagai('authenticated', B, () => q('select * from ebook_isi'))).toEqual([])
  })
  it('pembeli hanya melihat pembeliannya sendiri; admin melihat semua', async () => {
    const a = await sebagai('authenticated', A, () => q('select order_id from pembelian'))
    expect(a.map((x) => x.order_id)).toEqual(['ORD-PENDING'])
    const adm = await sebagai('authenticated', ADM, () => q('select order_id from pembelian order by order_id'))
    expect(adm.length).toBe(2)
  })
  it('satu pembeli tidak bisa punya dua pembelian lunas untuk ebook yang sama', async () => {
    await sebagai('service_role', null, () => db.exec(`insert into pembelian (user_id, ebook_id, order_id, status, jumlah) values ('${A}','buku-a','ORD-A2','pending',25000)`))
    const e = await sebagai('service_role', null, () => gagal(() => db.exec(`update pembelian set status='lunas' where order_id='ORD-A2'`)))
    expect(e).toMatch(/unique|duplicate/)
  })
  it('ebook yang sudah ada pembeliannya tidak bisa dihapus (pembeli tak kehilangan akses)', async () => {
    const e = await sebagai('authenticated', ADM, () => gagal(() => db.exec(`delete from ebook_berbayar where id='buku-a'`)))
    expect(e).toMatch(/foreign key|violates/)
  })
})

describe('admin tidak bisa dipalsukan', () => {
  it('pengguna tidak bisa membaca atau menambah diri ke admin_users', async () => {
    expect(await sebagai('authenticated', A, () => q('select * from admin_users'))).toEqual([])
    expect(await sebagai('authenticated', A, () => gagal(() => db.exec(`insert into admin_users values ('${A}')`)))).toMatch(/row-level security/)
    expect(await sebagai('anon', null, () => q('select public.is_admin() as a'))).toEqual([{ a: false }])
    expect(await sebagai('authenticated', A, () => q('select public.is_admin() as a'))).toEqual([{ a: false }])
    expect(await sebagai('authenticated', ADM, () => q('select public.is_admin() as a'))).toEqual([{ a: true }])
  })
})

describe('batasan data', () => {
  it('harga di bawah 1000, id ngawur, dan tema salah ditolak', async () => {
    const coba = (v: string) => sebagai('authenticated', ADM, () => gagal(() => db.exec(`insert into ebook_berbayar (id,judul,harga,tema) values ${v}`)))
    expect(await coba(`('murah','x',999,'malam')`)).toMatch(/check/)
    expect(await coba(`('Besar Kecil','x',5000,'malam')`)).toMatch(/check/)
    expect(await coba(`('ok-1','x',5000,'neon')`)).toMatch(/check/)
    expect(await coba(`('ok-1','',5000,'malam')`)).toMatch(/check/)
  })
})
