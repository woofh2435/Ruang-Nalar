import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Footer } from '../Footer'
import { Ikon, type NamaIkon } from '../art/Ikon'
import { Panel } from '../art/Panel'
import { Nalar } from '../nalar/Nalar'
import { useNalar } from '../nalar/NalarContext'
import { useGerak } from '../../lib/gerak'
import { useTemaGlobal } from '../../lib/store'
import { kulitTemaGlobal } from '../../lib/tema'
import { ambilToko, useToko } from '../../lib/toko/store'

export interface ItemMenu {
  to: string
  label: string
  ikon: NamaIkon
  /** hanya NavLink "end" (supaya "Ringkasan" tidak selalu aktif) */
  end?: boolean
  /** hanya tampil bila fitur akun & toko menyala */
  perluToko?: boolean
}

export const MENU_DASBOR: ItemMenu[] = [
  { to: '/dasbor', label: 'Ringkasan', ikon: 'rumah', end: true },
  { to: '/dasbor/rak', label: 'Rak', ikon: 'buku' },
  { to: '/dasbor/cari', label: 'Cari Ebook', ikon: 'cari' },
  { to: '/dasbor/favorit', label: 'Favorit', ikon: 'hati' },
  { to: '/dasbor/riwayat', label: 'Riwayat Baca', ikon: 'jam' },
  { to: '/dasbor/pembelian', label: 'Pembelian', ikon: 'dompet', perluToko: true },
  { to: '/dasbor/akun', label: 'Akun', ikon: 'pengguna' },
  { to: '/dasbor/suara', label: 'Pengaturan Suara', ikon: 'musik' },
  { to: '/dasbor/tentang', label: 'About Me', ikon: 'seru' },
]

const LEBAR_DESKTOP = 1024
const adaDesktop = () => typeof window !== 'undefined' && window.innerWidth >= LEBAR_DESKTOP

/** Nama pendek untuk sapaan: bagian depan email (sebelum @), huruf pertama kapital. */
export function namaDariEmail(email: string | undefined | null): string {
  const d = (email ?? '').split('@')[0].replace(/[._-]+/g, ' ').trim()
  return d ? d.charAt(0).toUpperCase() + d.slice(1) : ''
}

export function judulMenu(path: string): string {
  const cocok = [...MENU_DASBOR].reverse().find((m) => (m.end ? path === m.to : path === m.to || path.startsWith(m.to + '/')))
  return cocok?.label ?? 'Dasbor'
}

