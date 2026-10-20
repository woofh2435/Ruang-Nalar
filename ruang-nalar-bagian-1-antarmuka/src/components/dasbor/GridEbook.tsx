import type { ReactNode } from 'react'
import { SampulBuku } from '../art/Sampul'
import type { Ebook } from '../../lib/types'
import { TombolKoleksi } from './TombolKoleksi'

/** Kisi sampul ebook dengan tombol koleksi di bawahnya. `aksiTambahan` muncul di bawah tombol koleksi. */
export function GridEbook({ daftar, aksiTambahan, tanpaKoleksi = false }: { daftar: readonly Ebook[]; aksiTambahan?: (e: Ebook) => ReactNode; tanpaKoleksi?: boolean }) {
  return (
    <ul className="m-0 grid list-none gap-x-5 gap-y-8 p-0" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 9.5rem), 1fr))' }}>
      {daftar.map((e) => (
        <li key={e.id} className="m-0 flex flex-col gap-2">
          <SampulBuku ebook={e} />
          {!tanpaKoleksi && <TombolKoleksi ebookId={e.id} judul={e.parsed.meta.judul} kecil />}
          {aksiTambahan?.(e)}
        </li>
      ))}
    </ul>
  )
}
