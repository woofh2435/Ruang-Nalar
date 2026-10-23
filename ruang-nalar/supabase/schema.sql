-- ============================================================
--  Ruang Nalar — skema Supabase untuk akun & ebook berbayar
--  Cara pakai: Supabase Dashboard → SQL Editor → tempel semua isi file ini → Run.
--  Aman dijalankan ulang (memakai IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS).
--
--  Prinsip keamanan:
--   • Isi ebook berbayar (tabel ebook_isi) HANYA bisa dibaca pembeli yang sudah LUNAS (atau admin),
--     dipaksa oleh Row Level Security di database, bukan oleh kode di browser.
--   • Pembeli tidak bisa menulis tabel pembelian sama sekali. Hanya Edge Function (service role)
--     yang membuat transaksi dan menandainya lunas setelah Midtrans mengonfirmasi.
--   • Harga selalu dibaca server dari tabel ebook_berbayar, tidak pernah dari browser.
-- ============================================================

-- ---------- admin ----------
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admin_users enable row level security;
-- sengaja TANPA policy: tidak ada yang bisa membaca/menulis lewat API. Isi lewat SQL Editor (lihat bawah).

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users a where a.user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- katalog ebook berbayar (metadata publik) ----------
create table if not exists public.ebook_berbayar (
  id          text primary key check (id ~ '^[a-z0-9][a-z0-9-]{0,59}$'),
  judul       text not null check (char_length(judul) between 1 and 140),
  subjudul    text not null default '' check (char_length(subjudul) <= 140),
  penulis     text not null default '' check (char_length(penulis) <= 100),
  tema        text not null default 'malam' check (tema in ('malam', 'siang', 'iris', 'almond', 'api')),
  ikon        text not null default '📖' check (char_length(ikon) <= 8),
  tag         text[] not null default '{}',
  deskripsi   text not null default '' check (char_length(deskripsi) <= 400),
  harga       integer not null check (harga between 1000 and 100000000), -- rupiah
  terbit      boolean not null default false,
  urutan      integer not null default 0,
  dibuat      timestamptz not null default now(),
  diperbarui  timestamptz not null default now()
);
alter table public.ebook_berbayar enable row level security;

drop policy if exists "katalog: semua orang lihat yang terbit" on public.ebook_berbayar;
create policy "katalog: semua orang lihat yang terbit" on public.ebook_berbayar
  for select using (terbit or public.is_admin());

drop policy if exists "katalog: admin kelola" on public.ebook_berbayar;
create policy "katalog: admin kelola" on public.ebook_berbayar
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- pembelian ----------
create table if not exists public.pembelian (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users (id) on delete cascade,
  ebook_id  text not null references public.ebook_berbayar (id) on delete restrict,
  order_id  text not null unique,
  status    text not null default 'pending' check (status in ('pending', 'lunas', 'gagal')),
  jumlah    integer not null check (jumlah > 0),
  dibuat    timestamptz not null default now(),
  dibayar   timestamptz
);
-- satu pembeli hanya boleh punya satu pembelian LUNAS per ebook
create unique index if not exists pembelian_satu_lunas on public.pembelian (user_id, ebook_id) where status = 'lunas';
create index if not exists pembelian_user on public.pembelian (user_id);

alter table public.pembelian enable row level security;
drop policy if exists "pembelian: lihat milik sendiri" on public.pembelian;
create policy "pembelian: lihat milik sendiri" on public.pembelian
  for select using (user_id = auth.uid() or public.is_admin());
-- TIDAK ADA policy insert/update/delete → hanya service role (Edge Function) yang bisa menulis.

-- ---------- isi ebook berbayar (terkunci) ----------
create table if not exists public.ebook_isi (
  ebook_id  text primary key references public.ebook_berbayar (id) on delete cascade,
  raw       text not null check (char_length(raw) <= 2000000)
);
alter table public.ebook_isi enable row level security;

