// Kalimat gelembung Nalar: bahasa Indonesia santai, maksimal 12 kata, dikelompokkan per kejadian.
// (Jumlah kalimat dan panjangnya diuji otomatis di tests/phrases.test.ts.)

import type { MoodNalar } from './types'

export type Kejadian =
  | 'sapa'
  | 'idle'
  | 'bangun'
  | 'kuisBenar'
  | 'kuisSalah'
  | 'babBaru'
  | 'klikBeruntun'
  | 'tangkap'
  | 'tangkapGagal'
  | 'bintang'
  | 'selesaiBab'
  | 'selesaiBuku'
  | 'sorot'
  | 'catatan'
  | 'penanda'
  | 'penandaLepas'
  | 'temaMalam'
  | 'temaLadang'
  | 'bunyiOn'
  | 'bunyiOff'
  | 'musikPilih'
  | 'refleksi'
  | 'misiSelesai'
  | 'karierMinat'
  | 'kartu'
  | 'rakKosong'
  | 'adminMasuk'
  | 'adminSalah'
  | 'adminSimpan'
  | 'adminError'
  | 'adminHapus'
  | 'adminUpload'
  | 'adminImpor'
  | 'adminEkspor'
  | 'adminTema'
  | 'tokoMasuk'
  | 'tokoKeluar'
  | 'tokoBeli'
  | 'tokoGalat'
  | 'tokoKunci'
  | 'tokoAdmin'
  | 'sandiBaru'
  | 'sandiKirim'
  | 'cookieTerima'
  | 'cookieTolak'
  | 'persetujuanSimpan'
  | 'persetujuanTarik'
  | 'daftarSyarat'
  | 'dataUnduh'
  | 'akunHapus'

export interface Frasa {
  t: string
  mood: MoodNalar
}

const f = (t: string, mood: MoodNalar): Frasa => ({ t, mood })

