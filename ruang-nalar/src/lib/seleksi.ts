// Menerjemahkan seleksi teks di layar menjadi posisi karakter di dalam satu paragraf.
// Setiap potongan teks di paragraf punya atribut data-off (posisi awalnya di teks polos paragraf).

function elemenDari(n: Node | null): HTMLElement | null {
  if (!n) return null
  return n.nodeType === 1 ? (n as HTMLElement) : n.parentElement
}

export function paraDari(n: Node | null): HTMLElement | null {
  return elemenDari(n)?.closest<HTMLElement>('[data-para]') ?? null
}

export function panjangPara(paraEl: HTMLElement): number {
  let maks = 0
  paraEl.querySelectorAll<HTMLElement>('[data-off]').forEach((sp) => {
    maks = Math.max(maks, Number(sp.dataset.off) + (sp.textContent ?? '').length)
  })
  return maks
}

/** Posisi [mulai, akhir) seleksi di dalam paragraf, atau null bila tidak ada teks terpilih di paragraf itu. */
export function hitungOffset(paraEl: HTMLElement, range: Range): [number, number] | null {
  let mulai = -1
  let akhir = -1
  paraEl.querySelectorAll<HTMLElement>('[data-off]').forEach((sp) => {
    const tn = sp.firstChild
    if (!tn || tn.nodeType !== 3) return
    if (!range.intersectsNode(tn)) return
    const len = (tn.textContent ?? '').length
    const dasar = Number(sp.dataset.off)
    const s = range.startContainer === tn ? range.startOffset : 0
    const e = range.endContainer === tn ? range.endOffset : len
    if (e <= s) return
    if (mulai < 0) mulai = dasar + s
    akhir = dasar + e
  })
  return mulai >= 0 && akhir > mulai ? [mulai, akhir] : null
}

export interface SeleksiTeks {
  para: string
  mulai: number
  akhir: number
  rect: DOMRect
}

/** Baca seleksi saat ini. Seleksi lintas paragraf dipotong sampai akhir paragraf pertama. */
export function bacaSeleksi(): SeleksiTeks | null {
  const sel = typeof window !== 'undefined' ? window.getSelection() : null
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null
  const range = sel.getRangeAt(0)
  const awal = paraDari(range.startContainer)
  const akhirEl = paraDari(range.endContainer)
  const el = awal ?? akhirEl
  if (!el) return null
  const o = hitungOffset(el, range)
  if (!o) return null
  const id = el.dataset.para
  if (!id) return null
  const rect = range.getBoundingClientRect()
  if (!rect.width && !rect.height) return null
  return { para: id, mulai: o[0], akhir: o[1], rect }
}
