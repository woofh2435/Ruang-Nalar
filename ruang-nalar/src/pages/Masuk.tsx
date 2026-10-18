import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { Ikon } from '../components/art/Ikon'
import { Panel } from '../components/art/Panel'
import { BannerDemo } from '../components/toko/BannerDemo'
import { Nalar } from '../components/nalar/Nalar'
import { useNalar } from '../components/nalar/NalarContext'
import { EMAIL_ADMIN_DEMO } from '../lib/toko/demo'
import { ambilToko, useToko } from '../lib/toko/store'
import { amanLanjut, emailValid, GalatToko, SANDI_MIN } from '../lib/toko/tipe'
import { useTemaGlobal } from '../lib/store'
import { kulitTemaGlobal } from '../lib/tema'
import { NotFound } from './NotFound'

type Tab = 'masuk' | 'daftar'

export function Masuk() {
  const tk = useToko()
  const [params] = useSearchParams()
  const lanjut = amanLanjut(params.get('lanjut'), '/dasbor')
  const [tab, setTab] = useState<Tab>(params.get('tab') === 'daftar' ? 'daftar' : 'masuk')
  const [email, setEmail] = useState('')
  const [sandi, setSandi] = useState('')
  const [lihat, setLihat] = useState(false)
  const [galat, setGalat] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const [cekEmail, setCekEmail] = useState('')
  const [tema] = useTemaGlobal()
  const { katakan } = useNalar()
  const idEmail = useId()
  const idSandi = useId()
  const idGalat = useId()
  const idHint = useId()
  const refEmail = useRef<HTMLInputElement>(null)

  useEffect(() => {
    refEmail.current?.focus()
  }, [tab])

  if (tk.mode === 'mati') return <NotFound judul="Fitur akun belum aktif" pesan="Pemilik web belum menyalakan akun dan pembayaran." />
  if (!tk.siap) {
    return (
      <div className="wadah grid min-h-[70vh] place-items-center pt-24" role="status">
        <p className="font-display text-xl font-bold">Memeriksa akunmu…</p>
      </div>
    )
  }
  if (tk.sesi) return <Navigate to={lanjut} replace />

  const daftar = tab === 'daftar'

  const kirim = async (e: FormEvent) => {
    e.preventDefault()
    if (sibuk) return
    const em = email.trim().toLowerCase()
    if (!emailValid(em)) {
      setGalat('Alamat email belum benar. Contoh: nama@email.com')
      katakan('tokoGalat')
      refEmail.current?.focus()
      return
    }
    if (daftar && sandi.length < SANDI_MIN) {
      setGalat(`Kata sandi minimal ${SANDI_MIN} karakter.`)
      katakan('tokoGalat')
      return
    }
    if (!daftar && !sandi) {
      setGalat('Isi kata sandinya dulu, ya.')
      return
    }
    setGalat('')
    setSibuk(true)
    try {
      const toko = ambilToko()
      if (daftar) {
        const h = await toko.daftar(em, sandi)
        if (h.perluKonfirmasi) setCekEmail(em)
        else katakan('tokoMasuk')
      } else {
        await toko.masuk(em, sandi)
        katakan('tokoMasuk')
      }
    } catch (err) {
      setGalat(err instanceof GalatToko ? err.message : 'Terjadi kesalahan. Coba lagi.')
      katakan('tokoGalat')
    } finally {
      setSibuk(false)
    }
  }

  return (
    <div className="wadah flex min-h-[85vh] flex-col items-center justify-center gap-6 pb-16 pt-24">
      <div className="w-[min(240px,62vw)]">
        <Nalar kulit={kulitTemaGlobal(tema)} ukuran="besar" gelembung="atas" />
      </div>
      <Panel warna="kertas" miring={-0.6} className="w-full max-w-md px-5 py-6 sm:px-7">
        <p className="m-0 flex items-center gap-2 font-tangan text-2xl font-bold" style={{ color: '#8a3d00' }}>
          <Ikon n="pengguna" ukuran={20} /> akun pembaca
        </p>
        <h1 className="cat-judul m-0 font-display text-4xl font-black">{daftar ? 'Buat akun' : 'Masuk'}</h1>

        {tk.mode === 'demo' && <BannerDemo className="mt-3" />}

        {cekEmail ? (
          <div role="status" className="mt-4">
            <p className="m-0 font-display text-xl font-bold">Cek emailmu 📬</p>
            <p className="mt-2">
              Kami mengirim tautan konfirmasi ke <strong>{cekEmail}</strong>. Klik tautan itu (cek folder spam juga), lalu kembali ke sini untuk masuk.
            </p>
            <button
              type="button"
              className="tombol tombol-primer mt-3"
              onClick={() => {
                setCekEmail('')
                setTab('masuk')
                setSandi('')
              }}
            >
              Sudah konfirmasi, lanjut masuk
            </button>
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label="Pilih masuk atau buat akun">
              {(['masuk', 'daftar'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`tombol tombol-kecil ${tab === t ? 'tombol-primer' : ''}`}
                  aria-pressed={tab === t}
                  onClick={() => {
                    setTab(t)
                    setGalat('')
                  }}
                >
                  {t === 'masuk' ? 'Masuk' : 'Buat akun'}
                </button>
              ))}
            </div>

            <form onSubmit={kirim} className="mt-4" noValidate>
              <label htmlFor={idEmail} className="mb-1 block font-semibold">
                Email
              </label>
              <input
                ref={refEmail}
                id={idEmail}
                type="email"
                inputMode="email"
                autoComplete="username"
                className="input"
                value={email}
                aria-invalid={!!galat}
                aria-describedby={galat ? idGalat : undefined}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setGalat('')
                }}
              />
              <label htmlFor={idSandi} className="mb-1 mt-3 block font-semibold">
                Kata sandi
              </label>
              <div className="flex gap-2">
                <input
                  id={idSandi}
                  type={lihat ? 'text' : 'password'}
                  autoComplete={daftar ? 'new-password' : 'current-password'}
                  className="input"
                  value={sandi}
                  aria-describedby={daftar ? idHint : undefined}
                  onChange={(e) => {
                    setSandi(e.target.value)
                    setGalat('')
                  }}
                />
                <button type="button" className="tombol tombol-ikon shrink-0" aria-label={lihat ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} aria-pressed={lihat} onClick={() => setLihat((v) => !v)}>
                  <Ikon n="mata" ukuran={18} />
                </button>
              </div>
              {daftar && (
                <p id={idHint} className="m-0 mt-1 text-sm" style={{ color: 'var(--tinta-redup)' }}>
                  Minimal {SANDI_MIN} karakter. Pakai sandi yang tidak kamu pakai di tempat lain.
                </p>
              )}
              {!daftar && (
                <p className="m-0 mt-2 text-sm">
                  <Link to="/lupa-sandi" className="inline-flex min-h-[36px] items-center font-semibold underline underline-offset-4" style={{ color: 'var(--tautan)' }}>
                    Lupa kata sandi?
                  </Link>
                </p>
              )}
              <p id={idGalat} role="alert" className="m-0 mt-2 min-h-[1.5rem] font-semibold" style={{ color: '#7a1608' }}>
                {galat}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button type="submit" className="tombol tombol-primer" disabled={sibuk} aria-busy={sibuk}>
                  {sibuk ? 'Sebentar…' : daftar ? 'Buat akun' : 'Masuk'}
                </button>
                <Link to="/" className="tombol">
                  Kembali ke rak
                </Link>
              </div>
            </form>

            {tk.mode === 'demo' && !daftar && (
              <p className="m-0 mt-4 text-sm">
                Mau coba sebagai admin?{' '}
                <button
                  type="button"
                  className="font-semibold underline underline-offset-4"
                  style={{ color: 'var(--tautan)' }}
                  onClick={() => {
                    setEmail(EMAIL_ADMIN_DEMO)
                    setSandi('admin-demo-123')
                  }}
                >
                  Isikan akun admin demo
                </button>
              </p>
            )}
          </>
        )}
      </Panel>
    </div>
  )
}
