import { describe, expect, it } from 'vitest'
import { hitungLencana } from '../src/lib/library'
import { parseEbook } from '../src/lib/parser'

const MD = `---
judul: Uji Lencana
tema: malam
status: terbit
---
# Bab Satu

Isi.

:::kuis
Q: Satu tambah satu?
- 1
- [x] 2
Penjelasan: Dua.
:::

# Bab Dua

:::kuis
Q: Dua tambah dua?
- [x] 4
- 5
Penjelasan: Empat.
:::
`
const p = parseEbook(MD)

describe('lencana rak', () => {
  it('ebook contoh punya 2 bab dan 2 kuis', () => {
    expect(p.bab.length).toBe(2)
    expect(p.jumlahKuis).toBe(2)
  })
  const ids = p.bab.flatMap((b) => b.blok.filter((k) => k.tipe === 'kuis').map((k) => k.id))
  it('belum ada apa-apa → tanpa lencana', () => {
    expect(hitungLencana(p, [], {})).toEqual({ selesaiDibaca: false, kuisSempurna: false })
  })
  it('"Selesai Dibaca" hanya bila SEMUA bab selesai', () => {
    expect(hitungLencana(p, [0], {}).selesaiDibaca).toBe(false)
    expect(hitungLencana(p, [0, 1], {}).selesaiDibaca).toBe(true)
  })
  it('"Kuis Sempurna" bila semua kuis benar di percobaan pertama', () => {
    const semua = Object.fromEntries(ids.map((id) => [id, { pertamaBenar: true }]))
    expect(hitungLencana(p, [], semua).kuisSempurna).toBe(true)
  })
  it('satu kuis salah di percobaan pertama → tidak sempurna', () => {
    const sebagian = { [ids[0]]: { pertamaBenar: true }, [ids[1]]: { pertamaBenar: false } }
    expect(hitungLencana(p, [], sebagian).kuisSempurna).toBe(false)
  })
  it('kuis yang belum dijawab → tidak sempurna', () => {
    expect(hitungLencana(p, [], { [ids[0]]: { pertamaBenar: true } }).kuisSempurna).toBe(false)
  })
  it('ebook tanpa kuis tidak pernah dapat "Kuis Sempurna"', () => {
    const tanpa = parseEbook('---\njudul: X\n---\n# A\n\nIsi.\n')
    expect(hitungLencana(tanpa, [0], {}).kuisSempurna).toBe(false)
  })
})
