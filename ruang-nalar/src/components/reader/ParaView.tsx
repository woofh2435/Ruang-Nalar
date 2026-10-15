import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNalar } from '../nalar/NalarContext'
import { Ikon } from '../art/Ikon'
import { useDataBaca } from './DataBaca'
import { TeksInline } from './TeksInline'
import type { Para } from '../../lib/types'

function CatatanTempel({ id }: { id: string }) {
  const d = useDataBaca()
  const { katakan } = useNalar()
  const tersimpan = d.catatan[id] ?? ''
  const [teks, setTeks] = useState(tersimpan)
  const pewaktu = useRef<ReturnType<typeof setTimeout>>()
  const terakhir = useRef(tersimpan)
  const area = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (d.catatanTerbuka.includes(id)) area.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const simpan = (t: string) => {
    if (t === terakhir.current) return
    terakhir.current = t
    d.setCatatan(id, t)
    if (t.trim()) katakan('catatan')
  }

  useEffect(
    () => () => {
      clearTimeout(pewaktu.current)
    },
    [],
  )

  return (
    <div className="sticky mt-2 max-w-[34rem]" role="group" aria-label="Catatan tempel untuk paragraf ini">
      <textarea
        ref={area}
        value={teks}
        rows={2}
        placeholder="Tulis catatanmu di sini…"
        aria-label="Isi catatan tempel"
        onChange={(e) => {
          setTeks(e.target.value)
          clearTimeout(pewaktu.current)
          const v = e.target.value
          pewaktu.current = setTimeout(() => {
            terakhir.current = v
            d.setCatatan(id, v)
          }, 500)
        }}
        onBlur={() => {
          clearTimeout(pewaktu.current)
          simpan(teks)
          if (!teks.trim()) d.bukaCatatan(id, false)
        }}
      />
      <button
        type="button"
        className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full text-tinta hover:bg-black/10"
        aria-label="Hapus catatan tempel"
        onClick={() => {
          clearTimeout(pewaktu.current)
          setTeks('')
          terakhir.current = ''
          d.setCatatan(id, '')
          d.bukaCatatan(id, false)
        }}
      >
        <Ikon n="tutup" ukuran={16} />
      </button>
    </div>
  )
}

interface Props {
  para: Para
  /** pembungkus: div (bawaan) atau li untuk daftar */
  pembungkus?: 'div' | 'li'
  className?: string
  /** tanpa tombol catatan/penanda di tepi (dipakai di dalam kotak); sorotan lewat seleksi tetap bisa */
  kompak?: boolean
  anak?: ReactNode
}

export function ParaView({ para, pembungkus = 'div', className = '', kompak = false }: Props) {
  const d = useDataBaca()
  const { katakan } = useNalar()
  const sorot = useMemo(() => d.sorotan.filter((s) => s.para === para.id), [d.sorotan, para.id])
  const adaCatatan = d.catatan[para.id] !== undefined || d.catatanTerbuka.includes(para.id)
  const ditandai = d.penanda.includes(para.id)
  const Pembungkus = pembungkus

  return (
    <Pembungkus className={`para group relative ${ditandai ? 'para-ditandai' : ''}`} id={`p-${para.id}`} data-para={para.id}>
      <p className={className}>
        <TeksInline para={para} sorotan={sorot} />
      </p>
      {ditandai && (
        <span className="para-pita" aria-hidden="true">
          <Ikon n="penanda" ukuran={16} />
        </span>
      )}
      {!kompak && (
        <div className="aksi-para" role="group" aria-label="Aksi paragraf">
          <button
            type="button"
            className="tombol-mini"
            aria-label={adaCatatan ? 'Sembunyikan catatan tempel' : 'Tambah catatan tempel'}
            aria-pressed={adaCatatan}
            onClick={() => {
              if (d.catatan[para.id] !== undefined) return
              d.bukaCatatan(para.id, !d.catatanTerbuka.includes(para.id))
            }}
          >
            <Ikon n="catatan" ukuran={16} />
          </button>
          <button
            type="button"
            className="tombol-mini"
            aria-label={ditandai ? 'Lepas penanda paragraf' : 'Tandai paragraf ini'}
            aria-pressed={ditandai}
            onClick={() => katakan(d.togglePenanda(para.id) ? 'penanda' : 'penandaLepas')}
          >
            <Ikon n="penanda" ukuran={16} />
          </button>
        </div>
      )}
      {adaCatatan && <CatatanTempel id={para.id} />}
    </Pembungkus>
  )
}
