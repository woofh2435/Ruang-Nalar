import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { NalarStiker } from '../art/NalarStiker'
import { Panel } from '../art/Panel'
import { Ikon } from '../art/Ikon'
import { useNalar } from '../nalar/NalarContext'
import { useGerak } from '../../lib/gerak'
import { VERSI_KEBIJAKAN } from '../../lib/legal/versi'
import { perluTanya, setPilihanCookie, tutupPengaturanCookie, useCookie } from '../../lib/persetujuan'
import { useTemaGlobal } from '../../lib/store'
import { kulitTemaGlobal } from '../../lib/tema'
import { ambilToko, useToko } from '../../lib/toko/store'

/**
 * Banner izin cookie. Aturannya:
 * - tidak ada yang tercentang otomatis (opt-in), dan "Tolak" sama mudahnya dengan "Terima"
 * - web ini saat ini tidak memasang analitik atau pelacak; pilihan analitik dicatat untuk jaga-jaga bila kelak dipasang
 * - banner tidak memblokir halaman, jadi ebook gratis tetap bisa dibaca tanpa memilih
 */
export function BannerCookie() {
  const { pilihan, dibukaPaksa } = useCookie()
  const tk = useToko()
  const { katakan } = useNalar()
  const gerak = useGerak()
  const [tema] = useTemaGlobal()
  const [atur, setAtur] = useState(false)
  const [analitik, setAnalitik] = useState(false)
  const idJudul = useId()
  const idAnalitik = useId()
  const refJudul = useRef<HTMLHeadingElement>(null)

  const tampil = perluTanya(pilihan) || dibukaPaksa

  // dibuka dari tautan "Pengaturan cookie": mulai dari nilai tersimpan dan pindahkan fokus ke banner
  useEffect(() => {
    if (!dibukaPaksa) return
    setAnalitik(!!pilihan?.analitik)
    setAtur(true)
    requestAnimationFrame(() => refJudul.current?.focus())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dibukaPaksa])

  useEffect(() => {
    if (!dibukaPaksa) return
    const tekan = (e: KeyboardEvent) => {
      if (e.key === 'Escape') tutupPengaturanCookie()
    }
    window.addEventListener('keydown', tekan)
    return () => window.removeEventListener('keydown', tekan)
  }, [dibukaPaksa])

  const simpan = (izin: boolean) => {
    setPilihanCookie(izin)
    // bila sedang masuk, catat juga di server supaya riwayat persetujuan akun konsisten (gagal = tidak mengganggu)
    if (tk.sesi) void ambilToko().catatPersetujuan('analitik', izin, VERSI_KEBIJAKAN).catch(() => undefined)
    katakan(izin ? 'cookieTerima' : 'cookieTolak')
    setAtur(false)
  }

  return (
    <AnimatePresence>
      {tampil && (
        <motion.section
          key="banner-cookie"
          role="region"
          aria-labelledby={idJudul}
          className="fixed inset-x-3 bottom-3 z-[65] mx-auto max-h-[calc(100dvh-1.5rem)] max-w-2xl overflow-y-auto"
          initial={gerak.kurang ? false : { y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={gerak.kurang ? { opacity: 0 } : { y: 40, opacity: 0 }}
          transition={{ duration: gerak.kurang ? 0 : 0.35, ease: 'easeOut' }}
        >
          <Panel warna="kertas" miring={gerak.kurang ? 0 : -0.3} className="px-4 py-4 sm:px-6">
            <div className="flex items-start gap-3">
              <div className="w-[72px] shrink-0" aria-hidden="true">
                <NalarStiker kulit={kulitTemaGlobal(tema)} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id={idJudul} ref={refJudul} tabIndex={-1} className="m-0 font-display text-xl font-black outline-none">
                  Soal cookie, kata Nalar
                </h2>
                <p className="m-0 mt-1 text-[0.95rem] leading-relaxed">
                  Web ini menyimpan data kecil di perangkatmu supaya kamu tetap masuk dan progres bacamu tidak hilang. Saat ini kami <strong>tidak memasang pelacak iklan atau analitik</strong>. Kalau kelak
                  ada analitik, ia hanya jalan jika kamu mengizinkannya di sini. Detailnya ada di{' '}
                  <Link to="/kebijakan-privasi" className="font-semibold underline underline-offset-4" style={{ color: 'var(--tautan)' }}>
                    Kebijakan Privasi
                  </Link>
                  .
                </p>
              </div>
              {dibukaPaksa && !perluTanya(pilihan) && (
                <button type="button" className="tombol tombol-ikon shrink-0" aria-label="Tutup pengaturan cookie" onClick={tutupPengaturanCookie}>
                  <Ikon n="tutup" ukuran={18} />
                </button>
              )}
            </div>

            {atur && (
              <fieldset className="m-0 mt-3 grid gap-2 border-0 p-0">
                <legend className="sr-only">Pilihan cookie</legend>
                <label className="flex items-start gap-3 rounded-lg border-2 border-dashed px-3 py-2" style={{ borderColor: 'var(--tinta-redup)' }}>
                  <input type="checkbox" checked disabled className="kotak-cek mt-1 opacity-70" />
                  <span>
                    <span className="block font-semibold">Perlu (selalu aktif)</span>
                    <span className="block text-sm" style={{ color: 'var(--tinta-redup)' }}>
                      Tetap masuk, progres baca, sorotan, catatan, dan tema pilihanmu.
                    </span>
                  </span>
                </label>
                <label htmlFor={idAnalitik} className="flex cursor-pointer items-start gap-3 rounded-lg border-2 px-3 py-2" style={{ borderColor: 'var(--tinta)' }}>
                  <input id={idAnalitik} type="checkbox" checked={analitik} onChange={(e) => setAnalitik(e.target.checked)} className="kotak-cek mt-1" />
                  <span>
                    <span className="block font-semibold">Analitik (opsional)</span>
                    <span className="block text-sm" style={{ color: 'var(--tinta-redup)' }}>
                      Izin untuk menghitung kunjungan secara anonim supaya web bisa diperbaiki. Belum ada analitik yang dipasang.
                    </span>
                  </span>
                </label>
              </fieldset>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {atur ? (
                <button type="button" className="tombol tombol-primer" onClick={() => simpan(analitik)}>
                  Simpan pilihan
                </button>
              ) : (
                <>
                  <button type="button" className="tombol tombol-primer" onClick={() => simpan(true)}>
                    Terima semua
                  </button>
                  <button type="button" className="tombol" onClick={() => simpan(false)}>
                    Hanya yang perlu
                  </button>
                  <button
                    type="button"
                    className="tombol"
                    onClick={() => {
                      setAnalitik(!!pilihan?.analitik)
                      setAtur(true)
                    }}
                  >
                    Atur pilihan
                  </button>
                </>
              )}
            </div>
          </Panel>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
