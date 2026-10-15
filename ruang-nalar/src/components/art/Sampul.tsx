import { Link } from 'react-router-dom'
import { NAMA_PENULIS_DEFAULT } from '../../config'
import { useLencana } from '../../lib/library'
import { namaPenulis } from '../../lib/parser'
import { hashBiji } from '../../lib/rng'
import { TEMA } from '../../lib/tema'
import type { Ebook, EbookMeta } from '../../lib/types'
import { BungaMatahari } from './BungaMatahari'
import { Ikon } from './Ikon'
import { Iris } from './Iris'
import { MatahariApi } from './MatahariApi'
import { Pusaran } from './Pusaran'
import { RantingAlmond } from './RantingAlmond'

// Sampul buku yang digenerate otomatis dari tema, ikon, dan judul ebook (tanpa gambar eksternal).

function Motif({ tema, seed }: { tema: EbookMeta['tema']; seed: number }) {
  switch (tema) {
    case 'siang':
      return (
        <>
          <Pusaran seed={seed} palet="ladang" bintang={6} className="absolute inset-0 h-full w-full" />
          <BungaMatahari seed={seed} tangkai={false} className="absolute left-1/2 top-[6%] w-[56%] -translate-x-1/2" />
        </>
      )
    case 'iris':
      return (
        <>
          <Pusaran seed={seed} palet="iris" bintang={8} className="absolute inset-0 h-full w-full" />
          <Iris className="absolute bottom-0 left-1/2 h-[88%] -translate-x-1/2" />
        </>
      )
    case 'almond':
      return (
        <>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#3d94b9 0%,#6db8d6 60%,#a9d9ea 100%)' }} />
          <RantingAlmond seed={seed} className="absolute inset-x-0 top-[8%] w-full" />
        </>
      )
    case 'api':
      return (
        <>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#e8892b 0%,#f6a243 55%,#f6d24b 100%)' }} />
          <MatahariApi seed={seed} putar={false} className="absolute left-1/2 top-[2%] w-[94%] -translate-x-1/2" />
        </>
      )
    default:
      return <Pusaran seed={seed} palet="malam" bintang={10} className="absolute inset-0 h-full w-full" />
  }
}

interface GambarProps {
  meta: EbookMeta
  id: string
  className?: string
}

/** Hanya gambarnya (tanpa tautan) — dipakai juga di pratinjau admin. */
export function SampulGambar({ meta, id, className = '' }: GambarProps) {
  const t = TEMA[meta.tema]
  const seed = hashBiji(meta.judul + '|' + id)
  const penulis = namaPenulis(meta.penulis, NAMA_PENULIS_DEFAULT)
  const contoh = meta.tag.some((x) => x.toLowerCase() === 'contoh')
  return (
    <div
      className={`relative aspect-[3/4] w-full overflow-hidden [container-type:inline-size] ${className}`}
      style={{ background: t.dasar, color: t.teks, borderRadius: '3px 10px 10px 3px', border: '2px solid #1a1a2e' }}
    >
      <div className="absolute inset-x-0 top-0 h-[60%] overflow-hidden">
        <Motif tema={meta.tema} seed={seed} />
      </div>
      <svg className="absolute left-0 w-full" style={{ top: 'calc(60% - 14px)' }} viewBox="0 0 300 26" preserveAspectRatio="none" height="26" aria-hidden="true" focusable="false">
        <path d="M0 13 C 38 -2, 78 24, 120 10 S 204 0, 246 14 S 292 4, 300 9 V26 H0 Z" fill={t.dasar} />
      </svg>
      <div
        className="absolute left-[7cqw] z-10 grid h-[17cqw] w-[17cqw] place-items-center rounded-full border-2 border-tinta bg-kertas text-[9cqw] shadow-[2px_3px_0_rgba(8,12,40,0.35)]"
        style={{ top: 'calc(56% - 4cqw)' }}
        aria-hidden="true"
      >
        <span style={{ fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif', lineHeight: 1 }}>{meta.ikon}</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex h-[43%] flex-col justify-end gap-[1cqw] px-[7cqw] pb-[5.5cqw] pt-[8cqw]" style={{ background: t.dasar }}>
        <h3
          className="m-0 font-display text-[8.6cqw] font-bold leading-[1.12]"
          style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {meta.judul}
        </h3>
        {meta.subjudul && (
          <p className="m-0 text-[6cqw] font-semibold leading-tight opacity-95" style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {meta.subjudul}
          </p>
        )}
        <p className="m-0 truncate text-[5.6cqw] italic opacity-90">{penulis}</p>
      </div>
      {contoh && (
        <span className="absolute right-2 top-2 rounded-sm border-2 border-tinta bg-kertas px-1.5 py-0.5 font-display text-[0.62rem] font-extrabold uppercase tracking-wider text-tinta">
          Contoh
        </span>
      )}
      {meta.status === 'draf' && (
        <span className="absolute left-5 top-2 rounded-sm border-2 border-tinta bg-kertas px-1.5 py-0.5 font-display text-[0.62rem] font-extrabold uppercase tracking-wider text-tinta">
          Draf
        </span>
      )}
      {/* punggung buku */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-3" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,.32), rgba(255,255,255,.14) 60%, rgba(0,0,0,.06))' }} />
    </div>
  )
}

/** Sampul di rak: tautan ke pembaca + lencana "Selesai Dibaca" dan "Kuis Sempurna". */
export function SampulBuku({ ebook }: { ebook: Ebook }) {
  const len = useLencana(ebook)
  const { meta } = ebook.parsed
  const keterangan = [len.selesaiDibaca && 'Selesai dibaca', len.kuisSempurna && 'Kuis sempurna'].filter(Boolean).join(', ')
  return (
    <div className="relative">
      <Link
        to={`/baca/${ebook.id}`}
        className="sampul"
        aria-label={`Baca ${meta.judul}${meta.subjudul ? ', ' + meta.subjudul : ''}${keterangan ? '. ' + keterangan : ''}`}
      >
        <SampulGambar meta={meta} id={ebook.id} />
      </Link>
      {(len.selesaiDibaca || len.kuisSempurna) && (
        <div className="pointer-events-none absolute -right-2 top-9 z-10 flex flex-col items-end gap-1">
          {len.selesaiDibaca && (
            <span className="inline-flex items-center gap-1 rounded-full border-2 border-tinta bg-kuning-pusaran px-2 py-0.5 text-[0.7rem] font-bold text-tinta shadow-[2px_3px_0_rgba(8,12,40,0.4)]">
              <Ikon n="cek" ukuran={13} tebal={3} />
              Selesai Dibaca
            </span>
          )}
          {len.kuisSempurna && (
            <span className="inline-flex items-center gap-1 rounded-full border-2 border-kuning-pusaran bg-tinta px-2 py-0.5 text-[0.7rem] font-bold text-kuning-pusaran shadow-[2px_3px_0_rgba(8,12,40,0.4)]">
              <Ikon n="bintang" ukuran={13} tebal={2.5} />
              Kuis Sempurna
            </span>
          )}
        </div>
      )}
    </div>
  )
}
