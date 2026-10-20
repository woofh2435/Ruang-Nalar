// Parser ebook Ruang Nalar.
//
// Prinsip utama: TIDAK PERNAH melempar error. Format yang salah / blok kosong /
// blok tidak lengkap dilewati, lalu dicatat sebagai peringatan lengkap dengan
// nomor baris supaya admin bisa memperbaikinya di pratinjau.
//
// Format (format lock):
//   --- frontmatter (judul, subjudul, penulis, tema, ikon, tag, status, deskripsi) ---
//   # Judul Bab
//   paragraf dengan **tebal**, *miring*, [[Istilah|definisi]]
//   :::catatan tipe=penting|tips|awas ... :::
//   :::tokoh nama="..." tahun="..." ... :::
//   :::kartu  (Depan: / Belakang:) ... :::
//   :::kuis   (Q: / - opsi / - [x] benar / Penjelasan:) ... :::
//   :::refleksi ... :::
//   :::misi judul="..." xp=10 ... Arah: ... :::            (quest: centang, catatan, arah jawaban)
//   :::karier jalur="Peneliti sosial" ... Coba: ... :::    (kartu jalur karier di dalam bab)
//   :::peta-karier judul="..."  - Jalur | Dikerjakan | Tempat | bab 3, 5 ... :::
//   :::papan judul="..." :::                                (ringkasan progres)
// Tambahan kecil yang aman: "## " / "### " sebagai subjudul dan "- " sebagai daftar biasa.

import { PLACEHOLDER_PENULIS } from '../config'
import { normalisasiTema } from './tema'
import type {
  Bab,
  Blok,
  CatatanTipe,
  EbookMeta,
  Inline,
  JalurKarier,
  Para,
  ParsedEbook,
  Peringatan,
  StatusEbook,
} from './types'

export const KUNCI_FRONTMATTER = [
  'judul',
  'subjudul',
  'penulis',
  'tema',
  'ikon',
  'tag',
  'status',
  'deskripsi',
] as const

export const META_KOSONG: EbookMeta = {
  judul: 'Tanpa Judul',
  subjudul: '',
  penulis: '',
  tema: 'malam',
  ikon: '📖',
  tag: [],
  status: 'terbit',
  deskripsi: '',
}

// ------------------------------------------------------------
// Inline: **tebal**, *miring*, [[Istilah|definisi]]
// ------------------------------------------------------------

const MASK: Record<string, string> = { '*': '', '[': '', ']': '', '\\': '' }
const UNMASK: Record<string, string> = { '': '*', '': '[', '': ']', '': '\\' }
const mask = (s: string) => s.replace(/\\([*[\]\\])/g, (_m, c: string) => MASK[c])
const unmask = (s: string) => s.replace(/[-]/g, (c) => UNMASK[c])

function scan(
  s: string,
  tebal: boolean,
  miring: boolean,
  out: Inline[],
  warn?: (pesan: string) => void,
) {
  let buf = ''
  const flush = () => {
    if (buf) {
      out.push({ k: 'teks', s: buf, tebal, miring })
      buf = ''
    }
  }
  let i = 0
  while (i < s.length) {
    const c = s[i]

    if (c === '[' && s[i + 1] === '[') {
      const end = s.indexOf(']]', i + 2)
      if (end > i + 1) {
        const inner = s.slice(i + 2, end)
        const bar = inner.indexOf('|')
        if (bar >= 0) {
          const term = inner.slice(0, bar).trim()
          const def = inner.slice(bar + 1).trim()
          if (term && def) {
            flush()
            out.push({ k: 'istilah', s: term, def, tebal, miring })
          } else {
            warn?.(`Istilah [[${unmask(inner)}]] kosong di salah satu sisi "|". Ditampilkan sebagai teks biasa.`)
            buf += term || def
          }
        } else {
          warn?.(`Istilah [[${unmask(inner)}]] belum punya definisi. Tulis [[Istilah|definisi]]. Ditampilkan sebagai teks biasa.`)
          buf += inner
        }
        i = end + 2
        continue
      }
    }

    if (c === '*' && s[i + 1] === '*') {
      let end = s.indexOf('**', i + 2)
      if (end > i + 2) {
        if (s[end + 2] === '*') end++ // ***teks*** : tutup di bintang terakhir
        const inner = s.slice(i + 2, end)
        if (inner.trim()) {
          flush()
          scan(inner, true, miring, out, warn)
          i = end + 2
          continue
        }
      }
    } else if (c === '*') {
      const next = s[i + 1]
      if (next && !/\s/.test(next)) {
        let j = i + 1
        let end = -1
        while (j < s.length) {
          const idx = s.indexOf('*', j)
          if (idx < 0) break
          if (s[idx + 1] === '*') {
            j = idx + 2
            continue
          }
          end = idx
          break
        }
        if (end > i + 1) {
          const inner = s.slice(i + 1, end)
          if (inner.trim() && !/\s$/.test(inner)) {
            flush()
            scan(inner, tebal, true, out, warn)
            i = end + 1
            continue
          }
        }
      }
    }

    buf += c
    i++
  }
  flush()
}

