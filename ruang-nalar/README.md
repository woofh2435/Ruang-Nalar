# 🦎 Ruang Nalar

Perpustakaan **ebook interaktif** untuk catatan kuliah Sosiologi. Ditemani **Nalar**, bunglon penjaga rak, dengan tampilan kolase ala lukisan Van Gogh (Malam Berbintang, Ladang Matahari, Iris, Almond Mekar).

- Murni web statis: **tanpa server, tanpa login, tanpa database, tanpa iklan/pelacak**.
- Siap tayang di **GitHub Pages**. Tidak perlu copy file satu-satu.
- Ebook publik = file `.md` di folder `src/content/`. Ebook tambahan lewat halaman admin tersimpan di browser pemilik.

---

## 1. Tayang di GitHub Pages (cara tercepat)

### Langkah 1: buat repo dan unggah proyek

1. Di GitHub: **New repository** → beri nama (misal `ruang-nalar`) → **Public** → *jangan* centang "Add a README" → **Create**.
2. Ekstrak zip ini. Di halaman repo yang baru: **uploading an existing file** → **seret SEMUA isi folder hasil ekstrak** (bukan zipnya) → **Commit changes**.
   - ⚠️ Folder **`.github`** itu *tersembunyi* di Mac/Linux (di Mac tekan `Cmd + Shift + .` untuk menampilkannya). Kalau ia tidak ikut terunggah, pakai **Opsi B** di bawah (tidak butuh `.github`), atau unggah lewat git (lihat kotak di bawah).
   - Tidak perlu mengunggah `node_modules` atau `dist` (memang tidak ada di zip).

<details>
<summary>Lebih suka lewat terminal (git)?</summary>

```bash
cd ruang-nalar
git init -b main
git add .
git commit -m "Ruang Nalar"
git remote add origin https://github.com/USERNAME/ruang-nalar.git
git push -u origin main
```
</details>

### Langkah 2: aktifkan Pages (cukup sekali)

**Settings → Pages → Build and deployment → Source: _GitHub Actions_.**

### Langkah 3: tunggu 1–2 menit

Buka tab **Actions**: workflow *Deploy ke GitHub Pages* akan berjalan. Setelah hijau, webmu terbuka di:

```
https://USERNAME.github.io/ruang-nalar/
```

> Kalau workflow sempat merah karena Pages belum diaktifkan, aktifkan dulu (Langkah 2), lalu **Actions → Deploy ke GitHub Pages → Run workflow**.

### Opsi B: tanpa GitHub Actions (cadangan)

Folder **`docs/`** sudah berisi hasil build siap pakai.

**Settings → Pages → Source: _Deploy from a branch_ → Branch: `main` → Folder: `/docs` → Save.**

Catatan Opsi B: `docs/` adalah *snapshot*. Kalau kamu menambah ebook di `src/content/` atau mengubah kode, jalankan `npm run build:docs` di komputermu lalu unggah ulang folder `docs/`. Dengan Opsi A, ini otomatis.

---

## 2. Jalankan di komputer

Butuh **Node.js 18.18+** (disarankan 20 LTS).

```bash
npm install          # sekali saja
npm run dev          # mode pengembangan → http://localhost:5173
npm run build        # cek tipe + bangun ke folder dist/
npm run preview      # lihat hasil build → http://localhost:4173
npm test             # jalankan tes (parser, frasa Nalar, kontras WCAG, lencana)
npm run build:docs   # bangun ke docs/ (untuk Opsi B)
```

Alamat memakai `#` (HashRouter), jadi tidak perlu pengaturan server khusus dan **refresh halaman tidak pernah 404** di GitHub Pages:

| Halaman | Alamat |
| --- | --- |
| Beranda / rak buku | `#/` |
| Pembaca | `#/baca/<id-ebook>` |
| Admin "Ruang Redaksi" | `#/admin` |

---

## 3. Menambah ebook

### Cara A: lewat halaman admin (cepat, tersimpan di browser ini saja)

1. Buka `…/#/admin`, masukkan kode sandi (bawaan: `GANTI_INI`, ganti di `src/config.ts`).
2. **Ebook baru** → isi judul, pilih tema warna dan ikon, lalu **unggah `.md`/`.txt`**, tempel, atau tulis langsung. Pratinjau tampil di sebelahnya, dan pemeriksaan format memberi tahu **nomor baris** yang bermasalah (tombol *Loncat*).
3. Pilih status **Terbit** (tampil di rak) atau **Draf** (disembunyikan), lalu **Simpan**.

Di sini juga ada: edit, duplikat, hapus (dengan konfirmasi), atur urutan rak, **Ekspor semua (JSON)** sebagai cadangan, **Impor JSON**, dan **Unduh .md** per ebook.

> ℹ️ Ebook yang kamu tambah di sini tersimpan di browser ini saja. Untuk dipublikasikan ke semua pembaca, unduh .md lalu taruh di `src/content/`.

### Cara B: taruh file `.md` di `src/content/` (tampil untuk semua pembaca)

1. Tulis ebook (format di bawah) atau **Unduh .md** dari admin.
2. Simpan sebagai `src/content/nama-ebook.md`. Nama file jadi id/alamat ebook (`#/baca/nama-ebook`).
3. Unggah/push ke GitHub. Workflow membangun ulang otomatis.

Ebook gratis bawaan adalah `src/content/ayok-kenali-sosiologi.md` (pengantar singkat tiga bab). Ganti atau hapus kalau tidak diperlukan. Ingat: isi `src/content/` ikut terbungkus saat build, jadi setelah mengubahnya web perlu dibuild ulang (otomatis lewat GitHub Actions, atau bangun `index.html` baru).

### Format ebook

````markdown
---
judul: Judul Ebook
subjudul: Catatan Minggu 1
penulis: [NAMA PENULIS]
tema: malam
ikon: 🦎
tag: [pengantar, teori]
status: terbit
deskripsi: Satu kalimat tentang isi ebook.
---

# Judul Bab 1

Paragraf biasa dengan **tebal**, *miring*, dan istilah [[Anomie|keadaan tanpa norma yang jelas]].

:::catatan tipe=tips
Kotak catatan.
:::

:::tokoh nama="Émile Durkheim" tahun="1858–1917"
Satu-dua kalimat tentang tokoh.
:::

:::kartu
Depan: Fakta sosial
Belakang: Cara bertindak, berpikir, dan merasa di luar individu.
:::

:::kuis
Q: Siapa yang memperkenalkan istilah "sosiologi"?
- Karl Marx
- [x] Auguste Comte
- Max Weber
Penjelasan: Comte, abad ke-19.
:::

:::refleksi
Pertanyaan renungan; jawabannya ditulis pembaca dan disimpan di browsernya.
:::

# Judul Bab 2

Isi bab berikutnya.
````

- Isian frontmatter: `tema` = `malam | siang | iris | almond | api`; `status` = `terbit | draf`. Tulis tanpa komentar di belakang nilai.
- `[NAMA PENULIS]` otomatis diganti dengan `NAMA_PENULIS_DEFAULT` dari `src/config.ts`.
- Tipe kotak catatan: `:::catatan tipe=penting`, `tipe=tips`, atau `tipe=awas`.
- Setiap baris `# ` memulai **bab baru**.
- Tandai satu pilihan benar di kuis dengan `- [x]`.
- Blok yang salah format **tidak membuat web crash**: blok itu dilewati dan admin menampilkan peringatan dengan nomor barisnya.
- Klaim yang belum pasti sebaiknya diberi tanda `[perlu dicek]`.
- Contoh yang memakai semua jenis blok: `contoh/apa-itu-sosiologi.md` (di luar `src/content/`, jadi tidak tampil di rak; dipakai juga oleh tes parser). Contoh ebook biasa: `src/content/ayok-kenali-sosiologi.md`.

