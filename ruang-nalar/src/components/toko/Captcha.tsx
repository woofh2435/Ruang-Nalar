import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { muatTurnstile, useKunciCaptcha, type ApiTurnstile } from '../../lib/toko/captcha'
import { useToko } from '../../lib/toko/store'

export interface PegangCaptcha {
  /** token hanya berlaku sekali: panggil setelah tiap percobaan */
  reset(): void
}

interface Props {
  onToken: (token: string | null) => void
}

/** Kotak "cek manusia" (Cloudflare Turnstile). Tidak menampilkan apa-apa bila CAPTCHA tidak dinyalakan atau mode demo. */
export const Captcha = forwardRef<PegangCaptcha, Props>(function Captcha({ onToken }, ref) {
  const kunci = useKunciCaptcha()
  const { mode } = useToko()
  const aktif = !!kunci && mode === 'nyata'
  const wadah = useRef<HTMLDivElement>(null)
  const idWidget = useRef<string | undefined>(undefined)
  const api = useRef<ApiTurnstile | null>(null)
  const [galat, setGalat] = useState(false)
  const kirimToken = useRef(onToken)
  kirimToken.current = onToken

  useImperativeHandle(ref, () => ({
    reset() {
      kirimToken.current(null)
      try {
        if (api.current) api.current.reset(idWidget.current)
      } catch {
        /* abaikan */
      }
    },
  }))

  useEffect(() => {
    if (!aktif || !wadah.current) return
    let batal = false
    setGalat(false)
    muatTurnstile()
      .then((t) => {
        if (batal || !wadah.current) return
        api.current = t
        idWidget.current = t.render(wadah.current, {
          sitekey: kunci,
          theme: 'light',
          language: 'id',
          callback: (token) => kirimToken.current(token),
          'expired-callback': () => kirimToken.current(null),
          'error-callback': () => {
            kirimToken.current(null)
            setGalat(true)
          },
        })
      })
      .catch(() => {
        if (!batal) setGalat(true)
      })
    return () => {
      batal = true
      kirimToken.current(null)
      try {
        if (api.current && idWidget.current !== undefined) api.current.remove(idWidget.current)
      } catch {
        /* abaikan */
      }
      idWidget.current = undefined
    }
  }, [aktif, kunci])

  if (!aktif) return null
  return (
    <div className="mt-3">
      <div ref={wadah} data-captcha className="min-h-[65px]" />
      {galat && (
        <p role="alert" className="m-0 mt-1 text-sm font-semibold" style={{ color: '#7a1608' }}>
          Cek manusia gagal dimuat. Matikan pemblokir iklan untuk halaman ini, lalu muat ulang.
        </p>
      )}
    </div>
  )
})
