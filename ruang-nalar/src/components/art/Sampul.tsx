import { useMemo, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { NAMA_PENULIS_DEFAULT } from '../../config'
import { useLencana } from '../../lib/library'
import { dimiliki, useToko } from '../../lib/toko/store'
import { rupiah } from '../../lib/toko/tipe'
import { namaPenulis } from '../../lib/parser'
import { hashBiji } from '../../lib/rng'
import { rancangSampul, type KomposisiSampul, type RancanganSampul } from '../../lib/sampul'
import { TEMA } from '../../lib/tema'
import type { Ebook, EbookMeta } from '../../lib/types'
import { BungaMatahari } from './BungaMatahari'
import { Ikon } from './Ikon'
import { Iris } from './Iris'
import { MatahariApi } from './MatahariApi'
import { Pusaran } from './Pusaran'
import { SampulKolase } from './SampulKolase'
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
  /** memaksa satu komposisi (untuk pratinjau dan uji visual); biasanya dipilih otomatis dari judul + id */
  paksa?: KomposisiSampul
}

/** Gambar motif dengan variasi per buku: dicerminkan, diperbesar, dan digeser sedikit. */
function Gerak({ r, children }: { r: RancanganSampul; children: ReactNode }) {
  return (
    <div className="absolute inset-0" style={{ transform: `translate(${r.geserX}%, ${r.geserY}%) scale(${r.skala}) scaleX(${r.cermin ? -1 : 1})` }}>
      {children}
    </div>
  )
}

