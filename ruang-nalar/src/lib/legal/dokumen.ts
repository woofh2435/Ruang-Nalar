// Isi dokumen hukum (Kebijakan Privasi dan Syarat & Ketentuan) sebagai data, supaya satu sumber dipakai oleh halaman web,
// oleh pengujian, dan oleh pembuat halaman statis untuk mesin pencari.
// Bahasa sengaja sehari-hari. Ini panduan yang disusun dengan itikad baik, bukan nasihat hukum; sebelum web dikomersialkan
// besar-besaran sebaiknya dibaca oleh konsultan hukum atau layanan bantuan hukum kampus.

import { RIWAYAT_PERUBAHAN, TANGGAL_BERLAKU, VERSI_KEBIJAKAN } from './versi'

export interface BagianLegal {
  id: string
  judul: string
  paragraf: string[]
  daftar?: string[]
}

export interface DokLegal {
  /** alamat di dalam web (HashRouter) */
  jalur: string
  judul: string
  /** satu kalimat untuk <meta description> */
  deskripsi: string
  pembuka: string
  /** poin ringkas yang "dibacakan" Nalar di bagian atas halaman */
  ringkas: string[]
  bagian: BagianLegal[]
}

export interface DataLegal {
  /** nama pengendali data / pemilik hak cipta */
  pengelola: string
  /** email kontak; kosong bila belum diisi */
  email: string
  /** kota domisili; kosong bila belum diisi */
  kota: string
  nama: string
}

const kontakKalimat = (d: DataLegal) =>
  d.email ? `Kirim email ke ${d.email}.` : 'Gunakan kontak yang dicantumkan di halaman About Me (menu Dasbor → About Me).'

