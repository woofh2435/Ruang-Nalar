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

Hapus `src/content/apa-itu-sosiologi.md` kalau contoh itu sudah tidak diperlukan.

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
- Contoh lengkap: `src/content/apa-itu-sosiologi.md`.

---

## 4. Pengaturan penting (`src/config.ts`)

| Pengaturan | Fungsi |
| --- | --- |
| `NAMA_WEB` | Nama web di beranda dan tab browser (bawaan "Ruang Nalar") |
| `NAMA_PENULIS_DEFAULT` | Nama yang menggantikan `[NAMA PENULIS]`. **Ganti dengan namamu** |
| `TAGLINE` | Kalimat di bawah judul beranda |
| `ADMIN_PASSCODE` | Kode sandi halaman admin. **Ganti dari `GANTI_INI`** |

⚠️ **`ADMIN_PASSCODE` hanya pengunci ringan di sisi browser**, bukan keamanan sungguhan. Nilainya ikut terkirim ke setiap pengunjung dan bisa dibaca lewat DevTools. Jangan pakai sandi yang sama dengan akun lain. Karena ebook admin memang hanya tersimpan di browsermu sendiri, pengunjung lain tidak melihat isinya. Yang terlihat publik hanyalah ebook di `src/content/`.

---

## 5. Fitur

**Rak & tampilan**
- Rak buku dengan sampul yang dibuat otomatis dari tema, ikon, dan judul (miring 3D saat disorot), lencana *Selesai Dibaca* dan *Kuis Sempurna*.
- 2 tema web: **Malam Berbintang** dan **Ladang Matahari**. 5 tema warna sampul/ebook: malam, siang, iris, almond, api.
- Elemen kreatif: kursor kuas (hanya perangkat dengan mouse), layar muat berbentuk pusaran, transisi sapuan kuas antarhalaman, klik/ketuk bintang di latar (percikan + komentar Nalar), hujan kelopak bunga matahari saat bab selesai, suara ambient WebAudio (**default mati**).

**Nalar si bunglon**
- Gambar SVG, warna kulit mengikuti tema, mata kiri-kanan bergerak sendiri, ekor bergoyang, lidah menangkap kunang-kunang (ada poin).
- 8 ekspresi: senang, mikir, kaget, ngantuk, semangat, sedih, bangga, kedip-nakal (`window.nalar.setMood('kaget')` untuk mencoba dari konsol).
- Lebih dari 40 kalimat pendek sesuai kejadian (kuis benar/salah, diam 30 detik jadi ngantuk, diklik 5 kali berturut-turut jadi protes geli, dll.).

**Pembaca**
- Daftar bab, bilah progres kuas, bab sebelumnya/berikutnya, animasi balik halaman, ukuran huruf, **ingat posisi terakhir**.
- Sorot teks 3 warna, catatan tempel, penanda paragraf, semuanya tersimpan di IndexedDB browser pembaca.
- Blok interaktif: kuis, kartu balik, istilah (tooltip), kartu tokoh, refleksi, kotak catatan.

**Aksesibilitas & performa**
- Mobile-first (diuji di 375px dan 1440px, tanpa scroll horizontal), navigasi keyboard, "Lewati ke konten", `aria-label` di tombol ikon, teks alternatif untuk Nalar, kontras WCAG AA (dites otomatis di `tests/kontras.test.ts`).
- Menghormati `prefers-reduced-motion`. Di perangkat lemah (≤2 core CPU, hemat data) atau dengan `?ringan=1` di alamat, animasi berat otomatis dimatikan.

---

## 6. Struktur folder

```
ruang-nalar/
├─ .github/workflows/deploy.yml   ← deploy otomatis ke GitHub Pages
├─ docs/                          ← hasil build siap pakai (Opsi B)
├─ public/favicon.svg
├─ src/
│  ├─ content/                    ← ★ taruh ebook .md publik di sini
│  ├─ config.ts                   ← ★ nama web, penulis, sandi admin
│  ├─ App.tsx, main.tsx, index.css
│  ├─ pages/                      ← Home (rak), Reader (baca), Admin (Ruang Redaksi), NotFound
│  ├─ components/
│  │  ├─ admin/                   ← gerbang sandi, daftar, editor, dialog konfirmasi
│  │  ├─ art/                     ← seni procedural SVG (bunga matahari, iris, pusaran, sampul, …)
│  │  ├─ fx/                      ← kanvas bintang, kursor kuas/percikan/kelopak, sapuan, loading
│  │  ├─ nalar/                   ← maskot Nalar (SVG, ekspresi, otak/mood)
│  │  └─ reader/                  ← blok ebook, sorot, progres, data baca
│  └─ lib/                        ← parser ebook, IndexedDB, penyimpanan, frasa Nalar, audio, tema
├─ tests/                         ← vitest (parser, frasa, kontras, lencana)
├─ index.html, vite.config.ts, tailwind.config.js, tsconfig.json
└─ package.json, package-lock.json
```

---

## 7. Catatan jujur & batasan

- **Sandi admin bukan keamanan** (lihat bagian 4).
- **Ebook dari admin hanya ada di satu browser** (IndexedDB). Ganti browser/perangkat atau hapus data situs = ebook itu hilang. Gunakan **Ekspor JSON** untuk cadangan, atau **Unduh .md** lalu taruh di `src/content/`.
- Sorotan, catatan, penanda, jawaban kuis, dan posisi baca pembaca juga hanya tersimpan di browser masing-masing pembaca.
- Font (Fraunces, Lora, Caveat) dimuat dari Google Fonts, jadi butuh internet. Tanpa internet, tampilan tetap jalan memakai font serif bawaan.
- Ikon sampul memakai emoji, sehingga bentuknya mengikuti perangkat pembaca.
- Tidak ada backend, login, database, komentar, pembayaran, atau analitik. Semua gambar dibuat dengan kode (SVG/Canvas), tanpa file gambar eksternal.
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
| Suara tidak bunyi | Default mati. Klik ikon speaker di pojok kanan atas. Browser hanya mengizinkan suara setelah ada klik. |
