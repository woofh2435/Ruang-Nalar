-- ============================================================
--  PATCH 01: catatan persetujuan pengguna (UU PDP No. 27/2022)
--  Aman dijalankan ulang. Kalau skema utama (schema.sql) sudah kamu jalankan SEBELUM patch ini ada,
--  cukup tempel isi file ini di Supabase -> SQL Editor -> Run. Kalau kamu baru memasang dari awal,
--  schema.sql sudah memuat bagian ini dan kamu tidak perlu menjalankan file ini lagi.
-- ============================================================

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
