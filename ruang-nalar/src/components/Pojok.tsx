import { useState } from 'react'
import { Link } from 'react-router-dom'
import { bunyiDidukung, bunyiNyala, setBunyi } from '../lib/audio'
import { useTemaGlobal } from '../lib/store'
import { useToko } from '../lib/toko/store'
import { Ikon } from './art/Ikon'
import { useNalar } from './nalar/NalarContext'

// Dua tombol di pojok kanan atas: ganti tema (Malam Berbintang / Ladang Matahari) dan suara ambient (default MATI).

export function Pojok() {
  const [tema, setTema] = useTemaGlobal()
  const tk = useToko()
  const { katakan } = useNalar()
  const [suara, setSuara] = useState(bunyiNyala())
  const mendukung = bunyiDidukung()

  const sekarang = tema === 'malam' ? 'Malam Berbintang' : 'Ladang Matahari'
  const tujuan = tema === 'malam' ? 'Ladang Matahari' : 'Malam Berbintang'

  return (
    <nav className="fixed right-3 top-3 z-[60] flex gap-2" aria-label="Pengaturan tampilan">
      {tk.mode !== 'mati' && (
        <Link
          to={tk.sesi ? '/akun' : '/masuk'}
          className="tombol tombol-ikon"
          aria-label={tk.sesi ? `Akunku (${tk.sesi.email})` : 'Masuk atau buat akun'}
          title={tk.sesi ? `Akunku: ${tk.sesi.email}` : 'Masuk / buat akun'}
          style={tk.sesi ? { background: 'var(--kuning-pusaran)' } : undefined}
        >
          <Ikon n="pengguna" />
        </Link>
      )}
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
        aria-label={suara ? 'Matikan suara ambient' : 'Nyalakan suara ambient'}
        aria-pressed={suara}
        title={mendukung ? (suara ? 'Suara ambient: nyala' : 'Suara ambient: mati') : 'Browser ini tidak mendukung suara'}
        disabled={!mendukung}
        onClick={() => {
          const on = setBunyi(!suara)
          setSuara(on)
          katakan(on ? 'bunyiOn' : 'bunyiOff')
        }}
      >
        <Ikon n={suara ? 'suara' : 'senyap'} />
      </button>
    </nav>
  )
}
