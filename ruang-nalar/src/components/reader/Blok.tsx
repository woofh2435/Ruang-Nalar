import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { dentingKecil } from '../../lib/audio'
import { hashBiji } from '../../lib/rng'
import type { Bab, Blok, CatatanTipe } from '../../lib/types'
import { Ikon, type NamaIkon } from '../art/Ikon'
import { useNalar } from '../nalar/NalarContext'
import { KartuKarier, Misi, PapanPencapaian, PetaKarier } from './BlokKarier'
import { useDataBaca } from './DataBaca'
import { ParaView } from './ParaView'
import { TeksInline } from './TeksInline'

type BlokDari<T extends Blok['tipe']> = Extract<Blok, { tipe: T }>

// ---------- kotak catatan ----------
const IKON_CATATAN: Record<CatatanTipe, { ikon: NamaIkon; label: string }> = {
  penting: { ikon: 'seru', label: 'Penting' },
  tips: { ikon: 'lampu', label: 'Tips' },
  awas: { ikon: 'awas', label: 'Awas' },
}

function KotakCatatan({ blok }: { blok: BlokDari<'catatan'> }) {
  const m = IKON_CATATAN[blok.jenis]
  return (
    <aside className={`kotak-catatan catatan-${blok.jenis}`} aria-label={`Catatan ${m.label}`}>
      <p className="mb-1 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide">
        <Ikon n={m.ikon} ukuran={18} />
        {m.label}
      </p>
      <div className="flex flex-col gap-2">
        {blok.paras.map((p) => (
          <ParaView key={p.id} para={p} kompak />
        ))}
      </div>
    </aside>
  )
}

// ---------- kartu tokoh ----------
const WARNA_AVATAR = ['#2f4ba2', '#5b4b9a', '#1c2b6b', '#8a3d00', '#34561f']

