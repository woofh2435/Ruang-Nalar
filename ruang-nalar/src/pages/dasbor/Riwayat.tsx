import { Link } from 'react-router-dom'
import { Ikon } from '../../components/art/Ikon'
import { Panel } from '../../components/art/Panel'
import { KepalaHalaman, KosongPanel } from '../../components/dasbor/KepalaHalaman'
import { riwayatBaca } from '../../lib/dasbor'
import { useEbookTerbit } from '../../lib/library'
import { useKvSemua } from '../../lib/store'

const waktu = (ms: number) => (ms > 0 ? new Date(ms).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'waktu tidak tercatat')

/** Riwayat baca: semua ebook yang pernah dibuka, dari yang terbaru. */
export function Riwayat() {
  const semua = useEbookTerbit()
  const kv = useKvSemua()
  const daftar = riwayatBaca(semua, kv)

  return (
    <>
      <KepalaHalaman kecil="jejak langkahmu" judul="Riwayat baca">
        <p className="m-0">Dicatat di perangkat ini saja. Tidak dikirim ke mana-mana.</p>
      </KepalaHalaman>

      {daftar.length === 0 ? (
        <KosongPanel judul="Belum ada riwayat">
          <p className="m-0">Buka satu ebook, lalu bacaanmu akan tercatat otomatis di sini.</p>
          <Link to="/dasbor/cari" className="tombol tombol-primer mt-3">
            <Ikon n="cari" ukuran={18} /> Cari ebook
          </Link>
        </KosongPanel>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {daftar.map((r) => (
            <li key={r.ebook.id} className="m-0">
              <Panel warna="kertas" className="px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="m-0 font-display text-xl font-bold leading-tight">{r.ebook.parsed.meta.judul}</h2>
                    <p className="m-0 mt-1 text-sm" style={{ color: 'var(--tinta-redup)' }}>
                      Terakhir dibaca {waktu(r.terakhir)}
                    </p>
                    <p className="m-0 mt-1 text-sm">
                      {r.babSelesai} dari {r.totalBab} bab selesai · {r.persen}%
                    </p>
                  </div>
                  {r.persen >= 100 && (
                    <span className="chip shrink-0" style={{ background: '#dff0d2', color: '#1f4a12' }}>
                      Tamat
                    </span>
                  )}
                </div>
                <div
                  role="progressbar"
                  aria-label={`Kemajuan ${r.ebook.parsed.meta.judul}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={r.persen}
                  className="mt-3 h-2.5 overflow-hidden rounded-full border-2 border-tinta"
                  style={{ background: '#e7dcc0' }}
                >
                  <div className="h-full" style={{ width: `${r.persen}%`, background: 'var(--kuning-pusaran)' }} />
                </div>
                <Link
                  to={`/baca/${r.ebook.id}?bab=${r.babTerakhir + 1}`}
                  className="tombol tombol-kecil mt-3"
                  aria-label={`${r.persen >= 100 ? 'Baca ulang' : 'Lanjut baca'} ${r.ebook.parsed.meta.judul}`}
                >
                  <Ikon n="buku" ukuran={16} /> {r.persen >= 100 ? 'Baca ulang' : 'Lanjut baca'}
                </Link>
              </Panel>
            </li>
          ))}
        </ol>
      )}
    </>
  )
}
