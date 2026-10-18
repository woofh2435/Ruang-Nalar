import { useMemo, useState } from 'react'
import { Ikon } from '../art/Ikon'
import { Panel } from '../art/Panel'
import { useToko } from '../../lib/toko/store'
import {
  KUNCI_PANDUAN,
  LABEL_MODE,
  PANDUAN_TOKO,
  alamatWeb,
  bacaCentang,
  hitungKemajuan,
  isiNilai,
  langkahOtomatis,
  type LangkahPanduan,
  type NilaiSalin,
  type TahapPanduan,
} from '../../lib/toko/panduan'

const redup = { color: 'var(--tinta-redup)' } as const

function bacaTersimpan(): string[] {
  try {
    return bacaCentang(localStorage.getItem(KUNCI_PANDUAN))
  } catch {
    return []
  }
}

function tulisTersimpan(x: string[]) {
  try {
    localStorage.setItem(KUNCI_PANDUAN, JSON.stringify(x))
  } catch {
    /* penyimpanan diblokir: centang tetap berjalan selama halaman terbuka */
  }
}

async function salinTeks(teks: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(teks)
      return true
    }
  } catch {
    /* lanjut ke cara cadangan */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = teks
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

function TombolSalin({ teks, label }: { teks: string; label: string }) {
  const [status, setStatus] = useState<'diam' | 'ok' | 'gagal'>('diam')
  return (
    <>
      <button
        type="button"
        className="tombol tombol-kecil"
        aria-label={`Salin ${label}`}
        onClick={async () => {
          const ok = await salinTeks(teks)
          setStatus(ok ? 'ok' : 'gagal')
          setTimeout(() => setStatus('diam'), 2500)
        }}
      >
        <Ikon n={status === 'ok' ? 'cek' : 'salin'} ukuran={16} /> {status === 'ok' ? 'Tersalin' : 'Salin'}
      </button>
      <span role="status" className="text-xs font-semibold" style={redup}>
        {status === 'gagal' ? 'Tidak bisa menyalin otomatis. Tekan lama teksnya, lalu salin.' : ''}
      </span>
    </>
  )
}

function BarisSalin({ item, alamat }: { item: NilaiSalin; alamat: string | null }) {
  const teks = isiNilai(item.nilai, alamat)
  const bisa = item.bisaSalin !== false
  return (
    <div className="grid gap-1">
      <span className="text-xs font-semibold" style={redup}>
        {item.label}
      </span>
      {item.blok ? (
        <>
          <pre className="m-0 select-all overflow-x-auto whitespace-pre-wrap break-words rounded-lg border-2 p-2 text-xs" style={{ background: '#fff3d6', borderColor: 'var(--tinta)', color: 'var(--tinta)' }}>
            {teks}
          </pre>
          {bisa && (
            <div className="flex flex-wrap items-center gap-2">
              <TombolSalin teks={teks} label={item.label} />
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <code className={`rounded border-2 px-2 py-1 text-sm ${bisa ? 'select-all break-all' : 'break-words'}`} style={{ background: '#fff3d6', borderColor: 'var(--tinta)', color: 'var(--tinta)' }}>
            {teks}
          </code>
          {bisa && <TombolSalin teks={teks} label={item.label} />}
        </div>
      )}
    </div>
  )
}

function ItemLangkah({ langkah, nomor, centang, otomatis, onUbah, alamat }: { langkah: LangkahPanduan; nomor: number; centang: boolean; otomatis: boolean; onUbah: () => void; alamat: string | null }) {
  return (
    <li className="m-0 border-t-2 border-dashed py-3 first:border-t-0" style={{ borderColor: 'rgba(8,12,40,0.25)' }}>
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" className="kotak-cek mt-0.5" checked={centang} disabled={otomatis} onChange={onUbah} />
        <span className="min-w-0">
          <strong className="block leading-snug">
            {nomor}. {langkah.judul}
          </strong>
          <span className="mt-1 block text-[0.95rem] leading-relaxed">{langkah.isi}</span>
          {otomatis && (
            <span className="mt-1 block text-xs font-semibold" style={{ color: '#1f4a12' }}>
              Terdeteksi otomatis: web ini sudah tersambung ke Supabase.
            </span>
          )}
        </span>
      </label>
      {(langkah.salin || langkah.tautan) && (
        <div className="ml-9 mt-2 grid gap-2">
          {langkah.salin?.map((s, i) => (
            <BarisSalin key={i} item={s} alamat={alamat} />
          ))}
          {langkah.tautan && (
            <div className="flex flex-wrap gap-2">
              {langkah.tautan.map((t) => (
                <a key={t.url} className="tombol tombol-kecil" href={t.url} target="_blank" rel="noopener noreferrer" aria-label={`${t.teks} (buka di tab baru)`}>
                  {t.teks} <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  )
}

function KartuTahap({
  tahap,
  awalTerbuka,
  nomorAwal,
  tanda,
  otomatis,
  onUbah,
  alamat,
}: {
  tahap: TahapPanduan
  awalTerbuka: boolean
  nomorAwal: number
  tanda: Set<string>
  otomatis: Set<string>
  onUbah: (id: string) => void
  alamat: string | null
}) {
  const { selesai, total } = hitungKemajuan([...tanda], [...otomatis], tahap.langkah)
  const lengkap = selesai === total
  return (
    <Panel warna="kertas" className="mt-4 px-4 py-4 sm:px-5">
      <details open={awalTerbuka}>
        <summary className="flex cursor-pointer flex-wrap items-center gap-2 font-display text-xl font-bold leading-tight">
          <span className="min-w-0">{tahap.judul}</span>
          <span className="chip" style={lengkap ? { background: '#dff0d2', color: '#1f4a12' } : undefined}>
            {selesai}/{total}
            {lengkap ? ' selesai' : ''}
          </span>
        </summary>
        <p className="m-0 mt-2 text-sm" style={redup}>
          {tahap.ringkas}
        </p>
        {tahap.awas && (
          <p className="m-0 mt-3 rounded-lg border-2 border-dashed p-3 text-sm" style={{ borderColor: 'var(--tinta)', background: '#fde7b0', color: '#3d2600' }} role="note">
            <strong>Perhatian:</strong> {tahap.awas}
          </p>
        )}
        <ol className="m-0 mt-2 list-none p-0">
          {tahap.langkah.map((l, i) => (
            <ItemLangkah key={l.id} langkah={l} nomor={nomorAwal + i} centang={tanda.has(l.id) || otomatis.has(l.id)} otomatis={otomatis.has(l.id)} onUbah={() => onUbah(l.id)} alamat={alamat} />
          ))}
        </ol>
      </details>
    </Panel>
  )
}

/** Panduan membuka toko: daftar centang di Ruang Redaksi. Tampil di semua mode (termasuk 'mati', saat panduan paling dibutuhkan). */
export function PanduanToko() {
  const tk = useToko()
  const [tanda, setTanda] = useState<Set<string>>(() => new Set(bacaTersimpan()))
  const alamat = useMemo(() => (typeof window === 'undefined' ? null : alamatWeb(window.location.href)), [])
  const otomatis = useMemo(() => new Set(tk.konfigSiap ? langkahOtomatis(tk.mode) : []), [tk.konfigSiap, tk.mode])
  const { selesai, total } = hitungKemajuan([...tanda], [...otomatis])
  const persen = Math.round((selesai / total) * 100)
  const label = tk.konfigSiap ? LABEL_MODE[tk.mode] : { judul: 'Memeriksa…', rinci: 'Membaca pengaturan toko.' }

  // tahap yang dibuka pertama kali: tahap pertama yang belum lengkap (ditentukan sekali saat halaman dibuka)
  const [tahapAwal] = useState(() => {
    const t = new Set([...bacaTersimpan(), ...langkahOtomatis(tk.mode)])
    return PANDUAN_TOKO.find((th) => th.langkah.some((l) => !t.has(l.id)))?.id ?? PANDUAN_TOKO[0].id
  })

  const ubah = (id: string) =>
    setTanda((lama) => {
      const baru = new Set(lama)
      if (baru.has(id)) baru.delete(id)
      else baru.add(id)
      tulisTersimpan([...baru])
      return baru
    })

  let nomor = 1
  return (
    <section aria-labelledby="judul-panduan" className="mt-12">
      <h2 id="judul-panduan" className="m-0 font-display text-3xl font-black" style={{ color: 'var(--teks)' }}>
        Panduan membuka toko
      </h2>
      <Panel warna="kertas" className="mt-4 px-4 py-4 sm:px-5">
        <p className="m-0">
          <span className="chip">{label.judul}</span> <span className="text-sm">{label.rinci}</span>
        </p>
        <p role="status" className="m-0 mt-3 font-semibold">
          {selesai} dari {total} langkah selesai
        </p>
        <div aria-hidden="true" className="mt-2 h-3 w-full overflow-hidden rounded-full border-2" style={{ borderColor: 'var(--tinta)', background: '#fffaf0' }}>
          <div className="h-full" style={{ width: `${persen}%`, background: 'var(--kuning-pusaran)', transition: 'width 0.25s ease' }} />
        </div>
        <p className="m-0 mt-2 text-xs" style={redup}>
          Centang hanya tersimpan di browser ini sebagai pengingat, dan tidak mengubah apa pun di toko. Urutan lengkap dan catatan tambahan ada di README bagian 9.
        </p>
      </Panel>

      {PANDUAN_TOKO.map((tahap) => {
        const awal = nomor
        nomor += tahap.langkah.length
        return <KartuTahap key={tahap.id} tahap={tahap} awalTerbuka={tahap.id === tahapAwal} nomorAwal={awal} tanda={tanda} otomatis={otomatis} onUbah={ubah} alamat={alamat} />
      })}
    </section>
  )
}
