/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'biru-malam': 'var(--biru-malam)',
        kobalt: 'var(--kobalt)',
        langit: 'var(--langit)',
        'kuning-pusaran': 'var(--kuning-pusaran)',
        'jingga-bunga': 'var(--jingga-bunga)',
        'jingga-api': 'var(--jingga-api)',
        'ungu-iris': 'var(--ungu-iris)',
        'hijau-daun': 'var(--hijau-daun)',
        kertas: 'var(--kertas)',
        tinta: 'var(--tinta)',
        // warna yang berubah mengikuti tema (Malam Berbintang / Ladang Matahari)
        latar: 'var(--latar)',
        teks: 'var(--teks)',
        redup: 'var(--teks-redup)',
        aksen: 'var(--aksen)',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'Cambria', 'serif'],
        baca: ['Lora', 'Georgia', 'Cambria', 'serif'],
        tangan: ['Caveat', '"Segoe Print"', '"Comic Sans MS"', 'cursive'],
      },
      screens: {
        xs: '420px',
      },
    },
  },
  plugins: [],
}
