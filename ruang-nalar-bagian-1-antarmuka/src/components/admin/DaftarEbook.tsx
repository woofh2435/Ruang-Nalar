import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { bacaBerkas, bacaCadangan, bangunCadangan, slugify, unduhTeks } from '../../lib/berkas'
import { useSemuaEbook, penulisTampil } from '../../lib/library'
import { pisahEbook, susunEbook } from '../../lib/parser'
import { buatId, hapusEbookLokal, K, kvSimpan, simpanEbookLokal, useEbookLokal, usePenyimpanan } from '../../lib/store'
import type { Ebook } from '../../lib/types'
import { Ikon } from '../art/Ikon'
import { Panel } from '../art/Panel'
import { SampulGambar } from '../art/Sampul'
import { useNalar } from '../nalar/NalarContext'
import { Konfirmasi } from './Konfirmasi'

export interface PesanAdmin {
  jenis: 'ok' | 'galat' | 'info'
  judul: string
  rincian?: string[]
}

interface Props {
  onBaru: () => void
  onEdit: (id: string) => void
  onPesan: (p: PesanAdmin | null) => void
}

const BATAS_CADANGAN = 20 * 1024 * 1024

export function DaftarEbook({ onBaru, onEdit, onPesan }: Props) {
  const semua = useSemuaEbook()
  const lokal = useEbookLokal()
  const penyimpanan = usePenyimpanan()
  const { katakan } = useNalar()
  const [hapus, setHapus] = useState<Ebook | null>(null)
  const [info, setInfo] = useState('')
  const berkasImpor = useRef<HTMLInputElement>(null)

  const ids = semua.map((e) => e.id)

  const geser = (i: number, d: -1 | 1) => {
    const j = i + d
    if (j < 0 || j >= ids.length) return
    const baru = [...ids]
    ;[baru[i], baru[j]] = [baru[j], baru[i]]
    kvSimpan(K.urutan, baru)
    setInfo(`"${semua[i].parsed.meta.judul}" dipindah ke urutan ${j + 1} dari ${ids.length}.`)
  }

  const duplikat = (e: Ebook) => {
    const { meta, isi } = pisahEbook(e.raw)
    const { raw } = susunEbook({ ...meta, judul: `${meta.judul} (salinan)`, status: 'draf' }, isi)
    const sekarang = Date.now()
    const id = buatId()
    simpanEbookLokal({ id, raw, dibuat: sekarang, diperbarui: sekarang })
    onPesan({
      jenis: 'ok',
      judul: `Salinan "${meta.judul}" dibuat sebagai Draf di browser ini.`,
      rincian: ['Ubah lewat tombol Edit, lalu terbitkan kalau sudah siap.'],
    })
  }

  const unduh = (e: Ebook) => {
    unduhTeks(`${slugify(e.parsed.meta.judul)}.md`, e.raw, 'text/markdown;charset=utf-8')
    onPesan({
      jenis: 'info',
      judul: `File ${slugify(e.parsed.meta.judul)}.md diunduh.`,
      rincian: ['Taruh file itu di folder src/content/ proyekmu, lalu push ke GitHub supaya terbit untuk semua pembaca.'],
    })
    katakan('adminEkspor')
  }

  const ekspor = () => {
    const tanggal = new Date().toISOString().slice(0, 10)
    unduhTeks(`ruang-nalar-cadangan-${tanggal}.json`, bangunCadangan(lokal), 'application/json;charset=utf-8')
    onPesan({ jenis: 'ok', judul: `Cadangan ${lokal.length} ebook diunduh sebagai JSON.` })
    katakan('adminEkspor')
  }

  const impor = async (file: File) => {
    if (file.size > BATAS_CADANGAN) {
      onPesan({ jenis: 'galat', judul: 'File cadangan terlalu besar (maksimal 20 MB).' })
      katakan('adminError')
      return
    }
    let teks = ''
    try {
      teks = await bacaBerkas(file)
    } catch {
      onPesan({ jenis: 'galat', judul: 'File tidak bisa dibaca. Coba pilih ulang.' })
      katakan('adminError')
      return
    }
    const hasil = bacaCadangan(teks, buatId)
    if (hasil.galat) {
      onPesan({ jenis: 'galat', judul: hasil.galat })
      katakan('adminError')
      return
    }
    hasil.diterima.forEach(simpanEbookLokal)
    onPesan({
      jenis: hasil.diterima.length ? 'ok' : 'galat',
      judul: `${hasil.diterima.length} ebook diimpor${hasil.dilewati.length ? `, ${hasil.dilewati.length} dilewati` : ''}.`,
      rincian: [
        ...(hasil.diterima.length ? ['Ebook dengan id yang sama diperbarui dengan isi dari cadangan.'] : []),
        ...hasil.dilewati.map((d) => `Ebook nomor ${d.nomor} dilewati: ${d.alasan}.`),
      ],
    })
    katakan(hasil.diterima.length ? 'adminImpor' : 'adminError')
  }

  return (
    <section aria-labelledby="judul-daftar">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="judul-daftar" className="m-0 font-display text-3xl font-black" style={{ color: 'var(--teks)' }}>
          Ebook di rak ({semua.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="tombol tombol-primer" onClick={onBaru}>
            <Ikon n="plus" ukuran={18} /> Ebook baru
          </button>
          <button
            type="button"
            className="tombol"
            aria-disabled={lokal.length === 0}
            title={lokal.length === 0 ? 'Belum ada ebook buatan admin untuk dicadangkan' : undefined}
            onClick={() => {
              if (lokal.length === 0) {
                onPesan({ jenis: 'info', judul: 'Belum ada ebook buatan admin untuk diekspor.', rincian: ['Ebook dari folder src/content/ sudah ada di proyekmu, jadi tidak ikut dicadangkan.'] })
                return
              }
              ekspor()
            }}
          >
            <Ikon n="unduh" ukuran={18} /> Ekspor semua (JSON)
          </button>
          <button type="button" className="tombol" onClick={() => berkasImpor.current?.click()}>
            <Ikon n="unggah" ukuran={18} /> Impor JSON
          </button>
          <input
            ref={berkasImpor}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            aria-label="Pilih file cadangan JSON untuk diimpor"
            tabIndex={-1}
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) void impor(f)
            }}
          />
        </div>
      </div>

      {penyimpanan !== 'indexeddb' && (
        <p className="mt-3 rounded-lg border-2 border-dashed p-3 text-sm font-semibold" style={{ borderColor: 'var(--tinta)', background: '#fff3d6', color: 'var(--tinta)' }} role="note">
          Penyimpanan browser ini terbatas ({penyimpanan === 'localstorage' ? 'memakai localStorage' : 'hanya di memori, hilang saat tab ditutup'}). Unduh cadangan JSON secara berkala.
        </p>
      )}

      <p className="sr-only" role="status" aria-live="polite">
        {info}
      </p>

      <ul className="m-0 mt-5 flex list-none flex-col gap-4 p-0">
        {semua.map((e, i) => {
          const { meta } = e.parsed
          const publik = e.sumber === 'publik'
          const nPeringatan = e.parsed.peringatan.length
          return (
            <li key={e.id} className="m-0">
              <Panel warna="kertas" className="px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="w-16 shrink-0 self-start" aria-hidden="true">
                    <SampulGambar meta={meta} id={e.id} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="m-0 font-display text-xl font-bold leading-tight">{meta.judul}</h3>
                      <span
                        className="chip"
                        style={meta.status === 'terbit' ? { background: '#dff0d2', color: '#1f4a12' } : { background: '#fde7b0', color: '#5c3600' }}
                      >
                        {meta.status === 'terbit' ? 'Terbit' : 'Draf'}
                      </span>
                      <span className="chip" style={{ color: '#3b2f78' }}>
                        {publik ? 'File publik' : 'Di browser ini'}
                      </span>
                      {nPeringatan > 0 && (
                        <span className="chip" style={{ color: '#7a1608' }} title="Buka Edit untuk melihat rincian peringatan">
                          {nPeringatan} peringatan
                        </span>
                      )}
                    </div>
                    <p className="m-0 mt-1 text-sm" style={{ color: 'var(--tinta-redup)' }}>
                      {meta.subjudul ? meta.subjudul + ' · ' : ''}
                      {penulisTampil(e)} · {e.parsed.bab.length} bab
                      {e.parsed.jumlahKuis ? ` · ${e.parsed.jumlahKuis} kuis` : ''}
                    </p>
                    {meta.deskripsi && <p className="m-0 mt-1 text-sm">{meta.deskripsi}</p>}
                    {publik && (
                      <p className="m-0 mt-1 text-xs" style={{ color: 'var(--tinta-redup)' }}>
                        Berasal dari file di src/content/. Ubah atau hapus lewat file itu di repo.
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link to={`/baca/${e.id}`} className="tombol tombol-kecil" aria-label={`Baca ${meta.judul}`}>
                        <Ikon n="mata" ukuran={16} /> Baca
                      </Link>
                      {!publik && (
                        <button type="button" className="tombol tombol-kecil" aria-label={`Edit ${meta.judul}`} onClick={() => onEdit(e.id)}>
                          <Ikon n="edit" ukuran={16} /> Edit
                        </button>
                      )}
                      <button type="button" className="tombol tombol-kecil" aria-label={`${publik ? 'Salin ke browser ini' : 'Duplikat'}: ${meta.judul}`} onClick={() => duplikat(e)}>
                        <Ikon n="salin" ukuran={16} /> {publik ? 'Salin ke browser ini' : 'Duplikat'}
                      </button>
                      <button type="button" className="tombol tombol-kecil" aria-label={`Unduh ${meta.judul} sebagai file .md`} onClick={() => unduh(e)}>
                        <Ikon n="unduh" ukuran={16} /> Unduh .md
                      </button>
                      {!publik && (
                        <button type="button" className="tombol tombol-kecil tombol-bahaya" aria-label={`Hapus ${meta.judul}`} onClick={() => setHapus(e)}>
                          <Ikon n="hapus" ukuran={16} /> Hapus
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2 sm:flex-col" role="group" aria-label={`Urutan di rak untuk ${meta.judul}`}>
                    <button type="button" className="tombol tombol-ikon" style={{ width: 40, height: 40, minHeight: 40 }} aria-label={`Naikkan ${meta.judul} di rak`} disabled={i === 0} onClick={() => geser(i, -1)}>
                      <Ikon n="naik" ukuran={18} />
                    </button>
                    <button type="button" className="tombol tombol-ikon" style={{ width: 40, height: 40, minHeight: 40 }} aria-label={`Turunkan ${meta.judul} di rak`} disabled={i === ids.length - 1} onClick={() => geser(i, 1)}>
                      <Ikon n="turun" ukuran={18} />
                    </button>
                  </div>
                </div>
              </Panel>
            </li>
          )
        })}
      </ul>

      {semua.length === 0 && (
        <Panel warna="kertas" className="mt-5 px-6 py-8 text-center">
          <p className="m-0 font-display text-2xl font-bold">Belum ada ebook</p>
          <p className="mt-2">Klik “Ebook baru” untuk menulis, atau impor file cadangan JSON.</p>
        </Panel>
      )}

      {hapus && (
        <Konfirmasi
          judul="Hapus ebook ini?"
          labelYa="Ya, hapus"
          bahaya
          onBatal={() => setHapus(null)}
          onYa={() => {
            const judul = hapus.parsed.meta.judul
            hapusEbookLokal(hapus.id)
            setHapus(null)
            onPesan({ jenis: 'ok', judul: `"${judul}" dihapus dari browser ini.` })
            katakan('adminHapus')
          }}
        >
          <p className="m-0">
            “<strong>{hapus.parsed.meta.judul}</strong>” beserta sorotan, catatan, dan jawaban kuis pembacanya akan dihapus dari browser ini. Tindakan ini tidak bisa dibatalkan.
          </p>
          <p className="m-0 mt-2 text-sm">Tips: unduh dulu sebagai .md kalau kamu mungkin membutuhkannya lagi.</p>
        </Konfirmasi>
      )}
    </section>
  )
}
