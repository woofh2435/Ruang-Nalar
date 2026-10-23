import { useState } from 'react'
import { Ikon } from '../../components/art/Ikon'
import { Panel } from '../../components/art/Panel'
import { KepalaHalaman } from '../../components/dasbor/KepalaHalaman'
import { PrivasiAkun } from '../../components/legal/PrivasiAkun'
import { useNalar } from '../../components/nalar/NalarContext'
import { BannerDemo } from '../../components/toko/BannerDemo'
import { FormGantiSandi } from '../../components/toko/FormGantiSandi'
import { UKURAN_HURUF, ukuranValid } from '../../lib/huruf'
import { K, useKv, useTemaGlobal } from '../../lib/store'
import { ambilToko, useToko } from '../../lib/toko/store'
import { GalatToko } from '../../lib/toko/tipe'

function Bagian({ id, judul, children }: { id: string; judul: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="mb-8">
      <h2 id={id} className="m-0 mb-3 font-display text-2xl font-black" style={{ color: 'var(--teks)' }}>
        {judul}
      </h2>
      {children}
    </section>
  )
}

/** Akun & pengaturan: profil, ganti kata sandi, tampilan (tema web, ukuran huruf, Nalar), dan keluar. */
export function AkunDasbor() {
  const tk = useToko()
  const { katakan } = useNalar()
  const [tema, setTema] = useTemaGlobal()
  const [hurufTersimpan, setHuruf] = useKv<number>(K.fontBaca, 18)
  const [nalarKecil, setNalarKecil] = useKv<boolean | null>(K.nalarKecil, null)
  const huruf = ukuranValid(hurufTersimpan)
  const [galat, setGalat] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const tokoAktif = tk.mode !== 'mati'

  const keluar = async () => {
    setSibuk(true)
    setGalat('')
    try {
      await ambilToko().keluar()
      katakan('tokoKeluar')
    } catch (e) {
      setGalat(e instanceof GalatToko ? e.message : 'Gagal keluar. Coba lagi.')
    } finally {
      setSibuk(false)
    }
  }

  return (
    <>
      <KepalaHalaman kecil="data dan kenyamanan" judul="Akun & pengaturan" />

      <Bagian id="judul-profil" judul="Profil">
        <Panel warna="kertas" className="px-5 py-5">
          {tk.sesi ? (
            <>
              <dl className="m-0 grid gap-x-4 gap-y-2 sm:grid-cols-[8rem_1fr]">
                <dt className="font-semibold">Email</dt>
                <dd className="m-0 break-all">{tk.sesi.email}</dd>
                <dt className="font-semibold">Peran</dt>
                <dd className="m-0">
                  {tk.sesi.admin ? (
                    <span className="chip" style={{ background: '#e4dcf8', color: '#2d1f66' }}>
                      Admin
                    </span>
                  ) : (
                    'Pembaca'
                  )}
                </dd>
              </dl>
              {tk.mode === 'demo' && <BannerDemo className="mt-3" />}
              <button type="button" className="tombol mt-4" disabled={sibuk} onClick={keluar}>
                <Ikon n="keluar" ukuran={18} /> {sibuk ? 'Keluar…' : 'Keluar dari akun'}
              </button>
              <p role="alert" className="m-0 mt-2 font-semibold" style={{ color: '#7a1608' }}>
                {galat}
              </p>
            </>
          ) : (
            <p className="m-0">Fitur akun belum dinyalakan oleh pemilik web. Semua pengaturan dan bacaanmu tersimpan di perangkat ini saja.</p>
          )}
        </Panel>
      </Bagian>

      {tk.sesi && tokoAktif && (
        <Bagian id="judul-ganti-sandi" judul="Ganti kata sandi">
          <Panel warna="kertas" className="max-w-md px-5 py-5">
            <FormGantiSandi />
          </Panel>
        </Bagian>
      )}

      <Bagian id="judul-privasi" judul="Privasi & persetujuan">
        <PrivasiAkun />
      </Bagian>

      <Bagian id="judul-tampilan" judul="Tampilan">
        <Panel warna="kertas" className="px-5 py-5">
          <fieldset className="m-0 border-0 p-0">
            <legend className="mb-2 p-0 font-semibold">Suasana web</legend>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['malam', 'Malam Berbintang'],
                  ['ladang', 'Ladang Matahari'],
                ] as const
              ).map(([id, nama]) => (
                <button
                  key={id}
                  type="button"
                  className="tombol"
                  aria-pressed={tema === id}
                  style={tema === id ? { background: 'var(--kuning-pusaran)' } : undefined}
                  onClick={() => {
                    setTema(id)
                    katakan(id === 'malam' ? 'temaMalam' : 'temaLadang')
                  }}
                >
                  <Ikon n={id === 'malam' ? 'bulan' : 'matahari'} ukuran={18} /> {nama}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-5">
            <label htmlFor="ukuran-huruf" className="mb-1 block font-semibold">
              Ukuran huruf bacaan
            </label>
            <select id="ukuran-huruf" className="input max-w-[12rem]" value={huruf} onChange={(e) => setHuruf(Number(e.target.value))}>
              {UKURAN_HURUF.map((u) => (
                <option key={u} value={u}>
                  {u} px
                </option>
              ))}
            </select>
            <p className="m-0 mt-2" style={{ fontSize: huruf, lineHeight: 1.5 }} aria-hidden="true">
              Contoh bacaan pada ukuran ini.
            </p>
          </div>

          <div className="mt-5">
            <p className="m-0 mb-2 font-semibold">Nalar di layar baca</p>
            <button
              type="button"
              className="tombol"
              aria-pressed={nalarKecil === true}
              onClick={() => setNalarKecil(nalarKecil === true ? false : true)}
            >
              {nalarKecil === true ? 'Nalar disembunyikan. Tampilkan' : 'Sembunyikan Nalar saat membaca'}
            </button>
          </div>
        </Panel>
      </Bagian>
    </>
  )
}
