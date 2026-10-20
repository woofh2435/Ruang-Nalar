import { Link } from 'react-router-dom'
import { Ikon } from '../../components/art/Ikon'
import { Panel } from '../../components/art/Panel'
import { GridEbook } from '../../components/dasbor/GridEbook'
import { KepalaHalaman, KosongPanel } from '../../components/dasbor/KepalaHalaman'
import { daftarPenanda } from '../../lib/dasbor'
import { saringId, useFavorit } from '../../lib/koleksi'
import { useEbookTerbit } from '../../lib/library'
import { useKvSemua } from '../../lib/store'

/** Favorit: ebook yang ditandai hati, ditambah semua penanda paragraf dari semua ebook. */
export function Favorit() {
  const semua = useEbookTerbit()
  const fav = useFavorit()
  const kv = useKvSemua()
  const ada = new Set(semua.map((e) => e.id))
  const idFav = saringId(fav.ids, ada)
  const ebook = idFav.map((id) => semua.find((e) => e.id === id)).filter((e): e is NonNullable<typeof e> => !!e)
  const penanda = daftarPenanda(
    semua.filter((e) => !e.terkunci),
    kv,
  )

  return (
    <>
      <KepalaHalaman kecil="yang paling kamu suka" judul="Favorit">
        <p className="m-0">Ebook yang kamu beri hati dan kalimat yang kamu tandai.</p>
      </KepalaHalaman>

      <section aria-labelledby="judul-ebook-fav" className="mb-10">
        <h2 id="judul-ebook-fav" className="m-0 mb-4 font-display text-2xl font-black" style={{ color: 'var(--teks)' }}>
          Ebook favorit ({ebook.length})
        </h2>
        {ebook.length === 0 ? (
          <KosongPanel judul="Belum ada favorit">
            <p className="m-0">Tekan “Favoritkan” di ebook yang kamu suka.</p>
          </KosongPanel>
        ) : (
          <GridEbook daftar={ebook} />
        )}
      </section>

      <section aria-labelledby="judul-penanda">
        <h2 id="judul-penanda" className="m-0 mb-4 font-display text-2xl font-black" style={{ color: 'var(--teks)' }}>
          Penanda bacaan ({penanda.length})
        </h2>
        {penanda.length === 0 ? (
          <KosongPanel judul="Belum ada penanda">
            <p className="m-0">Saat membaca, tekan ikon penanda di sebuah paragraf untuk menyimpannya di sini.</p>
          </KosongPanel>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {penanda.map((p) => (
              <li key={`${p.ebook.id}:${p.paraId}`} className="m-0">
                <Panel warna="kertas" className="px-4 py-4">
                  <p className="m-0 text-sm font-semibold" style={{ color: 'var(--tinta-redup)' }}>
                    {p.ebook.parsed.meta.judul} · Bab {p.babIdx + 1}
                  </p>
                  <p className="m-0 mt-1">“{p.cuplikan}”</p>
                  <Link to={`/baca/${p.ebook.id}?bab=${p.babIdx + 1}`} className="tombol tombol-kecil mt-3" aria-label={`Buka ${p.ebook.parsed.meta.judul}, bab ${p.babIdx + 1}`}>
                    <Ikon n="buku" ukuran={16} /> Buka bab ini
                  </Link>
                </Panel>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
