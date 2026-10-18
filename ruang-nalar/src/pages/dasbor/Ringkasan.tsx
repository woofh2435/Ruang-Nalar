import { Link } from 'react-router-dom'
import { Ikon } from '../../components/art/Ikon'
import { Panel } from '../../components/art/Panel'
import { SampulBuku } from '../../components/art/Sampul'
import { namaDariEmail } from '../../components/dasbor/DasborLayout'
import { KepalaHalaman } from '../../components/dasbor/KepalaHalaman'
import { BannerDemo } from '../../components/toko/BannerDemo'
import { riwayatBaca, ringkasBaca, sapaanWaktu } from '../../lib/dasbor'
import { useRak } from '../../lib/koleksi'
import { EBOOK_PERCOBAAN, useEbookTerbit } from '../../lib/library'
import { useKvSemua } from '../../lib/store'
import { useToko } from '../../lib/toko/store'

function Angka({ nilai, label }: { nilai: number; label: string }) {
  return (
    <li className="m-0">
      <Panel warna="kertas" className="h-full px-4 py-3 text-center">
        <p className="cat-judul m-0 font-display text-4xl font-black leading-none">{nilai}</p>
        <p className="m-0 mt-1 text-sm font-semibold">{label}</p>
      </Panel>
    </li>
  )
}

export function Ringkasan() {
  const tk = useToko()
  const daftar = useEbookTerbit()
  const kv = useKvSemua()
  const rak = useRak()
  const riwayat = riwayatBaca(daftar, kv)
  const r = ringkasBaca(daftar, kv)
  const lanjut = riwayat.find((x) => x.persen < 100 && !x.ebook.terkunci) ?? null
  const nama = namaDariEmail(tk.sesi?.email)
  const sapa = sapaanWaktu(new Date().getHours())
  const idAda = new Set(daftar.map((e) => e.id))
  const rakAda = daftar.filter((e) => rak.ids.includes(e.id) && idAda.has(e.id)).slice(0, 4)
  const belumMulai = riwayat.length === 0

  return (
    <>
      <KepalaHalaman kecil={nama ? `${sapa}, ${nama}!` : `${sapa}!`} judul="Ringkasan bacaanmu">
        <p className="m-0">Semua angka di bawah dihitung dari bacaan di perangkat ini.</p>
        {tk.mode === 'demo' && <BannerDemo className="mt-3" />}
      </KepalaHalaman>

      <section aria-labelledby="judul-lanjut" className="mb-10">
        <h2 id="judul-lanjut" className="m-0 mb-3 font-display text-2xl font-black" style={{ color: 'var(--teks)' }}>
          {lanjut ? 'Lanjutkan membaca' : 'Mulai dari mana?'}
        </h2>
        {lanjut ? (
          <Panel warna="kertas" miring={0.4} className="px-5 py-5">
            <div className="grid items-center gap-5 sm:grid-cols-[9.5rem_1fr]">
              <div className="mx-auto w-[9.5rem]">
                <SampulBuku ebook={lanjut.ebook} />
              </div>
              <div className="min-w-0">
                <h3 className="m-0 font-display text-2xl font-bold leading-tight">{lanjut.ebook.parsed.meta.judul}</h3>
                <p className="m-0 mt-1">
                  Bab {lanjut.babTerakhir + 1} dari {lanjut.totalBab} · {lanjut.persen}% selesai
                </p>
                <div
                  role="progressbar"
                  aria-label={`Kemajuan membaca ${lanjut.ebook.parsed.meta.judul}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={lanjut.persen}
                  className="mt-2 h-3 overflow-hidden rounded-full border-2 border-tinta"
                  style={{ background: '#e7dcc0' }}
                >
                  <div className="h-full" style={{ width: `${lanjut.persen}%`, background: 'var(--kuning-pusaran)' }} />
                </div>
                <Link to={`/baca/${lanjut.ebook.id}?bab=${lanjut.babTerakhir + 1}`} className="tombol tombol-primer mt-4">
                  <Ikon n="buku" ukuran={18} /> Lanjut baca
                </Link>
              </div>
            </div>
          </Panel>
        ) : (
          <Panel warna="kertas" miring={0.4} className="px-5 py-5">
            <p className="m-0 font-display text-xl font-bold">{belumMulai ? 'Belum ada yang kamu baca.' : 'Semua bacaanmu sudah tuntas. Hebat!'}</p>
            <p className="m-0 mt-1">{belumMulai ? 'Pilih satu ebook, Nalar akan menemanimu.' : 'Cari ebook lain untuk dijelajahi.'}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {EBOOK_PERCOBAAN && belumMulai && (
                <Link to={`/baca/${EBOOK_PERCOBAAN.id}`} className="tombol tombol-primer">
                  Baca “{EBOOK_PERCOBAAN.parsed.meta.judul}”
                </Link>
              )}
              <Link to="/dasbor/cari" className="tombol">
                <Ikon n="cari" ukuran={18} /> Cari ebook
              </Link>
            </div>
          </Panel>
        )}
      </section>

      <section aria-labelledby="judul-angka" className="mb-10">
        <h2 id="judul-angka" className="m-0 mb-3 font-display text-2xl font-black" style={{ color: 'var(--teks)' }}>
          Jejak belajarmu
        </h2>
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-4">
          <Angka nilai={r.ebookDibuka} label="Ebook dibuka" />
          <Angka nilai={r.ebookSelesai} label="Ebook tamat" />
          <Angka nilai={r.babSelesai} label="Bab selesai" />
          <Angka nilai={r.kuisSempurna} label="Kuis sempurna" />
          <Angka nilai={r.sorotan} label="Sorotan" />
          <Angka nilai={r.catatan} label="Catatan" />
          <Angka nilai={r.penanda} label="Penanda" />
          <Angka nilai={rak.ids.filter((id) => idAda.has(id)).length} label="Di rakku" />
        </ul>
      </section>

      <section aria-labelledby="judul-rak-mini">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 id="judul-rak-mini" className="m-0 font-display text-2xl font-black" style={{ color: 'var(--teks)' }}>
            Rakku
          </h2>
          <Link to="/dasbor/rak" className="font-semibold underline underline-offset-4" style={{ color: 'var(--teks)' }}>
            Lihat semua
          </Link>
        </div>
        {rakAda.length === 0 ? (
          <Panel warna="kertas" className="px-5 py-5">
            <p className="m-0">
              Rakmu masih kosong. Tekan “Simpan ke rak” di ebook mana pun untuk menaruhnya di sini, atau{' '}
              <Link to="/dasbor/cari" className="font-semibold underline underline-offset-4" style={{ color: 'var(--tautan)' }}>
                cari ebook
              </Link>
              .
            </p>
          </Panel>
        ) : (
          <ul className="m-0 grid list-none gap-5 p-0" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 9.5rem), 1fr))' }}>
            {rakAda.map((e) => (
              <li key={e.id} className="m-0">
                <SampulBuku ebook={e} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
