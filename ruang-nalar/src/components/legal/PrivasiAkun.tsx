import { useCallback, useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { Ikon } from '../art/Ikon'
import { Panel } from '../art/Panel'
import { useNalar } from '../nalar/NalarContext'
import { unduhTeks } from '../../lib/berkas'
import { bangunEksporData, cocokKonfirmasiHapus, KATA_KONFIRMASI_HAPUS, LABEL_JENIS, namaBerkasEkspor, statusTerkini } from '../../lib/legal/ekspor'
import { VERSI_KEBIJAKAN } from '../../lib/legal/versi'
import { bukaPengaturanCookie, setPilihanCookie, useCookie } from '../../lib/persetujuan'
import { ambilToko, useToko } from '../../lib/toko/store'
import { GalatToko, type CatatanPersetujuan } from '../../lib/toko/tipe'

const waktu = (s: string) => {
  const t = Date.parse(s)
  return Number.isNaN(t) ? s : new Date(t).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

/** Bagian "Privasi & persetujuan" di Akun & pengaturan: atur izin, lihat riwayat, unduh data, hapus akun. */
export function PrivasiAkun() {
  const tk = useToko()
  const { katakan } = useNalar()
  const { pilihan } = useCookie()
  const [riwayat, setRiwayat] = useState<CatatanPersetujuan[]>([])
  const [status, setStatus] = useState<'memuat' | 'siap' | 'galat'>('memuat')
  const [pesan, setPesan] = useState('')
  // tampilan langsung berubah saat dicentang (tanpa menunggu server); bila gagal, kembali ke nilai server
  const [sementara, setSementara] = useState<{ promo?: boolean; analitik?: boolean }>({})
  const [sibuk, setSibuk] = useState(false)
  const [buka, setBuka] = useState(false)
  const [kata, setKata] = useState('')
  const idKata = useId()
  const sesi = tk.sesi

  const muat = useCallback(async () => {
    try {
      setRiwayat(await ambilToko().riwayatPersetujuan())
      setStatus('siap')
    } catch {
      setStatus('galat')
    }
  }, [])

  useEffect(() => {
    if (sesi) {
      setStatus('memuat')
      void muat()
    }
  }, [sesi?.id, muat]) // eslint-disable-line react-hooks/exhaustive-deps

  const kini = statusTerkini(riwayat)
  const promoAktif = sementara.promo ?? kini.promo?.status ?? false
  const analitikAktif = sementara.analitik ?? pilihan?.analitik ?? kini.analitik?.status ?? false

  const ubah = async (jenis: 'promo' | 'analitik', nilai: boolean) => {
    if (sibuk) return
    setSibuk(true)
    setPesan('')
    setSementara((o) => ({ ...o, [jenis]: nilai }))
    try {
      await ambilToko().catatPersetujuan(jenis, nilai, VERSI_KEBIJAKAN)
      if (jenis === 'analitik') setPilihanCookie(nilai)
      katakan(nilai ? 'persetujuanSimpan' : 'persetujuanTarik')
      await muat()
    } catch (e) {
      setPesan(e instanceof GalatToko ? e.message : 'Gagal menyimpan pilihan. Coba lagi.')
    } finally {
      setSementara((o) => {
        const { [jenis]: _dibuang, ...sisa } = o
        return sisa
      })
      setSibuk(false)
    }
  }

  const unduh = async () => {
    if (!sesi || sibuk) return
    setSibuk(true)
    setPesan('')
    try {
      const terbaru = await ambilToko().riwayatPersetujuan()
      unduhTeks(namaBerkasEkspor(), bangunEksporData({ sesi, pembelian: tk.pembelian, riwayat: terbaru, cookie: pilihan }), 'application/json;charset=utf-8')
      katakan('dataUnduh')
    } catch (e) {
      setPesan(e instanceof GalatToko ? e.message : 'Gagal menyiapkan data. Coba lagi.')
    } finally {
      setSibuk(false)
    }
  }

  const hapus = async () => {
    if (!cocokKonfirmasiHapus(kata) || sibuk) return
    setSibuk(true)
    setPesan('')
    try {
      await ambilToko().hapusAkun()
      katakan('akunHapus')
    } catch (e) {
      setPesan(e instanceof GalatToko ? e.message : 'Akun belum bisa dihapus. Coba lagi.')
    } finally {
      setSibuk(false)
    }
  }

  return (
    <>
      <Panel warna="kertas" className="px-5 py-5">
        <p className="m-0">
          Kamu yang pegang kendali atas datamu. Baca{' '}
          <Link to="/kebijakan-privasi" className="font-semibold underline underline-offset-4" style={{ color: 'var(--tautan)' }}>
            Kebijakan Privasi
          </Link>{' '}
          dan{' '}
          <Link to="/syarat-ketentuan" className="font-semibold underline underline-offset-4" style={{ color: 'var(--tautan)' }}>
            Syarat &amp; Ketentuan
          </Link>{' '}
          kapan saja.
        </p>

        {sesi && (
          <fieldset className="m-0 mt-4 grid gap-2 border-0 p-0">
            <legend className="mb-1 p-0 font-semibold">Izin yang bisa kamu atur</legend>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border-2 px-3 py-2" style={{ borderColor: 'var(--tinta)' }}>
              <input type="checkbox" className="kotak-cek mt-1" checked={promoAktif} disabled={sibuk || status !== 'siap'} onChange={(e) => void ubah('promo', e.target.checked)} />
              <span>
                <span className="block font-semibold">Email kabar ebook baru dan promo</span>
                <span className="block text-sm" style={{ color: 'var(--tinta-redup)' }}>
                  Mati = kami tidak mengirim email promo. Email penting soal akun dan pembelian tetap dikirim.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border-2 px-3 py-2" style={{ borderColor: 'var(--tinta)' }}>
              <input type="checkbox" className="kotak-cek mt-1" checked={analitikAktif} disabled={sibuk || status !== 'siap'} onChange={(e) => void ubah('analitik', e.target.checked)} />
              <span>
                <span className="block font-semibold">Analitik (cookie)</span>
                <span className="block text-sm" style={{ color: 'var(--tinta-redup)' }}>
                  Saat ini belum ada analitik yang dipasang. Pilihanmu tetap dicatat.
                </span>
              </span>
            </label>
          </fieldset>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="tombol" onClick={bukaPengaturanCookie}>
            Pengaturan cookie
          </button>
          {sesi && (
            <button type="button" className="tombol" disabled={sibuk} onClick={() => void unduh()}>
              <Ikon n="unduh" ukuran={18} /> Unduh data akun saya
            </button>
          )}
        </div>
        <p role="alert" className="m-0 mt-2 min-h-[1.5rem] font-semibold" style={{ color: '#7a1608' }}>
          {pesan}
        </p>

        {sesi && (
          <div className="mt-3">
            <p className="m-0 font-semibold">Riwayat persetujuanmu</p>
            {status === 'memuat' && <p className="m-0 mt-1 text-sm">Memuat…</p>}
            {status === 'galat' && (
              <p className="m-0 mt-1 text-sm">
                Riwayat belum bisa dimuat.{' '}
                <button type="button" className="font-semibold underline underline-offset-4" style={{ color: 'var(--tautan)' }} onClick={() => void muat()}>
                  Coba lagi
                </button>
              </p>
            )}
            {status === 'siap' && riwayat.length === 0 && <p className="m-0 mt-1 text-sm">Belum ada catatan. Catatan muncul setelah kamu mendaftar atau mengubah pilihan di atas.</p>}
            {status === 'siap' && riwayat.length > 0 && (
              <ul className="m-0 mt-1 list-none p-0 text-sm">
                {riwayat.map((r) => (
                  <li key={r.id} className="border-t py-1" style={{ borderColor: 'var(--tinta-redup)' }}>
                    <span className="font-semibold">{LABEL_JENIS[r.jenis]}</span>: {r.status ? 'setuju' : 'dicabut'} · versi {r.versi} · {waktu(r.dibuat)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Panel>

      {sesi && (
        <Panel warna="kertas" className="mt-5 px-5 py-5">
          <h3 className="m-0 font-display text-xl font-black">Hapus akun</h3>
          {sesi.admin ? (
            <p className="m-0 mt-2">Akun admin tidak bisa dihapus dari sini, supaya Ruang Redaksi tidak terkunci tanpa sengaja.</p>
          ) : !buka ? (
            <>
              <p className="m-0 mt-2">Akun, riwayat pembelian di akun, dan catatan persetujuanmu akan dihapus dari database kami. Tindakan ini tidak bisa dibatalkan, dan akses ke ebook berbayar yang kamu beli ikut hilang.</p>
              <button type="button" className="tombol tombol-bahaya mt-3" onClick={() => setBuka(true)}>
                <Ikon n="hapus" ukuran={18} /> Hapus akun saya
              </button>
            </>
          ) : (
            <div role="group" aria-label="Konfirmasi hapus akun" className="mt-2">
              <p className="m-0">
                Ini permanen. Semua akses ebook berbayar di akun ini hilang dan tidak bisa dipulihkan. Data bacaan di perangkatmu tidak ikut terhapus. Untuk melanjutkan, ketik <strong>{KATA_KONFIRMASI_HAPUS}</strong>.
              </p>
              <label htmlFor={idKata} className="mb-1 mt-3 block font-semibold">
                Ketik {KATA_KONFIRMASI_HAPUS} untuk konfirmasi
              </label>
              <input id={idKata} className="input max-w-xs" value={kata} autoComplete="off" autoCapitalize="characters" onChange={(e) => setKata(e.target.value)} />
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="tombol tombol-bahaya" disabled={!cocokKonfirmasiHapus(kata) || sibuk} aria-busy={sibuk} onClick={() => void hapus()}>
                  {sibuk ? 'Menghapus…' : 'Ya, hapus akun saya'}
                </button>
                <button
                  type="button"
                  className="tombol"
                  disabled={sibuk}
                  onClick={() => {
                    setBuka(false)
                    setKata('')
                  }}
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </Panel>
      )}
    </>
  )
}