### Blok interaktif: misi, jalur karier, peta karier, dan papan pencapaian

Selain lima blok di atas, ada empat blok untuk ebook yang ingin mengajak pembaca **mengerjakan sesuatu** dan **melihat arah kariernya**. Semuanya tersimpan di browser pembaca (per ebook), dan blok yang salah format dilewati dengan peringatan nomor baris seperti blok lain.

````markdown
---
judul: Judul Ebook Karier
tema: siang
tag: [karier, sampul-kolase]
status: terbit
---

# Bab 1: Judul Bab

:::misi judul="Misi 1: Judul misi" xp=10
Tantangan yang dikerjakan pembaca di dunia nyata. Hasilnya ditulis di kotak catatan.
Arah: Petunjuk jawaban yang baik. Disembunyikan sampai pembaca menekan tombol intip.
:::

:::karier jalur="Peneliti sosial"
Satu-dua paragraf tentang pintu karier yang dibuka bab ini.
Coba: Satu langkah kecil yang bisa dicoba minggu ini.
:::

# Bab 2: Peta dan papan

:::peta-karier judul="Peta Jalur Karier"
- Peneliti sosial | Merancang riset dan survei | Lembaga riset, LSM | bab 1, 2
- Dosen | Mengajar dan meneliti | Kampus |
:::

:::papan judul="Papan Pencapaianmu"
:::
````

| Blok | Fungsinya | Aturan |
| --- | --- | --- |
| `:::misi judul="…" xp=10` | Quest. Pembaca menulis jawaban di kotak catatan, boleh mengintip `Arah:`, lalu menandai selesai. | `xp` = poin misi (bawaan 10). `Arah:` opsional, ditulis di baris terakhir. |
| `:::karier jalur="…"` | Kartu satu jalur karier yang dibuka bab itu. Pembaca bisa menandai minat dan menulis satu langkah konkret. | `jalur` dipakai sebagai kunci, jadi tulis nama yang **sama persis** di `peta-karier`. `Coba:` opsional. |
| `:::peta-karier judul="…"` | Peta semua jalur: apa yang dikerjakan, contoh tempat kerja, dan bab yang menjadi modalnya. Batang progres tiap jalur ikut terisi dari bab yang sudah ditandai selesai. | Satu baris per jalur: `- Nama \| Dikerjakan \| Tempat kerja \| bab 3, 5-7`. Kolom bab boleh kosong (artinya semua bab bernomor) dan boleh memakai rentang. |
| `:::papan judul="…"` | Papan pencapaian: poin, tingkat, bab selesai, misi selesai, kuis benar, dan jalur yang ditandai. | Badannya kosong. Boleh dipasang lebih dari sekali. |

- **Poin**: misi sesuai `xp`, kuis +5 kalau benar di percobaan pertama, tiap bab yang ditandai selesai +10. Ada enam tingkat, dari *Maba Penasaran* sampai *Navigator Karier*.
- **Judul bab harus berbentuk `# Bab 1: …`** kalau ebook memakai peta karier. Progres jalur dicocokkan ke bab lewat nomor di judul, bukan urutan, jadi bab pembuka seperti "Kata Pembuka" atau penutup seperti "Referensi" tidak menggeser hitungan.
- Pratinjau di Ruang Redaksi menampilkan semua blok ini, tetapi tidak menyimpan apa pun.

---

## 4. Pengaturan penting (`src/config.ts`)

| Pengaturan | Fungsi |
| --- | --- |
| `NAMA_WEB` | Nama web di beranda dan tab browser (bawaan "Ruang Nalar") |
| `NAMA_PENULIS_DEFAULT` | Nama yang menggantikan `[NAMA PENULIS]`. **Ganti dengan namamu** |
| `TAGLINE` | Kalimat di bawah judul beranda |
| `ADMIN_PASSCODE` | Kode sandi halaman admin. **Ganti dari `GANTI_INI`** |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | *(opsional)* Menyalakan akun & ebook berbayar. Kosong = fitur mati. Bisa juga diisi lewat `toko-config.json` tanpa build ulang. Lihat bagian 9 |
| `TOKO_DEMO` | *(opsional)* `true` = tampilkan toko **demo** (akun & bayar palsu). Biarkan `false` di web publik |

⚠️ **`ADMIN_PASSCODE` hanya pengunci ringan di sisi browser**, bukan keamanan sungguhan. Nilainya ikut terkirim ke setiap pengunjung dan bisa dibaca lewat DevTools. Jangan pakai sandi yang sama dengan akun lain. Karena ebook admin memang hanya tersimpan di browsermu sendiri, pengunjung lain tidak melihat isinya. Yang terlihat publik hanyalah ebook di `src/content/`.

---

## 5. Fitur

**Rak & tampilan**
- Rak buku dengan sampul yang dibuat otomatis dari tema, ikon, dan judul (miring 3D saat disorot), lencana *Selesai Dibaca* dan *Kuis Sempurna*.
- 2 tema web: **Malam Berbintang** dan **Ladang Matahari**. 5 tema warna sampul/ebook: malam, siang, iris, almond, api.
- Elemen kreatif: kursor kuas (hanya perangkat dengan mouse), layar muat berbentuk pusaran, transisi sapuan kuas antarhalaman, klik/ketuk bintang di latar (percikan + komentar Nalar), hujan kelopak bunga matahari saat bab selesai, musik latar buatan WebAudio (**default mati**, bagian 10).
- Beranda punya bagian "menjual": cerita Nalar, keunggulan, cara kerja, ajakan **Coba Gratis**, dan tanya-jawab. Semua klaimnya dicocokkan dengan fitur nyata di `tests/promosi.test.ts`.
- Sampul tiap buku punya 5 komposisi berbeda (dipilih dari judul + id, jadi stabil), dan kepala bab di pembaca punya 5 gaya yang berganti antarbab (ada huruf awal besar di sebagian gaya). Ebook yang bertag `sampul-kolase` memakai sampul kolase bergaya poster Jepang 90-an (bagian 10.5).

**Nalar si bunglon**
- Gambar SVG, warna kulit mengikuti tema, mata kiri-kanan bergerak sendiri, ekor bergoyang, lidah menangkap kunang-kunang (ada poin).
- 8 ekspresi: senang, mikir, kaget, ngantuk, semangat, sedih, bangga, kedip-nakal (`window.nalar.setMood('kaget')` untuk mencoba dari konsol).
- Lebih dari 40 kalimat pendek sesuai kejadian (kuis benar/salah, diam 30 detik jadi ngantuk, diklik 5 kali berturut-turut jadi protes geli, dll.).

**Pembaca**
- Daftar bab, bilah progres kuas, bab sebelumnya/berikutnya, animasi balik halaman, ukuran huruf, **ingat posisi terakhir**.
- Sorot teks 3 warna, catatan tempel, penanda paragraf, semuanya tersimpan di IndexedDB browser pembaca.
- Blok interaktif: kuis, kartu balik, istilah (tooltip), kartu tokoh, refleksi, kotak catatan.
- **Misi (quest) berpoin, jalur karier, peta karier, dan papan pencapaian** (tingkat *Maba Penasaran* sampai *Navigator Karier*), semuanya tersimpan per ebook di browser pembaca. Sintaksnya ada di bagian 3.

