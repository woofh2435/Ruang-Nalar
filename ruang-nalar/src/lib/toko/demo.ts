// Backend DEMO: seluruh alur akun & pembayaran berjalan di browser dengan data palsu.
// TIDAK ada uang sungguhan, TIDAK aman (sandi disimpan apa adanya di browser ini). Hanya untuk mencoba tampilan.

import { GalatToko, SANDI_MIN, emailValid, idEbookValid, type Backend, type CatatanPersetujuan, type ItemKatalog, type JenisPersetujuan, type Pembelian, type PersetujuanDaftar, type Sesi } from './tipe'

export const EMAIL_ADMIN_DEMO = 'admin@demo.test'

interface PenggunaDemo {
  id: string
  email: string
  sandi: string
}
/** Pembelian demo menyimpan pemilik di properti tambahan (tidak pernah dikirim ke UI). */
type PembelianDemo = Pembelian & { dibuatOleh: string }
interface DataDemo {
  pengguna: PenggunaDemo[]
  katalog: ItemKatalog[]
  isi: Record<string, string>
  pembelian: PembelianDemo[]
  /** log persetujuan; opsional supaya data demo lama (tanpa kolom ini) tetap terbaca */
  persetujuan?: (CatatanPersetujuan & { dibuatOleh: string })[]
}

const ISI_CONTOH = `---
judul: Contoh Ebook Berbayar
subjudul: Versi DEMO
penulis: [NAMA PENULIS]
tema: api
ikon: 🔥
tag: [demo, berbayar]
status: terbit
deskripsi: CONTOH DEMO. Ebook berbayar palsu untuk mencoba alur beli. Tidak ada uang sungguhan.
---

# Bab 1: Selamat, kamu sudah "membeli"

Ini adalah isi ebook **berbayar** versi demo. Isi ini hanya bisa dibuka setelah kamu masuk dan membayar (di demo: pura-pura membayar).

:::catatan tipe=penting
CONTOH DEMO. Di mode nyata, isi ebook disimpan di server (Supabase) dan hanya dikirim kepada pembeli yang pembayarannya sudah lunas.
:::

:::kuis
Q: Di mana isi ebook berbayar disimpan pada mode nyata?
- Di dalam kode web yang diunduh semua orang
- [x] Di server, dan hanya dikirim ke pembeli yang sudah lunas
- Di file .md pada folder src/content/
Penjelasan: Isi di dalam kode web bisa dibaca siapa saja lewat DevTools, jadi ebook berbayar harus disimpan di server.
:::

# Bab 2: Langkah berikutnya

Setelah mencoba demo ini, isi kunci Supabase dan Midtrans di panduan README untuk mengaktifkan toko sungguhan.

:::refleksi
Menurutmu, berapa harga yang pantas untuk ebook catatan kuliah? Apa yang membuat pembaca mau membayar?
:::
`

function datAwal(): DataDemo {
  return {
    pengguna: [{ id: 'demo-admin', email: EMAIL_ADMIN_DEMO, sandi: 'admin-demo-123' }],
    katalog: [
      {
        id: 'contoh-berbayar-demo',
        judul: 'Contoh Ebook Berbayar',
        subjudul: 'Versi DEMO',
        penulis: '[NAMA PENULIS]',
        tema: 'api',
        ikon: '🔥',
        tag: ['demo', 'berbayar'],
        deskripsi: 'CONTOH DEMO. Ebook berbayar palsu untuk mencoba alur beli. Tidak ada uang sungguhan.',
        harga: 25000,
        terbit: true,
        urutan: 0,
      },
    ],
    isi: { 'contoh-berbayar-demo': ISI_CONTOH },
    pembelian: [],
  }
}

const KUNCI_DATA = 'rn-demo:data'
const KUNCI_SESI = 'rn-demo:sesi'

function penyimpan() {
  const memori = new Map<string, string>()
  return {
    ambil(k: string): string | null {
      try {
        const v = globalThis.localStorage?.getItem(k)
        if (v !== undefined && v !== null) return v
      } catch {
        /* abaikan */
      }
      return memori.get(k) ?? null
    },
    simpan(k: string, v: string) {
      try {
        globalThis.localStorage?.setItem(k, v)
        return
      } catch {
        /* jatuh ke memori */
      }
      memori.set(k, v)
    },
    hapus(k: string) {
      try {
        globalThis.localStorage?.removeItem(k)
      } catch {
        /* abaikan */
      }
      memori.delete(k)
    },
  }
}

const jeda = () => new Promise<void>((r) => setTimeout(r, 40))
const salin = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T

