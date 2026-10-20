import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { NAMA_WEB } from '../../config'
import { useGerak } from '../../lib/gerak'
import { EBOOK_PERCOBAAN } from '../../lib/library'
import { useTemaGlobal } from '../../lib/store'
import { kulitTemaGlobal } from '../../lib/tema'
import { useToko } from '../../lib/toko/store'
import { Ikon, type NamaIkon } from '../art/Ikon'
import { Panel, type WarnaPanel } from '../art/Panel'
import { Nalar } from '../nalar/Nalar'

// Bagian "menjual" di beranda: cerita Nalar, keunggulan, cara kerja, ajakan mencoba, dan tanya-jawab.
// Semua klaim di sini sudah benar-benar ada di web (diuji di tests/promosi.test.ts), tanpa angka atau testimoni karangan.

function Muncul({ children, tunda = 0, className = '' }: { children: ReactNode; tunda?: number; className?: string }) {
  const gerak = useGerak()
  if (gerak.kurang) return <div className={className}>{children}</div>
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5, delay: tunda, ease: 'easeOut' }}>
      {children}
    </motion.div>
  )
}

export interface Keunggulan {
  ikon: NamaIkon
  judul: string
  isi: string
  warna: WarnaPanel
  miring: number
}

export const KEUNGGULAN: Keunggulan[] = [
  { ikon: 'catatan', judul: 'Sorot dan catatan tempel', isi: 'Sorot kalimat penting dengan tiga warna, tempel catatan di paragraf, dan tandai bagian yang mau dibaca ulang.', warna: 'kuning', miring: -0.8 },
  { ikon: 'bintang', judul: 'Kuis dan kartu balik', isi: 'Tiap bab punya kuis kecil dan kartu balik, supaya materinya menempel di ingatan, bukan cuma lewat.', warna: 'kertas', miring: 0.7 },
  { ikon: 'lampu', judul: 'Istilah yang bisa diketuk', isi: 'Istilah sulit bergaris putus-putus. Arahkan kursor atau ketuk, definisinya langsung muncul tanpa pindah halaman.', warna: 'biru', miring: -0.5 },
  { ikon: 'tanda', judul: 'Kemajuan tersimpan sendiri', isi: 'Posisi baca, sorotan, dan lencana Selesai Dibaca tersimpan otomatis di perangkatmu, jadi bisa lanjut kapan saja.', warna: 'kertas', miring: 0.6 },
  { ikon: 'bulan', judul: 'Dua suasana, satu gaya', isi: 'Pilih Malam Berbintang atau Ladang Matahari. Tiap buku punya sampul dan warna sendiri, tetap dalam gaya Van Gogh.', warna: 'ungu', miring: -0.6 },
  { ikon: 'suara', judul: 'Musik latar pilihan', isi: 'Lo-fi, ambient, hujan, atau suara alam. Nyalakan kalau mau, matikan kapan saja. Bawaannya hening.', warna: 'jingga', miring: 0.5 },
]

export interface Tanya {
  t: string
  j: string
}

/** Jawaban untuk pertanyaan yang mengandung pembayaran hanya tampil bila toko aktif. */
export const TANYA_JAWAB = (tokoAktif: boolean): Tanya[] => [
  {
    t: 'Perlu daftar untuk membaca?',
    j: tokoAktif ? 'Tidak untuk ebook gratis. Akun hanya dibutuhkan untuk membeli ebook berbayar dan membuka dasbor member.' : 'Tidak. Semua ebook yang tampil di rak bisa langsung dibaca tanpa akun.',
  },
  {
    t: 'Sorotan dan catatanku disimpan di mana?',
    j: 'Di browser perangkat yang kamu pakai. Kalau berganti HP atau komputer, atau menghapus data browser, sorotan dan catatan tidak ikut pindah. Untuk cadangan, simpan ebook dan catatanmu sendiri.',
  },
  {
    t: 'Bisa dibaca di HP?',
    j: 'Bisa. Tampilannya menyesuaikan layar, dan ukuran huruf bacaan bisa diperbesar atau diperkecil dari menu di dalam ebook.',
  },
  ...(tokoAktif
    ? [
        {
          t: 'Bayarnya pakai apa?',
          j: 'Lewat e-wallet atau QRIS melalui Midtrans. Ebook terbuka otomatis setelah pembayaran lunas, dan isinya hanya dikirim ke akun yang sudah membayar.',
        },
      ]
    : []),
  {
    t: 'Siapa yang menulis isinya?',
    j: 'Catatan sosiologi di sini ditulis sendiri oleh pemilik Ruang Nalar dari materi kuliah, lalu dirapikan jadi ebook interaktif.',
  },
]