function KartuTokoh({ blok }: { blok: BlokDari<'tokoh'> }) {
  const inisial = blok.nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  const warna = WARNA_AVATAR[hashBiji(blok.nama) % WARNA_AVATAR.length]
  return (
    <section
      className="flex gap-4 rounded-xl border-2 border-tinta bg-[#fffaf0] p-4 shadow-[4px_5px_0_rgba(8,12,40,0.25)]"
      aria-label={`Tokoh: ${blok.nama}`}
    >
      <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0" aria-hidden="true" focusable="false">
        <circle cx="32" cy="32" r="30" fill={warna} stroke="#1a1a2e" strokeWidth="3" />
        <path d="M32 32m-4 0c0-6 10-6 10 2s-14 14-20 4-2-22 14-24 28 8 24 24" fill="none" stroke="#f6d24b" strokeWidth="2.4" strokeLinecap="round" opacity="0.55" />
        <text x="32" y="40" textAnchor="middle" fontFamily="Fraunces, Georgia, serif" fontWeight="800" fontSize="22" fill="#f4e9cf">
          {inisial}
        </text>
      </svg>
      <div className="min-w-0 flex-1">
        <h3 className="m-0 font-display text-xl font-bold leading-tight">{blok.nama}</h3>
        {blok.tahun && (
          <span className="chip mt-1 text-[#4a3a94]" style={{ color: '#3b2f78' }}>
            {blok.tahun}
          </span>
        )}
        <div className="mt-2 flex flex-col gap-2">
          {blok.paras.map((p) => (
            <ParaView key={p.id} para={p} kompak />
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------- kartu balik ----------
function KartuBalik({ blok }: { blok: BlokDari<'kartu'> }) {
  const [balik, setBalik] = useState(false)
  const { katakan } = useNalar()
  return (
    <button
      type="button"
      className="kartu3d"
      aria-pressed={balik}
      aria-label={balik ? `Kartu: ${blok.depan.teks}. Jawaban: ${blok.belakang.teks}. Klik untuk membalik.` : `Kartu: ${blok.depan.teks}. Klik untuk melihat jawaban.`}
      onClick={() => {
        setBalik((b) => !b)
        if (!balik) katakan('kartu')
      }}
    >
      <span className="kartu3d-dalam">
        <span className="muka muka-depan" aria-hidden={balik}>
          <span className="mb-1 text-xs font-bold uppercase tracking-wider opacity-90">Depan · klik untuk membalik</span>
          <span className="font-display text-xl font-bold leading-snug">
            <TeksInline para={blok.depan} polos />
          </span>
        </span>
        <span className="muka muka-belakang" aria-hidden={!balik}>
          <span className="mb-1 text-xs font-bold uppercase tracking-wider">Belakang</span>
          <span className="text-base leading-relaxed">
            <TeksInline para={blok.belakang} polos />
          </span>
        </span>
      </span>
    </button>
  )
}

// ---------- kuis ----------
function Kuis({ blok }: { blok: BlokDari<'kuis'> }) {
  const d = useDataBaca()
  const { katakan } = useNalar()
  const idTanya = useId()
  const idJudul = useId()
  const jawaban = d.kuis[blok.id]
  const sudah = !!jawaban && jawaban.pilih >= 0
  const idxBenar = blok.opsi.findIndex((o) => o.benar)

  const pilih = (i: number) => {
    if (sudah) return
    const benar = blok.opsi[i].benar
    d.jawab(blok.id, i, benar)
    if (benar) {
      katakan('kuisBenar')
      dentingKecil(i + 2)
    } else katakan('kuisSalah')
  }

  return (
    <section className="rounded-xl border-2 border-tinta bg-[#fff3d6] p-4 shadow-[4px_5px_0_rgba(8,12,40,0.25)]" aria-labelledby={`${idJudul} ${idTanya}`}>
      <p id={idJudul} className="mb-1 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-[#1c2b6b]">
        <Ikon n="tanda" ukuran={18} />
        Kuis
      </p>
      <p id={idTanya} className="m-0 mb-3 font-semibold">
        <TeksInline para={blok.tanya} polos />
      </p>
      <div role="radiogroup" aria-labelledby={idTanya} className="flex flex-col gap-2">
        {blok.opsi.map((o, i) => {
          const terpilih = sudah && jawaban.pilih === i
          const kelas = sudah ? (o.benar ? 'opsi-benar' : terpilih ? 'opsi-salah' : '') : ''
          return (
            <button
              key={o.para.id}
              type="button"
              role="radio"
              aria-checked={terpilih}
              aria-disabled={sudah}
              className={`opsi-kuis ${kelas}`}
              onClick={() => pilih(i)}
              disabled={sudah}
            >
              <span aria-hidden="true" className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-tinta bg-white text-xs font-bold">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">
                <TeksInline para={o.para} polos />
              </span>
              {sudah && o.benar && (
                <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-[#1f4a12]">
                  <Ikon n="cek" ukuran={18} />
                  Benar
                </span>
              )}
              {sudah && terpilih && !o.benar && (
                <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-[#7a1608]">
                  <Ikon n="tutup" ukuran={18} />
                  Salah
                </span>
              )}
            </button>
          )
        })}
      </div>
      <div role="status" aria-live="polite">
        {sudah && (
          <div className="mt-3 rounded-lg border-2 border-dashed border-tinta bg-white/70 p-3 text-[0.95em]">
            <p className="m-0 font-bold">
              {jawaban.benar ? 'Jawabanmu benar!' : `Belum tepat. Jawaban yang benar: ${String.fromCharCode(65 + idxBenar)}.`}
            </p>
            {blok.penjelasan && (
              <p className="m-0 mt-1">
                <TeksInline para={blok.penjelasan} polos />
              </p>
            )}
            {!jawaban.benar && (
              <button type="button" className="tombol tombol-kecil mt-2" onClick={() => d.ulangiKuis(blok.id)}>
                Coba lagi
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

// ---------- kotak refleksi ----------
function Refleksi({ blok }: { blok: BlokDari<'refleksi'> }) {
  const d = useDataBaca()
  const { katakan } = useNalar()
  const id = useId()
  const tersimpan = d.refleksi[blok.id] ?? ''
  const [teks, setTeks] = useState(tersimpan)
  const [status, setStatus] = useState<'' | 'menyimpan' | 'tersimpan'>(tersimpan ? 'tersimpan' : '')
  const pewaktu = useRef<ReturnType<typeof setTimeout>>()
  const sudahBicara = useRef(false)

  useEffect(
    () => () => {
      clearTimeout(pewaktu.current)
    },
    [],
  )

  return (
    <section className="rounded-xl border-2 border-tinta bg-[#e9e2fb] p-4 shadow-[4px_5px_0_rgba(8,12,40,0.25)]" aria-label="Kotak refleksi">
      <p className="mb-1 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-[#3b2f78]">
        <Ikon n="lampu" ukuran={18} />
        Refleksi
      </p>
      <div className="flex flex-col gap-2">
        {blok.paras.map((p) => (
          <ParaView key={p.id} para={p} kompak />
        ))}
      </div>
      <label htmlFor={id} className="sr-only">
        Jawaban refleksimu (disimpan di browser ini)
      </label>
      <textarea
        id={id}
        className="input mt-3"
        rows={4}
        placeholder="Tulis renunganmu di sini…"
        value={teks}
        onChange={(e) => {
          const v = e.target.value
          setTeks(v)
          setStatus('menyimpan')
          clearTimeout(pewaktu.current)
          pewaktu.current = setTimeout(() => {
            d.setRefleksi(blok.id, v)
            setStatus(v.trim() ? 'tersimpan' : '')
          }, 500)
        }}
        onBlur={() => {
          clearTimeout(pewaktu.current)
          d.setRefleksi(blok.id, teks)
          setStatus(teks.trim() ? 'tersimpan' : '')
          if (teks.trim() && !sudahBicara.current) {
            sudahBicara.current = true
            katakan('refleksi')
          }
        }}
      />
      <p className="m-0 mt-1 text-xs text-[#4a4660]" role="status">
        {status === 'menyimpan' ? 'Menyimpan…' : status === 'tersimpan' ? 'Tersimpan di browser ini.' : 'Jawabanmu hanya tersimpan di browser ini.'}
      </p>
    </section>
  )
}

// ---------- satu blok ----------
export function BlokView({ blok }: { blok: Blok }): ReactNode {
  switch (blok.tipe) {
    case 'p':
      return <ParaView para={blok.para} />
    case 'sub': {
      const H = blok.level === 2 ? 'h2' : 'h3'
      return (
        <H id={`h-${blok.id}`} className="font-display">
          <TeksInline para={blok.para} polos />
        </H>
      )
    }
    case 'daftar':
      return (
        <ul>
          {blok.item.map((p) => (
            <ParaView key={p.id} para={p} pembungkus="li" kompak />
          ))}
        </ul>
      )
    case 'catatan':
      return <KotakCatatan blok={blok} />
    case 'tokoh':
      return <KartuTokoh blok={blok} />
    case 'kartu':
      return <KartuBalik blok={blok} />
    case 'kuis':
      return <Kuis blok={blok} />
    case 'refleksi':
      return <Refleksi blok={blok} />
    case 'misi':
      return <Misi blok={blok} />
    case 'karier':
      return <KartuKarier blok={blok} />
    case 'peta':
      return <PetaKarier blok={blok} />
    case 'papan':
      return <PapanPencapaian blok={blok} />
    default:
      return null
  }
}

/** Seluruh isi satu bab. Kartu balik berurutan dikelompokkan dalam satu grid. */
/** `inisial`: huruf pertama paragraf pembuka dibuat besar (hanya bila blok pertama bab memang paragraf biasa). */
export function IsiBab({ bab, inisial = false }: { bab: Bab; inisial?: boolean }) {
  const out: ReactNode[] = []
  let i = 0
  while (i < bab.blok.length) {
    const b = bab.blok[i]
    if (b.tipe === 'kartu') {
      const grup: BlokDari<'kartu'>[] = []
      while (i < bab.blok.length && bab.blok[i].tipe === 'kartu') {
        grup.push(bab.blok[i] as BlokDari<'kartu'>)
        i++
      }
      out.push(
        <div key={grup[0].id} className="grid gap-4 sm:grid-cols-2">
          {grup.map((k) => (
            <KartuBalik key={k.id} blok={k} />
          ))}
        </div>,
      )
      continue
    }
    out.push(<BlokView key={b.id} blok={b} />)
    i++
  }
  const hurufBesar = inisial && bab.blok[0]?.tipe === 'p'
  return <div className={`flex flex-col gap-5 ${hurufBesar ? 'baca-inisial' : ''}`}>{out}</div>
}
