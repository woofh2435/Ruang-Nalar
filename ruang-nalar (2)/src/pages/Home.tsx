import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BungaMatahari } from '../components/art/BungaMatahari'
import { Iris } from '../components/art/Iris'
import { JendelaKafe } from '../components/art/JendelaKafe'
import { MatahariApi } from '../components/art/MatahariApi'
import { Panel } from '../components/art/Panel'
import { Pusaran } from '../components/art/Pusaran'
import { RantingAlmond } from '../components/art/RantingAlmond'
import { SampulBuku } from '../components/art/Sampul'
import { Footer } from '../components/Footer'
import { Nalar } from '../components/nalar/Nalar'
import { useNalar } from '../components/nalar/NalarContext'
import { NAMA_WEB, TAGLINE } from '../config'
import { useGerak } from '../lib/gerak'
import { useEbookTerbit } from '../lib/library'
import { useTemaGlobal } from '../lib/store'
import { kulitTemaGlobal } from '../lib/tema'
import type { Ebook } from '../lib/types'

function useKolom(): number {
  const hitung = () => (typeof window === 'undefined' ? 2 : window.innerWidth >= 1024 ? 4 : window.innerWidth >= 640 ? 3 : 2)
  const [n, setN] = useState(hitung)
  useEffect(() => {
    const f = () => setN(hitung())
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  return n
}

function Hero() {
  const [tema] = useTemaGlobal()
  const gerak = useGerak()
  const kulit = kulitTemaGlobal(tema)
  const malam = tema === 'malam'

  const keRak = () => document.getElementById('rak')?.scrollIntoView({ behavior: gerak.kurang ? 'auto' : 'smooth', block: 'start' })

  return (
    <section aria-labelledby="judul-hero" className="wadah pt-16 lg:pt-14">
      <div className="relative lg:h-[640px]">
        {/* adegan: pusaran langit + matahari api + Nalar di tengahnya */}
        <div className="relative mx-auto aspect-[6/5] w-full max-w-[560px] lg:absolute lg:left-0 lg:top-0 lg:mx-0 lg:aspect-auto lg:h-full lg:w-[64%] lg:max-w-none">
          <Panel warna="kertas" miring={1.6} className="absolute inset-[2%]" aria-hidden="true" />
          <Panel warna={malam ? 'malam' : 'kuning'} miring={-1.2} className="absolute inset-[4%]">
            <div className="absolute inset-0 overflow-hidden">
              <Pusaran seed={21} palet={malam ? 'malam' : 'ladang'} bintang={malam ? 16 : 6} className="h-full w-full" />
            </div>
          </Panel>

          <div className="absolute left-1/2 top-1/2 aspect-square w-[82%] -translate-x-1/2 -translate-y-1/2 lg:w-auto lg:h-[92%]">
            <MatahariApi seed={9} putar={!gerak.ringan} className="h-full w-full" />
          </div>

          <div className="absolute left-1/2 top-[57%] z-10 w-[64%] -translate-x-1/2 -translate-y-1/2 lg:w-[56%]">
            <Nalar kulit={kulit} ukuran="besar" gelembung="atas" />
          </div>

          <RantingAlmond seed={4} className="absolute -left-[3%] -top-[5%] z-20 w-[54%] -rotate-3" />
          <Iris className="absolute -bottom-[5%] left-[1%] z-20 w-[17%] -rotate-6" />
          <BungaMatahari seed={6} className="absolute -bottom-[7%] right-[3%] z-20 w-[19%] rotate-3" />
        </div>

        {/* judul */}
        <Panel
          warna="kertas"
          miring={1}
          className="relative z-30 mx-1 -mt-4 px-6 py-7 text-center sm:mx-6 lg:absolute lg:right-0 lg:top-[7%] lg:mx-0 lg:mt-0 lg:w-[41%] lg:text-left"
        >
          <p className="m-0 font-tangan text-2xl font-bold text-[#8a3d00]">catatan kuliah Sosiologi</p>
          <h1 id="judul-hero" className="cat-judul m-0 font-display text-5xl font-black leading-[1.02] sm:text-6xl">
            {NAMA_WEB}
          </h1>
          <p className="m-0 mt-3 text-lg leading-snug">{TAGLINE}. Disorot, dicatat, dan diuji bersama Nalar si bunglon.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3 lg:justify-start">
            <button type="button" className="tombol tombol-primer" onClick={keRak}>
              Lihat rak buku
            </button>
          </div>
        </Panel>

        <Panel warna="malam" miring={3} className="absolute bottom-[1%] right-[1%] z-20 hidden w-[17%] p-1.5 lg:block">
          <JendelaKafe className="block h-auto w-full" />
        </Panel>
      </div>
    </section>
  )
}

function Rak({ daftar }: { daftar: Ebook[] }) {
  const kolom = useKolom()
  const baris = useMemo(() => {
    const out: Ebook[][] = []
    for (let i = 0; i < daftar.length; i += kolom) out.push(daftar.slice(i, i + kolom))
    return out
  }, [daftar, kolom])

  return (
    <section id="rak" aria-labelledby="judul-rak" className="wadah scroll-mt-6 pt-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h2 id="judul-rak" className="cat-judul m-0 font-display text-4xl font-black sm:text-5xl">
          Rak Buku
        </h2>
        <p className="m-0 font-tangan text-2xl font-bold" style={{ color: 'var(--teks-redup)' }}>
          psst… coba ketuk bintang di langit ✨
        </p>
      </div>

      {daftar.length === 0 ? (
        <Panel warna="kertas" miring={-0.6} className="mx-auto max-w-xl px-6 py-8 text-center">
          <p className="m-0 font-display text-2xl font-bold">Rak masih kosong</p>
          <p className="mt-2">
            Tambahkan ebook lewat{' '}
            <Link to="/admin" className="font-semibold underline underline-offset-4" style={{ color: 'var(--tautan)' }}>
              Ruang Redaksi
            </Link>{' '}
            atau taruh file .md di folder <code>src/content/</code>.
          </p>
        </Panel>
      ) : (
        <div className="flex flex-col gap-12">
          {baris.map((b, i) => (
            <div key={i}>
              <ul className="m-0 grid list-none gap-x-6 gap-y-4 p-0 px-2 sm:gap-x-8" style={{ gridTemplateColumns: `repeat(${kolom}, minmax(0, 1fr))` }}>
                {b.map((e) => (
                  <li key={e.id} className="m-0 px-1 pb-3 sm:px-3">
                    <SampulBuku ebook={e} />
                  </li>
                ))}
              </ul>
              <div className="papan-rak" aria-hidden="true" />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export function Home() {
  const daftar = useEbookTerbit()
  const { katakan } = useNalar()
  const kosong = daftar.length === 0

  useEffect(() => {
    const t = setTimeout(() => katakan(kosong ? 'rakKosong' : 'sapa'), 1500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Hero />
      <Rak daftar={daftar} />
      <Footer />
    </>
  )
}