**Akun & ebook berbayar (opsional, bagian 9)**
- Daftar/masuk dengan email + kata sandi, halaman *Akunku* berisi riwayat pembelian, dan ebook berbayar yang terkunci sampai lunas.
- Bayar lewat Midtrans; isi ebook disimpan di server dan hanya dikirim ke pembeli yang sudah lunas.
- Admin toko mengelola harga, status terbit, dan isi ebook dari Ruang Redaksi.
- Lupa kata sandi dan ganti kata sandi (lewat tautan email). Tautan itu hanya bekerja kalau **Site URL** dan **Redirect URLs** di Supabase berisi alamat web ini (bagian 9.3).

**Dasbor member, musik, dan tampilan klien (bagian 10)**
- `/dasbor`: menu samping (hamburger di HP) berisi Ringkasan, Rak, Cari Ebook, Favorit, Riwayat Baca, Pembelian, Akun, Pengaturan Suara, About Me.
- Pencarian dengan saringan tema, topik, dan akses (gratis/berbayar).
- 5 pilihan musik latar (ambient, dua lo-fi, hujan, suara alam) dengan nyala/mati dan volume. Semuanya disintesis di browser, tanpa berkas audio.
- `/klien`: ringkasan formal untuk peninjau, datar dan siap dicetak.

**Aksesibilitas & performa**
- Mobile-first (diuji di 375px dan 1440px, tanpa scroll horizontal), navigasi keyboard, "Lewati ke konten", `aria-label` di tombol ikon, teks alternatif untuk Nalar, kontras WCAG AA (dites otomatis di `tests/kontras.test.ts`).
- Menghormati `prefers-reduced-motion`. Di perangkat lemah (≤2 core CPU, hemat data) atau dengan `?ringan=1` di alamat, animasi berat otomatis dimatikan.

---

## 6. Struktur folder

```
ruang-nalar/
├─ .github/workflows/deploy.yml   ← deploy otomatis ke GitHub Pages
├─ docs/                          ← hasil build siap pakai (Opsi B)
├─ public/favicon.svg, toko-config.json   ← toko-config.json: (opsional) alamat Supabase tanpa build ulang
├─ src/
│  ├─ content/                    ← ★ taruh ebook .md publik di sini
│  ├─ config.ts                   ← ★ nama web, penulis, sandi admin
│  ├─ App.tsx, main.tsx, index.css
│  ├─ pages/                      ← Home (rak), Reader (baca), Admin (Ruang Redaksi), Masuk, Akun, Klien, NotFound
│  │  └─ dasbor/                  ← halaman di dalam /dasbor (Ringkasan, Rak, Cari, Favorit, Riwayat, Akun, Suara, Tentang)
│  ├─ components/
│  │  ├─ admin/                   ← gerbang sandi, daftar, editor, dialog konfirmasi
│  │  ├─ dasbor/                  ← kerangka dasbor + menu samping, kisi ebook
│  │  ├─ landing/                 ← bagian promosi beranda
│  │  ├─ art/                     ← seni procedural SVG (bunga matahari, iris, pusaran, sampul, sampul kolase + stiker Nalar, …)
│  │  ├─ fx/                      ← kanvas bintang, kursor kuas/percikan/kelopak, sapuan, loading
│  │  ├─ nalar/                   ← maskot Nalar (SVG, ekspresi, otak/mood)
│  │  └─ reader/                  ← blok ebook (termasuk misi, jalur karier, peta, papan di BlokKarier.tsx), kepala bab, sorot, progres, data baca
│  └─ lib/                        ← parser ebook, IndexedDB, penyimpanan, frasa Nalar, musik (musik.ts, penghasilMusik.ts, audio.ts), tema, sampul (+ kanjiSampul.ts), papan.ts (poin & tingkat), toko/ (akun & bayar)
├─ KEAMANAN.md                    ← status perlindungan, cara menyalakan CAPTCHA, daftar yang perlu kamu atur
├─ supabase/                      ← (opsional) schema.sql + Edge Functions untuk akun & pembayaran
│  ├─ schema.sql, functions/      ← tabel + aturan akses, buat-transaksi, midtrans-webhook, hapus-akun (opsional)
│  ├─ patch/                      ← tambahan untuk database yang sudah berjalan (01-persetujuan.sql)
│  ├─ dashboard/                  ← versi satu-berkas kedua fungsi, untuk ditempel di Dashboard Supabase
│  └─ tests/edge_test.ts          ← uji Edge Function dengan Deno (Supabase & Midtrans tiruan)
├─ scripts/                       ← bundel-fungsi.mjs, csp.ts (kebijakan keamanan konten), satu-file.mjs
├─ tests/                         ← vitest (parser, frasa, kontras, lencana, toko, aturan RLS, panduan toko, dasbor, musik, klaim promosi)
├─ index.html, vite.config.ts, tailwind.config.js, tsconfig.json
└─ package.json, package-lock.json
```

---

## 7. Catatan jujur & batasan

- **Sandi admin bukan keamanan** (lihat bagian 4).
- **Ebook dari admin hanya ada di satu browser** (IndexedDB). Ganti browser/perangkat atau hapus data situs = ebook itu hilang. Gunakan **Ekspor JSON** untuk cadangan, atau **Unduh .md** lalu taruh di `src/content/`.
- Sorotan, catatan, penanda, jawaban kuis, dan posisi baca pembaca juga hanya tersimpan di browser masing-masing pembaca. Rak pribadi, favorit, riwayat baca, dan pilihan musik di dasbor juga **per perangkat**: belum ada sinkronisasi antarperangkat, dan ini dikatakan terang-terangan di halaman beranda dan `/klien`.
- Belum ada tombol pengajuan refund di web. Refund dilakukan manual lewat dashboard Midtrans.
- Belum ada halaman Syarat & Ketentuan, Kebijakan Privasi, dan Kontak khusus. Kontak cukup diisi lewat `toko-config.json` (bagian 10). Pemeriksa pembayaran umumnya menilai kejelasan produk, harga, dan kontak penjual, jadi halaman semacam itu akan membantu kalau dibuat sebelum mengajukan aktivasi Production (syarat terbarunya cek di dokumentasi Midtrans).
- Tidak ada DRM. Pembaca yang sudah membeli bisa menyalin teks yang tampil di layarnya.
- Font (Fraunces, Lora, Caveat) dimuat dari Google Fonts, jadi butuh internet. Tanpa internet, tampilan tetap jalan memakai font serif bawaan.
- Ikon sampul memakai emoji, sehingga bentuknya mengikuti perangkat pembaca.
- Secara bawaan tidak ada backend, login, database, komentar, pembayaran, atau analitik. Akun & pembayaran hanya ada kalau kamu menyalakannya sendiri (bagian 9). Tidak ada komentar atau analitik sama sekali. Semua gambar dibuat dengan kode (SVG/Canvas), tanpa file gambar eksternal.
- Diuji di Chromium (Playwright) pada lebar 375px dan 1440px. Safari dan Firefox belum diuji langsung.

## 8. Pemecahan masalah

