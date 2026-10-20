import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ADMIN_PASSCODE } from '../../config'
import { kulitTemaGlobal } from '../../lib/tema'
import { useTemaGlobal } from '../../lib/store'
import { Ikon } from '../art/Ikon'
import { Panel } from '../art/Panel'
import { Nalar } from '../nalar/Nalar'
import { useNalar } from '../nalar/NalarContext'

/**
 * Layar kode sandi. INGAT: ini hanya pengunci ringan di sisi klien (lihat src/config.ts),
 * bukan keamanan sungguhan.
 */
export function GerbangSandi({ onBuka }: { onBuka: () => void }) {
  const [kode, setKode] = useState('')
  const [salah, setSalah] = useState(false)
  const [getar, setGetar] = useState(0)
  const [tema] = useTemaGlobal()
  const { katakan } = useNalar()
  const idInput = useId()
  const idGalat = useId()
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    input.current?.focus()
  }, [])

  const kirim = (e: FormEvent) => {
    e.preventDefault()
    if (kode === ADMIN_PASSCODE) {
      onBuka()
      return
    }
    setSalah(true)
    setGetar((g) => g + 1)
    katakan('adminSalah')
    input.current?.select()
  }

  return (
    <div className="wadah flex min-h-[85vh] flex-col items-center justify-center gap-6 pb-16 pt-24 text-center">
      <div className="w-[min(280px,72vw)]">
        <Nalar kulit={kulitTemaGlobal(tema)} ukuran="besar" gelembung="atas" />
      </div>
      <Panel warna="kertas" miring={-0.8} className="w-full max-w-md px-6 py-7 text-left">
        <p className="m-0 flex items-center gap-2 font-tangan text-2xl font-bold" style={{ color: '#8a3d00' }}>
          <Ikon n="kunci" ukuran={20} /> khusus pemilik
        </p>
        <h1 className="cat-judul m-0 font-display text-4xl font-black">Ruang Redaksi</h1>
        <form onSubmit={kirim} className="mt-4" noValidate>
          <label htmlFor={idInput} className="mb-1 block font-semibold">
            Kode sandi
          </label>
          <input
            ref={input}
            key={getar}
            id={idInput}
            type="password"
            autoComplete="off"
            className={`input ${getar ? 'goyang' : ''}`}
            value={kode}
            aria-invalid={salah}
            aria-describedby={salah ? idGalat : undefined}
            onChange={(e) => {
              setKode(e.target.value)
              setSalah(false)
            }}
          />
          <p id={idGalat} role="alert" className="m-0 mt-2 min-h-[1.5rem] font-semibold" style={{ color: '#7a1608' }}>
            {salah ? 'Kode sandinya belum pas. Coba lagi, ya.' : ''}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="submit" className="tombol tombol-primer">
              Masuk
            </button>
            <Link to="/" className="tombol">
              Kembali ke rak
            </Link>
          </div>
        </form>
        <p className="m-0 mt-4 text-sm" style={{ color: 'var(--tinta-redup)' }}>
          Ini hanya pengunci ringan di sisi browser, bukan keamanan sungguhan.
        </p>
      </Panel>
    </div>
  )
}
