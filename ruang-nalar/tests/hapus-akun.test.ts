import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const baca = (p: string) => readFileSync(new URL('../' + p, import.meta.url), 'utf8')

describe('Edge Function hapus-akun', () => {
  const fn = baca('supabase/functions/hapus-akun/index.ts')
  it('memeriksa token pengguna sendiri sebelum bertindak (deploy memakai --no-verify-jwt)', () => {
    expect(fn).toContain('auth.getUser(token)')
    expect(fn.indexOf('auth.getUser(token)')).toBeLessThan(fn.indexOf('deleteUser'))
    expect(fn).toContain('--no-verify-jwt')
  })
  it('hanya menerima POST dan menuntut kata konfirmasi HAPUS', () => {
    expect(fn).toMatch(/req\.method !== 'POST'/)
    expect(fn).toMatch(/konfirmasi !== 'HAPUS'/)
  })
  it('menolak akun admin dan menghapus akun yang SAMA dengan pemilik token (bukan id dari permintaan)', () => {
    expect(fn).toMatch(/admin_users/)
    expect(fn).toMatch(/admin_tidak_bisa/)
    expect(fn).toMatch(/deleteUser\(user\.id\)/)
    expect(fn).not.toMatch(/masukan\.(id|user)/)
  })
  it('kunci service role hanya dibaca dari lingkungan server', () => {
    expect(fn).toContain("Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')")
    expect(fn).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}/)
  })
  it('salinan untuk dashboard ada, dan memuat logika inti yang sama', () => {
    const d = baca('supabase/dashboard/hapus-akun.ts')
    for (const k of ['auth.getUser(token)', "konfirmasi !== 'HAPUS'", 'admin_tidak_bisa', 'deleteUser(user.id)']) expect(d, k).toContain(k)
  })
  it('klien memanggil fungsi dengan kata konfirmasi yang sama', () => {
    expect(baca('src/lib/toko/supabase.ts')).toContain("functions.invoke('hapus-akun', { body: { konfirmasi: 'HAPUS' } })")
  })
})

describe('data yang ikut terhapus bersama akun', () => {
  const skema = baca('supabase/schema.sql')
  it('pembelian dan catatan persetujuan memakai on delete cascade ke auth.users', () => {
    const tabel = (nama: string) => skema.slice(skema.indexOf(`create table if not exists public.${nama}`), skema.indexOf(');', skema.indexOf(`create table if not exists public.${nama}`)))
    expect(tabel('pembelian')).toMatch(/references auth\.users \(id\) on delete cascade/)
    expect(tabel('persetujuan')).toMatch(/references auth\.users \(id\) on delete cascade/)
  })
})
