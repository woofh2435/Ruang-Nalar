import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Ikon } from '../components/art/Ikon'
import { Panel } from '../components/art/Panel'
import { BannerDemo } from '../components/toko/BannerDemo'
import { Captcha, type PegangCaptcha } from '../components/toko/Captcha'
import { ambilKunciCaptcha } from '../lib/toko/captcha'
import { Nalar } from '../components/nalar/Nalar'
import { useNalar } from '../components/nalar/NalarContext'
import { useTemaGlobal } from '../lib/store'
import { kulitTemaGlobal } from '../lib/tema'
import { ambilToko, useToko } from '../lib/toko/store'
import { emailValid, GalatToko, type TautanAuth } from '../lib/toko/tipe'
import { NotFound } from './NotFound'

/** Minta tautan atur ulang kata sandi lewat email. */
export function LupaSandi() {
  const tk = useToko()
  const navigate = useNavigate()
  const [tema] = useTemaGlobal()
  const { katakan } = useNalar()
  const [email, setEmail] = useState('')
  const [galat, setGalat] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const [terkirim, setTerkirim] = useState<{ email: string; demo?: TautanAuth } | null>(null)
  const idEmail = useId()
  const idGalat = useId()
  const refEmail = useRef<HTMLInputElement>(null)
  const [tokenCaptcha, setTokenCaptcha] = useState<string | null>(null)
  const captcha = useRef<PegangCaptcha>(null)

  useEffect(() => {
    refEmail.current?.focus()
  }, [])

  if (tk.mode === 'mati') return <NotFound judul="Fitur akun belum aktif" pesan="Pemilik web belum menyalakan akun dan pembayaran." />
  if (!tk.siap) {
    return (
      <div className="wadah grid min-h-[70vh] place-items-center pt-24" role="status">
        <p className="font-display text-xl font-bold">Memeriksa akunmu…</p>
      </div>
    )
  }

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
    if (ambilKunciCaptcha() && tk.mode === 'nyata' && !tokenCaptcha) {
      setGalat('Selesaikan cek manusia dulu, ya.')
      katakan('captchaBelum')
      return
    }
    setGalat('')
    setSibuk(true)
    try {
      const h = await ambilToko().kirimResetSandi(em, tokenCaptcha ?? undefined)
      setTerkirim({ email: em, demo: h.tautanDemo })
      katakan('sandiKirim')
    } catch (err) {
      setGalat(err instanceof GalatToko ? err.message : 'Terjadi kesalahan. Coba lagi.')
      katakan('tokoGalat')
    } finally {
      captcha.current?.reset()
      setSibuk(false)
    }
  }

  const bukaTautanDemo = async (t: TautanAuth) => {
    setSibuk(true)
    try {
      await ambilToko().pulihkanDariTautan(t)
      navigate('/atur-sandi', { replace: true })
    } catch (err) {
      setGalat(err instanceof GalatToko ? err.message : 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setSibuk(false)
    }
  }

  return (
    <div className="wadah flex min-h-[85vh] flex-col items-center justify-center gap-6 pb-16 pt-24">
      <div className="w-[min(220px,58vw)]">
        <Nalar kulit={kulitTemaGlobal(tema)} ukuran="besar" gelembung="atas" />
      </div>
      <Panel warna="kertas" miring={-0.6} className="w-full max-w-md px-5 py-6 sm:px-7">
        <p className="m-0 flex items-center gap-2 font-tangan text-2xl font-bold" style={{ color: '#8a3d00' }}>
          <Ikon n="kunci" ukuran={20} /> lupa kata sandi?
        </p>
        <h1 className="cat-judul m-0 font-display text-4xl font-black">Atur ulang sandi</h1>

        {tk.mode === 'demo' && <BannerDemo className="mt-3" />}

        {terkirim ? (
          <div role="status" className="mt-4">
            <p className="m-0 font-display text-xl font-bold">Cek emailmu 📬</p>
            <p className="mt-2">
              Kalau <strong className="break-all">{terkirim.email}</strong> terdaftar, tautan untuk membuat kata sandi baru sudah dikirim. Cek folder spam juga. Tautannya hanya berlaku sebentar dan sekali pakai.
            </p>
            {terkirim.demo && (
              <p className="m-0 mt-3 rounded-lg border-2 border-dashed p-3 text-sm" style={{ borderColor: 'var(--tinta)', background: '#fff3d6' }}>
                Mode DEMO tidak mengirim email sungguhan.{' '}
                <button type="button" className="font-semibold underline underline-offset-4" style={{ color: 'var(--tautan)' }} disabled={sibuk} onClick={() => terkirim.demo && bukaTautanDemo(terkirim.demo)}>
                  Buka tautan demo
                </button>
              </p>
            )}
            <p role="alert" className="m-0 mt-2 font-semibold" style={{ color: '#7a1608' }}>
              {galat}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link to="/masuk" className="tombol tombol-primer">
                Kembali ke halaman masuk
              </Link>
              <button
                type="button"
                className="tombol"
                onClick={() => {
                  setTerkirim(null)
                  setGalat('')
                }}
              >
                Pakai email lain
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={kirim} className="mt-4" noValidate>
            <p className="m-0 mb-3 text-[0.95rem]">Tulis email akunmu. Kami kirim tautan untuk membuat kata sandi baru.</p>
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
            <Captcha ref={captcha} onToken={setTokenCaptcha} />
            <p id={idGalat} role="alert" className="m-0 mt-2 min-h-[1.5rem] font-semibold" style={{ color: '#7a1608' }}>
              {galat}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button type="submit" className="tombol tombol-primer" disabled={sibuk} aria-busy={sibuk}>
                {sibuk ? 'Mengirim…' : 'Kirim tautan'}
              </button>
              <Link to="/masuk" className="tombol">
                Kembali
              </Link>
            </div>
          </form>
        )}
      </Panel>
    </div>
  )
}
