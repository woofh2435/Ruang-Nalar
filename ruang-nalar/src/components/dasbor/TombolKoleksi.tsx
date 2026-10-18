import { useNalar } from '../nalar/NalarContext'
import { Ikon } from '../art/Ikon'
import { useFavorit, useRak } from '../../lib/koleksi'

/** Dua tombol kecil: simpan ke rak pribadi, dan tandai favorit. Dipakai di pembaca, pencarian, dan dasbor. */
export function TombolKoleksi({ ebookId, judul, kecil = false }: { ebookId: string; judul: string; kecil?: boolean }) {
  const rak = useRak()
  const fav = useFavorit()
  const { katakanTeks } = useNalar()
  const disimpan = rak.ada(ebookId)
  const favorit = fav.ada(ebookId)
  const kelas = `tombol ${kecil ? 'tombol-kecil' : ''}`
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`Koleksi untuk ${judul}`}>
      <button
        type="button"
        className={kelas}
        aria-pressed={disimpan}
        style={disimpan ? { background: 'var(--kuning-pusaran)' } : undefined}
        onClick={() => {
          const sekarang = rak.geser(ebookId)
          katakanTeks(sekarang ? 'Masuk rakmu! Gampang dicari nanti.' : 'Dilepas dari rakmu.', sekarang ? 'senang' : 'mikir')
        }}
      >
        <Ikon n={disimpan ? 'cek' : 'buku'} ukuran={16} />
        {disimpan ? 'Di rakku' : 'Simpan ke rak'}
      </button>
      <button
        type="button"
        className={kelas}
        aria-pressed={favorit}
        aria-label={favorit ? `Hapus ${judul} dari favorit` : `Jadikan ${judul} favorit`}
        style={favorit ? { background: '#fbd9c8', borderColor: '#7a1f0d' } : undefined}
        onClick={() => {
          const sekarang = fav.geser(ebookId)
          katakanTeks(sekarang ? 'Favorit baru! Seleramu bagus.' : 'Favorit dilepas.', sekarang ? 'bangga' : 'mikir')
        }}
      >
        <Ikon n="hati" ukuran={16} />
        {favorit ? 'Favorit' : 'Favoritkan'}
      </button>
    </div>
  )
}
