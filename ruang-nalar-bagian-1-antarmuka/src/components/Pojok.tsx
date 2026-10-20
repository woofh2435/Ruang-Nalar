import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { bunyiDidukung, setBunyi } from '../lib/audio'
import { useBunyiNyala } from '../lib/pilihanMusik'
import { useTemaGlobal } from '../lib/store'
import { useToko } from '../lib/toko/store'
import { Ikon } from './art/Ikon'
import { Panel } from './art/Panel'
import { useNalar } from './nalar/NalarContext'
import { PemilihMusik } from './PemilihMusik'

// Tombol di pojok kanan atas: dasbor/akun, ganti tema (Malam Berbintang / Ladang Matahari), musik latar (nyala/mati)
// dan pemilih lagu. Musik default MATI.

export function Pojok() {
  const [tema, setTema] = useTemaGlobal()
  const tk = useToko()
  const { katakan } = useNalar()
  const suara = useBunyiNyala()
  const mendukung = bunyiDidukung()
  const [pilihBuka, setPilihBuka] = useState(false)
  const tombolPilih = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  // panel pemilih: Esc menutup dan mengembalikan fokus; ketuk di luar menutup
  useEffect(() => {
    if (!pilihBuka) return
    const tekan = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPilihBuka(false)
        tombolPilih.current?.focus()
      }
    }
    const luar = (e: PointerEvent) => {
      const t = e.target as Node
      if (panel.current?.contains(t) || tombolPilih.current?.contains(t)) return
      setPilihBuka(false)
    }
    window.addEventListener('keydown', tekan)
    window.addEventListener('pointerdown', luar)
    return () => {
      window.removeEventListener('keydown', tekan)
      window.removeEventListener('pointerdown', luar)
    }
  }, [pilihBuka])

  const sekarang = tema === 'malam' ? 'Malam Berbintang' : 'Ladang Matahari'
  const tujuan = tema === 'malam' ? 'Ladang Matahari' : 'Malam Berbintang'
  const perluMasuk = tk.mode !== 'mati' && !tk.sesi

  return (
    <>
      <nav className="fixed right-3 top-3 z-[60] flex gap-2" aria-label="Pengaturan tampilan">
        <Link
          to={perluMasuk ? '/masuk' : '/dasbor'}
          className="tombol tombol-ikon"
          aria-label={tk.sesi ? `Dasbor (${tk.sesi.email})` : perluMasuk ? 'Masuk atau buat akun' : 'Buka dasbor'}
          title={tk.sesi ? `Dasbor: ${tk.sesi.email}` : perluMasuk ? 'Masuk / buat akun' : 'Dasbor'}
          style={tk.sesi ? { background: 'var(--kuning-pusaran)' } : undefined}
        >
          <Ikon n="pengguna" />
        </Link>
        <button
          type="button"
          className="tombol tombol-ikon"
          aria-label={`Ganti tema. Sekarang ${sekarang}, klik untuk ${tujuan}.`}
          title={`Tema: ${sekarang}`}
          onClick={() => {
            const n = tema === 'malam' ? 'ladang' : 'malam'
            setTema(n)
            katakan(n === 'malam' ? 'temaMalam' : 'temaLadang')
          }}
        >
          <Ikon n={tema === 'malam' ? 'bulan' : 'matahari'} />
        </button>
        <button
          type="button"
          className="tombol tombol-ikon"
          aria-label={suara ? 'Matikan musik latar' : 'Nyalakan musik latar'}
          aria-pressed={suara}
          title={mendukung ? (suara ? 'Musik latar: nyala' : 'Musik latar: mati') : 'Browser ini tidak mendukung suara'}
          disabled={!mendukung}
          onClick={() => {
            const on = setBunyi(!suara)
            katakan(on ? 'bunyiOn' : 'bunyiOff')
          }}
        >
          <Ikon n={suara ? 'suara' : 'senyap'} />
        </button>
        {mendukung && (
          <button
            ref={tombolPilih}
            type="button"
            className="tombol tombol-ikon"
            aria-label="Pilih musik latar"
            aria-expanded={pilihBuka}
            aria-controls="panel-musik"
            title="Pilih musik latar"
            onClick={() => setPilihBuka((v) => !v)}
          >
            <Ikon n="musik" />
          </button>
        )}
      </nav>
      {pilihBuka && (
        <div
          ref={panel}
          id="panel-musik"
          role="dialog"
          aria-label="Pilih musik latar"
          className="fixed right-0.5 top-[4rem] z-[61] max-h-[calc(100dvh-5rem)] w-[min(24rem,calc(100vw-0.25rem))] overflow-y-auto p-3"
        >
          <Panel warna="kertas" className="px-4 py-4">
            <button
              type="button"
              className="tombol tombol-ikon absolute right-2 top-2 z-10"
              aria-label="Tutup pemilih musik"
              onClick={() => {
                setPilihBuka(false)
                tombolPilih.current?.focus()
              }}
            >
              <Ikon n="tutup" ukuran={18} />
            </button>
            <PemilihMusik judulTingkat={2} />
          </Panel>
        </div>
      )}
    </>
  )
}
