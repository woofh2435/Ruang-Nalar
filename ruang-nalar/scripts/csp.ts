// Content-Security-Policy untuk build produksi. Dipasang sebagai <meta http-equiv> karena GitHub Pages tidak bisa mengatur header HTTP.
// (Untuk header sungguhan, termasuk frame-ancestors yang TIDAK bekerja lewat <meta>, lihat public/_headers.)
// Dipakai oleh vite.config.ts (hanya saat build, supaya `npm run dev` tetap jalan) dan oleh tests/keamanan.test.ts.

import { createHash } from 'node:crypto'
import type { Plugin } from 'vite'

export const sha256Skrip = (teks: string): string => `'sha256-${createHash('sha256').update(teks, 'utf8').digest('base64')}'`

/** Alamat layanan pihak ketiga yang memang dipakai web ini. Tambahkan di sini bila kamu menyambungkan layanan baru. */
export const SUMBER = {
  supabase: ['https://*.supabase.co', 'wss://*.supabase.co'],
  fontCss: ['https://fonts.googleapis.com'],
  fontFile: ['https://fonts.gstatic.com'],
  turnstile: ['https://challenges.cloudflare.com'],
} as const

/** Susun kebijakan. `hashSkrip` = hash skrip inline yang diizinkan (mis. skrip pemasang tema). */
export function bangunCsp(hashSkrip: string[] = []): string {
  const d: Record<string, string[]> = {
    'default-src': ["'self'"],
    // tidak ada 'unsafe-inline' dan 'unsafe-eval' untuk skrip: hanya berkas sendiri, skrip inline ber-hash, dan Turnstile (opsional)
    'script-src': ["'self'", ...hashSkrip, ...SUMBER.turnstile],
    // gaya inline dipakai React/Framer Motion untuk posisi dan animasi
    'style-src': ["'self'", "'unsafe-inline'", ...SUMBER.fontCss],
    'font-src': ["'self'", ...SUMBER.fontFile, 'data:'],
    'img-src': ["'self'", 'data:', 'blob:'],
    'connect-src': ["'self'", ...SUMBER.supabase, ...SUMBER.turnstile],
    'frame-src': [...SUMBER.turnstile],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'manifest-src': ["'self'"],
  }
  return Object.entries(d)
    .map(([k, v]) => `${k} ${v.join(' ')}`)
    .join('; ')
}

/** Skrip inline (tanpa src) di dalam HTML: isi persisnya yang di-hash browser. */
export function skripInline(html: string): string[] {
  const hasil: string[] = []
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    if (/\bsrc\s*=/.test(m[1])) continue
    if (m[2].trim()) hasil.push(m[2])
  }
  return hasil
}

export function pluginCsp(): Plugin {
  return {
    name: 'ruang-nalar-csp',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const csp = bangunCsp(skripInline(html).map(sha256Skrip))
        const meta = `<meta http-equiv="Content-Security-Policy" content="${csp}" />\n    <meta name="referrer" content="strict-origin-when-cross-origin" />`
        // letakkan SETELAH <meta charset> (wajib berada di 1024 byte pertama), tetapi SEBELUM skrip dan stylesheet apa pun
        if (/<meta\s+charset[^>]*>/i.test(html)) return html.replace(/(<meta\s+charset[^>]*>)/i, `$1\n    ${meta}`)
        return html.replace(/<head[^>]*>/i, (h) => `${h}\n    ${meta}`)
      },
    },
  }
}
