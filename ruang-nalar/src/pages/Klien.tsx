import { Link } from 'react-router-dom'
import { Ikon } from '../components/art/Ikon'
import { NAMA_PENULIS_DEFAULT, NAMA_WEB, TAGLINE } from '../config'
import { CATATAN_TEKNIS, LABEL_STATUS, barisFitur, statistikKonten } from '../lib/klien'
import { EBOOK_PERCOBAAN, useEbookTerbit } from '../lib/library'
import { useProfil } from '../lib/profil'
import { useToko } from '../lib/toko/store'

/** Tampilan Klien: ringkasan formal untuk peninjau. Datar, tanpa dekorasi, mudah dicetak. */
export function Klien() {
  const tk = useToko()
  const ebooks = useEbookTerbit()
  const profil = useProfil()
  const s = statistikKonten(ebooks)
  const baris = barisFitur(tk.mode)
  const tanggal = new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })
  const adaKontak = !!profil.kontakEmail || profil.tautan.length > 0

  const angka: [number, string][] = [
    [s.ebook, 'Ebook dapat dibaca'],
    [s.bab, 'Bab'],
    [s.kuis, 'Soal kuis'],
    [s.kartu, 'Kartu balik'],
    [s.refleksi, 'Pertanyaan refleksi'],
    [s.topik, 'Topik'],
  ]

  return (
    <div className="klien">
      <article className="klien-isi" aria-labelledby="klien-judul">
        <nav aria-label="Navigasi tinjauan" className="klien-nav tanpa-cetak">
          <Link to="/">Beranda</Link>
          <Link to="/dasbor">Dasbor</Link>
          <button type="button" onClick={() => window.print()}>
            <Ikon n="cetak" ukuran={16} /> Cetak halaman ini
          </button>
        </nav>

        <header className="klien-kepala">
          <p className="klien-kecil">Tinjauan platform</p>
          <h1 id="klien-judul">{NAMA_WEB}</h1>
          <p className="klien-sub">{TAGLINE}</p>
          <p className="klien-kecil">
            Disusun oleh {NAMA_PENULIS_DEFAULT} · dilihat pada {tanggal}
          </p>
        </header>

        <section aria-labelledby="k-ringkas">
          <h2 id="k-ringkas">1. Ringkasan produk</h2>
          <p>
            {NAMA_WEB} adalah perpustakaan ebook interaktif untuk catatan kuliah Sosiologi. Pembaca tidak sekadar membaca: mereka menyorot, menempel catatan, membalik kartu istilah, menjawab kuis, dan menulis
            refleksi di setiap bab. Maskot bunglon bernama Nalar menemani dan memberi umpan balik singkat.
          </p>
          <p>
            Sasarannya mahasiswa dan pembelajar umum yang ingin materi sosiologi yang ringkas, enak dibaca di ponsel, dan bisa diuji sendiri. Ebook gratis dapat dibaca tanpa akun; ebook berbayar dijual lewat akun dan
            pembayaran Midtrans bila pemilik mengaktifkannya.
          </p>
        </section>

        <section aria-labelledby="k-angka">
          <h2 id="k-angka">2. Isi saat ini</h2>
          <p className="klien-catatan">Dihitung langsung dari ebook yang sedang tampil di web ini.</p>
          <dl className="klien-angka">
            {angka.map(([n, label]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{n}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="k-fitur">
          <h2 id="k-fitur">3. Status fitur</h2>
          <div className="klien-tabel-bungkus" tabIndex={0} role="region" aria-label="Tabel status fitur, dapat digulir">
            <table>
              <caption className="sr-only">Daftar fitur, statusnya, dan keterangan</caption>
              <thead>
                <tr>
                  <th scope="col">Fitur</th>
                  <th scope="col">Status</th>
                  <th scope="col">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {baris.map((b) => (
                  <tr key={b.nama}>
                    <th scope="row">{b.nama}</th>
                    <td>
                      <span className={`klien-status klien-status-${b.status}`}>{LABEL_STATUS[b.status]}</span>
                    </td>
                    <td>{b.ket}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="k-teknis">
          <h2 id="k-teknis">4. Teknologi dan keamanan</h2>
          <dl className="klien-daftar">
            {CATATAN_TEKNIS.map((c) => (
              <div key={c.judul}>
                <dt>{c.judul}</dt>
                <dd>{c.isi}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="k-coba" className="tanpa-cetak">
          <h2 id="k-coba">5. Cara mencoba</h2>
          <ol>
            {EBOOK_PERCOBAAN && (
              <li>
                Buka ebook percobaan: <Link to={`/baca/${EBOOK_PERCOBAAN.id}`}>{EBOOK_PERCOBAAN.parsed.meta.judul}</Link>. Sorot satu kalimat, jawab kuis di akhir bab.
              </li>
            )}
            <li>
              Buka <Link to="/dasbor">dasbor member</Link>, lalu simpan ebook ke rak dan coba pencarian.
            </li>
            <li>
              Di pojok kanan atas, nyalakan musik latar dan pilih suasana lewat ikon not musik.
            </li>
          </ol>
        </section>

        <section aria-labelledby="k-kontak">
          <h2 id="k-kontak">6. Kontak</h2>
          {adaKontak ? (
            <ul>
              {profil.kontakEmail && (
                <li>
                  Email: <a href={`mailto:${profil.kontakEmail}`}>{profil.kontakEmail}</a>
                </li>
              )}
              {profil.tautan.map((t) => (
                <li key={t.url}>
                  {t.label}:{' '}
                  <a href={t.url} target="_blank" rel="noopener noreferrer">
                    {t.url}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p>Kontak belum dicantumkan oleh pemilik web.</p>
          )}
        </section>
      </article>
    </div>
  )
}
