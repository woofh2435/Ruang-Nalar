import { useId, useState, type FormEvent } from 'react'
import { Ikon } from '../art/Ikon'
import { useNalar } from '../nalar/NalarContext'
import { ambilToko } from '../../lib/toko/store'
import { GalatToko, SANDI_MIN } from '../../lib/toko/tipe'

/** Form ganti kata sandi untuk akun yang sedang masuk. Dipakai di halaman "atur sandi" dan di Akun. */
export function FormGantiSandi({ onSelesai, tombol = 'Simpan kata sandi baru' }: { onSelesai?: () => void; tombol?: string }) {
  const { katakan } = useNalar()
  const [sandi, setSandi] = useState('')
  const [ulang, setUlang] = useState('')
  const [lihat, setLihat] = useState(false)
  const [galat, setGalat] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const [berhasil, setBerhasil] = useState(false)
  const idSandi = useId()
  const idUlang = useId()
  const idHint = useId()
  const idGalat = useId()

  const kirim = async (e: FormEvent) => {
    e.preventDefault()
    if (sibuk) return
    if (sandi.length < SANDI_MIN) {
      setGalat(`Kata sandi minimal ${SANDI_MIN} karakter.`)
      katakan('tokoGalat')
      return
    }
    if (sandi !== ulang) {
      setGalat('Kata sandi dan pengulangannya belum sama.')
      katakan('tokoGalat')
      return
    }
    setGalat('')
    setSibuk(true)
    try {
      await ambilToko().ubahSandi(sandi)
      setBerhasil(true)
      setSandi('')
      setUlang('')
      katakan('sandiBaru')
      onSelesai?.()
    } catch (err) {
      setGalat(err instanceof GalatToko ? err.message : 'Terjadi kesalahan. Coba lagi.')
      katakan('tokoGalat')
    } finally {
      setSibuk(false)
    }
  }

  return (
    <form onSubmit={kirim} noValidate>
      <label htmlFor={idSandi} className="mb-1 block font-semibold">
        Kata sandi baru
      </label>
      <div className="flex gap-2">
        <input
          id={idSandi}
          type={lihat ? 'text' : 'password'}
          autoComplete="new-password"
          className="input"
          value={sandi}
          aria-describedby={idHint}
          onChange={(e) => {
            setSandi(e.target.value)
            setGalat('')
            setBerhasil(false)
          }}
        />
        <button type="button" className="tombol tombol-ikon shrink-0" aria-label={lihat ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} aria-pressed={lihat} onClick={() => setLihat((v) => !v)}>
          <Ikon n="mata" ukuran={18} />
        </button>
      </div>
      <p id={idHint} className="m-0 mt-1 text-sm" style={{ color: 'var(--tinta-redup)' }}>
        Minimal {SANDI_MIN} karakter. Pakai sandi yang tidak kamu pakai di tempat lain.
      </p>
      <label htmlFor={idUlang} className="mb-1 mt-3 block font-semibold">
        Ulangi kata sandi baru
      </label>
      <input
        id={idUlang}
        type={lihat ? 'text' : 'password'}
        autoComplete="new-password"
        className="input"
        value={ulang}
        aria-describedby={galat ? idGalat : undefined}
        aria-invalid={!!galat}
        onChange={(e) => {
          setUlang(e.target.value)
          setGalat('')
          setBerhasil(false)
        }}
      />
      <p id={idGalat} role="alert" className="m-0 mt-2 min-h-[1.5rem] font-semibold" style={{ color: '#7a1608' }}>
        {galat}
      </p>
      <p role="status" className="m-0 min-h-[1.5rem] font-semibold" style={{ color: '#1f4a12' }}>
        {berhasil ? 'Kata sandi baru tersimpan.' : ''}
      </p>
      <button type="submit" className="tombol tombol-primer mt-1" disabled={sibuk} aria-busy={sibuk}>
        {sibuk ? 'Sebentar…' : tombol}
      </button>
    </form>
  )
}