export function kebijakanPrivasi(d: DataLegal): DokLegal {
  const kontak = kontakKalimat(d)
  return {
    jalur: '/kebijakan-privasi',
    judul: 'Kebijakan Privasi',
    deskripsi: `Data apa yang dikumpulkan ${d.nama}, untuk apa dipakai, berapa lama disimpan, dan hak kamu atas data itu, ditulis dengan bahasa sehari-hari sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.`,
    pembuka: `Kebijakan Privasi ${d.nama}. ${d.nama} menghargai privasi kamu. Halaman ini menjelaskan data apa yang kami kumpulkan saat kamu memakai web ini, untuk apa data itu dipakai, dan hak kamu atas data tersebut. Isinya ditulis mengikuti UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi, dengan bahasa yang mudah dimengerti, bukan bahasa hukum yang bikin pusing.`,
    ringkas: [
      'Kamu bisa membaca ebook gratis tanpa akun dan tanpa memberi data apa pun.',
      'Akun hanya butuh email dan kata sandi. Kami tidak minta nama lengkap, nomor HP, atau alamat.',
      'Catatan, sorotan, dan progres bacamu tersimpan di perangkatmu sendiri, bukan di server kami.',
      'Data kartu atau dompet digitalmu tidak pernah lewat web ini. Pembayaran ditangani Midtrans.',
      'Kamu bisa mengunduh data, menarik persetujuan, atau menghapus akun kapan saja dari menu Akun & pengaturan.',
    ],
    bagian: [
      {
        id: 'pengendali',
        judul: '1. Siapa yang mengelola data kamu',
        paragraf: [
          `${d.nama} dikelola oleh ${d.pengelola}. Dalam istilah UU PDP, ${d.pengelola} adalah Pengendali Data Pribadi, yaitu pihak yang menentukan untuk apa dan bagaimana datamu diproses.`,
        ],
      },
      {
        id: 'data',
        judul: '2. Data apa yang kami kumpulkan',
        paragraf: ['Datanya dibagi tiga kelompok supaya jelas mana yang sampai ke server dan mana yang tidak.'],
        daftar: [
          'Saat kamu membuat akun: alamat email dan kata sandi. Kata sandi disimpan dalam bentuk acak (hash) oleh penyedia login kami, jadi kami sendiri tidak bisa membacanya.',
          'Saat kamu menyetujui atau menarik persetujuan: jenis persetujuan, jawabannya (ya atau tidak), versi kebijakan yang kamu baca, dan waktunya.',
          'Saat kamu membeli ebook berbayar: ebook yang dibeli, jumlah bayar, status pembayaran, nomor pesanan (Order ID), dan waktu. Data kartu, rekening, atau dompet digital tidak kami terima atau simpan.',
          'Data teknis yang dicatat penyedia layanan demi keamanan, misalnya alamat IP, jenis perangkat, dan waktu akses.',
          'Data yang hanya tinggal di perangkatmu (tidak dikirim ke server kami): progres baca, sorotan, catatan, penanda, jawaban kuis, refleksi, misi, rak pribadi, favorit, serta pilihan tampilan seperti tema, ukuran huruf, dan musik latar.',
        ],
      },
      {
        id: 'tujuan',
        judul: '3. Untuk apa data dipakai',
        paragraf: ['Datamu hanya dipakai untuk hal-hal di bawah ini, dan tidak kami jual.'],
        daftar: [
          'Membuat dan mengamankan akunmu (login, konfirmasi email, atur ulang kata sandi).',
          'Memproses pembelian dan membuka ebook yang sudah kamu bayar, di perangkat mana pun.',
          'Menyimpan bukti persetujuan dan pembelian bila suatu saat dibutuhkan.',
          'Menghubungimu soal akun atau pembelian. Email promo atau info ebook baru hanya dikirim kalau kamu mencentang pilihan itu.',
          'Menjaga web tetap aman dari penyalahgunaan.',
        ],
      },
      {
        id: 'dasar',
        judul: '4. Dasar kami memproses data',
        paragraf: [
          'Dasar utamanya adalah persetujuanmu. Saat membuat akun kamu diminta mencentang persetujuan terhadap Kebijakan Privasi dan Syarat & Ketentuan. Kotaknya tidak pernah tercentang otomatis. Persetujuan untuk email promo dan analitik bersifat opsional dan dipisahkan dari persetujuan yang wajib.',
          'Untuk pembelian, data diproses juga karena dibutuhkan untuk menjalankan transaksi yang kamu minta.',
        ],
      },
      {
        id: 'simpan',
        judul: '5. Berapa lama data disimpan dan cara menghapusnya',
        paragraf: [
          'Data akun, riwayat pembelian di akun, dan catatan persetujuanmu disimpan selama akunmu aktif. Kamu bisa menghapus akun sendiri lewat Dasbor → Akun & pengaturan → Privasi & persetujuan → Hapus akun saya. Setelah dihapus, data itu ikut terhapus dari database kami.',
          'Beberapa hal tidak langsung hilang: catatan transaksi di sisi Midtrans tetap dikelola Midtrans sesuai aturannya, dan salinan cadangan milik penyedia layanan bisa menyimpan data sampai siklus cadangan berikutnya selesai.',
          'Data di perangkatmu (progres, catatan, sorotan) tidak ikut terhapus saat akun dihapus. Kamu menghapusnya sendiri lewat pengaturan browser.',
        ],
      },
      {
        id: 'pihak-ketiga',
        judul: '6. Pihak lain yang menerima datamu',
        paragraf: ['Kami memakai beberapa layanan pihak ketiga supaya web ini bisa berjalan. Masing-masing hanya menerima data yang dibutuhkannya.'],
        daftar: [
          'Penyedia login dan database (Supabase): menyimpan email, hash kata sandi, pembelian, dan catatan persetujuan, serta mengirim email konfirmasi dan atur ulang kata sandi.',
          'Payment gateway (Midtrans): menerima nomor pesanan, jumlah, nama ebook, dan emailmu untuk membuat halaman pembayaran. Pembayaran dilakukan langsung di halaman Midtrans lewat GoPay, ShopeePay, atau QRIS.',
          'Penyedia hosting (layanan hosting situs statis): mencatat log akses teknis seperti alamat IP.',
          'Penyedia font (Google Fonts): saat halaman dibuka, browsermu mengambil huruf dari server Google, sehingga alamat IP dan informasi browsermu terlihat oleh Google.',
          'Analitik: saat ini web ini tidak memasang analitik atau pelacak apa pun. Kalau kelak dipasang, hanya aktif untuk pengunjung yang memberi izin analitik di banner cookie.',
        ],
      },
      {
        id: 'hak',
        judul: '7. Hak kamu',
        paragraf: ['Kamu berhak atas datamu. Sebagian besar bisa kamu lakukan sendiri tanpa menunggu siapa pun.'],
        daftar: [
          'Mengakses: lihat email, riwayat pembelian, dan riwayat persetujuanmu di Dasbor.',
          'Mengunduh (ekspor): tombol Unduh data akun saya di Akun & pengaturan memberi berkas JSON berisi data akunmu di server (email, pembelian, dan riwayat persetujuan).',
          'Mengoreksi: ganti kata sandi di Akun & pengaturan. Untuk perubahan email atau data lain, hubungi kontak di bawah.',
          'Menarik persetujuan: matikan pilihan email promo atau analitik kapan saja di Akun & pengaturan, atau lewat tautan Pengaturan cookie di bagian bawah halaman.',
          'Menghapus: tombol Hapus akun saya di Akun & pengaturan (bagian Privasi & persetujuan).',
          'Berkeberatan atau bertanya: hubungi kontak di bawah. Kami berusaha menanggapi dalam 3 x 24 jam.',
        ],
      },
      {
        id: 'cookie',
        judul: '8. Cookie dan penyimpanan di perangkat',
        paragraf: [
          'Web ini memakai penyimpanan di browser (IndexedDB dan localStorage) untuk hal yang kamu butuhkan: tetap masuk, mengingat progres bacamu, dan pilihan tampilan. Itu masuk kategori perlu dan tidak butuh izin tambahan.',
          'Izin analitik di banner cookie adalah pilihan terpisah. Saat ini belum ada analitik yang dipasang; pilihanmu tetap dicatat supaya kalau kelak dipakai, kami sudah tahu kamu memilih apa.',
          'Pilihan cookie disimpan di perangkatmu sebagai pengingat saja. Bukti persetujuan sebagai pemilik akun disimpan di server dengan waktu dan versi kebijakan.',
        ],
      },
      {
        id: 'keamanan',
        judul: '9. Cara kami menjaga data',
        paragraf: [
          'Semua halaman dan permintaan data memakai koneksi terenkripsi (HTTPS). Kata sandi disimpan dalam bentuk hash. Aturan akses di database memastikan kamu hanya bisa membaca data milikmu sendiri, dan isi ebook berbayar hanya dikirim ke akun yang sudah membayar lunas.',
          'Tidak ada sistem yang seratus persen kebal. Kalau suatu saat terjadi kebocoran data yang berdampak padamu, kami akan memberi tahu kamu dan pihak berwenang sesuai aturan, paling lambat 3 x 24 jam sejak kami mengetahuinya, beserta langkah yang perlu kamu ambil.',
        ],
      },
      {
        id: 'usia',
        judul: '10. Usia pengguna',
        paragraf: ['Akun ditujukan untuk pengguna berusia 18 tahun ke atas. Kalau kamu belum 18 tahun, mintalah izin orang tua atau wali sebelum membuat akun atau membeli.'],
      },
      {
        id: 'kontak',
        judul: '11. Kontak untuk pertanyaan privasi',
        paragraf: [`Pertanyaan, permintaan, atau keluhan soal data pribadimu bisa disampaikan ke ${d.pengelola}. ${kontak}`],
      },
      {
        id: 'perubahan',
        judul: '12. Tanggal berlaku dan riwayat perubahan',
        paragraf: [
          `Kebijakan ini berlaku sejak ${TANGGAL_BERLAKU} (versi ${VERSI_KEBIJAKAN}). Kalau isinya berubah, tanggal dan versinya kami perbarui di sini, dan kamu akan ditanya lagi lewat banner cookie.`,
          'Riwayat perubahan:',
        ],
        daftar: RIWAYAT_PERUBAHAN.map((r) => `${r.tanggal} (versi ${r.versi}): ${r.ringkas}`),
      },
    ],
  }
}