export function parseInline(text: string, warn?: (pesan: string) => void): Inline[] {
  const raw: Inline[] = []
  scan(mask(text), false, false, raw, warn)
  // gabungkan potongan teks bersebelahan dengan gaya sama, lalu kembalikan karakter escape
  const out: Inline[] = []
  for (const t of raw) {
    const prev = out[out.length - 1]
    if (prev && prev.k === 'teks' && t.k === 'teks' && prev.tebal === t.tebal && prev.miring === t.miring) {
      prev.s += t.s
    } else {
      out.push({ ...t })
    }
  }
  for (const t of out) {
    t.s = unmask(t.s)
    if (t.k === 'istilah') t.def = unmask(t.def)
  }
  return out
}

export function teksPolos(inline: Inline[]): string {
  return inline.map((t) => t.s).join('')
}

// ------------------------------------------------------------
// Frontmatter
// ------------------------------------------------------------

interface HasilFrontmatter {
  fm: Record<string, string>
  fmBaris: Record<string, number>
  /** indeks baris (0-based) pertama isi setelah frontmatter */
  mulaiIsi: number
  ada: boolean
}

function normalisasiTeks(raw: string): string {
  return String(raw ?? '')
    .replace(/^﻿/, '')
    .replace(/\r\n?/g, '\n')
}

const reHeadingBab = /^#\s+(.*)$/
const reHeadingKosong = /^#\s*$/
const reOpener = /^:::\s*[^\s:]/