function IsiMenu({ onPilih, tutup }: { onPilih: () => void; tutup?: () => void }) {
  const tk = useToko()
  const { katakan } = useNalar()
  const [tema] = useTemaGlobal()
  const tokoAktif = tk.mode !== 'mati'
  const nama = namaDariEmail(tk.sesi?.email)
  const daftar = MENU_DASBOR.filter((m) => !m.perluToko || tokoAktif)

  return (
    <Panel warna="kertas" miring={0.3} className="px-4 py-4">
      {tutup && (
        <button type="button" className="tombol tombol-ikon absolute right-2 top-2 z-10 lg:hidden" aria-label="Tutup menu" onClick={tutup}>
          <Ikon n="tutup" ukuran={18} />
        </button>
      )}
      <div className="flex items-center gap-3">
        <div className="w-[88px] shrink-0">
          <Nalar kulit={kulitTemaGlobal(tema)} ukuran="kecil" cabang={false} gelembung={false} className="!w-full" />
        </div>
        <div className="min-w-0">
          <p className="m-0 font-tangan text-xl font-bold leading-tight" style={{ color: '#8a3d00' }}>
            {nama ? `halo, ${nama}` : 'halo, pembaca'}
          </p>
          <p className="m-0 break-words text-xs" style={{ color: 'var(--tinta-redup)' }}>
            {tk.sesi ? tk.sesi.email : 'Mode tanpa akun'}
          </p>
        </div>
      </div>

      <nav aria-label="Menu dasbor" className="mt-3">
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {daftar.map((m) => (
            <li key={m.to} className="m-0">
              <NavLink
                to={m.to}
                end={m.end}
                onClick={onPilih}
                className="flex min-h-[44px] items-center gap-3 rounded-lg border-2 px-3 py-2 font-semibold no-underline"
                style={({ isActive }) => ({
                  borderColor: isActive ? 'var(--tinta)' : 'transparent',
                  background: isActive ? 'var(--kuning-pusaran)' : 'transparent',
                  color: 'var(--tinta)',
                })}
              >
                <Ikon n={m.ikon} ukuran={20} />
                {m.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-3 border-t-2 border-dashed border-tinta pt-3">
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          <li className="m-0">
            <Link to="/klien" onClick={onPilih} className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 font-semibold no-underline" style={{ color: 'var(--tinta)' }}>
              <Ikon n="papan" ukuran={20} /> Tampilan Klien
            </Link>
          </li>
          {tk.sesi?.admin && (
            <li className="m-0">
              <Link to="/admin" onClick={onPilih} className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 font-semibold no-underline" style={{ color: 'var(--tinta)' }}>
                <Ikon n="edit" ukuran={20} /> Ruang Redaksi
              </Link>
            </li>
          )}
          <li className="m-0">
            <Link to="/" onClick={onPilih} className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 font-semibold no-underline" style={{ color: 'var(--tinta)' }}>
              <Ikon n="kembali" ukuran={20} /> Ke beranda
            </Link>
          </li>
          {tk.sesi && (
            <li className="m-0">
              <button
                type="button"
                className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2 text-left font-semibold"
                style={{ color: 'var(--tinta)', background: 'transparent', cursor: 'pointer' }}
                onClick={async () => {
                  try {
                    await ambilToko().keluar()
                    katakan('tokoKeluar')
                  } catch {
                    /* keadaan layar sudah dibersihkan oleh penyimpan toko */
                  }
                }}
              >
                <Ikon n="keluar" ukuran={20} /> Keluar
              </button>
            </li>
          )}
        </ul>
      </div>
    </Panel>
  )
}

/** Kerangka dasbor: menu samping (laci di HP, tetap terlihat di layar lebar) dan area isi. */
export function DasborLayout() {
  const tk = useToko()
  const lokasi = useLocation()
  const gerak = useGerak()
  const [terbuka, setTerbuka] = useState(adaDesktop)
  const tombolMenu = useRef<HTMLButtonElement>(null)
  const laci = useRef<HTMLDivElement>(null)
  const desktopSebelumnya = useRef(adaDesktop())
  const tokoAktif = tk.mode !== 'mati'

  // di HP, laci menutup sendiri setiap pindah halaman; saat melintasi batas layar, ikuti kebiasaan layar itu
  useEffect(() => {
    if (!adaDesktop()) setTerbuka(false)
  }, [lokasi.pathname])
  useEffect(() => {
    const f = () => {
      const d = adaDesktop()
      if (d !== desktopSebelumnya.current) {
        desktopSebelumnya.current = d
        setTerbuka(d)
      }
    }
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])

  const tutup = useCallback(() => {
    setTerbuka(false)
    tombolMenu.current?.focus()
  }, [])

  // laci (HP) bersifat modal: Esc menutup, Tab berputar di dalam laci, dan fokus pindah ke menu pertama saat dibuka
  useEffect(() => {
    if (!terbuka || adaDesktop()) return
    const t = setTimeout(() => laci.current?.querySelector<HTMLElement>('a')?.focus(), 60)
    const tekan = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        tutup()
        return
      }
      if (e.key !== 'Tab' || !laci.current) return
      const fokus = [...laci.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')]
      if (fokus.length === 0) return
      const awal = fokus[0]
      const akhir = fokus[fokus.length - 1]
      const aktif = document.activeElement
      if (!laci.current.contains(aktif)) {
        e.preventDefault()
        awal.focus()
      } else if (e.shiftKey && aktif === awal) {
        e.preventDefault()
        akhir.focus()
      } else if (!e.shiftKey && aktif === akhir) {
        e.preventDefault()
        awal.focus()
      }
    }
    window.addEventListener('keydown', tekan)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', tekan)
    }
  }, [terbuka, tutup])

  if (tokoAktif && !tk.siap) {
    return (
      <div className="wadah grid min-h-[70vh] place-items-center pt-24" role="status">
        <p className="font-display text-xl font-bold">Memeriksa akunmu…</p>
      </div>
    )
  }
  if (tokoAktif && !tk.sesi) return <Navigate to={`/masuk?lanjut=${encodeURIComponent(lokasi.pathname)}`} replace />

  const judul = judulMenu(lokasi.pathname)
  const geser = gerak.kurang ? { opacity: 0 } : { opacity: 0, x: -28 }

  return (
    <>
      <div className="wadah pb-8 pt-16">
        <div className="mb-5 flex items-center gap-3">
          <button
            ref={tombolMenu}
            type="button"
            className="tombol tombol-ikon shrink-0"
            aria-label={terbuka ? 'Tutup menu dasbor' : 'Buka menu dasbor'}
            aria-expanded={terbuka}
            aria-controls="menu-dasbor"
            onClick={() => setTerbuka((v) => !v)}
          >
            <Ikon n={terbuka && !adaDesktop() ? 'tutup' : 'menu'} ukuran={22} />
          </button>
          <p className="m-0 min-w-0 truncate font-display text-lg font-bold" style={{ color: 'var(--teks)' }}>
            Dasbor <span aria-hidden="true">·</span> {judul}
          </p>
        </div>

        <div className="lg:flex lg:items-start lg:gap-8">
          {/* desktop: kolom tetap di kiri */}
          {terbuka && (
            <aside id="menu-dasbor" className="hidden w-[19.5rem] shrink-0 lg:sticky lg:top-20 lg:-m-3 lg:block lg:max-h-[calc(100dvh-5rem)] lg:overflow-y-auto lg:p-3" aria-label="Navigasi dasbor">
              <IsiMenu onPilih={() => undefined} />
            </aside>
          )}

          {/* HP: laci modal dari kiri. Dirender di <body> supaya berada di atas tombol pojok (z-60) yang hidup di luar <main>. */}
          {typeof document !== 'undefined' &&
            createPortal(
              <AnimatePresence>
                {terbuka && (
                  <div key="laci" className="lg:hidden">
                    <motion.div
                      className="fixed inset-0 z-[80] bg-black/55"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: gerak.kurang ? 0 : 0.2 }}
                      onClick={tutup}
                      aria-hidden="true"
                    />
                    <motion.div
                      ref={laci}
                      id="menu-dasbor-hp"
                      role="dialog"
                      aria-modal="true"
                      aria-label="Menu dasbor"
                      className="fixed inset-y-0 left-0 z-[90] w-[min(20rem,88vw)] overflow-y-auto p-3 pt-4"
                      initial={geser}
                      animate={{ opacity: 1, x: 0 }}
                      exit={geser}
                      transition={{ duration: gerak.kurang ? 0 : 0.25, ease: 'easeOut' }}
                    >
                      <IsiMenu onPilih={() => setTerbuka(false)} tutup={tutup} />
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>,
              document.body,
            )}

          <div className="min-w-0 flex-1">
            <Outlet />
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