export const FRASA: Record<Kejadian, Frasa[]> = {
  sapa: [
    f('Halo! Aku Nalar, penjaga rak buku ini.', 'senang'),
    f('Eh, ada tamu! Ayo pilih buku.', 'semangat'),
    f('Selamat datang di Ruang Nalar!', 'senang'),
    f('Mau baca apa hari ini?', 'mikir'),
    f('Ssst, bukunya seru-seru lho. Intip, yuk.', 'kedip-nakal'),
  ],
  idle: [
    f('Zzz... bangunin pas ada yang seru ya', 'ngantuk'),
    f('Hoaam... sepi banget di sini.', 'ngantuk'),
    f('Aku merem sebentar, jangan kabur ya.', 'ngantuk'),
    f('Zzz... lagi mimpi jadi sosiolog.', 'ngantuk'),
  ],
  bangun: [
    f('Hah? Aku nggak tidur kok!', 'kaget'),
    f('Eh, kamu balik! Ayo lanjut.', 'senang'),
    f('Oke, oke, aku bangun!', 'semangat'),
  ],
  kuisBenar: [
    f('Nah! Nalarmu jalan!', 'bangga'),
    f('Tepat sekali! Kamu jeli banget.', 'bangga'),
    f('Benar! Aku bangga sama kamu.', 'bangga'),
    f('Mantap! Satu poin buat nalarmu.', 'semangat'),
    f('Cakep! Lanjut, jangan kendor.', 'semangat'),
  ],
  kuisSalah: [
    f('Hmm, coba lihat dari sudut pandang lain.', 'sedih'),
    f('Eits, belum pas. Belajar itu proses, kok.', 'sedih'),
    f('Wah, hampir! Baca penjelasannya, yuk.', 'kaget'),
    f('Salah itu bagian dari bernalar, tenang.', 'sedih'),
  ],
  babBaru: [
    f('Bab baru! Siapkan rasa penasaranmu.', 'semangat'),
    f('Yuk, kita selami bab ini!', 'semangat'),
    f('Lembar baru, pikiran baru. Gas!', 'semangat'),
    f('Aku nggak sabar baca bagian ini!', 'semangat'),
  ],
  klikBeruntun: [
    f('Hihi, geli! Jangan digelitikin terus!', 'kedip-nakal'),
    f('Eh eh, stop! Aku bunglon, bukan bantal!', 'kaget'),
    f('Ampun! Lidahku jadi kusut nih.', 'kaget'),
    f('Lima kali?! Aku protes ya!', 'kaget'),
    f('Hahaha geli! Ampun, ampun, ampun!', 'kedip-nakal'),
  ],
  tangkap: [
    f('Hap! Kunang-kunang ketangkap!', 'senang'),
    f('Lidahku cepat, kan?', 'bangga'),
    f('Nyam! Camilan malam.', 'senang'),
    f('Hap! Dapat satu lagi.', 'semangat'),
  ],
  tangkapGagal: [f('Yah, kunang-kunangnya lagi sembunyi.', 'sedih')],
  bintang: [
    f('Wih, bintangnya meletup!', 'kaget'),
    f('Cantik ya, langitnya berputar.', 'senang'),
    f('Pusaran langit lagi baik hati.', 'senang'),
    f('Ada yang bersinar khusus buat kamu.', 'kedip-nakal'),
    f('Kamu nemu bintang! Aku juga mau.', 'semangat'),
  ],
  selesaiBab: [
    f('Bab selesai! Hujan bunga buat kamu.', 'bangga'),
    f('Satu bab tamat. Kamu keren!', 'bangga'),
    f('Selesai! Kelopak matahari buat pembaca rajin.', 'bangga'),
  ],
  selesaiBuku: [
    f('Buku tamat! Lencana buat kamu!', 'semangat'),
    f('Wah, kamu khatam! Bangga banget.', 'bangga'),
  ],
  sorot: [f('Disorot! Bagian penting nih.', 'senang'), f('Tinta kuning, ide jadi terang.', 'senang')],
  catatan: [f('Catatan tempel! Rapi banget kamu.', 'senang'), f('Ide dicatat, ide aman.', 'bangga')],
  penanda: [f('Ditandai! Nanti balik lagi, ya.', 'senang')],
  penandaLepas: [f('Penanda dilepas. Oke!', 'mikir')],
  temaMalam: [f('Malam berbintang, favoritku!', 'senang')],
  temaLadang: [f('Ladang matahari! Hangat banget.', 'semangat')],
  bunyiOn: [f('Musik langit dinyalakan. Syahdu ya.', 'senang')],
  bunyiOff: [f('Hening lagi. Tenang juga, kan.', 'ngantuk')],
  musikPilih: [f('Lagu baru! Cocok buat fokus.', 'senang'), f('Pilihan bagus. Telingaku ikut goyang.', 'kedip-nakal'), f('Nada baru, semangat baru!', 'semangat')],
  refleksi: [f('Renungan disimpan. Pikiranmu dalam juga.', 'mikir')],
  misiSelesai: [
    f('Misi tuntas! Poinmu bertambah.', 'bangga'),
    f('Satu misi lagi beres. Mantap!', 'senang'),
    f('Pelan-pelan, kamu naik level nih.', 'semangat'),
  ],
  karierMinat: [
    f('Jalur itu kucatat di petamu.', 'mikir'),
    f('Menarik! Jalan masa depanmu mulai kebuka.', 'semangat'),
  ],
  kartu: [f('Kartunya dibalik! Ingat-ingat ya.', 'mikir')],
  rakKosong: [f('Rak masih kosong. Tambah ebook lewat Ruang Redaksi.', 'sedih')],
  adminMasuk: [f('Selamat datang di Ruang Redaksi!', 'semangat')],
  adminSalah: [f('Kode sandinya belum pas. Coba lagi.', 'sedih')],
  adminSimpan: [f('Tersimpan! Ebook barumu mejeng di rak.', 'bangga')],
  adminError: [f('Ada yang janggal di format. Cek barisnya, ya.', 'kaget')],
  adminHapus: [f('Dihapus. Semoga memang sudah waktunya.', 'sedih')],
  adminUpload: [f('File masuk! Aku periksa isinya dulu.', 'mikir')],
  adminImpor: [f('Cadangan masuk! Rak jadi ramai lagi.', 'senang')],
  adminEkspor: [f('Cadangan diunduh. Simpan baik-baik, ya.', 'bangga')],
  adminTema: [f('Ganti warna! Kulitku ikut menyesuaikan.', 'kedip-nakal')],
  tokoMasuk: [f('Selamat datang! Aku ingat kamu, kok.', 'senang'), f('Berhasil masuk. Ayo lanjut baca!', 'semangat')],
  tokoKeluar: [f('Sampai jumpa! Jangan lupa balik lagi.', 'sedih')],
  tokoBeli: [f('Berhasil! Ebook barumu sudah terbuka.', 'bangga'), f('Lunas! Selamat membaca, ya.', 'semangat')],
  tokoGalat: [f('Hmm, ada yang belum pas. Cek lagi, ya.', 'kaget')],
  tokoKunci: [f('Ebook ini digembok. Kuncinya ada di tombol beli.', 'kedip-nakal')],
  tokoAdmin: [f('Rak toko diperbarui. Semoga laris, ya!', 'bangga')],
  sandiBaru: [f('Kata sandi baru tersimpan. Aman!', 'bangga')],
  sandiKirim: [f('Tautannya meluncur ke emailmu. Cek ya!', 'senang')],
  cookieTerima: [f('Pilihanmu kucatat. Selamat menjelajah!', 'senang')],
  cookieTolak: [f('Oke, hanya yang perlu saja. Aman!', 'bangga')],
  persetujuanSimpan: [f('Pilihan privasimu sudah tersimpan.', 'bangga')],
  persetujuanTarik: [f('Persetujuan ditarik. Kamu yang pegang kendali.', 'bangga')],
  daftarSyarat: [f('Baca dulu, lalu centang kotaknya. Aku sabar.', 'mikir')],
  dataUnduh: [f('Datamu sudah kuunduhkan. Simpan baik-baik.', 'senang')],
  akunHapus: [f('Akunmu sudah dihapus. Terima kasih sudah mampir.', 'sedih')],
}

export const SEMUA_FRASA: Frasa[] = Object.values(FRASA).flat()

const terakhir: Partial<Record<Kejadian, string>> = {}

/** Pilih satu kalimat acak untuk kejadian tertentu, hindari mengulang yang barusan. */
export function pilihFrasa(k: Kejadian, acak: () => number = Math.random): Frasa {
  const daftar = FRASA[k]
  if (daftar.length === 1) return daftar[0]
  let hasil = daftar[Math.floor(acak() * daftar.length)]
  if (hasil.t === terakhir[k]) hasil = daftar[(daftar.indexOf(hasil) + 1) % daftar.length]
  terakhir[k] = hasil.t
  return hasil
}

export const jumlahKata = (s: string) => s.trim().split(/\s+/).filter(Boolean).length
