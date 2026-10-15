// Membuat versi SATU-BERKAS dari Edge Function, untuk ditempel langsung di editor Dashboard Supabase
// (editor itu tidak mendukung impor dari folder _shared). Hasil: supabase/dashboard/*.ts
// Jalankan: npm run bundel:fungsi
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const akar = join(dirname(fileURLToPath(import.meta.url)), '..')
const fungsi = join(akar, 'supabase', 'functions')
const keluar = join(akar, 'supabase', 'dashboard')
mkdirSync(keluar, { recursive: true })

const IMPOR_BERSAMA = /^import\s*\{[^}]*\}\s*from\s*'\.\.\/_shared\/midtrans\.ts'\s*;?\s*$/m
const IMPOR_KLIEN = "import { createClient } from 'npm:@supabase/supabase-js@2'"

const bersama = readFileSync(join(fungsi, '_shared', 'midtrans.ts'), 'utf8')
  .replace(/^\/\/ Logika murni[^\n]*\n/, '')
  .replace(/^export /gm, '')
  .trim()

for (const nama of ['buat-transaksi', 'midtrans-webhook']) {
  const sumber = readFileSync(join(fungsi, nama, 'index.ts'), 'utf8')
  if (!IMPOR_BERSAMA.test(sumber)) throw new Error(`${nama}: impor ../_shared/midtrans.ts tidak ditemukan`)
  if (!sumber.includes(IMPOR_KLIEN)) throw new Error(`${nama}: impor createClient tidak ditemukan`)
  const badan = sumber.replace(IMPOR_BERSAMA, '').replace(IMPOR_KLIEN, '').replace(/^\n+/, '')
  const komentarAtas = badan.match(/^(\/\/[^\n]*\n)+/)?.[0] ?? ''
  const sisa = badan.slice(komentarAtas.length).replace(/^\n+/, '')
  const hasil = `${komentarAtas}//
// VERSI SATU-BERKAS untuk Dashboard Supabase (Edge Functions → fungsi → Code). Dibuat otomatis oleh
// scripts/bundel-fungsi.mjs dari supabase/functions/. JANGAN diedit di sini; ubah sumbernya lalu jalankan ulang skripnya.

${IMPOR_KLIEN}

// ---------- kode bersama (dari _shared/midtrans.ts) ----------
${bersama}

// ---------- fungsi ----------
${sisa}`
  writeFileSync(join(keluar, `${nama}.ts`), hasil)
  console.log('dibuat: supabase/dashboard/' + nama + '.ts (' + hasil.length + ' karakter)')
}