drop policy if exists "isi: baca jika sudah lunas atau admin" on public.ebook_isi;
create policy "isi: baca jika sudah lunas atau admin" on public.ebook_isi
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.pembelian p
      where p.ebook_id = ebook_isi.ebook_id
        and p.user_id = auth.uid()
        and p.status = 'lunas'
    )
  );

drop policy if exists "isi: admin kelola" on public.ebook_isi;
create policy "isi: admin kelola" on public.ebook_isi
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- pembaruan otomatis kolom diperbarui ----------
create or replace function public.set_diperbarui()
returns trigger language plpgsql as $$
begin
  new.diperbarui = now();
  return new;
end;
$$;
drop trigger if exists ebook_berbayar_diperbarui on public.ebook_berbayar;
create trigger ebook_berbayar_diperbarui before update on public.ebook_berbayar
  for each row execute function public.set_diperbarui();

-- ===== (dari supabase/patch/01-persetujuan.sql) =====
-- ---------- log persetujuan (hanya menambah, tidak pernah diubah atau dihapus oleh pengguna) ----------
create table if not exists public.persetujuan (
  id               bigint generated always as identity primary key,
  user_id          uuid not null references auth.users (id) on delete cascade,
  jenis            text not null check (jenis in ('syarat_privasi', 'promo', 'analitik')),
  status           boolean not null,
  versi_kebijakan  text not null check (char_length(versi_kebijakan) between 1 and 20),
  dibuat           timestamptz not null default now()
);
create index if not exists persetujuan_user on public.persetujuan (user_id, jenis, dibuat desc);

alter table public.persetujuan enable row level security;

drop policy if exists "persetujuan: lihat milik sendiri" on public.persetujuan;
create policy "persetujuan: lihat milik sendiri" on public.persetujuan
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "persetujuan: catat milik sendiri" on public.persetujuan;
create policy "persetujuan: catat milik sendiri" on public.persetujuan
  for insert with check (user_id = auth.uid());
-- TIDAK ada policy update/delete: catatan lama tidak bisa diubah. Menarik persetujuan = menambah baris baru berstatus false.

-- ---------- catat persetujuan saat akun dibuat ----------
-- Web mengirim pilihan di kolom metadata pendaftaran (raw_user_meta_data.persetujuan). Waktu dicatat oleh server,
-- bukan oleh browser, jadi tidak bisa dimundurkan. Kegagalan mencatat TIDAK boleh menggagalkan pendaftaran.
create or replace function public.catat_persetujuan_daftar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p jsonb;
  v text;
begin
  p := new.raw_user_meta_data -> 'persetujuan';
  if p is null or jsonb_typeof(p) <> 'object' then
    return new;
  end if;
  v := left(coalesce(p ->> 'versi', ''), 20);
  if v = '' then
    return new;
  end if;
  if (p ->> 'syarat') = 'true' then
    insert into public.persetujuan (user_id, jenis, status, versi_kebijakan) values (new.id, 'syarat_privasi', true, v);
  end if;
  insert into public.persetujuan (user_id, jenis, status, versi_kebijakan) values (new.id, 'promo', (p ->> 'promo') = 'true', v);
  insert into public.persetujuan (user_id, jenis, status, versi_kebijakan) values (new.id, 'analitik', (p ->> 'analitik') = 'true', v);
  return new;
exception when others then
  raise warning 'catat_persetujuan_daftar gagal: %', sqlerrm;
  return new;
end;
$$;
revoke all on function public.catat_persetujuan_daftar() from public, anon, authenticated;

drop trigger if exists catat_persetujuan_daftar on auth.users;
create trigger catat_persetujuan_daftar after insert on auth.users
  for each row execute function public.catat_persetujuan_daftar();

-- ============================================================
--  LANGKAH MANUAL SETELAH MENJALANKAN FILE INI
--  Jadikan akunmu admin (ganti emailnya, dan akun harus sudah mendaftar lewat web dulu):
--
--    insert into public.admin_users (user_id)
--    select id from auth.users where email = 'emailmu@contoh.com'
--    on conflict do nothing;
-- ============================================================