function bacaFrontmatter(lines: string[], warn: (b: number, p: string) => void): HasilFrontmatter {
  const hasil: HasilFrontmatter = { fm: {}, fmBaris: {}, mulaiIsi: 0, ada: false }
  if ((lines[0] ?? '').trim() !== '---') return hasil

  let akhir = -1
  for (let j = 1; j < lines.length; j++) {
    if (lines[j].trim() === '---') {
      akhir = j
      break
    }
  }
  let mulaiIsi: number
  if (akhir < 0) {
    // frontmatter tidak ditutup: anggap berakhir sebelum heading bab / blok pertama
    let k = 1
    while (k < lines.length && !reHeadingBab.test(lines[k]) && !reHeadingKosong.test(lines[k]) && !reOpener.test(lines[k].trim())) k++
    akhir = k
    mulaiIsi = k
    warn(
      1,
      `Frontmatter dibuka dengan "---" tetapi tidak ditutup dengan "---". Saya anggap frontmatter berakhir sebelum baris ${k + 1}.`,
    )
  } else {
    mulaiIsi = akhir + 1
  }

  for (let j = 1; j < akhir; j++) {
    const ln = lines[j]
    if (!ln.trim()) continue
    const m = /^\s*([A-Za-z_]+)\s*:\s*(.*)$/.exec(ln)
    if (!m) {
      warn(j + 1, `Baris frontmatter ini tidak dikenali: "${ln.trim().slice(0, 40)}". Tulis dengan bentuk kunci: nilai.`)
      continue
    }
    const kunci = m[1].toLowerCase()
    let nilai = m[2].trim()
    if (nilai.length >= 2 && /^["“'].*["”']$/.test(nilai)) nilai = nilai.slice(1, -1).trim()
    if (!(KUNCI_FRONTMATTER as readonly string[]).includes(kunci)) {
      warn(j + 1, `Kunci "${kunci}" tidak dikenal di frontmatter, diabaikan. Kunci yang dikenal: ${KUNCI_FRONTMATTER.join(', ')}.`)
      continue
    }
    hasil.fm[kunci] = nilai
    hasil.fmBaris[kunci] = j + 1
  }
  hasil.mulaiIsi = mulaiIsi
  hasil.ada = true
  return hasil
}

function bacaTag(nilai: string): string[] {
  let s = nilai.trim()
  if (s.startsWith('[') && s.endsWith(']')) s = s.slice(1, -1)
  return s
    .split(',')
    .map((x) => x.trim().replace(/^["“']|["”']$/g, ''))
    .filter(Boolean)
}

function bangunMeta(h: HasilFrontmatter, warn: (b: number, p: string) => void): EbookMeta {
  const meta: EbookMeta = { ...META_KOSONG, tag: [] }
  const { fm, fmBaris } = h

  if (fm.judul && fm.judul.trim()) meta.judul = fm.judul.trim()
  else warn(fmBaris.judul ?? 1, 'Judul ebook kosong. Isi "judul:" di frontmatter. Sementara dipakai "Tanpa Judul".')

  meta.subjudul = (fm.subjudul ?? '').trim()
  meta.penulis = (fm.penulis ?? '').trim()
  meta.deskripsi = (fm.deskripsi ?? '').trim()
  if (fm.ikon && fm.ikon.trim()) meta.ikon = fm.ikon.trim()
  if (fm.tag !== undefined) meta.tag = bacaTag(fm.tag)

  if (fm.tema !== undefined) {
    const t = normalisasiTema(fm.tema)
    if (t) meta.tema = t
    else warn(fmBaris.tema ?? 1, `Tema "${fm.tema}" tidak dikenal. Pilih: malam, siang, iris, almond, atau api. Dipakai "malam".`)
  }

  if (fm.status !== undefined) {
    const s = fm.status.trim().toLowerCase()
    if (s === 'terbit') meta.status = 'terbit'
    else if (s === 'draf' || s === 'draft') meta.status = 'draf'
    else warn(fmBaris.status ?? 1, `Status "${fm.status}" tidak dikenal. Pilih: terbit atau draf. Dipakai "terbit".`)
  }
  return meta
}

/** Pisahkan frontmatter dan isi, untuk editor admin. Tidak pernah melempar error. */
export function pisahEbook(raw: string): { meta: EbookMeta; adaFrontmatter: boolean; isi: string } {
  const lines = normalisasiTeks(raw).split('\n')
  const h = bacaFrontmatter(lines, () => {})
  const meta = bangunMeta(h, () => {})
  let isi = lines.slice(h.mulaiIsi).join('\n')
  isi = isi.replace(/^\n+/, '')
  return { meta, adaFrontmatter: h.ada, isi }
}

/** Susun frontmatter + isi menjadi satu teks .md. `offset` = jumlah baris sebelum isi. */
export function susunEbook(meta: EbookMeta, isi: string): { raw: string; offset: number } {
  const satuBaris = (s: string) => s.replace(/\s*\n\s*/g, ' ').trim()
  const head = [
    '---',
    `judul: ${satuBaris(meta.judul)}`,
    `subjudul: ${satuBaris(meta.subjudul)}`,
    `penulis: ${satuBaris(meta.penulis)}`,
    `tema: ${meta.tema}`,
    `ikon: ${satuBaris(meta.ikon)}`,
    `tag: [${meta.tag.map(satuBaris).filter(Boolean).join(', ')}]`,
    `status: ${meta.status}`,
    `deskripsi: ${satuBaris(meta.deskripsi)}`,
    '---',
    '',
  ]
  const body = normalisasiTeks(isi).replace(/^\n+/, '').replace(/\s+$/, '')
  return { raw: head.join('\n') + '\n' + body + '\n', offset: head.length }
}

/** Nama penulis yang ditampilkan (placeholder / kosong -> default dari config). */
export function namaPenulis(penulis: string, bawaan: string): string {
  const p = (penulis ?? '').trim()
  return !p || p === PLACEHOLDER_PENULIS ? bawaan : p
}

// ------------------------------------------------------------
// Isi ebook: bab dan blok
// ------------------------------------------------------------

interface Baris {
  t: string
  n: number
}

function kelompokParagraf(isi: Baris[]): { text: string; n: number }[] {
  const out: { text: string; n: number }[] = []
  let cur: Baris[] = []
  const tutup = () => {
    if (cur.length) {
      out.push({ text: cur.map((b) => b.t.trim()).join(' '), n: cur[0].n })
      cur = []
    }
  }
  for (const b of isi) {
    if (!b.t.trim()) tutup()
    else cur.push(b)
  }
  tutup()
  return out
}

/** Kunci penyimpanan dari nama jalur karier: huruf kecil, angka, dan tanda hubung. */
export function kunciJalur(nama: string): string {
  return nama
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/** "bab 3, 5-7" -> [3, 5, 6, 7]. Angka di luar 1..999 diabaikan; rentang dibatasi 60 bab. */
export function nomorBabDariTeks(teks: string): number[] {
  const hasil = new Set<number>()
  for (const m of teks.matchAll(/(\d+)(?:\s*[-–]\s*(\d+))?/g)) {
    const a = Number(m[1])
    const z = m[2] !== undefined ? Number(m[2]) : a
    if (a < 1 || z < a || z > 999 || z - a > 60) continue
    for (let n = a; n <= z; n++) hasil.add(n)
  }
  return [...hasil].sort((x, y) => x - y)
}

function parseAtribut(s: string): Record<string, string> {
  const out: Record<string, string> = {}
  const re = /([A-Za-z_]+)\s*=\s*(?:"([^"]*)"|“([^”]*)”|'([^']*)'|(\S+))/g
  let m: RegExpExecArray | null
  while ((m = re.exec(s))) {
    out[m[1].toLowerCase()] = (m[2] ?? m[3] ?? m[4] ?? m[5] ?? '').trim()
  }
  return out
}

export function parseEbook(raw: string): ParsedEbook {
  const peringatan: Peringatan[] = []
  const warn = (baris: number, pesan: string) => {
    peringatan.push({ baris, pesan })
  }
  try {
    return parseDalam(raw, peringatan, warn)
  } catch (err) {
    // Jaring pengaman terakhir: jangan sampai halaman crash.
    warn(1, `Terjadi kesalahan tak terduga saat membaca ebook (${(err as Error)?.message ?? 'tidak diketahui'}). Periksa format ebook.`)
    return { meta: { ...META_KOSONG, tag: [] }, bab: [], peringatan, jumlahKuis: 0 }
  }
}

function parseDalam(
  raw: string,
  peringatan: Peringatan[],
  warn: (b: number, p: string) => void,
): ParsedEbook {
  const lines = normalisasiTeks(raw).split('\n')
  const h = bacaFrontmatter(lines, warn)
  const meta = bangunMeta(h, warn)

  const babs: Bab[] = []
  const st = { cur: null as Bab | null, urut: 0 }

  const bukaBab = (judul: string, baris: number) => {
    const idx = babs.length
    const bab: Bab = { id: `bab${idx}`, nomor: idx + 1, judul, baris, blok: [] }
    babs.push(bab)
    st.cur = bab
    st.urut = 0
    return bab
  }
  const babAktif = (baris: number): Bab => {
    if (st.cur) return st.cur
    warn(baris, 'Ada isi sebelum bab pertama (heading "# "). Isi itu dimasukkan ke bab "Pembuka".')
    return bukaBab('Pembuka', baris)
  }
  const idBlok = () => `b${babs.length - 1}-${++st.urut}`

  const mkPara = (id: string, text: string, baris: number): Para => {
    const inline = parseInline(text, (p) => warn(baris, p))
    return { id, inline, teks: teksPolos(inline) }
  }
  const mkParas = (id: string, isi: Baris[]): Para[] =>
    kelompokParagraf(isi).map((p, k) => mkPara(`${id}.${k + 1}`, p.text, p.n))

  // buffer paragraf & daftar di luar blok
  let pbuf: Baris[] = []
  let lbuf: Baris[] = []
  const flush = () => {
    if (pbuf.length) {
      const bab = babAktif(pbuf[0].n)
      const id = idBlok()
      bab.blok.push({ tipe: 'p', id, para: mkPara(id, pbuf.map((b) => b.t.trim()).join(' '), pbuf[0].n) })
      pbuf = []
    }
    if (lbuf.length) {
      const bab = babAktif(lbuf[0].n)
      const id = idBlok()
      bab.blok.push({
        tipe: 'daftar',
        id,
        item: lbuf.map((b, k) => mkPara(`${id}.${k + 1}`, b.t, b.n)),
      })
      lbuf = []
    }
  }

  const bangunBlok = (jenis: string, atr: Record<string, string>, isi: Baris[], baris: number): Blok | null => {
    const label = `:::${jenis}`
    const kosongSemua = isi.every((b) => !b.t.trim())

    switch (jenis) {
      case 'catatan': {
        if (kosongSemua) {
          warn(baris, `Blok ${label} (baris ${baris}) kosong, dilewati.`)
          return null
        }
        let jenisCatatan: CatatanTipe = 'penting'
        if (atr.tipe !== undefined) {
          const t = atr.tipe.toLowerCase()
          if (t === 'penting' || t === 'tips' || t === 'awas') jenisCatatan = t
          else warn(baris, `Tipe catatan "${atr.tipe}" tidak dikenal (baris ${baris}). Pilih: penting, tips, atau awas. Dipakai "penting".`)
        }
        const id = idBlok()
        return { tipe: 'catatan', id, jenis: jenisCatatan, paras: mkParas(id, isi) }
      }

      case 'tokoh': {
        const nama = (atr.nama ?? '').trim()
        if (!nama) {
          warn(baris, `Blok ${label} (baris ${baris}) belum punya nama. Tulis :::tokoh nama="Nama Tokoh" tahun="1858–1917". Blok dilewati.`)
          return null
        }
        if (kosongSemua) {
          warn(baris, `Blok ${label} untuk "${nama}" (baris ${baris}) tidak punya isi, dilewati.`)
          return null
        }
        const id = idBlok()
        return { tipe: 'tokoh', id, nama, tahun: (atr.tahun ?? '').trim(), paras: mkParas(id, isi) }
      }

      case 'kartu': {
        if (kosongSemua) {
          warn(baris, `Blok ${label} (baris ${baris}) kosong, dilewati.`)
          return null
        }
        let depan: Baris[] | null = null
        let belakang: Baris[] | null = null
        let aktif: Baris[] | null = null
        for (const b of isi) {
          const md = /^\s*depan\s*:\s*(.*)$/i.exec(b.t)
          const mb = /^\s*belakang\s*:\s*(.*)$/i.exec(b.t)
          if (md) {
            depan = [{ t: md[1], n: b.n }]
            aktif = depan
          } else if (mb) {
            belakang = [{ t: mb[1], n: b.n }]
            aktif = belakang
          } else if (aktif && b.t.trim()) {
            aktif.push(b)
          }
        }
        const td = depan ? depan.map((b) => b.t.trim()).filter(Boolean).join(' ') : ''
        const tb = belakang ? belakang.map((b) => b.t.trim()).filter(Boolean).join(' ') : ''
        if (!td || !tb) {
          warn(
            baris,
            `Blok ${label} (baris ${baris}) harus punya "Depan:" dan "Belakang:" yang terisi. ${!td ? 'Bagian Depan kosong. ' : ''}${!tb ? 'Bagian Belakang kosong. ' : ''}Blok dilewati.`,
          )
          return null
        }
        const id = idBlok()
        return { tipe: 'kartu', id, depan: mkPara(`${id}.d`, td, depan![0].n), belakang: mkPara(`${id}.b`, tb, belakang![0].n) }
      }

      case 'kuis': {
        if (kosongSemua) {
          warn(baris, `Blok ${label} (baris ${baris}) kosong, dilewati.`)
          return null
        }
        let q: Baris[] | null = null
        const opsi: { teks: string; benar: boolean; n: number }[] = []
        let penj: Baris[] | null = null
        let aktif: 'q' | 'opsi' | 'penj' | null = null
        for (const b of isi) {
          const mq = /^\s*q\s*:\s*(.*)$/i.exec(b.t)
          const mp = /^\s*penjelasan\s*:\s*(.*)$/i.exec(b.t)
          const mo = /^\s*[-*]\s+(?:\[\s*([xX]?)\s*\]\s*)?(.*)$/.exec(b.t)
          if (mq) {
            q = [{ t: mq[1], n: b.n }]
            aktif = 'q'
          } else if (mp) {
            penj = [{ t: mp[1], n: b.n }]
            aktif = 'penj'
          } else if (mo) {
            opsi.push({ teks: mo[2].trim(), benar: (mo[1] ?? '').toLowerCase() === 'x', n: b.n })
            aktif = 'opsi'
          } else if (b.t.trim()) {
            if (aktif === 'q' && q) q.push(b)
            else if (aktif === 'penj' && penj) penj.push(b)
            else if (aktif === 'opsi' && opsi.length) opsi[opsi.length - 1].teks += ' ' + b.t.trim()
          }
        }
        const tq = q ? q.map((b) => b.t.trim()).filter(Boolean).join(' ') : ''
        if (!tq) {
          warn(baris, `Blok ${label} (baris ${baris}) belum punya pertanyaan. Tulis "Q: pertanyaanmu". Blok dilewati.`)
          return null
        }
        const opsiValid = opsi.filter((o) => o.teks)
        if (opsiValid.length < 2) {
          warn(baris, `Blok ${label} (baris ${baris}) butuh minimal 2 pilihan jawaban (tulis "- pilihan"). Blok dilewati.`)
          return null
        }
        const jmlBenar = opsiValid.filter((o) => o.benar).length
        if (jmlBenar === 0) {
          warn(baris, `Blok ${label} (baris ${baris}) belum punya jawaban benar. Tandai satu pilihan dengan "- [x]". Blok dilewati.`)
          return null
        }
        if (jmlBenar > 1) {
          warn(baris, `Blok ${label} (baris ${baris}) punya ${jmlBenar} jawaban benar. Hanya yang pertama dipakai.`)
        }
        const id = idBlok()
        let sudah = false
        const tp = penj ? penj.map((b) => b.t.trim()).filter(Boolean).join(' ') : ''
        return {
          tipe: 'kuis',
          id,
          tanya: mkPara(`${id}.q`, tq, q![0].n),
          opsi: opsiValid.map((o, k) => {
            const benar = o.benar && !sudah
            if (benar) sudah = true
            return { para: mkPara(`${id}.o${k + 1}`, o.teks, o.n), benar }
          }),
          penjelasan: tp ? mkPara(`${id}.e`, tp, penj![0].n) : null,
        }
      }

      case 'refleksi': {
        if (kosongSemua) {
          warn(baris, `Blok ${label} (baris ${baris}) kosong, dilewati.`)
          return null
        }
        const id = idBlok()
        return { tipe: 'refleksi', id, paras: mkParas(id, isi) }
      }

      case 'misi': {
        if (kosongSemua) {
          warn(baris, `Blok ${label} (baris ${baris}) kosong, dilewati.`)
          return null
        }
        const tugas: Baris[] = []
        let arah: Baris[] | null = null
        for (const b of isi) {
          const ma = /^\s*arah\s*:\s*(.*)$/i.exec(b.t)
          if (ma) arah = [{ t: ma[1], n: b.n }]
          else if (arah) {
            if (b.t.trim()) arah.push(b)
          } else tugas.push(b)
        }
        if (tugas.every((b) => !b.t.trim())) {
          warn(baris, `Blok ${label} (baris ${baris}) belum punya tugas (teks sebelum "Arah:"). Blok dilewati.`)
          return null
        }
        const judul = (atr.judul ?? '').trim()
        if (!judul) warn(baris, `Blok ${label} (baris ${baris}) belum punya judul. Tulis :::misi judul="Misi 1: ..." xp=10. Dipakai "Misi".`)
        let xp = 10
        if (atr.xp !== undefined) {
          const n = Number(atr.xp)
          if (Number.isInteger(n) && n >= 1 && n <= 100) xp = n
          else warn(baris, `Nilai xp "${atr.xp}" (baris ${baris}) tidak valid. Pakai bilangan bulat 1 sampai 100. Dipakai 10.`)
        }
        const id = idBlok()
        const ta = arah ? arah.map((b) => b.t.trim()).filter(Boolean).join(' ') : ''
        return {
          tipe: 'misi',
          id,
          judul: judul || 'Misi',
          xp,
          paras: mkParas(id, tugas),
          arah: ta ? mkPara(`${id}.a`, ta, arah![0].n) : null,
        }
      }

      case 'karier': {
        const jalur = (atr.jalur ?? '').trim()
        if (!jalur) {
          warn(baris, `Blok ${label} (baris ${baris}) belum punya nama jalur. Tulis :::karier jalur="Peneliti sosial". Blok dilewati.`)
          return null
        }
        if (kosongSemua) {
          warn(baris, `Blok ${label} untuk "${jalur}" (baris ${baris}) tidak punya isi, dilewati.`)
          return null
        }
        const kunci = kunciJalur(jalur)
        if (!kunci) {
          warn(baris, `Nama jalur "${jalur}" (baris ${baris}) harus memuat huruf atau angka. Blok dilewati.`)
          return null
        }
        const badan: Baris[] = []
        let coba: Baris[] | null = null
        for (const b of isi) {
          const mc = /^\s*coba\s*:\s*(.*)$/i.exec(b.t)
          if (mc) coba = [{ t: mc[1], n: b.n }]
          else if (coba) {
            if (b.t.trim()) coba.push(b)
          } else badan.push(b)
        }
        if (badan.every((b) => !b.t.trim())) {
          warn(baris, `Blok ${label} untuk "${jalur}" (baris ${baris}) belum punya penjelasan (teks sebelum "Coba:"). Blok dilewati.`)
          return null
        }
        const id = idBlok()
        const tc = coba ? coba.map((b) => b.t.trim()).filter(Boolean).join(' ') : ''
        return { tipe: 'karier', id, jalur, kunci, paras: mkParas(id, badan), coba: tc ? mkPara(`${id}.c`, tc, coba![0].n) : null }
      }

      case 'peta-karier': {
        const jalur: JalurKarier[] = []
        const dipakai = new Set<string>()
        for (const b of isi) {
          const m = /^\s*[-*]\s+(.*)$/.exec(b.t)
          if (!m) {
            if (b.t.trim()) warn(b.n, `Baris ini di dalam ${label} (baris ${b.n}) diabaikan. Tulis tiap jalur sebagai "- Nama | Yang dikerjakan | Tempat kerja | bab 3, 5".`)
            continue
          }
          const f = m[1].split('|').map((x) => x.trim())
          if (f.length < 3 || !f[0] || !f[1] || !f[2]) {
            warn(b.n, `Baris jalur di baris ${b.n} harus punya minimal tiga bagian dipisah "|": nama, yang dikerjakan, tempat kerja. Baris dilewati.`)
            continue
          }
          const kunci = kunciJalur(f[0])
          if (!kunci || dipakai.has(kunci)) {
            warn(b.n, `Nama jalur "${f[0]}" di baris ${b.n} ${kunci ? 'sudah dipakai di peta ini' : 'harus memuat huruf atau angka'}. Baris dilewati.`)
            continue
          }
          dipakai.add(kunci)
          const bab = nomorBabDariTeks(f[3] ?? '')
          jalur.push({ kunci, nama: f[0], kerja: f[1], tempat: f[2], bab })
          if (jalur.length >= 20) break
        }
        if (jalur.length === 0) {
          warn(baris, `Blok ${label} (baris ${baris}) belum punya jalur yang valid. Blok dilewati.`)
          return null
        }
        const id = idBlok()
        return { tipe: 'peta', id, judul: (atr.judul ?? '').trim() || 'Peta Jalur Kariermu', jalur }
      }

      case 'papan': {
        const id = idBlok()
        return { tipe: 'papan', id, judul: (atr.judul ?? '').trim() || 'Papan Pencapaian' }
      }

      default:
        warn(
          baris,
          `Jenis blok ":::${jenis}" (baris ${baris}) tidak dikenal, dilewati. Yang tersedia: catatan, tokoh, kartu, kuis, refleksi, misi, karier, peta-karier, papan.`,
        )
        return null
    }
  }

  for (let i = h.mulaiIsi; i < lines.length; i++) {
    const ln = lines[i]
    const n = i + 1
    const t = ln.trim()

    // --- heading bab ---
    if (reHeadingBab.test(ln) || reHeadingKosong.test(ln)) {
      flush()
      const m = reHeadingBab.exec(ln)
      let judul = (m?.[1] ?? '').trim()
      if (!judul) {
        judul = `Bab ${babs.length + 1}`
        warn(n, `Judul bab di baris ${n} kosong. Sementara dipakai "${judul}".`)
      }
      bukaBab(judul, n)
      continue
    }

    // --- penutup tanpa pembuka ---
    if (t === ':::') {
      flush()
      warn(n, `Ada penutup ":::" di baris ${n} tanpa blok yang dibuka. Penutup ini diabaikan.`)
      continue
    }

    // --- pembuka blok ---
    if (reOpener.test(t)) {
      flush()
      const m = /^:::\s*([^\s:=]+)\s*(.*)$/.exec(t)
      const jenis = (m?.[1] ?? '').toLowerCase()
      const atr = parseAtribut(m?.[2] ?? '')
      const isi: Baris[] = []
      let k = i + 1
      let tertutup = false
      while (k < lines.length) {
        const L = lines[k]
        const tt = L.trim()
        if (tt === ':::') {
          tertutup = true
          break
        }
        if (reHeadingBab.test(L) || reHeadingKosong.test(L) || reOpener.test(tt)) break
        isi.push({ t: L, n: k + 1 })
        k++
      }
      if (!tertutup) {
        warn(n, `Blok ":::${jenis}" di baris ${n} tidak ditutup dengan ":::". Saya tutup otomatis sebelum baris ${k + 1}.`)
      }
      // bab sementara supaya id blok benar; dibatalkan kalau blok ternyata dilewati
      const sementara = st.cur === null
      if (sementara) bukaBab('Pembuka', n)
      const blok = bangunBlok(jenis, atr, isi, n)
      if (blok) {
        if (sementara) warn(n, 'Ada isi sebelum bab pertama (heading "# "). Isi itu dimasukkan ke bab "Pembuka".')
        st.cur!.blok.push(blok)
      } else if (sementara) {
        babs.pop()
        st.cur = null
        st.urut = 0
      }
      i = tertutup ? k : k - 1
      continue
    }

    // --- subjudul ---
    const ms = /^(#{2,3})\s+(.*)$/.exec(ln)
    if (ms) {
      flush()
      const level = ms[1].length === 2 ? 2 : 3
      const bab = babAktif(n)
      const bid = idBlok()
      bab.blok.push({ tipe: 'sub', id: bid, level, para: mkPara(bid, ms[2].trim(), n) })
      continue
    }

    // --- daftar ---
    if (/^\s*[-*]\s+\S/.test(ln)) {
      if (pbuf.length) flush()
      lbuf.push({ t: ln.replace(/^\s*[-*]\s+/, ''), n })
      continue
    }

    // --- baris kosong ---
    if (!t) {
      flush()
      continue
    }

    // --- paragraf biasa ---
    if (lbuf.length) flush()
    pbuf.push({ t: ln, n })
  }
  flush()

  if (babs.length === 0) {
    warn(lines.length || 1, 'Belum ada bab. Mulai setiap bab dengan baris "# Judul Bab".')
  }

  let jumlahKuis = 0
  for (const b of babs) for (const k of b.blok) if (k.tipe === 'kuis') jumlahKuis++

  peringatan.sort((a, b) => a.baris - b.baris)
  return { meta, bab: babs, peringatan, jumlahKuis }
}

// ------------------------------------------------------------
// Bantuan
// ------------------------------------------------------------

/** Semua paragraf yang bisa disorot / diberi catatan di satu bab, berurutan. */
export function kumpulPara(bab: Bab): Para[] {
  const out: Para[] = []
  for (const b of bab.blok) {
    switch (b.tipe) {
      case 'p':
      case 'sub':
        out.push(b.para)
        break
      case 'daftar':
        out.push(...b.item)
        break
      case 'catatan':
      case 'tokoh':
      case 'refleksi':
      case 'misi':
      case 'karier':
        out.push(...b.paras)
        break
      default:
        break
    }
  }
  return out
}

/** Cari paragraf berdasarkan id (mis. "b1-4" atau "b1-4.2") di seluruh ebook. */
export function cariPara(parsed: ParsedEbook, id: string): { babIdx: number; para: Para } | null {
  const m = /^b(\d+)-/.exec(id)
  if (!m) return null
  const babIdx = Number(m[1])
  const bab = parsed.bab[babIdx]
  if (!bab) return null
  const para = kumpulPara(bab).find((p) => p.id === id)
  return para ? { babIdx, para } : null
}

export function statusLabel(s: StatusEbook): string {
  return s === 'terbit' ? 'Terbit' : 'Draf'
}