| Gejala | Penyebab & solusi |
| --- | --- |
| Halaman putih / 404 di GitHub Pages | Source Pages belum diatur. Lihat Langkah 2, atau pakai Opsi B. |
| Tab Actions merah di langkah "Tayangkan" | Pages belum aktif. Atur Source ke *GitHub Actions* lalu **Run workflow**. |
| Tidak ada tab/workflow Actions | Folder `.github` tidak ikut terunggah (tersembunyi). Unggah lewat git, atau tambahkan lewat **Add file → Create new file** dengan nama `.github/workflows/deploy.yml`, atau pakai Opsi B. |
| Ebook baru dari admin tidak tampil di rak | Statusnya masih **Draf**. Ubah ke **Terbit**. |
| Ebook di `src/content/` tidak muncul | Pastikan akhiran `.md`, ada frontmatter `judul:`, dan **status: terbit**. Cek halaman admin untuk peringatan. |
| Kursor kuas tidak tampil | Memang hanya aktif di perangkat dengan mouse, dan tidak di mode ringan / reduced-motion. |
| Suara tidak bunyi | Default mati. Klik ikon speaker di pojok kanan atas, atau ikon not musik untuk memilih lagu. Browser hanya mengizinkan suara setelah ada klik. |
| Tautan "lupa sandi" atau konfirmasi email membuka "Not found" | **Site URL** dan **Redirect URLs** di Supabase (*Authentication → URL Configuration*) belum berisi alamat web lengkap dengan nama repo (bagian 9.3). Email yang sudah terkirim tetap membawa tujuan lama, jadi kirim ulang. |
| Daftar atau kirim ulang email muncul "Terlalu sering mencoba" / "Batas pengiriman email sedang penuh" | Pengirim email bawaan Supabase hanya mengizinkan beberapa email per jam untuk seluruh proyek, dan tiap pendaftaran memakai satu jatah. Tunggu sekitar satu jam. Untuk pemakaian sungguhan pasang SMTP sendiri (*Authentication → Emails → SMTP Settings*, mis. Brevo atau Resend), atau matikan *Confirm email* (*Authentication → Sign In / Providers → Email*) selagi uji coba. Akun yang sudah terdaftar tetapi belum terkonfirmasi bisa dikonfirmasi lewat SQL di bagian 9.3. |
| `/dasbor` langsung melempar ke halaman masuk | Memang begitu kalau toko aktif dan kamu belum masuk. Masuk dulu, lalu kamu diantar kembali ke dasbor. |
| Tombol akun tidak muncul | Fitur toko mati karena `SUPABASE_URL`/`SUPABASE_ANON_KEY` kosong. Itu normal. Isi keduanya (bagian 9) atau coba demo lewat `npm run dev`. |
| Setelah bayar, ebook masih terkunci | Cek halaman **Akunku**. Status berubah setelah Midtrans memanggil webhook (biasanya detik, transfer bank bisa menit). Kalau tetap *Menunggu*, periksa Notification URL di Midtrans dan log fungsi `midtrans-webhook` di Supabase. |
| Tombol Beli bilang "belum siap" | Secret `MIDTRANS_SERVER_KEY` / `SITE_URL` belum diatur, atau fungsi belum di-deploy. Ulangi langkah 5 di bagian 9.3. |
| Panel toko di Ruang Redaksi bilang bukan admin | Akunmu belum dimasukkan ke tabel `admin_users` (langkah 3 di bagian 9.3). |

---

## 9. Akun & ebook berbayar (opsional)

Fitur ini **mati secara bawaan**. Selama `SUPABASE_URL` dan `SUPABASE_ANON_KEY` di `src/config.ts` kosong, web berjalan persis seperti biasa (tanpa tombol akun, tanpa permintaan jaringan tambahan).

### 9.1 Coba dulu versi demo (gratis, tanpa akun apa pun)

Jalankan `npm run dev` di komputermu. Di alamat lokal (`localhost`), mode **demo** menyala otomatis: akun dan pembayaran **palsu**, tersimpan hanya di browser itu, tanpa uang sungguhan. Di rak muncul satu ebook berbayar contoh (Rp 25.000). Kamu bisa daftar, "membeli", membaca, keluar, bahkan masuk sebagai admin demo (`admin@demo.test` / `admin-demo-123`) untuk menjual ebook baru di Ruang Redaksi. Mode demo **tidak aman** dan hanya untuk melihat alurnya. Di web publik, demo hanya menyala kalau kamu sengaja set `TOKO_DEMO = true`.

### 9.2 Cara kerjanya

```
Pembeli ──masuk──▶ Supabase Auth
   │ klik Beli ──▶ Edge Function buat-transaksi ──▶ Midtrans Snap (halaman bayar)
   │                  (harga dibaca dari database)           │ pembeli bayar
   ▼                                                          ▼
Baca ebook ◀── tabel ebook_isi ◀── status "lunas" ◀── Edge Function midtrans-webhook
 (RLS: hanya yang lunas)                                (cek tanda tangan + tanya ulang ke Midtrans + cek jumlah)
```

Yang dijaga di **server**, bukan di browser: isi ebook berbayar (tabel `ebook_isi`, dilindungi Row Level Security), harga, dan status lunas. Browser pembeli tidak bisa menulis tabel pembelian sama sekali.

### 9.3 Mengaktifkan versi sungguhan

> **Panduan di dalam web:** langkah-langkah di bawah (plus pendaftaran Midtrans di 9.6) juga tersedia sebagai daftar centang di **Ruang Redaksi** (`#/admin`), bagian **Panduan membuka toko**, lengkap dengan tombol Salin untuk nama fungsi, nama secret, dan perintah SQL. Centangnya hanya pengingat yang tersimpan di browser.

Semua langkah di bawah dikerjakan **olehmu** karena butuh akunmu sendiri. Sandbox (uji coba) Midtrans gratis dan tidak memakai uang sungguhan. Selalu uji di sandbox dulu.

