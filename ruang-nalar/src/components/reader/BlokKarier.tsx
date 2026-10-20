import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { dentingKecil } from '../../lib/audio'
import { TINGKAT, hitungPapan, progresModal } from '../../lib/papan'
import type { Blok, JalurKarier } from '../../lib/types'
import { Ikon } from '../art/Ikon'
import { useNalar } from '../nalar/NalarContext'
import { useDataBaca } from './DataBaca'
import { ParaView } from './ParaView'
import { TeksInline } from './TeksInline'

type BlokDari<T extends Blok['tipe']> = Extract<Blok, { tipe: T }>

// Blok "belajar sambil jalan": Misi (quest), kartu Jalur Karier, Peta Karier, dan Papan Pencapaian.
// Semua data tersimpan lewat DataBaca (IndexedDB per ebook; di pratinjau admin hanya di memori).

/** Kotak teks yang menyimpan otomatis (sama pola dengan kotak refleksi). */
function KotakTulis({
  nilai,
  simpan,
  label,
  placeholder,
  rows = 3,
}: {
  nilai: string
  simpan: (v: string) => void
  label: string
  placeholder: string
  rows?: number
}) {
  const id = useId()
  const [teks, setTeks] = useState(nilai)
  const [status, setStatus] = useState<'' | 'menyimpan' | 'tersimpan'>(nilai ? 'tersimpan' : '')
  const pewaktu = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => () => clearTimeout(pewaktu.current), [])
  return (
    <div className="mt-3">
      <label htmlFor={id} className="mb-1 block text-sm font-bold">
        {label}
      </label>
      <textarea
        id={id}
        className="input"
        rows={rows}
        placeholder={placeholder}
        value={teks}
        onChange={(e) => {
          const v = e.target.value
          setTeks(v)
          setStatus('menyimpan')
          clearTimeout(pewaktu.current)
          pewaktu.current = setTimeout(() => {
            simpan(v)
            setStatus(v.trim() ? 'tersimpan' : '')
          }, 500)
        }}
        onBlur={() => {
          clearTimeout(pewaktu.current)
          simpan(teks)
          setStatus(teks.trim() ? 'tersimpan' : '')
        }}
      />
      <p className="m-0 mt-1 text-xs text-[#4a4660]" role="status">
        {status === 'menyimpan' ? 'Menyimpan…' : status === 'tersimpan' ? 'Tersimpan di browser ini.' : 'Hanya tersimpan di browser ini.'}
      </p>
    </div>
  )
}

function Meter({ nilai, maks, label }: { nilai: number; maks: number; label: string }) {
  const pct = maks > 0 ? Math.round((nilai / maks) * 100) : 0
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={maks} aria-valuenow={nilai} className="h-3 w-full overflow-hidden rounded-full border-2 border-tinta bg-white">
      <div className="h-full" style={{ width: `${pct}%`, background: 'repeating-linear-gradient(135deg,#1f6b57 0 6px,#2f8f76 6px 12px)', transition: 'width .4s ease' }} />
    </div>
  )
}

