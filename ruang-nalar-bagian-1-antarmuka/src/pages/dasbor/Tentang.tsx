import { Link } from 'react-router-dom'
import { Ikon } from '../../components/art/Ikon'
import { Panel } from '../../components/art/Panel'
import { KepalaHalaman } from '../../components/dasbor/KepalaHalaman'
import { Nalar } from '../../components/nalar/Nalar'
import { NAMA_PENULIS_DEFAULT, NAMA_WEB } from '../../config'
import { useProfil } from '../../lib/profil'
import { useTemaGlobal } from '../../lib/store'
import { kulitTemaGlobal } from '../../lib/tema'

/** About Me: cerita pembuat + kontak. Isinya dari src/config.ts atau toko-config.json (TENTANG_PEMBUAT, KONTAK_EMAIL, TAUTAN). */
export function Tentang() {
  const p = useProfil()
  const [tema] = useTemaGlobal()
  const adaKontak = !!p.kontakEmail || p.tautan.length > 0

  return (
    <>
      <KepalaHalaman kecil="kenalan dulu" judul="About Me" />

      <div className="grid items-start gap-6 md:grid-cols-[1fr_12rem]">
        <Panel warna="kertas" miring={-0.3} className="px-5 py-5 sm:px-7">
          <h2 className="m-0 font-display text-2xl font-black">Siapa di balik {NAMA_WEB}?</h2>
          <p className="m-0 mt-1 font-tangan text-xl font-bold" style={{ color: '#8a3d00' }}>
            {NAMA_PENULIS_DEFAULT}
          </p>
          <p className="m-0 mt-3 whitespace-pre-line leading-relaxed">{p.tentang}</p>
          <p className="m-0 mt-3 leading-relaxed">
            Maskotnya Nalar, bunglon yang warna kulitnya mengikuti tema ebook. Ia menemanimu menyorot, mencatat, dan mengerjakan kuis.
          </p>

          <h3 className="m-0 mt-6 font-display text-xl font-bold">Hubungi</h3>
          {adaKontak ? (
            <ul className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0">
              {p.kontakEmail && (
                <li className="m-0">
                  <a className="tombol tombol-kecil" href={`mailto:${p.kontakEmail}`}>
                    <Ikon n="surat" ukuran={16} /> {p.kontakEmail}
                  </a>
                </li>
              )}
              {p.tautan.map((t) => (
                <li key={t.url} className="m-0">
                  <a className="tombol tombol-kecil" href={t.url} target="_blank" rel="noopener noreferrer">
                    {t.label}
                    <span className="sr-only"> (buka di tab baru)</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 mt-2">Kontak belum dicantumkan oleh pemilik web.</p>
          )}

          <p className="m-0 mt-6">
            <Link to="/klien" className="font-semibold underline underline-offset-4" style={{ color: 'var(--tautan)' }}>
              Lihat tinjauan platform untuk peninjau
            </Link>
          </p>
        </Panel>

        <div className="mx-auto w-[min(11rem,60vw)]">
          <Nalar kulit={kulitTemaGlobal(tema)} ukuran="besar" gelembung="atas" />
        </div>
      </div>
    </>
  )
}
