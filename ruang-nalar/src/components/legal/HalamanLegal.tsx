import { Link } from 'react-router-dom'
import { Ikon } from '../art/Ikon'
import { Panel } from '../art/Panel'
import { Nalar } from '../nalar/Nalar'
import { useGerak } from '../../lib/gerak'
import { useJudulHalaman } from '../../lib/judul'
import { kulitTemaGlobal } from '../../lib/tema'
import { useTemaGlobal } from '../../lib/store'
import { TANGGAL_BERLAKU, VERSI_KEBIJAKAN } from '../../lib/legal/versi'
import { bukaPengaturanCookie } from '../../lib/persetujuan'
import type { DokLegal } from '../../lib/legal/dokumen'

interface Props {
  dok: DokLegal
  /** tautan ke dokumen pendamping */
  lain: { ke: string; teks: string }
}

/** Kerangka halaman hukum: Nalar membacakan poin penting, daftar isi, lalu isi dokumen. */
export function HalamanLegal({ dok, lain }: Props) {
  const [tema] = useTemaGlobal()
  const gerak = useGerak()
  useJudulHalaman(dok.judul)

  // HashRouter memakai # untuk alamat, jadi tautan #id biasa tidak bisa dipakai. Gulir lewat skrip.
  const lompat = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: gerak.kurang ? 'auto' : 'smooth', block: 'start' })
    el.focus({ preventScroll: true })
  }

  return (
    <div className="wadah pb-16 pt-24">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="mb-4 inline-flex min-h-[44px] items-center gap-1 font-semibold underline underline-offset-4" style={{ color: 'var(--teks)' }}>
          <Ikon n="kembali" ukuran={18} /> Kembali ke rak
        </Link>

        <header>
          <Panel warna="kertas" miring={-0.4} className="px-5 py-5 sm:px-7">
            <p className="m-0 font-tangan text-2xl font-bold" style={{ color: '#8a3d00' }}>
              dibacakan Nalar, biar tidak bikin pusing
            </p>
            <h1 className="cat-judul m-0 font-display text-3xl font-black leading-tight sm:text-4xl">{dok.judul}</h1>
            <p className="m-0 mt-2 text-sm" style={{ color: 'var(--tinta-redup)' }}>
              Berlaku sejak {TANGGAL_BERLAKU} · versi {VERSI_KEBIJAKAN}
            </p>
          </Panel>
        </header>

        <Panel warna="kuning" miring={0.4} className="mt-6 px-5 py-5 sm:px-7" aria-labelledby="judul-ringkas">
          <div className="flex items-start gap-4">
            <div className="hidden w-[88px] shrink-0 sm:block" aria-hidden="true">
              <Nalar kulit={kulitTemaGlobal(tema)} ukuran="besar" gelembung={false} cabang={false} />
            </div>
            <div>
              <h2 id="judul-ringkas" className="m-0 font-display text-xl font-black">
                Versi singkatnya, kata Nalar
              </h2>
              <ul className="m-0 mt-2 list-disc pl-5">
                {dok.ringkas.map((r) => (
                  <li key={r} className="mt-1">
                    {r}
                  </li>
                ))}
              </ul>
              <p className="m-0 mt-3 text-sm">Ini cuma ringkasan. Yang berlaku adalah isi lengkap di bawah.</p>
            </div>
          </div>
        </Panel>

        <Panel warna="kertas" className="mt-6 px-5 py-5 sm:px-7">
          <p className="m-0">{dok.pembuka}</p>

          <nav aria-label={`Daftar isi ${dok.judul}`} className="mt-4">
            <p className="m-0 font-semibold">Daftar isi</p>
            <ol className="m-0 mt-1 list-none p-0">
              {dok.bagian.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    className="min-h-[36px] text-left underline underline-offset-4"
                    style={{ color: 'var(--tautan)' }}
                    onClick={() => lompat(`legal-${b.id}`)}
                  >
                    {b.judul}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </Panel>

        <Panel warna="kertas" className="mt-6 px-5 py-6 sm:px-7">
          {dok.bagian.map((b, i) => (
            <section key={b.id} aria-labelledby={`legal-${b.id}`} className={i > 0 ? 'mt-7' : ''}>
              <h2 id={`legal-${b.id}`} tabIndex={-1} className="m-0 scroll-mt-24 font-display text-2xl font-black outline-none">
                {b.judul}
              </h2>
              {b.paragraf.map((p) => (
                <p key={p} className="m-0 mt-2 leading-relaxed">
                  {p}
                </p>
              ))}
              {b.daftar && (
                <ul className="m-0 mt-2 list-disc pl-6">
                  {b.daftar.map((d) => (
                    <li key={d} className="mt-1 leading-relaxed">
                      {d}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </Panel>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={lain.ke} className="tombol">
            {lain.teks}
          </Link>
          <button type="button" className="tombol" onClick={bukaPengaturanCookie}>
            Pengaturan cookie
          </button>
        </div>
      </div>
    </div>
  )
}