// ---------- misi ----------
export function Misi({ blok }: { blok: BlokDari<'misi'> }) {
  const d = useDataBaca()
  const { katakan } = useNalar()
  const data = d.misi[blok.id]
  const selesai = !!data?.selesai
  const [arah, setArah] = useState(false)
  const idArah = useId()

  return (
    <section
      className="rounded-xl border-2 border-tinta p-4 shadow-[4px_5px_0_rgba(8,12,40,0.25)]"
      style={{ background: selesai ? '#dff0d2' : '#fff0b8' }}
      aria-label={`Misi: ${blok.judul}`}
      data-misi={blok.id}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-sm border-2 border-tinta bg-tinta px-2 py-0.5 font-display text-xs font-extrabold uppercase tracking-wider text-[#f7e04b]">
          <Ikon n="bintang" ukuran={14} tebal={2.5} />
          Misi
        </span>
        <span className="rounded-full border-2 border-tinta bg-white px-2 py-0.5 text-xs font-bold">+{blok.xp} poin</span>
        {selesai && (
          <span className="inline-flex items-center gap-1 text-sm font-bold text-[#1f4a12]">
            <Ikon n="cek" ukuran={16} tebal={3} />
            Selesai
          </span>
        )}
      </div>
      <h3 className="m-0 mt-2 font-display text-xl font-bold leading-tight">{blok.judul}</h3>
      <div className="mt-2 flex flex-col gap-2">
        {blok.paras.map((p) => (
          <ParaView key={p.id} para={p} kompak />
        ))}
      </div>

      <KotakTulis
        nilai={data?.catatan ?? ''}
        simpan={(v) => d.setMisi(blok.id, { catatan: v })}
        label="Jawaban atau catatan misimu"
        placeholder="Tulis hasil misimu di sini…"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          role="checkbox"
          aria-checked={selesai}
          className="tombol"
          style={selesai ? { background: '#1f6b57', color: '#fff' } : undefined}
          onClick={() => {
            const baru = !selesai
            d.setMisi(blok.id, { selesai: baru })
            if (baru) {
              katakan('misiSelesai')
              dentingKecil(5)
            }
          }}
        >
          <Ikon n="cek" ukuran={18} tebal={3} />
          {selesai ? 'Misi selesai' : 'Tandai misi selesai'}
        </button>
        {blok.arah && (
          <button type="button" className="tombol" aria-expanded={arah} aria-controls={idArah} onClick={() => setArah((a) => !a)}>
            <Ikon n="lampu" ukuran={18} />
            {arah ? 'Sembunyikan arah jawaban' : 'Intip arah jawaban'}
          </button>
        )}
      </div>
      {blok.arah && arah && (
        <div id={idArah} className="mt-3 rounded-lg border-2 border-dashed border-tinta bg-white/75 p-3 text-[0.95em]">
          <p className="m-0 font-bold">Arah jawaban yang baik</p>
          <p className="m-0 mt-1">
            <TeksInline para={blok.arah} polos />
          </p>
        </div>
      )}
    </section>
  )
}

// ---------- tombol minat jalur ----------
function TombolMinat({ kunci, nama }: { kunci: string; nama: string }) {
  const d = useDataBaca()
  const { katakan } = useNalar()
  const minat = !!d.karier[kunci]?.minat
  return (
    <button
      type="button"
      className="tombol"
      aria-pressed={minat}
      style={minat ? { background: '#f7e04b' } : undefined}
      onClick={() => {
        d.setKarier(kunci, { minat: !minat })
        if (!minat) katakan('karierMinat')
      }}
    >
      <Ikon n="bintang" ukuran={18} tebal={minat ? 3 : 2} />
      {minat ? `Jalur ${nama} ditandai` : `Tandai minat: ${nama}`}
    </button>
  )
}

// ---------- kartu jalur karier di dalam bab ----------
export function KartuKarier({ blok }: { blok: BlokDari<'karier'> }) {
  return (
    <section
      className="relative overflow-hidden rounded-xl border-2 border-tinta bg-[#e0f0ea] p-4 pl-6 shadow-[4px_5px_0_rgba(8,12,40,0.25)]"
      aria-label={`Jalur karier: ${blok.jalur}`}
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-3" style={{ background: 'repeating-linear-gradient(180deg,#16282b 0 10px,#f7e04b 10px 20px)' }} />
      <p className="m-0 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-[#16443a]">
        <Ikon n="naikPanah" ukuran={18} />
        Jalur karier
      </p>
      <h3 className="m-0 mt-1 font-display text-xl font-bold leading-tight">{blok.jalur}</h3>
      <div className="mt-2 flex flex-col gap-2">
        {blok.paras.map((p) => (
          <ParaView key={p.id} para={p} kompak />
        ))}
      </div>
      {blok.coba && (
        <p className="m-0 mt-3 rounded-lg border-2 border-dashed border-tinta bg-white/70 p-3 text-[0.95em]">
          <strong>Coba semester ini: </strong>
          <TeksInline para={blok.coba} polos />
        </p>
      )}
      <div className="mt-3">
        <TombolMinat kunci={blok.kunci} nama={blok.jalur} />
      </div>
    </section>
  )
}

// ---------- peta karier ----------
function BarisJalur({ j }: { j: JalurKarier }) {
  const d = useDataBaca()
  const modal = useMemo(() => (d.ebook ? progresModal(j, d.ebook.bab, d.selesai) : { total: 0, selesai: 0, bab: [] }), [d.ebook, d.selesai, j])
  const data = d.karier[j.kunci]
  const minat = !!data?.minat
  return (
    <li className="m-0 list-none">
      <article
        className="flex h-full flex-col rounded-xl border-2 border-tinta p-4 shadow-[3px_4px_0_rgba(8,12,40,0.25)]"
        style={{ background: minat ? '#fff6c2' : '#fffaf0' }}
        aria-label={`Jalur ${j.nama}`}
      >
        <h4 className="m-0 font-display text-lg font-bold leading-tight">{j.nama}</h4>
        <p className="m-0 mt-2 text-[0.95em]">
          <strong>Yang dikerjakan: </strong>
          {j.kerja}
        </p>
        <p className="m-0 mt-1 text-[0.95em]">
          <strong>Contoh tempat kerja: </strong>
          {j.tempat}
        </p>
        {modal.total > 0 && (
          <div className="mt-3">
            <p className="m-0 mb-1 text-sm font-bold">
              Modal dari buku ini: {modal.selesai} dari {modal.total} bab sudah kamu selesaikan
            </p>
            <Meter nilai={modal.selesai} maks={modal.total} label={`Progres bab modal untuk jalur ${j.nama}`} />
            <ul className="m-0 mt-2 flex list-none flex-wrap gap-1 p-0">
              {modal.bab.map((b) => (
                <li key={b.idx} className="m-0">
                  <span className="chip" style={{ background: b.selesai ? '#dff0d2' : '#fff', color: '#1a1a2e', borderColor: '#1a1a2e' }}>
                    {b.selesai && <Ikon n="cek" ukuran={12} tebal={3.5} />}
                    Bab {b.nomor}
                    {b.selesai && <span className="sr-only"> (selesai)</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-3">
          <TombolMinat kunci={j.kunci} nama={j.nama} />
        </div>
        {minat && (
          <KotakTulis
            nilai={data?.langkah ?? ''}
            simpan={(v) => d.setKarier(j.kunci, { langkah: v })}
            label="Satu langkah konkret semester ini"
            placeholder="Mis. ikut proyek riset dosen, masuk organisasi, atau cari magang…"
            rows={2}
          />
        )}
      </article>
    </li>
  )
}

export function PetaKarier({ blok }: { blok: BlokDari<'peta'> }) {
  const d = useDataBaca()
  const ditandai = blok.jalur.filter((j) => d.karier[j.kunci]?.minat).length
  return (
    <section className="rounded-xl border-2 border-tinta bg-[#e0f0ea] p-4 shadow-[4px_5px_0_rgba(8,12,40,0.25)]" aria-label={blok.judul}>
      <p className="m-0 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-[#16443a]">
        <Ikon n="naikPanah" ukuran={18} />
        Peta karier
      </p>
      <h3 className="m-0 mt-1 font-display text-2xl font-black leading-tight">{blok.judul}</h3>
      <p className="m-0 mt-2" role="status" aria-live="polite">
        <strong>{ditandai}</strong> dari {blok.jalur.length} jalur kamu tandai. Tandai yang menarik, lalu tulis satu langkah nyata untuk masing-masing.
      </p>
      <ul className="m-0 mt-4 grid list-none gap-4 p-0 md:grid-cols-2">
        {blok.jalur.map((j) => (
          <BarisJalur key={j.kunci} j={j} />
        ))}
      </ul>
    </section>
  )
}

// ---------- papan pencapaian ----------
function Statistik({ nilai, label }: { nilai: string; label: string }) {
  return (
    <div className="rounded-lg border-2 border-tinta bg-white/80 px-3 py-2 text-center">
      <dd className="m-0 font-display text-2xl font-black leading-none">{nilai}</dd>
      <dt className="mt-1 text-xs font-bold uppercase tracking-wide text-[#4a4660]">{label}</dt>
    </div>
  )
}

export function PapanPencapaian({ blok }: { blok: BlokDari<'papan'> }) {
  const d = useDataBaca()
  const p = useMemo(
    () => (d.ebook ? hitungPapan(d.ebook, { selesai: d.selesai, misi: d.misi, kuis: d.kuis, karier: d.karier }) : null),
    [d.ebook, d.selesai, d.misi, d.kuis, d.karier],
  )
  if (!p) {
    return (
      <section className="rounded-xl border-2 border-dashed border-tinta bg-white/70 p-4" aria-label={blok.judul}>
        <p className="m-0">Papan Pencapaian tampil di sini saat ebook dibaca.</p>
      </section>
    )
  }
  const tingkat = TINGKAT[p.tingkat]
  return (
    <section className="rounded-xl border-2 border-tinta bg-[#16282b] p-4 text-[#f4f1e6] shadow-[4px_5px_0_rgba(8,12,40,0.35)]" aria-label={blok.judul}>
      <p className="m-0 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-[#f7e04b]">
        <Ikon n="bintang" ukuran={18} tebal={2.5} />
        Papan pencapaian
      </p>
      <h3 className="m-0 mt-1 font-display text-2xl font-black leading-tight text-[#f4f1e6]">{blok.judul}</h3>
      <p className="m-0 mt-3 text-sm uppercase tracking-wider opacity-90">Tingkatmu sekarang</p>
      <p className="m-0 font-display text-3xl font-black leading-tight text-[#f7e04b]" role="status" aria-live="polite">
        {tingkat.nama}
      </p>
      <p className="m-0 mt-1">{tingkat.deskripsi}</p>
      <div className="mt-3 rounded-lg bg-[#f4f1e6] p-3 text-tinta">
        <p className="m-0 mb-1 text-sm font-bold">
          {p.poin} dari {p.poinMaks} poin
        </p>
        <Meter nilai={p.poin} maks={p.poinMaks} label="Total poin pencapaian" />
      </div>
      <dl className="m-0 mt-3 grid grid-cols-2 gap-2 text-tinta sm:grid-cols-4">
        <Statistik nilai={`${p.bab.selesai}/${p.bab.total}`} label="Bab selesai" />
        <Statistik nilai={`${p.misi.selesai}/${p.misi.total}`} label="Misi selesai" />
        <Statistik nilai={`${p.kuis.benar}/${p.kuis.total}`} label="Kuis benar" />
        <Statistik nilai={`${p.karier.ditandai}/${p.karier.total}`} label="Jalur ditandai" />
      </dl>
      <p className="m-0 mt-3 text-xs opacity-85">
        Poin: tiap misi selesai sesuai nilainya, +5 untuk kuis yang benar di percobaan pertama, +10 untuk tiap bab yang kamu tandai selesai. Semua tersimpan di browser ini.
      </p>
    </section>
  )
}
