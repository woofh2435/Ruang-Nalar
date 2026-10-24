// Membuat versi SATU-BERKAS dari hasil build: CSS dan JS dimasukkan ke dalam index.html, jadi cukup satu berkas untuk dipasang
// di akar repo GitHub Pages (tanpa GitHub Actions). Kebijakan keamanan (CSP) otomatis ditambah hash skrip yang di-inline.
// Pakai:  npm run build:docs && node scripts/satu-file.mjs [folder-build=docs] [berkas-keluaran=satu-berkas.html]
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2] ?? 'docs'
const keluar = process.argv[3] ?? 'satu-berkas.html'
let html = readFileSync(join(dir, 'index.html'), 'utf8')

const tagJs = html.match(/<script type="module" crossorigin src="\.\/(assets\/[^"]+\.js)"><\/script>/)
const tagCss = html.match(/<link rel="stylesheet" crossorigin href="\.\/(assets\/[^"]+\.css)">/)
if (!tagJs || !tagCss) throw new Error('tag aset tidak ditemukan di ' + join(dir, 'index.html'))
let js = readFileSync(join(dir, tagJs[1]), 'utf8')
let css = readFileSync(join(dir, tagCss[1]), 'utf8')
if (js.includes('import.meta')) throw new Error('JS memakai import.meta, tidak bisa di-inline')
js = js.split('</script').join('<\\/script')
css = css.split('</style').join('<\\/style')

// pakai fungsi sebagai pengganti: kode JS penuh tanda "$" yang akan ditafsirkan khusus bila dipakai sebagai string pengganti
html = html.replace(tagCss[0], () => `<style>${css}</style>`)
html = html.replace(tagJs[0], () => `<script type="module">${js}</script>`)

const hash = `'sha256-${createHash('sha256').update(js, 'utf8').digest('base64')}'`
const sebelum = html
html = html.replace(/(<meta http-equiv="Content-Security-Policy" content=")([^"]*)(")/, (_m, a, isi, z) => a + isi.replace(/script-src ([^;]*)/, (_mm, daftar) => `script-src ${daftar} ${hash}`) + z)
if (html === sebelum) console.warn('PERINGATAN: meta Content-Security-Policy tidak ditemukan, hash skrip tidak ditambahkan.')

writeFileSync(keluar, html, 'utf8')
console.log('OK', keluar, html.length, 'karakter')