export function syaratKetentuan(d: DataLegal): DokLegal {
  const kontak = kontakKalimat(d)
  const hukum = d.kota ? `Pengadilan Negeri ${d.kota}` : 'pengadilan yang berwenang di Indonesia sesuai domisili pengelola'
  return {
    jalur: '/syarat-ketentuan',
    judul: 'Syarat & Ketentuan',
    deskripsi: `Aturan memakai ${d.nama}: layanan ebook digital, hak cipta, aturan akun, pembayaran dan refund, serta cara melapor konten bermasalah.`,
    pembuka: `Syarat & Ketentuan ${d.nama}. Dengan membuat akun atau membeli ebook di ${d.nama}, kamu setuju dengan aturan di halaman ini. Kami menulisnya sesingkat dan sejelas mungkin supaya mudah dipahami. Soal data pribadi, baca Kebijakan Privasi.`,
    ringkas: [
      'Ebook di sini boleh kamu baca untuk dirimu sendiri, tidak boleh disebar atau dijual lagi.',
      'Satu akun untuk satu orang. Jangan bagi-bagi login.',
      'Ebook digital yang sudah dibuka umumnya tidak bisa dikembalikan, kecuali ada masalah yang memang tanggung jawab kami.',
      'Ada yang salah atau melanggar hak ciptamu? Laporkan, kami tindak lanjuti.',
    ],
    bagian: [
      {
        id: 'layanan',
        judul: '1. Layanan yang kami sediakan',
        paragraf: [
          `${d.nama} adalah web perpustakaan ebook digital interaktif berisi catatan kuliah Sosiologi. Ada tiga jenis akses:`,
        ],
        daftar: [
          'Ebook gratis atau percobaan: bisa dibaca tanpa akun.',
          'Ebook berbayar: dibaca setelah kamu membuat akun dan pembayaran dinyatakan lunas. Aksesnya melekat pada akunmu dan bisa dibuka di perangkat mana pun setelah masuk.',
          'Fitur belajar seperti sorotan, catatan, kuis, dan misi tersimpan di perangkatmu sendiri.',
        ],
      },
      {
        id: 'hak-cipta',
        judul: '2. Hak kekayaan intelektual',
        paragraf: [
          `Seluruh isi ebook, tulisan, ilustrasi, desain sampul, maskot Nalar, dan tampilan web adalah milik ${d.pengelola} dan dilindungi UU No. 28 Tahun 2014 tentang Hak Cipta, kecuali bagian yang jelas disebut berasal dari pihak lain.`,
          'Kamu mendapat lisensi pribadi, tidak eksklusif, dan tidak bisa dipindahtangankan untuk membaca ebook yang kamu beli. Kamu tidak boleh menyalin, membagikan, mengunggah ulang, menjual, menyewakan, atau menerbitkan ulang isinya, baik seluruhnya maupun sebagian besar, tanpa izin tertulis. Mengutip sebagian kecil dengan menyebut sumber untuk keperluan belajar dan karya ilmiah tetap boleh.',
        ],
      },
      {
        id: 'akun',
        judul: '3. Aturan akun',
        paragraf: ['Supaya akun tetap aman dan adil bagi semua orang:'],
        daftar: [
          'Pengguna berusia 18 tahun ke atas, atau sudah mendapat izin orang tua atau wali.',
          'Gunakan email aktif milikmu dan data yang benar.',
          'Satu akun dipakai satu orang. Dilarang membagikan login atau menjual akses.',
          'Jaga kerahasiaan kata sandimu. Aktivitas di akunmu menjadi tanggung jawabmu.',
          'Kalau kami menemukan pelanggaran, misalnya akun dipakai ramai-ramai atau isi ebook disebarkan, kami bisa memberi peringatan, membatasi, atau menutup akun tanpa pengembalian dana, sesuai tingkat pelanggarannya.',
        ],
      },
      {
        id: 'pembayaran',
        judul: '4. Pembayaran dan pengembalian dana (refund)',
        paragraf: [
          'Harga ditampilkan dalam rupiah di halaman ebook dan berlaku sekali bayar untuk akses seterusnya. Harga yang ditagih selalu yang tercatat di server saat kamu menekan tombol beli.',
          'Pembayaran diproses oleh Midtrans lewat GoPay, ShopeePay, atau QRIS. Ebook terbuka otomatis setelah pembayaran lunas. Kalau sudah membayar tetapi ebook belum terbuka, tunggu beberapa menit lalu tekan Periksa lagi di halaman akun. Kalau tetap belum terbuka, hubungi kami dengan menyertakan Order ID.',
          'Karena ebook adalah produk digital yang langsung bisa dibaca, pembelian yang sudah terbuka pada dasarnya tidak bisa dikembalikan. Pengecualiannya: kamu membayar dua kali untuk ebook yang sama, ebook tidak bisa dibuka karena kesalahan dari kami, atau ada kesalahan tagihan. Dalam kasus itu kami mengembalikan dana lewat Midtrans, dan akses ebook ikut ditutup.',
        ],
      },
      {
        id: 'tanggung-jawab',
        judul: '5. Batas tanggung jawab',
        paragraf: [
          `Kami berusaha menjaga web tetap bisa diakses dan isinya akurat, tetapi ebook adalah catatan belajar, bukan nasihat profesional. ${d.nama} disediakan apa adanya. Kami tidak bertanggung jawab atas gangguan di luar kendali wajar kami, misalnya gangguan internet, pemeliharaan penyedia layanan, atau kerusakan perangkatmu.`,
          'Karena sorotan dan catatanmu tersimpan di perangkat, kehilangan data browser berarti kehilangan data itu. Simpan cadangan kalau penting.',
        ],
      },
      {
        id: 'hukum',
        judul: '6. Hukum yang berlaku dan penyelesaian sengketa',
        paragraf: [
          'Syarat ini tunduk pada hukum Republik Indonesia. Kalau ada perselisihan, kita mulai dengan musyawarah. Bila tidak ada titik temu, penyelesaiannya melalui ' + hukum + '.',
        ],
      },
      {
        id: 'lapor',
        judul: '7. Melapor konten bermasalah',
        paragraf: [
          `Kalau kamu menemukan isi yang melanggar hak ciptamu, memuat kesalahan serius, atau melanggar hukum, laporkan ke ${d.pengelola}. ${kontak}`,
          'Sertakan alamat halaman atau nama ebook, bagian yang dipersoalkan, alasannya, dan cara menghubungimu. Untuk laporan hak cipta, jelaskan juga bukti bahwa kamu pemegang haknya. Kami akan meninjau dan menindaklanjuti, termasuk menurunkan konten bila laporannya terbukti.',
        ],
      },
      {
        id: 'perubahan',
        judul: '8. Perubahan syarat',
        paragraf: [`Syarat ini berlaku sejak ${TANGGAL_BERLAKU} (versi ${VERSI_KEBIJAKAN}). Kalau berubah, kami memperbarui tanggal dan versinya di sini dan meminta kamu membacanya lagi lewat banner. Riwayat perubahan sama dengan yang tercantum di Kebijakan Privasi.`],
      },
    ],
  }
}

/** Kalimat notice hak cipta yang dipasang di tiap bab. */
export function noticeHakCipta(penulis: string, tahun: number): string {
  return `© ${tahun} ${penulis}. Seluruh hak dilindungi UU No. 28 Tahun 2014 tentang Hak Cipta.`
}
