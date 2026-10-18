import { Panel } from '../../components/art/Panel'
import { KepalaHalaman } from '../../components/dasbor/KepalaHalaman'
import { PemilihMusik } from '../../components/PemilihMusik'

/** Pengaturan suara: nyala/mati, pilihan lagu latar, dan volume. */
export function Suara() {
  return (
    <>
      <KepalaHalaman kecil="teman membaca" judul="Pengaturan suara" />
      <Panel warna="kertas" className="max-w-xl px-5 py-5">
        <PemilihMusik judulTingkat={2} />
      </Panel>
    </>
  )
}
