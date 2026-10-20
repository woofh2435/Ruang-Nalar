import type { ReactNode } from 'react'
import { Panel } from '../art/Panel'

/** Kepala tiap halaman dasbor: tulisan tangan kecil + judul bergaya cat. */
export function KepalaHalaman({ kecil, judul, children }: { kecil: string; judul: string; children?: ReactNode }) {
  return (
    <header className="mb-6">
      <Panel warna="kertas" miring={-0.4} className="px-5 py-5 sm:px-7">
        <p className="m-0 font-tangan text-2xl font-bold" style={{ color: '#8a3d00' }}>
          {kecil}
        </p>
        <h1 className="cat-judul m-0 font-display text-3xl font-black leading-tight sm:text-4xl">{judul}</h1>
        {children && <div className="mt-2">{children}</div>}
      </Panel>
    </header>
  )
}

export function KosongPanel({ judul, children }: { judul: string; children?: ReactNode }) {
  return (
    <Panel warna="kertas" miring={0.3} className="mx-auto max-w-xl px-6 py-8 text-center">
      <p className="m-0 font-display text-2xl font-bold">{judul}</p>
      {children && <div className="mt-2">{children}</div>}
    </Panel>
  )
}
