import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { bacaSeleksi, paraDari, type SeleksiTeks } from '../../lib/seleksi'
import type { WarnaSorot } from '../../lib/types'
import { Ikon } from '../art/Ikon'
import { useGerak } from '../../lib/gerak'
import { useNalar } from '../nalar/NalarContext'
import { useDataBaca } from './DataBaca'

// Bilah kecil yang muncul saat teks dipilih (sorot 3 warna, catatan tempel, penanda)
// atau saat sorotan yang sudah ada diketuk (hapus sorotan).

type Aktif =
  | { jenis: 'seleksi'; s: SeleksiTeks }
  | { jenis: 'sorotan'; id: string; para: string; rect: DOMRect }

const WARNA: { w: WarnaSorot; label: string; css: string }[] = [
  { w: 1, label: 'kuning', css: 'var(--sorot-1)' },
  { w: 2, label: 'hijau', css: 'var(--sorot-2)' },
  { w: 3, label: 'biru', css: 'var(--sorot-3)' },
]

export function SorotToolbar({ kunciBab }: { kunciBab: string | number }) {
  const d = useDataBaca()
  const { katakan } = useNalar()
  const gerak = useGerak()
  const [aktif, setAktif] = useState<Aktif | null>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const bar = useRef<HTMLDivElement>(null)
  const pewaktu = useRef<ReturnType<typeof setTimeout>>()

  const tutup = useCallback(() => {
    setAktif(null)
    setPos(null)
  }, [])

  // tutup saat pindah bab
  useEffect(() => {
    tutup()
  }, [kunciBab, tutup])

  useEffect(() => {
    const periksa = () => {
      clearTimeout(pewaktu.current)
      pewaktu.current = setTimeout(() => {
        const s = bacaSeleksi()
        if (s) setAktif({ jenis: 'seleksi', s })
        else setAktif((a) => (a && a.jenis === 'seleksi' ? null : a))
      }, 180)
    }
    const klik = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null
      const sel = window.getSelection()
      if (sel && !sel.isCollapsed) return
      const h = el?.closest<HTMLElement>('[data-hid]')
      if (h) {
        const para = paraDari(h)?.dataset.para
        if (para && h.dataset.hid) {
          setAktif({ jenis: 'sorotan', id: h.dataset.hid, para, rect: h.getBoundingClientRect() })
          return
        }
      }
      if (!el?.closest('[data-toolbar-sorot]')) setAktif((a) => (a && a.jenis === 'sorotan' ? null : a))
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') tutup()
    }
    const gulir = () => setAktif((a) => (a ? null : a))
    document.addEventListener('selectionchange', periksa)
    document.addEventListener('click', klik)
    document.addEventListener('keydown', esc)
    window.addEventListener('scroll', gulir, { passive: true })
    return () => {
      clearTimeout(pewaktu.current)
      document.removeEventListener('selectionchange', periksa)
      document.removeEventListener('click', klik)
      document.removeEventListener('keydown', esc)
      window.removeEventListener('scroll', gulir)
    }
  }, [tutup])

  // posisi: di atas seleksi (desktop) / di bawahnya (layar sentuh, supaya tidak menabrak menu bawaan)
  useLayoutEffect(() => {
    if (!aktif) {
      setPos(null)
      return
    }
    const rect = aktif.jenis === 'seleksi' ? aktif.s.rect : aktif.rect
    const w = bar.current?.offsetWidth ?? 240
    const h = bar.current?.offsetHeight ?? 48
    const kiri = Math.min(Math.max(8, rect.left + rect.width / 2 - w / 2), window.innerWidth - w - 8)
    let atas = gerak.halus ? rect.top - h - 10 : rect.bottom + 14
    if (atas < 8) atas = rect.bottom + 14
    if (atas + h > window.innerHeight - 8) atas = Math.max(8, rect.top - h - 10)
    setPos({ left: kiri, top: atas })
  }, [aktif, gerak.halus])

  if (!aktif) return null

  const para = aktif.jenis === 'seleksi' ? aktif.s.para : aktif.para
  const ditandai = d.penanda.includes(para)

  const sorot = (w: WarnaSorot) => {
    if (aktif.jenis !== 'seleksi') return
    d.tambahSorot(aktif.s.para, aktif.s.mulai, aktif.s.akhir, w)
    window.getSelection()?.removeAllRanges()
    katakan('sorot')
    tutup()
  }

  return createPortal(
    <div
      ref={bar}
      data-toolbar-sorot
      role="toolbar"
      aria-label="Aksi untuk teks terpilih"
      className="bilah-sorot"
      style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? 'visible' : 'hidden' }}
      onPointerDown={(e) => e.preventDefault()}
      onMouseDown={(e) => e.preventDefault()}
    >
      {aktif.jenis === 'seleksi' ? (
        <>
          {WARNA.map((c) => (
            <button key={c.w} type="button" className="swatch" aria-label={`Sorot warna ${c.label}`} title={`Sorot ${c.label}`} style={{ background: c.css }} onClick={() => sorot(c.w)} />
          ))}
          <span className="pemisah" aria-hidden="true" />
          <button
            type="button"
            className="tombol-bilah"
            aria-label="Tambah catatan tempel di paragraf ini"
            title="Catatan tempel"
            onClick={() => {
              d.bukaCatatan(para, true)
              window.getSelection()?.removeAllRanges()
              tutup()
            }}
          >
            <Ikon n="catatan" ukuran={18} />
          </button>
          <button
            type="button"
            className="tombol-bilah"
            aria-label={ditandai ? 'Lepas penanda paragraf ini' : 'Tandai paragraf ini'}
            aria-pressed={ditandai}
            title="Penanda"
            onClick={() => {
              katakan(d.togglePenanda(para) ? 'penanda' : 'penandaLepas')
              tutup()
            }}
          >
            <Ikon n="penanda" ukuran={18} />
          </button>
        </>
      ) : (
        <button
          type="button"
          className="tombol-bilah tombol-bilah-teks"
          aria-label="Hapus sorotan ini"
          onClick={() => {
            d.hapusSorot(aktif.id)
            tutup()
          }}
        >
          <Ikon n="hapus" ukuran={16} />
          Hapus sorotan
        </button>
      )}
    </div>,
    document.body,
  )
}