function Medali({ ikon, className = '', style }: { ikon: string; className?: string; style?: CSSProperties }) {
  return (
    <div
      className={`absolute z-10 grid h-[17cqw] w-[17cqw] place-items-center rounded-full border-2 border-tinta bg-kertas text-[9cqw] shadow-[2px_3px_0_rgba(8,12,40,0.35)] ${className}`}
      style={style}
      aria-hidden="true"
    >
      <span style={{ fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif', lineHeight: 1 }}>{ikon}</span>
    </div>
  )
}

function Ombak({ warna, terbalik = false, style }: { warna: string; terbalik?: boolean; style: CSSProperties }) {
  return (
    <svg className="absolute left-0 w-full" style={{ ...style, transform: terbalik ? 'scaleY(-1)' : undefined }} viewBox="0 0 300 26" preserveAspectRatio="none" height="26" aria-hidden="true" focusable="false">
      <path d="M0 13 C 38 -2, 78 24, 120 10 S 204 0, 246 14 S 292 4, 300 9 V26 H0 Z" fill={warna} />
    </svg>
  )
}

interface TeksProps {
  meta: EbookMeta
  penulis: string
  baris: number
  ukuran?: string
  rata?: 'left' | 'center'
  warnaTeks?: string
}

/** Judul, subjudul, dan penulis. Judul tetap h3 supaya urutan heading di daftar buku tidak berubah. */
function TeksSampul({ meta, penulis, baris, ukuran = '8.6cqw', rata = 'left', warnaTeks }: TeksProps) {
  return (
    <>
      <h3
        className="m-0 font-display font-bold leading-[1.12]"
        style={{ fontSize: ukuran, textAlign: rata, color: warnaTeks, display: '-webkit-box', WebkitLineClamp: baris, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
      >
        {meta.judul}
      </h3>
      {meta.subjudul && (
        <p
          className="m-0 text-[6cqw] font-semibold leading-tight opacity-95"
          style={{ textAlign: rata, color: warnaTeks, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {meta.subjudul}
        </p>
      )}
      <p className="m-0 truncate text-[5.6cqw] italic opacity-90" style={{ textAlign: rata, color: warnaTeks }}>
        {penulis}
      </p>
    </>
  )
}

/** Hanya gambarnya (tanpa tautan) — dipakai juga di pratinjau admin. */
export function SampulGambar({ meta, id, className = '', paksa }: GambarProps) {
  const t = TEMA[meta.tema]
  const seed = hashBiji(meta.judul + '|' + id)
  const penulis = namaPenulis(meta.penulis, NAMA_PENULIS_DEFAULT)
  const contoh = meta.tag.some((x) => x.toLowerCase() === 'contoh')
  const r = useMemo(() => {
    const dasar = rancangSampul(meta.judul, id, meta.tag)
    return paksa ? { ...dasar, komposisi: paksa } : dasar
  }, [meta.judul, id, meta.tag, paksa])
  const motif = (
    <Gerak r={r}>
      <Motif tema={meta.tema} seed={seed} />
    </Gerak>
  )

  let isi: ReactNode
  switch (r.komposisi) {
    case 'kolase':
      isi = <SampulKolase meta={meta} penulis={penulis} />
      break
    case 'bingkai':
      isi = (
        <>
          <div className="absolute inset-0 overflow-hidden">{motif}</div>
          <div className="pointer-events-none absolute inset-[3.5cqw] rounded-[2cqw] border-2" style={{ borderColor: t.teks }} aria-hidden="true" />
          <Medali ikon={meta.ikon} className="left-1/2 top-[8cqw] -translate-x-1/2" />
          <div className="absolute inset-x-[9cqw] bottom-[9cqw] flex flex-col gap-[1cqw] rounded-md border-2 border-tinta bg-kertas px-[5cqw] py-[4cqw] text-tinta shadow-[3px_4px_0_rgba(8,12,40,0.4)]">
            <TeksSampul meta={meta} penulis={penulis} baris={3} ukuran="7.8cqw" rata="center" warnaTeks="#1a1a2e" />
          </div>
        </>
      )
      break
    case 'atas':
      isi = (
        <>
          <div className="absolute inset-x-0 bottom-0 h-[58%] overflow-hidden">{motif}</div>
          <div className="absolute inset-x-0 top-0 flex h-[42%] flex-col justify-center gap-[1cqw] px-[8cqw] pb-[10cqw] pt-[10cqw]" style={{ background: t.dasar }}>
            <TeksSampul meta={meta} penulis={penulis} baris={2} ukuran="7.6cqw" />
          </div>
          <Ombak warna={t.dasar} terbalik style={{ top: 'calc(42% - 12px)' }} />
          <Medali ikon={meta.ikon} className="bottom-[6cqw] right-[7cqw]" />
        </>
      )
      break
    case 'medalion':
      isi = (
        <>
          <div
            className="absolute left-1/2 top-[7%] aspect-square w-[72%] -translate-x-1/2 overflow-hidden rounded-full border-2 border-tinta"
            style={{ boxShadow: `0 0 0 1.4cqw ${t.dasar}, 0 0 0 1.9cqw ${t.aksen}` }}
          >
            {motif}
          </div>
          <Medali ikon={meta.ikon} className="right-[9cqw]" style={{ top: 'calc(7% + 58cqw)' }} />
          <div className="absolute inset-x-0 bottom-0 flex h-[30%] flex-col items-center justify-end gap-[1cqw] px-[8cqw] pb-[5.5cqw]" style={{ background: t.dasar }}>
            <TeksSampul meta={meta} penulis={penulis} baris={2} ukuran="8cqw" rata="center" />
          </div>
        </>
      )
      break
    case 'diagonal':
      isi = (
        <>
          <div className="absolute inset-0 overflow-hidden" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 30%, 0 58%)' }}>
            {motif}
          </div>
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 133.3" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <line x1="0" y1="77.3" x2="100" y2="40" stroke={t.aksen} strokeWidth="3" vectorEffect="non-scaling-stroke" />
          </svg>
          <Medali ikon={meta.ikon} className="right-[7cqw]" style={{ top: 'calc(30% - 8cqw)' }} />
          <div className="absolute inset-x-0 bottom-0 flex h-[40%] flex-col justify-end gap-[1cqw] pb-[6cqw] pl-[10cqw] pr-[7cqw]">
            <TeksSampul meta={meta} penulis={penulis} baris={3} />
          </div>
        </>
      )
      break
    default:
      isi = (
        <>
          <div className="absolute inset-x-0 top-0 h-[60%] overflow-hidden">{motif}</div>
          <Ombak warna={t.dasar} style={{ top: 'calc(60% - 14px)' }} />
          <Medali ikon={meta.ikon} className="left-[7cqw]" style={{ top: 'calc(56% - 4cqw)' }} />
          <div className="absolute inset-x-0 bottom-0 flex h-[43%] flex-col justify-end gap-[1cqw] px-[7cqw] pb-[5.5cqw] pt-[8cqw]" style={{ background: t.dasar }}>
            <TeksSampul meta={meta} penulis={penulis} baris={3} />
          </div>
        </>
      )
  }

  return (
    <div
      className={`relative aspect-[3/4] w-full overflow-hidden [container-type:inline-size] ${className}`}
      style={{ background: t.dasar, color: t.teks, borderRadius: '3px 10px 10px 3px', border: '2px solid #1a1a2e' }}
      data-komposisi={r.komposisi}
    >
      {isi}
      {contoh && (
        <span className="absolute right-2 top-2 z-20 rounded-sm border-2 border-tinta bg-kertas px-1.5 py-0.5 font-display text-[0.62rem] font-extrabold uppercase tracking-wider text-tinta">
          Contoh
        </span>
      )}
      {meta.status === 'draf' && (
        <span className="absolute left-5 top-2 z-20 rounded-sm border-2 border-tinta bg-kertas px-1.5 py-0.5 font-display text-[0.62rem] font-extrabold uppercase tracking-wider text-tinta">
          Draf
        </span>
      )}
      {/* punggung buku */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-3" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,.32), rgba(255,255,255,.14) 60%, rgba(0,0,0,.06))' }} />
    </div>
  )
}

/** Sampul di rak: tautan ke pembaca + lencana "Selesai Dibaca" dan "Kuis Sempurna". */
export function SampulBuku({ ebook }: { ebook: Ebook }) {
  const len = useLencana(ebook)
  const tk = useToko()
  const { meta } = ebook.parsed
  const toko = ebook.sumber === 'toko'
  const milik = toko && dimiliki(tk, ebook.id)
  const keteranganToko = toko ? (milik ? 'Sudah kamu miliki' : `Berbayar, ${rupiah(ebook.harga ?? 0)}`) : ''
  const keterangan = [len.selesaiDibaca && 'Selesai dibaca', len.kuisSempurna && 'Kuis sempurna', keteranganToko].filter(Boolean).join(', ')
  return (
    <div className="relative">
      <Link
        to={`/baca/${ebook.id}`}
        className="sampul"
        aria-label={`${toko && !milik ? 'Lihat' : 'Baca'} ${meta.judul}${meta.subjudul ? ', ' + meta.subjudul : ''}${keterangan ? '. ' + keterangan : ''}`}
      >
        <SampulGambar meta={meta} id={ebook.id} />
      </Link>
      {toko && (
        <span
          className="pointer-events-none absolute left-4 top-2 z-10 inline-flex items-center gap-1 rounded-sm border-2 border-tinta px-1.5 py-0.5 font-display text-[0.68rem] font-extrabold tracking-wide text-tinta shadow-[2px_3px_0_rgba(8,12,40,0.4)]"
          style={{ background: milik ? '#dff0d2' : '#f4e9cf' }}
          aria-hidden="true"
        >
          <Ikon n={milik ? 'cek' : 'kunci'} ukuran={12} tebal={3} />
          {milik ? 'Dimiliki' : rupiah(ebook.harga ?? 0)}
        </span>
      )}
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