function KartuKeunggulan({ k, i }: { k: Keunggulan; i: number }) {
  return (
    <Muncul tunda={(i % 3) * 0.08}>
      <Panel warna={k.warna} miring={k.miring} className="h-full px-5 py-5">
        <span className="grid h-11 w-11 place-items-center rounded-full border-2 border-tinta bg-kertas text-tinta" aria-hidden="true">
          <Ikon n={k.ikon} ukuran={22} />
        </span>
        <h3 className="m-0 mt-3 font-display text-xl font-bold leading-tight">{k.judul}</h3>
        <p className="m-0 mt-1.5 text-[0.97rem] leading-relaxed">{k.isi}</p>
      </Panel>
    </Muncul>
  )
}

export function Promosi() {
  const tk = useToko()
  const [tema] = useTemaGlobal()
  const kulit = kulitTemaGlobal(tema)
  const tokoAktif = tk.mode !== 'mati'
  const tanya = TANYA_JAWAB(tokoAktif)
  const keRak = () => document.getElementById('rak')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <>
      {/* cerita Nalar */}
      <section aria-labelledby="judul-cerita" className="wadah pt-24">
        <Muncul className="grid items-center gap-6 md:grid-cols-[minmax(0,260px)_1fr] md:gap-10">
          <div className="mx-auto w-[min(230px,60vw)] md:mx-0">
            <Nalar kulit={kulit} ukuran="besar" gelembung={false} />
          </div>
          <Panel warna="kertas" miring={-0.5} className="relative px-6 py-6 sm:px-8">
            <p className="m-0 font-tangan text-2xl font-bold text-[#8a3d00]">cerita Nalar</p>
            <h2 id="judul-cerita" className="cat-judul m-0 font-display text-3xl font-black leading-tight sm:text-4xl">
              Kenalan dulu, aku Nalar
            </h2>
            <p className="m-0 mt-3 text-lg leading-relaxed">
              Dulu aku cuma bunglon yang numpang tidur di pojok perpustakaan. Tiap ada mahasiswa pusing baca catatan sosiologi, kulitku ikut pucat. Jadi catatan-catatan itu kami rapikan jadi buku yang bisa disorot, dicatat, dikuis, dan dibalik kartunya.
            </p>
            <p className="m-0 mt-3 text-lg leading-relaxed">
              Sekarang kulitku berganti warna mengikuti isi bukunya. Biru kalau lagi merenung, kuning kalau lagi semangat. Mau lihat sendiri?
            </p>
          </Panel>
        </Muncul>
      </section>

      {/* keunggulan */}
      <section aria-labelledby="judul-keunggulan" className="wadah pt-24">
        <Muncul>
          <h2 id="judul-keunggulan" className="cat-judul m-0 font-display text-4xl font-black sm:text-5xl">
            Kenapa baca di {NAMA_WEB}?
          </h2>
          <p className="m-0 mt-2 max-w-2xl text-lg" style={{ color: 'var(--teks-redup)' }}>
            Bukan sekadar PDF yang dibuka lalu ditutup. Bukunya ikut bergerak bersama caramu belajar.
          </p>
        </Muncul>
        <ul className="m-0 mt-8 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {KEUNGGULAN.map((k, i) => (
            <li key={k.judul} className="m-0">
              <KartuKeunggulan k={k} i={i} />
            </li>
          ))}
        </ul>
      </section>

      {/* cara kerja */}
      <section aria-labelledby="judul-cara" className="wadah pt-24">
        <Muncul>
          <h2 id="judul-cara" className="cat-judul m-0 font-display text-4xl font-black sm:text-5xl">
            Cara kerjanya
          </h2>
        </Muncul>
        <ol className="m-0 mt-8 grid list-none gap-5 p-0 md:grid-cols-3">
          {[
            ['1', 'Pilih bukunya', 'Telusuri rak. Sampul tiap buku beda, dan labelnya jelas: gratis atau berbayar.'],
            ['2', 'Baca, sorot, catat', 'Gulir bab demi bab. Sorot, tempel catatan, dan tandai bagian yang penting.'],
            ['3', 'Uji nalarmu', 'Jawab kuis, balik kartu, dan kumpulkan lencana Selesai Dibaca dan Kuis Sempurna.'],
          ].map(([no, judul, isi], i) => (
            <li key={no} className="m-0">
              <Muncul tunda={i * 0.1} className="h-full">
                <Panel warna="kertas" miring={i === 1 ? 0.6 : -0.5} className="h-full px-5 py-6">
                  <span className="font-tangan text-6xl font-bold leading-none text-[#8a3d00]" aria-hidden="true">
                    {no}
                  </span>
                  <h3 className="m-0 mt-1 font-display text-2xl font-bold leading-tight">{judul}</h3>
                  <p className="m-0 mt-2 leading-relaxed">{isi}</p>
                </Panel>
              </Muncul>
            </li>
          ))}
        </ol>
      </section>

      {/* ajakan mencoba */}
      <section aria-labelledby="judul-coba" className="wadah pt-24">
        <Muncul>
          <Panel warna="kuning" miring={0.5} className="px-6 py-8 text-center sm:px-12">
            <p className="m-0 font-tangan text-2xl font-bold text-[#8a3d00]">gratis, tanpa daftar</p>
            <h2 id="judul-coba" className="cat-judul m-0 font-display text-3xl font-black leading-tight sm:text-5xl">
              Coba dulu, baru putuskan
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-lg leading-relaxed">
              {EBOOK_PERCOBAAN ? (
                <>
                  Buka <strong>{EBOOK_PERCOBAAN.parsed.meta.judul}</strong> sekarang dan rasakan sendiri sorotan, catatan, kuis, dan kartu baliknya. Tidak perlu akun, tidak perlu kartu apa pun.
                </>
              ) : (
                <>Telusuri rak di bawah dan buka satu ebook. Tidak perlu akun, tidak perlu kartu apa pun.</>
              )}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {EBOOK_PERCOBAAN ? (
                <Link to={`/baca/${EBOOK_PERCOBAAN.id}`} className="tombol tombol-primer">
                  <Ikon n="buku" ukuran={18} /> Coba Gratis
                </Link>
              ) : null}
              <button type="button" className={`tombol ${EBOOK_PERCOBAAN ? '' : 'tombol-primer'}`} onClick={keRak}>
                Mulai Membaca
              </button>
            </div>
          </Panel>
        </Muncul>
      </section>

      {/* gratis dan berbayar */}
      {tokoAktif && (
        <section aria-labelledby="judul-berbayar" className="wadah pt-24">
          <Muncul>
            <Panel warna="malam" miring={-0.4} className="px-6 py-7 sm:px-10">
              <h2 id="judul-berbayar" className="m-0 font-display text-3xl font-black leading-tight">
                Ada yang gratis, ada yang berbayar
              </h2>
              <p className="m-0 mt-2 max-w-3xl text-lg leading-relaxed">
                Ebook berlabel harga dibuka setelah kamu masuk dan membayar lewat e-wallet atau QRIS. Isinya disimpan di server dan hanya dikirim ke akun yang sudah lunas, jadi tidak bisa diambil lewat kode web.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to="/masuk?tab=daftar" className="tombol tombol-primer">
                  <Ikon n="pengguna" ukuran={18} /> Buat akun
                </Link>
                <Link to="/masuk" className="tombol">
                  Sudah punya akun? Masuk
                </Link>
              </div>
            </Panel>
          </Muncul>
        </section>
      )}

      {/* tanya jawab */}
      <section aria-labelledby="judul-tanya" className="wadah pt-24">
        <Muncul>
          <h2 id="judul-tanya" className="cat-judul m-0 font-display text-4xl font-black sm:text-5xl">
            Yang sering ditanyakan
          </h2>
        </Muncul>
        <div className="mt-6 grid gap-3">
          {tanya.map((q) => (
            <Panel key={q.t} warna="kertas" className="px-5 py-1">
              <details className="group py-2">
                <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 font-display text-lg font-bold leading-snug">
                  <span>{q.t}</span>
                  <span aria-hidden="true" className="shrink-0 transition-transform group-open:rotate-180">
                    <Ikon n="turun" ukuran={20} />
                  </span>
                </summary>
                <p className="m-0 pb-3 pt-1 leading-relaxed">{q.j}</p>
              </details>
            </Panel>
          ))}
        </div>
      </section>
    </>
  )
}