1. **Buat proyek Supabase** di [supabase.com](https://supabase.com) (paket gratis cukup untuk mulai). Pilih region terdekat (mis. Singapore). Simpan *Project URL* (`https://xxxx.supabase.co`) dan kunci **anon / publishable** dari halaman pengaturan API proyek. Nama menu bisa sedikit berubah.
2. **Jalankan skema**: *SQL Editor → New query*, tempel seluruh isi `supabase/schema.sql`, klik **Run**. Aman dijalankan ulang. Kalau database-mu sudah berjalan dari skema versi lama, cukup jalankan file di `supabase/patch/` yang belum pernah kamu jalankan (lihat 10.6).
3. **Jadikan dirimu admin toko**: pertama punya akun dulu, boleh lewat tombol akun di web-mu (setelah langkah 7) atau langsung di Supabase (*Authentication → Users → Add user*, centang auto-confirm). Lalu di SQL Editor jalankan (ganti emailnya):
   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'emailmu@contoh.com'
   on conflict do nothing;
   ```
4. **Midtrans**: daftar di [midtrans.com](https://midtrans.com), masuk ke dashboard **Sandbox**, ambil **Server Key** sandbox (diawali `SB-Mid-server-`). Untuk mode produksi (uang sungguhan), Midtrans memverifikasi usahamu dulu. Dokumen yang diminta (untuk perorangan biasanya KTP dan NPWP) dan lama prosesnya ditentukan Midtrans dan bisa berubah, jadi cek persyaratan terbarunya di situs mereka. Panduan daftar sebagai usaha mikro dengan pembayaran e-wallet + QRIS ada di **9.6**.
5. **Pasang dua Edge Function** (kode yang menerima pembayaran). Pilih salah satu cara. Nama fungsi **harus persis** `buat-transaksi` dan `midtrans-webhook`.

   **Cara A: lewat Dashboard Supabase (tanpa terminal, bisa dari HP).**
   1. *Edge Functions → Deploy a new function → Via Editor*, beri nama `buat-transaksi`, hapus kode contoh, lalu tempel seluruh isi `supabase/dashboard/buat-transaksi.ts`, klik **Deploy**.
   2. Ulangi untuk `midtrans-webhook` dengan isi `supabase/dashboard/midtrans-webhook.ts`.
   3. Di pengaturan **masing-masing** fungsi, **matikan "Verify JWT"** (nama opsinya bisa sedikit berbeda). Ini aman: `buat-transaksi` memeriksa sendiri token pembeli, dan `midtrans-webhook` memang dipanggil Midtrans yang tidak punya token Supabase (keamanannya dari pemeriksaan tanda tangan).
   4. Di *Edge Functions → Secrets* tambahkan tiga secret ini (nama persis, huruf besar):
      - `MIDTRANS_SERVER_KEY` = Server Key sandbox dari langkah 4
      - `MIDTRANS_ENV` = `sandbox`
      - `SITE_URL` = alamat web-mu **persis**, mis. `https://namamu.github.io/ruang-nalar/` (domain sendiri kalau pakai domain sendiri). Dari alamat inilah browser diizinkan memanggil fungsi pembayaran.
      - *(opsional)* `MIDTRANS_METODE` = saluran bayar yang ditampilkan, dipisah koma. **Kosong = e-wallet + QRIS** (`gopay,shopeepay,other_qris`). Isi `semua` untuk tidak membatasi. Lihat **9.6**.

   **Cara B: lewat terminal** (butuh Node.js; tanpa Docker):
   ```bash
   npx supabase login                # atau set SUPABASE_ACCESS_TOKEN dari dashboard Supabase
   npx supabase init                 # sekali saja; membuat supabase/config.toml, tidak menimpa file lain

   npx supabase secrets set --project-ref ID_PROYEK \
     MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxx \
     MIDTRANS_ENV=sandbox \
     SITE_URL=https://namamu.github.io/ruang-nalar/

   npx supabase functions deploy buat-transaksi   --project-ref ID_PROYEK --use-api --no-verify-jwt
   npx supabase functions deploy midtrans-webhook --project-ref ID_PROYEK --use-api --no-verify-jwt
   ```
   `ID_PROYEK` adalah bagian depan Project URL (`xxxx` di `https://xxxx.supabase.co`).

   **Server Key hanya boleh ada di secrets Supabase.** Jangan menaruhnya di `src/config.ts`, `toko-config.json`, di repo, atau di chat. Kalau sempat bocor, buat ulang di dashboard Midtrans.
6. **Daftarkan webhook**: di dashboard Midtrans (Sandbox) buka *Settings → Payment Settings* (di dokumentasi Midtrans lama bernama *Settings → Configuration*; nama menu bisa berubah) dan isi **Payment Notification URL** dengan
   `https://ID_PROYEK.supabase.co/functions/v1/midtrans-webhook`
7. **Beri tahu web-mu alamat Supabase-nya.** Ada dua cara, pilih salah satu:
   - **Tanpa build ulang (paling mudah di GitHub):** edit file `toko-config.json` di samping `index.html` (di repo ini ada di `public/toko-config.json`; kalau kamu memakai versi satu-file, unggah file itu ke repo-mu di folder yang sama dengan `index.html`). Isinya:
     ```json
     {
       "SUPABASE_URL": "https://xxxx.supabase.co",
       "SUPABASE_ANON_KEY": "kunci-anon-atau-publishable-milikmu",
       "TOKO_DEMO": false
     }
     ```
   - **Lewat kode:** isi `SUPABASE_URL` dan `SUPABASE_ANON_KEY` di `src/config.ts` lalu build ulang. Nilai di `toko-config.json` (kalau tidak kosong) menimpa `src/config.ts`.

   Isi `SUPABASE_URL` dengan **alamat depannya saja** (`https://xxxx.supabase.co`). Kalau kamu menempel alamat API lengkap (`…/rest/v1/`), web akan membuang bagian belakangnya sendiri dan menulis peringatan di konsol.

   Kunci "anon / publishable" memang publik (keamanan data dijaga RLS). **Jangan** memasukkan kunci `service_role` atau `sb_secret_...`; web akan menolak memakainya dan menulis peringatan di konsol browser, tetapi kalau sudah terlanjur terunggah ke repo publik, segera buat ulang kuncinya di Supabase.
8. **Tayangkan ulang** kalau perlu (jika kamu hanya mengedit `toko-config.json` di GitHub, GitHub Pages akan memperbaruinya sendiri dalam beberapa menit; tekan refresh keras di browser bila masih lama).
9. **Uji di sandbox**: login, jual satu ebook murah, beli dengan metode simulasi dari Midtrans (dokumentasi *Testing* mereka menjelaskan metode & simulatornya). Pastikan status di *Akunku* berubah ke **Lunas** dan ebook terbuka. ⚠️ Selama Midtrans masih Sandbox, ebook yang berstatus *Terbit* bisa “dibeli” siapa pun yang tahu simulator Midtrans tanpa membayar. Karena itu pakai **ebook contoh** berisi pendek untuk uji ini, dan baru terbitkan isi aslinya setelah memakai kunci produksi (langkah 10).
10. **Pindah ke produksi** setelah akun Midtrans produksimu disetujui: ganti `MIDTRANS_SERVER_KEY` dengan Server Key **produksi**, set `MIDTRANS_ENV=production` (ubah secret di Dashboard, atau jalankan `secrets set` lagi), dan isi Notification URL yang sama di dashboard **Production** (dashboard sandbox dan produksi terpisah). Urutan lengkapnya ada di **9.6**.

**Isi Site URL dulu.** Web ini mengirim alamatnya sendiri (lengkap dengan nama repo) sebagai tujuan tautan konfirmasi, tetapi Supabase hanya mau memakainya kalau alamat itu terdaftar di *Redirect URLs*. Kalau tidak terdaftar, Supabase memakai *Site URL*-nya, jadi dua isian ini tetap harus benar. Kalau masih bawaan atau salah, tautan di email membuka halaman "Not found" (padahal emailnya biasanya sudah terverifikasi; coba langsung masuk). Buka Supabase *Authentication → URL Configuration*, isi **Site URL** dengan alamat web persis seperti yang dibuka di browser (mis. `https://NAMAKAMU.github.io/ruang-nalar/`, nama repo harus ikut), tambahkan alamat yang sama di **Redirect URLs**, lalu Save. Email yang sudah terkirim tetap membawa tujuan lama, jadi daftar ulang atau kirim ulang. Kalau ada akun yang terlanjur tidak terkonfirmasi, jalankan di SQL Editor: `update auth.users set email_confirmed_at = now() where email = 'emailnya' and email_confirmed_at is null;`

Pengaturan email: di Supabase *Authentication → Providers → Email*, kamu bisa mewajibkan konfirmasi email. Pengirim email bawaan Supabase dibatasi jumlahnya dan ditujukan untuk uji coba, jadi untuk pengguna sungguhan pasang SMTP sendiri atau matikan konfirmasi (dengan risiko orang bisa mendaftar memakai email yang salah ketik).

### 9.4 Menjual ebook

Buka **Ruang Redaksi** (`#/admin`), masuk kode sandi admin, lalu di bagian **Toko ebook berbayar** masuk dengan akun adminmu. Klik *Ebook berbayar baru*, tempel isi `.md` (format sama seperti ebook biasa), isi harga, centang **Terbit**. Judul, tema, ikon, dan deskripsi diambil dari frontmatter. Tombol *Baca* memberimu pratinjau seperti pembeli.

⚠️ **Jangan menaruh ebook berbayar di `src/content/`.** Folder itu publik: siapa pun bisa membacanya gratis.

### 9.5 Catatan jujur untuk fitur ini

- **Belum diuji langsung ke Supabase dan Midtrans sungguhan** (lingkungan pengembangannya tidak punya akses ke keduanya). Yang sudah diuji: alur lengkap mode demo di browser (HP 375px & desktop), aturan akses database di Postgres tiruan (`tests/toko-rls.test.ts`), logika tanda tangan/status/jumlah, dan kedua Edge Function dijalankan di Deno sungguhan dengan Supabase & Midtrans tiruan (`supabase/tests/edge_test.ts`; jalankan dengan `npm run test:edge` bila Deno terpasang; versi `supabase/dashboard/` diuji dengan `EDGE_BUNDEL=1`). **Karena itu uji dulu di sandbox, dengan transaksi kecil, sebelum membuka toko.**
- **Mode Sandbox itu terbuka untuk dikelabui**: selama `MIDTRANS_ENV=sandbox`, ebook yang Terbit bisa “dibeli” tanpa uang lewat simulator Midtrans. Jangan menaruh isi asli di toko sebelum pindah ke produksi.
- Tidak ada DRM: pembeli yang sah bisa menyalin teks atau memfoto layar ebook yang dia beli, dan bisa membagikan sandi akunnya. Kontrol akses hanya mencegah orang yang **belum** membayar.
- **Belum ada fitur "lupa kata sandi".** Untuk sementara pemilik web bisa mengatur ulang sandi pengguna di dashboard Supabase (*Authentication → Users*).
- Belum ada tombol refund atau voucher. Kalau kamu mengembalikan uang pembeli lewat dashboard Midtrans, cabut aksesnya dengan SQL: `update public.pembelian set status = 'gagal' where order_id = 'ORDER-ID-DARI-AKUNKU';`
- Ebook yang sudah pernah dibeli tidak bisa dihapus (supaya pembeli tidak kehilangan akses). Sembunyikan saja dengan *Jadikan draf*.
- Menjual produk digital punya konsekuensi pajak dan aturan hukum sendiri. Itu di luar cakupan panduan ini dan bukan nasihat hukum atau pajak, jadi cek aturan yang berlaku untukmu.
- Biaya: Supabase punya paket gratis dengan batas pemakaian. Midtrans memungut biaya per transaksi sesuai tarif yang mereka tampilkan.
- Sorotan, catatan, dan progres baca ebook berbayar tetap tersimpan di browser pembaca (bukan di server).

### 9.6 Daftar Midtrans sebagai usaha mikro, bayar lewat e-wallet dan QRIS

**Di sisi web sudah beres.** Fungsi `buat-transaksi` meminta Midtrans menampilkan hanya **GoPay, ShopeePay, dan QRIS** (nama saluran Snap: `gopay`, `shopeepay`, `other_qris`). Mau mengubah? Isi secret `MIDTRANS_METODE`, mis. `gopay,other_qris`, atau `semua` supaya mengikuti semua metode yang aktif di dashboard Midtrans. Ini hanya *membatasi*: metode yang belum aktif di akun Midtrans-mu tidak akan muncul, apa pun isi daftarnya. Karena itu aktifkan juga metodenya di dashboard Midtrans (menu pengaturan *Snap Preferences* / metode pembayaran; namanya bisa berubah). Nama saluran DANA tidak bisa dipastikan dari dokumentasi yang dibaca, jadi tidak dimasukkan ke daftar bawaan.

**Urutan mendaftar (perorangan / usaha mikro):**

1. **Siapkan data.** KTP, NPWP pribadi, dan alamat web tokomu (alamat GitHub Pages cukup), akun media sosial atau katalog produk. Dokumen perorangan di dokumentasi Midtrans: *KTP pemilik bisnis* dan *NPWP*. Halaman pendaftaran mereka menyebut paket awal (transfer bank, GoPay, QRIS) cukup memakai KTP, sedangkan kartu butuh KTP dan NPWP. Siapkan dua-duanya supaya tidak bolak-balik. Badan usaha (PT/CV) berbeda: butuh akta, NPWP perusahaan, dan NIB/SIUP/TDP. Untuk usaha perorangan NIB **tidak tercantum** sebagai syarat.
2. **NIB (opsional, disarankan).** Usaha mikro bisa mengurus NIB di [oss.go.id](https://oss.go.id): pilih skala *usaha mikro* dan pelaku *perseorangan*, isi NIK, NPWP pribadi, email, nomor HP, dan alamat sesuai KTP. Berguna sebagai bukti usaha, tetapi Midtrans tidak mewajibkannya untuk perorangan.
3. **Daftar di midtrans.com**, verifikasi email, lalu di dashboard klik banner penyelesaian registrasi, pilih jenis usaha *perorangan*, isi data dan unggah dokumen, lalu **Ajukan**. Jangan memilih kategori usaha yang dilarang Midtrans. Tunggu kabar persetujuan lewat email; Midtrans bisa meminta dokumen tambahan.
4. **Setelah disetujui**, di dashboard mode **Production**: aktifkan hanya GoPay dan QRIS (dan ShopeePay bila tersedia untuk akunmu), lalu ambil **Server Key produksi**.
5. **Ganti secrets** di Supabase: `MIDTRANS_SERVER_KEY` = Server Key produksi, `MIDTRANS_ENV` = `production`. Isi **Payment Notification URL** di dashboard Production dengan `https://ID_PROYEK.supabase.co/functions/v1/midtrans-webhook`. Tidak perlu mengubah `toko-config.json`.
6. **Uji satu transaksi kecil sungguhan** (ebook tes Rp 1.000) dan pastikan status di *Akunku* berubah ke **Lunas**. Setelah itu jadikan ebook tes *draf*.

**Biaya (per transaksi sukses, tanpa biaya pasang/bulanan, menurut halaman harga Midtrans saat dibaca):** QRIS 0,7%, GoPay 2%, DANA 1,5%, ShopeePay 1,5% atau 2% (dua sumber Midtrans berbeda), transfer bank Rp 4.000 tetap. Sumbernya berbeda pendapat apakah PPN 11% sudah termasuk untuk QRIS/GoPay/ShopeePay, jadi cek tarif dan PPN-nya di dashboard sebelum menentukan harga. Tarif bisa berubah.

**Pajak (bukan nasihat pajak):** untuk wajib pajak orang pribadi dengan peredaran bruto di bawah Rp 500 juta setahun, penghasilan usaha tidak dikenai PPh final UMKM; di atas itu 0,5% dari peredaran bruto (PP 55/2022; menurut pajak.go.id tetap berlaku setelah perubahan PP 20/2026). Cek kewajiban lapor SPT-mu ke DJP atau konsultan pajak.

---

## 10. Dasbor, musik latar, dan tampilan klien

### 10.1 Rute baru

| Alamat | Isi |
| --- | --- |
| `#/` | Beranda: hero, cerita Nalar, keunggulan, cara kerja, **Coba Gratis**, rak, tanya-jawab |
| `#/dasbor` | Dasbor member (menu samping). Kalau toko aktif dan belum masuk, diantar ke halaman masuk lalu kembali ke dasbor |
| `#/dasbor/rak`, `/cari`, `/favorit`, `/riwayat`, `/pembelian`, `/akun`, `/suara`, `/tentang` | Halaman di dalam dasbor. `/pembelian` hanya ada kalau toko aktif |
| `#/klien` | Tampilan klien: ringkasan formal untuk peninjau, tanpa dekorasi, bisa dicetak |
| `#/kebijakan-privasi`, `#/syarat-ketentuan` | Dokumen hukum, dibacakan Nalar. Tautannya ada di footer dan di form buat akun (lihat 10.6) |

Pengunjung tanpa akun tetap bisa membaca semua ebook gratis. Akun hanya dibutuhkan untuk membeli ebook berbayar dan membuka dasbor.

### 10.2 Mengisi "About Me" dan kontak tanpa build ulang

Halaman **About Me** di dasbor dan bagian Kontak di `/klien` membaca tiga kunci opsional dari `toko-config.json` (edit di GitHub, ikon pensil, lalu Commit). Nilai yang kosong atau tidak valid diabaikan, dan hanya tautan `https` yang diterima.

```json
{
  "SUPABASE_URL": "https://xxxx.supabase.co",
  "SUPABASE_ANON_KEY": "sb_publishable_...",
  "TOKO_DEMO": false,
  "TENTANG_PEMBUAT": "Cerita singkat tentang kamu dan kenapa web ini dibuat (maksimal 1200 huruf).",
  "KONTAK_EMAIL": "emailmu@contoh.com",
  "NAMA_PENGELOLA": "Namamu atau nama usahamu",
  "KOTA_DOMISILI": "Surabaya",
  "TAHUN_HAK_CIPTA": 2026,
  "TAUTAN": [
    { "label": "Instagram", "url": "https://instagram.com/namamu" }
  ]
}
```

Bawaannya ada di `src/config.ts` (`TENTANG_PEMBUAT`, `KONTAK_EMAIL`, `TAUTAN_KONTAK`, `NAMA_PENGELOLA`, `KOTA_DOMISILI`, `TAHUN_HAK_CIPTA`). Tiga kunci terakhir dipakai dokumen hukum (10.6). Nama yang tampil sebagai pembuat adalah `NAMA_PENULIS_DEFAULT`, jadi **ganti dari "Pemilik Ruang Nalar"** dengan namamu.

### 10.3 Lupa dan ganti kata sandi

Halaman Masuk punya tautan *Lupa kata sandi*. Emailnya membawa tautan ke web ini, tempat pengguna mengisi sandi baru. Agar tautannya tidak berujung "Not found", isi **Site URL** dan **Redirect URLs** di Supabase dengan alamat web lengkap (bagian 9.3). Pengguna yang sudah masuk bisa mengganti sandi di *Dasbor → Akun*.

### 10.4 Musik latar

Ikon speaker di pojok kanan atas menyalakan atau mematikan musik, dan ikon not musik membuka pemilih lagu dan volume (juga ada di *Dasbor → Pengaturan Suara*). Pilihan tersimpan di browser.

| Lagu | Jenis |
| --- | --- |
| Langit Berputar | ambient |
| Kafe Malam (74 bpm) | lo-fi |
| Senja Pelan (64 bpm) | lo-fi |
| Hujan di Jendela | hujan |
| Hutan dan Sungai | suara alam |

- Semuanya **disintesis langsung di browser** dengan WebAudio, tanpa berkas mp3, jadi tidak menambah ukuran unduhan dan tidak ada soal hak cipta musik. Konsekuensinya, bunyinya sederhana dan terdengar sintetis. Kalau mau lagu rekaman asli, taruh berkas berlisensi jelas di `public/` dan sambungkan lewat `src/lib/audio.ts`.
- Default **mati**. Browser baru mengizinkan suara setelah pengguna mengklik sesuatu.
- Kenyaringan antarjenis sudah disamakan lewat ukur render offline (`PENYETARA` di `src/lib/musik.ts`, dijaga `tests/musik.test.ts`). Tetap dengarkan sendiri di HP dan earphone-mu, karena pengujian di sini hanya mengukur angka, bukan telinga.

### 10.5 Sampul dan kepala bab

Sampul dirancang dari judul dan id ebook (`src/lib/sampul.ts`): 5 komposisi, dengan sedikit pergeseran dan skala, jadi satu ebook selalu mendapat sampul yang sama. Kepala bab di pembaca (`src/lib/gayaBab.ts`) memakai 5 gaya (klasik, angka, pita, tengah, tepi) yang berganti antarbab, dan dua di antaranya memakai huruf awal besar. Tidak perlu mengatur apa pun di file `.md`.

Ada satu sampul tambahan yang **tidak** ikut diacak: **kolase** (gaya tempel-guntingan poster Jepang 90-an, dengan stiker Nalar, kanji 進路 *shinro* = jalur/karier, dan 社会 *shakai* = masyarakat). Sampul ini hanya dipakai kalau frontmatter ebook memuat tag `sampul-kolase`:

```
tag: [sosiologi, karier, sampul-kolase]
```

Tag itu sengaja dipakai (bukan kolom baru) supaya gaya sampul ikut terbawa ke katalog toko tanpa mengubah skema Supabase. Tag yang berawalan `sampul-` tidak ditampilkan ke pembaca, tidak masuk filter tag, dan tidak ikut pencarian. Judul pada sampul dipecah otomatis jadi 1-3 baris huruf kapital; subjudul dipotong kalau lebih dari 34 huruf. Warna kulit Nalar mengikuti `tema`. Kanji ditanam sebagai bentuk SVG (huruf Noto Sans CJK JP Black, lisensi SIL OFL), jadi tampil sama di semua perangkat. Pilihan huruf judul `Montserrat` dimuat dari Google Fonts dan akan jatuh ke Arial Black kalau offline.

### 10.6 Kebijakan Privasi, persetujuan, dan hapus akun

Web ini punya dua dokumen hukum yang dibacakan Nalar (`#/kebijakan-privasi` dan `#/syarat-ketentuan`) dan fitur privasi dasar yang mengikuti UU No. 27 Tahun 2022 (PDP).

- **Isi dokumen** ada di `src/lib/legal/dokumen.ts`. Nama pengelola, email kontak, dan kota domisili diambil dari `NAMA_PENGELOLA`, `KONTAK_EMAIL`, dan `KOTA_DOMISILI` (10.2), jadi tidak perlu menyunting teksnya. Kalau email atau kota kosong, dokumen tetap utuh dan menunjuk jalur kontak lain.
- **Versi dokumen** ada di `src/lib/legal/versi.ts`. Setiap kali isi dokumen berubah, naikkan `VERSI_KEBIJAKAN` (maksimal 20 karakter), ubah `TANGGAL_BERLAKU`, dan tambah satu baris di `RIWAYAT_PERUBAHAN`. Pengunjung lama akan ditanya lagi lewat banner cookie.
- **Banner cookie**: tiga tombol setara (Terima semua, Hanya yang perlu, Atur pilihan), tidak ada yang tercentang dari awal, dan bisa dibuka lagi lewat tautan *Pengaturan cookie* di footer. **Saat ini web tidak memasang analitik atau pelacak apa pun**, dan banner jujur soal itu. Kalau kelak kamu memasang analitik, bungkus kodenya dengan `bolehAnalitik()` dari `src/lib/persetujuan.ts` supaya hanya jalan untuk yang mengizinkan, lalu ubah kalimat di banner dan di Kebijakan Privasi (bagian 6 dan 8).
- **Form buat akun** punya kotak persetujuan wajib (Kebijakan Privasi dan Syarat & Ketentuan, tidak tercentang dari awal) dan kotak opsional untuk email promo. Tombol *Buat akun* aktif setelah kotak wajib dicentang.
- **Catatan persetujuan di database**: tabel `public.persetujuan` hanya bisa ditambah (tidak ada kebijakan ubah/hapus untuk pengguna), memuat jenis, setuju atau tidak, versi dokumen, dan waktu dari server. Menarik persetujuan = menambah baris baru. Untuk database yang sudah berjalan, jalankan `supabase/patch/01-persetujuan.sql` sekali di SQL Editor (aman diulang). Pemasangan baru dari `schema.sql` sudah memuatnya.
- **Akun & pengaturan → Privasi & persetujuan**: pengguna bisa mencabut izin promo atau analitik, melihat riwayat, mengunduh data akunnya (JSON), dan menghapus akun dengan mengetik `HAPUS`.
- **Hapus akun** butuh satu Edge Function opsional bernama `hapus-akun` (kode: `supabase/dashboard/hapus-akun.ts`, deploy dengan cara yang sama seperti dua fungsi pembayaran, **matikan Verify JWT**, secret `SITE_URL` yang sama). Akun admin ditolak oleh fungsi ini. Tanpa fungsinya, tombol memberi tahu pengguna untuk meminta hapus lewat email. Catatan transaksi di sisi Midtrans tidak ikut terhapus.

> **Penting:** teks hukum ini disusun dengan itikad baik sebagai titik awal, bukan nasihat hukum. Sebelum web dipakai berjualan secara luas, minta konsultan hukum atau layanan bantuan hukum kampus membacanya, terutama bagian refund, batas tanggung jawab, dan domisili hukum.

### 10.7 Hak cipta dan bukti kepemilikan

- **Notice hak cipta** tampil di ujung setiap bab (`© 2026 Nama Penulis. Seluruh hak dilindungi UU No. 28 Tahun 2014 tentang Hak Cipta.`) dan di footer. Nama penulis diambil dari baris `penulis:` di ebook (bila kosong, dari `NAMA_PENULIS_DEFAULT`), tahunnya dari `TAHUN_HAK_CIPTA`, dan nama pengelola di footer dari `NAMA_PENGELOLA`.
- **Syarat & Ketentuan** bagian 2 menyatakan pembaca hanya mendapat lisensi baca pribadi, dan bagian 7 menyediakan jalur pelaporan konten bermasalah (takedown) ke email kontak.
- **Pencatatan ciptaan ke DJKI** (Direktorat Jenderal Kekayaan Intelektual) bisa menjadi bukti kepemilikan bila kelak ada sengketa plagiarisme. Prosesnya dilakukan sendiri oleh pemilik karya. Cek syarat, biaya, dan alur terbarunya langsung di situs resmi DJKI karena bisa berubah.
- **Simpan bukti waktu pembuatan** sebagai pendukung: riwayat commit di GitHub (jangan hapus repo-nya), simpan salinan berkas `.md` asli, dan simpan sidik jari (hash) tiap berkas. Contoh di Linux/macOS: `shasum -a 256 ebook-saya.md`.

### 10.8 Keamanan

Ringkasan perlindungan yang sudah ada, yang opsional, dan yang belum ada ada di **`KEAMANAN.md`**. Hal-hal yang berhubungan dengan kode:

- **Content-Security-Policy** dipasang otomatis pada build produksi lewat `scripts/csp.ts` (tidak aktif di `npm run dev`). Kalau kamu menyambungkan layanan baru (analitik, font lain, domain Supabase sendiri), tambahkan alamatnya di `SUMBER` pada berkas itu, lalu salin baris yang benar ke `public/_headers` (tes akan menampilkan barisnya bila berbeda).
- **Satu-berkas** (`index.html` yang langsung tayang tanpa GitHub Actions): `npm run build:docs` lalu `node scripts/satu-file.mjs docs satu-berkas.html`. Skrip ini otomatis menambahkan hash skrip yang di-inline ke CSP. Ganti nama hasilnya menjadi `index.html` di akar repo hanya kalau kamu memang tidak memakai GitHub Actions, dan simpan `index.html` asli sebagai `index.sumber.html`.
- **Jeda login** di browser (`src/lib/toko/cooldown.ts`) dan **CAPTCHA opsional** (`TURNSTILE_SITE_KEY` di `toko-config.json`, mati secara bawaan).
- **Validasi unggahan** ebook (`periksaIsiTeks` di `src/lib/berkas.ts`).

---

## 11. Ebook berbayar "Jalur Sosiologi": cara memasukkannya

File `jalur-sosiologi.md` (dikirim terpisah, **bukan** di dalam proyek ini) adalah ebook berbayar lengkap: kata pembuka, 10 bab, 30 kuis, 46 kartu, 11 misi, 9 kartu jalur karier, peta sembilan jalur, dan dua papan pencapaian. Karena berbayar, isinya **tidak boleh** ditaruh di `src/content/` (folder itu publik, ikut terbuka di GitHub dan di build).

1. Pastikan web sudah memakai versi terbaru dari proyek ini (blok misi, karier, peta, papan, dan sampul kolase ada di versi ini). Kalau memakai versi lama, blok baru akan dilewati dengan peringatan.
2. Buka `…/#/admin`, masuk ke Ruang Redaksi, lalu ke bagian **Toko ebook berbayar** dan masuk sebagai admin toko.
3. Klik **Ebook berbayar baru**, lalu **Ambil dari file .md** dan pilih `jalur-sosiologi.md`. Judul, subjudul, penulis, tema, ikon, tag, dan deskripsi diambil dari frontmatter. Di bawah kotak isi harus tertulis `Terbaca: Jalur Sosiologi · 15 bab · 30 kuis` **tanpa** peringatan format.
4. Isi **harga** (bilangan bulat rupiah, minimal 1000), centang **Terbit**, lalu **Simpan ke toko**.
5. **Jangan hapus tag `sampul-kolase`** dari baris `tag:` kalau kamu mengedit isinya. Tanpa tag itu sampul kembali ke gaya acak.
6. Cek sebagai pembeli: keluar dari akun admin, lihat sampulnya di rak (terkunci), lalu beli dan baca. Di mode demo semuanya palsu; di mode sungguhan, uji dengan akun biasa dan Midtrans Sandbox dulu.

Untuk mengubah isi buku nanti, buka lagi dari daftar toko (**Ubah**), lalu **Unduh .md**, edit, dan simpan kembali. Jangan menyalin isinya ke `src/content/`.