export function buatBackendDemo(): Backend {
  const disk = penyimpan()
  const pendengar = new Set<(s: Sesi | null) => void>()

  const muat = (): DataDemo => {
    const mentah = disk.ambil(KUNCI_DATA)
    if (mentah) {
      try {
        const d = JSON.parse(mentah) as DataDemo
        if (Array.isArray(d.pengguna) && Array.isArray(d.katalog) && Array.isArray(d.pembelian) && d.isi) return d
      } catch {
        /* data rusak → mulai ulang */
      }
    }
    const baru = datAwal()
    disk.simpan(KUNCI_DATA, JSON.stringify(baru))
    return baru
  }
  const tulis = (d: DataDemo) => disk.simpan(KUNCI_DATA, JSON.stringify(d))

  const sesiDari = (id: string | null): Sesi | null => {
    if (!id) return null
    const u = muat().pengguna.find((p) => p.id === id)
    return u ? { id: u.id, email: u.email, admin: u.email === EMAIL_ADMIN_DEMO } : null
  }
  const sesiKini = () => sesiDari(disk.ambil(KUNCI_SESI))
  const kabar = () => {
    const s = sesiKini()
    pendengar.forEach((f) => f(s))
  }
  const wajibLogin = (): Sesi => {
    const s = sesiKini()
    if (!s) throw new GalatToko('belum_login', 'Kamu belum masuk.')
    return s
  }
  const wajibAdmin = (): Sesi => {
    const s = wajibLogin()
    if (!s.admin) throw new GalatToko('bukan_admin', 'Hanya admin yang boleh melakukan ini.')
    return s
  }
  const berhak = (d: DataDemo, s: Sesi, ebookId: string) => s.admin || d.pembelian.some((p) => p.ebookId === ebookId && p.status === 'lunas' && p.dibuatOleh === s.id)

  return {
    mode: 'demo',
    async sesiSaatIni() {
      await jeda()
      return sesiKini()
    },
    onSesi(cb) {
      pendengar.add(cb)
      return () => pendengar.delete(cb)
    },
    async daftar(email, sandi, persetujuan?: PersetujuanDaftar) {
      await jeda()
      const e = email.trim().toLowerCase()
      if (!emailValid(e)) throw new GalatToko('email_tidak_valid', 'Alamat email belum benar.')
      if (sandi.length < SANDI_MIN) throw new GalatToko('sandi_lemah', `Kata sandi minimal ${SANDI_MIN} karakter.`)
      const d = muat()
      if (d.pengguna.some((p) => p.email === e)) throw new GalatToko('email_terdaftar', 'Email ini sudah terdaftar. Coba masuk.')
      const id = 'demo-' + Math.random().toString(36).slice(2, 10)
      d.pengguna.push({ id, email: e, sandi })
      if (persetujuan) {
        const waktu = new Date().toISOString()
        const baris = (jenis: JenisPersetujuan, status: boolean) => ({ id: 'c-' + Math.random().toString(36).slice(2, 10), jenis, status, versi: persetujuan.versi, dibuat: waktu, dibuatOleh: id })
        d.persetujuan = [...(d.persetujuan ?? []), baris('syarat_privasi', true), baris('promo', persetujuan.promo), baris('analitik', persetujuan.analitik)]
      }
      tulis(d)
      disk.simpan(KUNCI_SESI, id)
      kabar()
      return { perluKonfirmasi: false }
    },
    async masuk(email, sandi) {
      await jeda()
      const e = email.trim().toLowerCase()
      const u = muat().pengguna.find((p) => p.email === e && p.sandi === sandi)
      if (!u) throw new GalatToko('kredensial_salah', 'Email atau kata sandi salah.')
      disk.simpan(KUNCI_SESI, u.id)
      kabar()
    },
    async keluar() {
      await jeda()
      disk.hapus(KUNCI_SESI)
      kabar()
    },
    async kirimResetSandi(email) {
      await jeda()
      const e = email.trim().toLowerCase()
      if (!emailValid(e)) throw new GalatToko('email_tidak_valid', 'Alamat email belum benar.')
      const u = muat().pengguna.find((p) => p.email === e)
      // di demo tidak ada email sungguhan: berikan "tautan" palsu hanya bila akunnya ada
      return u ? { tautanDemo: { jenis: 'pemulihan', accessToken: 'demo:' + u.id, refreshToken: 'demo' } } : {}
    },
    async pulihkanDariTautan(t) {
      await jeda()
      const id = t.accessToken.startsWith('demo:') ? t.accessToken.slice(5) : ''
      const u = muat().pengguna.find((p) => p.id === id)
      if (!u) throw new GalatToko('tautan_kedaluwarsa', 'Tautan sudah kedaluwarsa atau sudah pernah dipakai. Minta tautan baru, ya.')
      disk.simpan(KUNCI_SESI, u.id)
      kabar()
    },
    async ubahSandi(sandiBaru) {
      await jeda()
      const s = wajibLogin()
      if (sandiBaru.length < SANDI_MIN) throw new GalatToko('sandi_lemah', `Kata sandi minimal ${SANDI_MIN} karakter.`)
      const d = muat()
      const u = d.pengguna.find((p) => p.id === s.id)
      if (!u) throw new GalatToko('belum_login', 'Kamu belum masuk.')
      if (u.sandi === sandiBaru) throw new GalatToko('sandi_sama', 'Kata sandi baru harus berbeda dari yang lama.')
      u.sandi = sandiBaru
      tulis(d)
    },
    async riwayatPersetujuan() {
      await jeda()
      const s = wajibLogin()
      return (muat().persetujuan ?? [])
        .filter((c) => c.dibuatOleh === s.id)
        .map(({ dibuatOleh: _x, ...c }) => salin(c))
        .reverse()
    },
    async catatPersetujuan(jenis, status, versi) {
      await jeda()
      const s = wajibLogin()
      const d = muat()
      d.persetujuan = [...(d.persetujuan ?? []), { id: 'c-' + Math.random().toString(36).slice(2, 10), jenis, status, versi: versi.slice(0, 20), dibuat: new Date().toISOString(), dibuatOleh: s.id }]
      tulis(d)
    },
    async hapusAkun() {
      await jeda()
      const s = wajibLogin()
      if (s.admin) throw new GalatToko('admin_tidak_bisa', 'Akun admin tidak bisa dihapus dari sini demi keamanan.')
      const d = muat()
      d.pengguna = d.pengguna.filter((p) => p.id !== s.id)
      d.pembelian = d.pembelian.filter((p) => p.dibuatOleh !== s.id)
      d.persetujuan = (d.persetujuan ?? []).filter((c) => c.dibuatOleh !== s.id)
      tulis(d)
      disk.hapus(KUNCI_SESI)
      kabar()
    },
    async katalog() {
      await jeda()
      return salin(muat().katalog.filter((k) => k.terbit)).sort((a, b) => a.urutan - b.urutan)
    },
    async pembelianSaya() {
      await jeda()
      const s = wajibLogin()
      return muat().pembelian.filter((p) => p.dibuatOleh === s.id).map(({ dibuatOleh: _x, ...p }) => salin(p))
    },
    async bacaIsi(ebookId) {
      await jeda()
      const s = wajibLogin()
      const d = muat()
      if (!berhak(d, s, ebookId)) return null
      return d.isi[ebookId] ?? null
    },
    async mulaiBayar(ebookId) {
      await jeda()
      const s = wajibLogin()
      const d = muat()
      const item = d.katalog.find((k) => k.id === ebookId && k.terbit)
      if (!item) throw new GalatToko('tidak_ditemukan', 'Ebook ini tidak ditemukan.')
      if (d.pembelian.some((p) => p.ebookId === ebookId && p.status === 'lunas' && p.dibuatOleh === s.id)) {
        throw new GalatToko('sudah_dibeli', 'Kamu sudah memiliki ebook ini.')
      }
      const sekarang = new Date().toISOString()
      const baru: PembelianDemo = { id: 'p-' + Math.random().toString(36).slice(2, 10), ebookId, orderId: 'DEMO-' + Date.now().toString(36), status: 'lunas', jumlah: item.harga, dibuat: sekarang, dibayar: sekarang, dibuatOleh: s.id }
      d.pembelian.push(baru)
      tulis(d)
      return { jenis: 'selesai' }
    },
    async adminDaftar() {
      await jeda()
      wajibAdmin()
      return salin(muat().katalog).sort((a, b) => a.urutan - b.urutan)
    },
    async adminBacaIsi(ebookId) {
      await jeda()
      wajibAdmin()
      return muat().isi[ebookId] ?? null
    },
    async adminSimpan(m) {
      await jeda()
      wajibAdmin()
      if (!idEbookValid(m.item.id)) throw new GalatToko('ditolak', 'ID ebook hanya boleh huruf kecil, angka, dan tanda hubung.')
      if (!Number.isInteger(m.item.harga) || m.item.harga < 1000) throw new GalatToko('ditolak', 'Harga minimal Rp 1.000.')
      const d = muat()
      const ada = d.katalog.findIndex((k) => k.id === m.item.id)
      const urutan = m.item.urutan ?? (ada >= 0 ? d.katalog[ada].urutan : d.katalog.length)
      const item: ItemKatalog = { ...m.item, urutan }
      if (ada >= 0) d.katalog[ada] = item
      else d.katalog.push(item)
      d.isi[item.id] = m.raw
      tulis(d)
    },
    async adminAtur(id, p) {
      await jeda()
      wajibAdmin()
      const d = muat()
      const k = d.katalog.find((x) => x.id === id)
      if (!k) throw new GalatToko('tidak_ditemukan', 'Ebook tidak ditemukan.')
      if (p.harga !== undefined) {
        if (!Number.isInteger(p.harga) || p.harga < 1000) throw new GalatToko('ditolak', 'Harga minimal Rp 1.000.')
        k.harga = p.harga
      }
      if (p.terbit !== undefined) k.terbit = p.terbit
      tulis(d)
    },
    async adminHapus(id) {
      await jeda()
      wajibAdmin()
      const d = muat()
      if (d.pembelian.some((p) => p.ebookId === id)) throw new GalatToko('ditolak', 'Ebook ini sudah pernah dibeli, jadi tidak bisa dihapus (pembeli akan kehilangan akses). Sembunyikan saja (jadikan Draf).')
      d.katalog = d.katalog.filter((k) => k.id !== id)
      delete d.isi[id]
      tulis(d)
    },
  }
}
