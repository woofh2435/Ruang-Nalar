import { Link } from 'react-router-dom'
import { KepalaHalaman, KosongPanel } from '../../components/dasbor/KepalaHalaman'
import { GridEbook } from '../../components/dasbor/GridEbook'
import { saringId } from '../../lib/koleksi'
import { useRak } from '../../lib/koleksi'
import { useEbookTerbit } from '../../lib/library'
import { dimiliki, useToko } from '../../lib/toko/store'

/** Rak pribadi: ebook yang disimpan, ditambah ebook berbayar yang sudah dimiliki. */
export function Rak() {
  const tk = useToko()
  const semua = useEbookTerbit()
  const rak = useRak()
  const ada = new Set(semua.map((e) => e.id))
  const idRak = saringId(rak.ids, ada)
  const disimpan = idRak.map((id) => semua.find((e) => e.id === id)).filter((e): e is NonNullable<typeof e> => !!e)
  const sudahDi = new Set(idRak)
  const dibeli = semua.filter((e) => e.sumber === 'toko' && dimiliki(tk, e.id) && !sudahDi.has(e.id))

  return (
    <>
      <KepalaHalaman kecil="koleksi pribadi" judul="Rakku">
        <p className="m-0">Ebook yang kamu simpan ada di sini, jadi tidak perlu mencari lagi.</p>
      </KepalaHalaman>

      {disimpan.length === 0 && dibeli.length === 0 ? (
        <KosongPanel judul="Rakmu masih kosong">
          <p className="m-0">
            Buka ebook lalu tekan “Simpan ke rak”, atau mulai dari{' '}
            <Link to="/dasbor/cari" className="font-semibold underline underline-offset-4" style={{ color: 'var(--tautan)' }}>
              pencarian
            </Link>
            .
          </p>
        </KosongPanel>
      ) : (
        <>
          {disimpan.length > 0 && (
            <section aria-labelledby="judul-simpanan" className="mb-10">
              <h2 id="judul-simpanan" className="m-0 mb-4 font-display text-2xl font-black" style={{ color: 'var(--teks)' }}>
                Yang kusimpan ({disimpan.length})
              </h2>
              <GridEbook daftar={disimpan} />
            </section>
          )}
          {dibeli.length > 0 && (
            <section aria-labelledby="judul-dibeli">
              <h2 id="judul-dibeli" className="m-0 mb-4 font-display text-2xl font-black" style={{ color: 'var(--teks)' }}>
                Ebook berbayar yang kumiliki ({dibeli.length})
              </h2>
              <GridEbook daftar={dibeli} />
            </section>
          )}
        </>
      )}
    </>
  )
}
