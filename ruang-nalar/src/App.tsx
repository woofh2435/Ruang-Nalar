import { useEffect, useRef, useState } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { PaintDefs } from './components/art/PaintDefs'
import { FxLayer } from './components/fx/FxLayer'
import { LoadingSwirl } from './components/fx/LoadingSwirl'
import { Sapuan } from './components/fx/Sapuan'
import { StarField } from './components/fx/StarField'
import { NalarProvider } from './components/nalar/NalarContext'
import { Pojok } from './components/Pojok'
import { useGerak } from './lib/gerak'
import { terapkanPilihanMusik } from './lib/pilihanMusik'
import { mulaiStore, temaSaatIni, terapkanTema, useStoreSiap, useTemaGlobal } from './lib/store'
import { mulaiToko, useToko } from './lib/toko/store'
import { Akun } from './pages/Akun'
import { DasborLayout } from './components/dasbor/DasborLayout'
import { AkunDasbor } from './pages/dasbor/AkunDasbor'
import { Cari } from './pages/dasbor/Cari'
import { Favorit } from './pages/dasbor/Favorit'
import { Pembelian } from './pages/dasbor/Pembelian'
import { Rak } from './pages/dasbor/Rak'
import { Ringkasan } from './pages/dasbor/Ringkasan'
import { Riwayat } from './pages/dasbor/Riwayat'
import { Suara } from './pages/dasbor/Suara'
import { Tentang } from './pages/dasbor/Tentang'
import { Admin } from './pages/Admin'
import { Home } from './pages/Home'
import { Klien } from './pages/Klien'
import { AturSandi } from './pages/AturSandi'
import { LupaSandi } from './pages/LupaSandi'
import { Masuk } from './pages/Masuk'
import { NotFound } from './pages/NotFound'
import { Reader } from './pages/Reader'
import { TautanAkun } from './pages/TautanAkun'

/** Halaman + transisi sapuan kuas saat berpindah halaman (hanya jika alamat/path berubah). */
function Rute() {
  const lokasi = useLocation()
  const gerak = useGerak()
  const [tampil, setTampil] = useState(lokasi)
  const [sapu, setSapu] = useState(0)
  const terbaru = useRef(lokasi)
  terbaru.current = lokasi
  const pertama = useRef(true)

  useEffect(() => {
    if (pertama.current) {
      pertama.current = false
      return
    }
    if (lokasi.pathname === tampil.pathname) {
      setTampil(lokasi)
      return
    }
    if (gerak.kurang) {
      setTampil(lokasi)
      window.scrollTo(0, 0)
      return
    }
    setSapu((s) => s + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lokasi])

  return (
    <>
      <Routes location={tampil}>
        <Route path="/" element={<Home />} />
        <Route path="/baca/:id" element={<Reader />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/masuk" element={<Masuk />} />
        <Route path="/akun" element={<Akun />} />
        <Route path="/klien" element={<Klien />} />
        <Route path="/dasbor" element={<DasborLayout />}>
          <Route index element={<Ringkasan />} />
          <Route path="rak" element={<Rak />} />
          <Route path="cari" element={<Cari />} />
          <Route path="favorit" element={<Favorit />} />
          <Route path="riwayat" element={<Riwayat />} />
          <Route path="pembelian" element={<Pembelian />} />
          <Route path="akun" element={<AkunDasbor />} />
          <Route path="suara" element={<Suara />} />
          <Route path="tentang" element={<Tentang />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/lupa-sandi" element={<LupaSandi />} />
        <Route path="/atur-sandi" element={<AturSandi />} />
        <Route path="/tautan" element={<TautanAkun />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {sapu > 0 && (
        <Sapuan
          key={sapu}
          onTutup={() => {
            setTampil(terbaru.current)
            window.scrollTo(0, 0)
          }}
          onSelesai={() => setSapu(0)}
        />
      )}
    </>
  )
}

function Rangka() {
  const siap = useStoreSiap()
  const tokoSiap = useToko().konfigSiap
  const gerak = useGerak()
  const [tema] = useTemaGlobal()
  const [cukupLama, setCukupLama] = useState(false)

  // loading screen tampil minimal sebentar supaya pusarannya terlihat
  useEffect(() => {
    const t = setTimeout(() => setCukupLama(true), gerak.kurang ? 250 : 1100)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // pasang tema tersimpan setelah data dimuat
  useEffect(() => {
    if (siap) {
      terapkanTema(temaSaatIni())
      terapkanPilihanMusik()
    }
  }, [siap])

  const memuat = !(siap && tokoSiap && cukupLama)

  return (
    <>
      <PaintDefs />
      <StarField tema={tema} />
      <div className="impasto" aria-hidden="true" />
      <button
        type="button"
        className="sr-only-fokus tombol tombol-primer fixed left-3 top-3 z-[100]"
        onClick={() => document.getElementById('konten')?.focus()}
      >
        Lewati ke konten
      </button>
      <Pojok />
      <main id="konten" tabIndex={-1} data-langit className="relative z-[2] min-h-screen outline-none">
        {siap && tokoSiap && <Rute />}
      </main>
      <FxLayer tema={tema} />
      <LoadingSwirl tampil={memuat} />
    </>
  )
}

export default function App() {
  useEffect(() => {
    void mulaiStore()
    void mulaiToko()
  }, [])
  return (
    <HashRouter>
      <NalarProvider>
        <Rangka />
      </NalarProvider>
    </HashRouter>
  )
}
