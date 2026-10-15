import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DaftarEbook, type PesanAdmin } from '../components/admin/DaftarEbook'
import { Editor } from '../components/admin/Editor'
import { GerbangSandi } from '../components/admin/GerbangSandi'
import { Ikon } from '../components/art/Ikon'
import { Panel } from '../components/art/Panel'
import { Footer } from '../components/Footer'
import { TokoAdmin } from '../components/toko/TokoAdmin'
import { Nalar } from '../components/nalar/Nalar'
import { useNalar } from '../components/nalar/NalarContext'
import { PETUNJUK_ADMIN } from '../config'
import { adminTerbuka, setAdminTerbuka, useTemaGlobal } from '../lib/store'
import { kulitTemaGlobal, TEMA } from '../lib/tema'
import type { TemaId } from '../lib/types'

type Layar = { tipe: 'daftar' } | { tipe: 'editor'; id: string | null }

function RuangRedaksi({ onKunci }: { onKunci: () => void }) {
  const [layar, setLayar] = useState<Layar>({ tipe: 'daftar' })
  const [pesan, setPesan] = useState<PesanAdmin | null>(null)
  const [temaEditor, setTemaEditor] = useState<TemaId | null>(null)
  const [temaGlobal] = useTemaGlobal()
  const kulit = layar.tipe === 'editor' && temaEditor ? TEMA[temaEditor].kulit : kulitTemaGlobal(temaGlobal)
  const gantiTema = useCallback((t: TemaId) => setTemaEditor(t), [])

  useEffect(() => {
    if (layar.tipe === 'daftar') setTemaEditor(null)
  }, [layar.tipe])

  // pesan keberhasilan hilang sendiri; pesan galat tetap sampai ditutup
  useEffect(() => {
    if (!pesan || pesan.jenis === 'galat') return
    const t = setTimeout(() => setPesan(null), 9000)
    return () => clearTimeout(t)
  }, [pesan])

  const warnaPesan = pesan?.jenis === 'galat' ? { bg: '#fbd9c8', fg: '#5a1306' } : pesan?.jenis === 'info' ? { bg: '#dbe7fb', fg: '#14275f' } : { bg: '#e5f4d9', fg: '#1f4a12' }

  return (
    <div className="wadah pb-8 pt-20">
      <header className="mb-6 grid items-center gap-4 sm:grid-cols-[1fr_auto]">
        <Panel warna="kertas" miring={-0.6} className="px-5 py-5 sm:px-7">
          <p className="m-0 font-tangan text-2xl font-bold" style={{ color: '#8a3d00' }}>
            dapur ebook Nalar
          </p>
          <h1 className="cat-judul m-0 font-display text-4xl font-black sm:text-5xl">Ruang Redaksi</h1>
          <p className="m-0 mt-3 rounded-lg border-2 border-dashed p-3 text-[0.95rem]" style={{ borderColor: 'var(--tinta)', background: '#fff3d6' }} role="note">
            {PETUNJUK_ADMIN}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/" className="tombol tombol-kecil">
              <Ikon n="kembali" ukuran={16} /> Ke rak buku
            </Link>
            <button type="button" className="tombol tombol-kecil" onClick={onKunci}>
              <Ikon n="kunci" ukuran={16} /> Kunci lagi
            </button>
          </div>
        </Panel>
        <div className="mx-auto mt-14 w-[min(230px,60vw)] sm:mx-0 sm:mt-0 sm:w-[230px]">
          <Nalar kulit={kulit} ukuran="besar" gelembung="atas" />
        </div>
      </header>

      <div role="status" aria-live="polite">
        {pesan && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border-2 border-tinta p-4 shadow-[3px_4px_0_rgba(8,12,40,0.3)]" style={{ background: warnaPesan.bg, color: warnaPesan.fg }}>
            <div className="min-w-0 flex-1">
              <p className="m-0 font-bold">{pesan.judul}</p>
              {pesan.rincian && pesan.rincian.length > 0 && (
                <ul className="m-0 mt-1 pl-5 text-sm">
                  {pesan.rincian.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
            <button type="button" className="tombol-mini shrink-0" aria-label="Tutup pesan" onClick={() => setPesan(null)}>
              <Ikon n="tutup" ukuran={16} />
            </button>
          </div>
        )}
      </div>

      {layar.tipe === 'daftar' ? (
        <DaftarEbook
          onBaru={() => {
            setPesan(null)
            setLayar({ tipe: 'editor', id: null })
          }}
          onEdit={(id) => {
            setPesan(null)
            setLayar({ tipe: 'editor', id })
          }}
          onPesan={setPesan}
        />
      ) : (
        <Editor
          key={layar.id ?? 'baru'}
          id={layar.id}
          onTema={gantiTema}
          onSelesai={(p) => {
            if (p) setPesan(p)
            setLayar({ tipe: 'daftar' })
            window.scrollTo({ top: 0 })
          }}
        />
      )}

      {layar.tipe === 'daftar' && <TokoAdmin onPesan={setPesan} />}
    </div>
  )
}

export function Admin() {
  const [terbuka, setTerbuka] = useState(adminTerbuka())
  const { katakan } = useNalar()

  if (!terbuka) {
    return (
      <GerbangSandi
        onBuka={() => {
          setAdminTerbuka(true)
          setTerbuka(true)
          katakan('adminMasuk')
        }}
      />
    )
  }
  return (
    <>
      <RuangRedaksi
        onKunci={() => {
          setAdminTerbuka(false)
          setTerbuka(false)
        }}
      />
      <Footer />
    </>
  )
}
