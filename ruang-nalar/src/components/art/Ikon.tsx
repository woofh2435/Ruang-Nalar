// Ikon garis kecil (SVG inline) — tombol ikon wajib diberi aria-label oleh pemakainya.

const D = {
  bulan: ['M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z'],
  matahari: ['M16 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0z', 'M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'],
  suara: ['M11 5 6 9H2v6h4l5 4V5z', 'M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13'],
  senyap: ['M11 5 6 9H2v6h4l5 4V5z', 'M22 9l-6 6M16 9l6 6'],
  buku: ['M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z', 'M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5'],
  catatan: ['M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5z', 'M15 3v6h6M8 13h8M8 17h5'],
  penanda: ['M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z'],
  kiri: ['M15 18l-6-6 6-6'],
  kanan: ['M9 18l6-6-6-6'],
  tutup: ['M18 6 6 18M6 6l12 12'],
  menu: ['M3 6h18M3 12h18M3 18h18'],
  minimal: ['M5 12h14'],
  cek: ['M20 6 9 17l-5-5'],
  naik: ['M18 15l-6-6-6 6'],
  turun: ['M6 9l6 6 6-6'],
  unduh: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3'],
  unggah: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12'],
  hapus: ['M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6'],
  edit: ['M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z'],
  salin: ['M11 9h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z', 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'],
  plus: ['M12 5v14M5 12h14'],
  kunci: ['M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z', 'M7 11V7a5 5 0 0 1 10 0v4'],
  mata: ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z', 'M15 12a3 3 0 1 0-6 0 3 3 0 0 0 6 0z'],
  awas: ['M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z', 'M12 9v4M12 17h.01'],
  seru: ['M22 12a10 10 0 1 0-20 0 10 10 0 0 0 20 0z', 'M12 7v6M12 16.5h.01'],
  lampu: ['M9 18h6M10 22h4', 'M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z'],
  bintang: ['M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z'],
  hurufKecil: ['M4 20 9 6l5 14M5.8 15h6.4', 'M16 20l3-8 3 8M17 18h4'],
  tanda: ['M9 11l3 3L22 4', 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'],
  kembali: ['M19 12H5M11 18l-6-6 6-6'],
  naikPanah: ['M12 19V5M5 12l7-7 7 7'],
  pengguna: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z'],
  keluar: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5M21 12H9'],
  segar: ['M23 4v6h-6M1 20v-6h6', 'M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15'],
} as const

export type NamaIkon = keyof typeof D

interface Props {
  n: NamaIkon
  ukuran?: number
  className?: string
  tebal?: number
}

export function Ikon({ n, ukuran = 20, className, tebal = 2 }: Props) {
  return (
    <svg
      width={ukuran}
      height={ukuran}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={tebal}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {D[n].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  )
}
