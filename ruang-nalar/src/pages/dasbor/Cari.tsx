import { useMemo, useState } from 'react'
import { Ikon } from '../../components/art/Ikon'
import { Panel } from '../../components/art/Panel'
import { GridEbook } from '../../components/dasbor/GridEbook'
import { KepalaHalaman, KosongPanel } from '../../components/dasbor/KepalaHalaman'
import { FILTER_KOSONG, cariEbook, filterAktif, semuaTag, temaTerpakai, type Akses, type FilterCari } from '../../lib/cari'
import { useEbookTerbit } from '../../lib/library'
import { TEMA } from '../../lib/tema'
import type { TemaId } from '../../lib/types'

const AKSES: { id: Akses; label: string }[] = [
  { id: 'semua', label: 'Semua' },
  { id: 'gratis', label: 'Gratis' },
  { id: 'berbayar', label: 'Berbayar' },
]

function Pil({ aktif, onKlik, children }: { aktif: boolean; onKlik: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="chip"
      aria-pressed={aktif}
      onClick={onKlik}
      style={{ cursor: 'pointer', minHeight: 36, background: aktif ? 'var(--kuning-pusaran)' : undefined, borderColor: 'var(--tinta)', color: 'var(--tinta)' }}
    >
      {children}
    </button>
  )
}

export function Cari() {
  const semua = useEbookTerbit()
  const [f, setF] = useState<FilterCari>(FILTER_KOSONG)
  const hasil = useMemo(() => cariEbook(semua, f), [semua, f])
  const tema = useMemo(() => temaTerpakai(semua), [semua])
  const tag = useMemo(() => semuaTag(semua).slice(0, 14), [semua])
  const adaBerbayar = semua.some((e) => e.sumber === 'toko')
  const ubah = (p: Partial<FilterCari>) => setF((x) => ({ ...x, ...p }))

  return (
    <>
      <KepalaHalaman kecil="temukan bacaan" judul="Cari ebook" />

      <Panel warna="kertas" miring={-0.3} className="mb-6 px-5 py-5">
        <form role="search" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="kata-cari" className="mb-1 block font-semibold">
            Cari judul, penulis, atau topik
          </label>
          <div className="flex gap-2">
            <input
              id="kata-cari"
              type="search"
              className="input min-w-0 flex-1"
              placeholder="mis. Durkheim, solidaritas, ruang publik"
              value={f.q}
              autoComplete="off"
              onChange={(e) => ubah({ q: e.target.value })}
            />
            {filterAktif(f) && (
              <button type="button" className="tombol" onClick={() => setF(FILTER_KOSONG)}>
                <Ikon n="tutup" ukuran={16} /> Atur ulang
              </button>
            )}
          </div>
        </form>

        <fieldset className="m-0 mt-4 border-0 p-0">
          <legend className="mb-2 p-0 font-semibold">Tema sampul</legend>
          <div className="flex flex-wrap gap-2">
            <Pil aktif={f.tema === ''} onKlik={() => ubah({ tema: '' })}>
              Semua
            </Pil>
            {tema.map((t: TemaId) => (
              <Pil key={t} aktif={f.tema === t} onKlik={() => ubah({ tema: f.tema === t ? '' : t })}>
                {TEMA[t].nama}
              </Pil>
            ))}
          </div>
        </fieldset>

        {tag.length > 0 && (
          <fieldset className="m-0 mt-4 border-0 p-0">
            <legend className="mb-2 p-0 font-semibold">Topik</legend>
            <div className="flex flex-wrap gap-2">
              <Pil aktif={f.tag === ''} onKlik={() => ubah({ tag: '' })}>
                Semua
              </Pil>
              {tag.map((t) => (
                <Pil key={t} aktif={f.tag === t} onKlik={() => ubah({ tag: f.tag === t ? '' : t })}>
                  {t}
                </Pil>
              ))}
            </div>
          </fieldset>
        )}

        {adaBerbayar && (
          <fieldset className="m-0 mt-4 border-0 p-0">
            <legend className="mb-2 p-0 font-semibold">Akses</legend>
            <div className="flex flex-wrap gap-2">
              {AKSES.map((a) => (
                <Pil key={a.id} aktif={f.akses === a.id} onKlik={() => ubah({ akses: a.id })}>
                  {a.label}
                </Pil>
              ))}
            </div>
          </fieldset>
        )}
      </Panel>

      <p role="status" aria-live="polite" className="m-0 mb-4 font-semibold" style={{ color: 'var(--teks)' }}>
        {hasil.length === 0 ? 'Tidak ada ebook yang cocok.' : `${hasil.length} ebook ${filterAktif(f) ? 'cocok' : 'tersedia'}`}
      </p>

      <h2 className="sr-only">Hasil pencarian</h2>
      {hasil.length === 0 ? (
        <KosongPanel judul="Belum ketemu">
          <p className="m-0">Coba kata yang lebih umum, atau atur ulang saringannya.</p>
        </KosongPanel>
      ) : (
        <GridEbook daftar={hasil} />
      )}
    </>
  )
}
