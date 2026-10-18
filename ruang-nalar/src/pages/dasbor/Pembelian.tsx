import { KepalaHalaman } from '../../components/dasbor/KepalaHalaman'
import { Akun } from '../Akun'

/** Daftar pembelian: memakai halaman Akun yang sudah ada (pemantauan status pembayaran Midtrans tetap sama). */
export function Pembelian() {
  return (
    <>
      <KepalaHalaman kecil="ebook berbayar" judul="Pembelian" />
      <Akun tanpaKepala />
    </>
  )
}
