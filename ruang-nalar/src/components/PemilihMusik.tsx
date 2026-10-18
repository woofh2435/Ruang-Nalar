import { useId } from 'react'
import { bunyiDidukung } from '../lib/audio'
import { DAFTAR_MUSIK, JENIS_MUSIK } from '../lib/musik'
import { aturVolume, pilihLagu, setBunyi, useBunyiNyala, useLaguAktif, useVolumeAktif } from '../lib/pilihanMusik'
import { Ikon } from './art/Ikon'
import { useNalar } from './nalar/NalarContext'

/** Pemilih musik latar: nyala/mati, pilihan lagu (radio), dan volume. Dipakai di pojok layar dan di dasbor. */
export function PemilihMusik({ judulTingkat = 2 }: { judulTingkat?: 2 | 3 }) {
  const nyala = useBunyiNyala()
  const aktif = useLaguAktif()
  const volume = useVolumeAktif()
  const { katakan } = useNalar()
  const mendukung = bunyiDidukung()
  const idVol = useId()
  const Judul = (judulTingkat === 2 ? 'h2' : 'h3') as 'h2'

  if (!mendukung) {
    return <p className="m-0">Browser ini tidak mendukung suara.</p>
  }

  return (
    <div>
      <Judul className="m-0 font-display text-xl font-bold">Musik latar</Judul>
      <p className="m-0 mt-1 text-sm" style={{ color: 'var(--tinta-redup)' }}>
        Suara dibuat langsung di browsermu. Awalnya mati; kamu yang menyalakan.
      </p>

      <button
        type="button"
        className="tombol mt-3 w-full justify-center"
        aria-pressed={nyala}
        style={nyala ? { background: 'var(--kuning-pusaran)' } : undefined}
        onClick={() => {
          const on = setBunyi(!nyala)
          katakan(on ? 'bunyiOn' : 'bunyiOff')
        }}
      >
        <Ikon n={nyala ? 'suara' : 'senyap'} ukuran={18} /> {nyala ? 'Musik menyala. Matikan' : 'Putar musik'}
      </button>

      <fieldset className="m-0 mt-4 border-0 p-0">
        <legend className="mb-2 p-0 font-semibold">Pilih suasana</legend>
        <div className="flex flex-col gap-2">
          {DAFTAR_MUSIK.map((l) => {
            const pilih = aktif === l.id
            return (
              <label
                key={l.id}
                className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg border-2 px-3 py-2"
                style={{ borderColor: pilih ? 'var(--tinta)' : 'transparent', background: pilih ? 'var(--kuning-pusaran)' : 'rgba(255,255,255,0.35)', color: 'var(--tinta)' }}
              >
                <input
                  type="radio"
                  name="lagu-latar"
                  value={l.id}
                  checked={pilih}
                  className="mt-1.5 h-4 w-4 shrink-0"
                  onChange={() => {
                    pilihLagu(l.id)
                    // memilih lagu = ingin mendengarnya; ketukan ini juga memenuhi aturan autoplay browser
                    if (!nyala) setBunyi(true)
                    katakan('musikPilih')
                  }}
                />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{l.nama}</span>
                    <span className="chip" style={{ minHeight: 0, padding: '0 0.45rem', fontSize: '0.72rem', background: '#f4e9cf', borderColor: 'var(--tinta)', color: 'var(--tinta)' }}>
                      {JENIS_MUSIK[l.jenis]}
                    </span>
                  </span>
                  <span className="block text-sm" style={{ color: 'var(--tinta-redup)' }}>
                    {l.ket}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="mt-4">
        <label htmlFor={idVol} className="mb-1 block font-semibold">
          Volume: {Math.round(volume * 100)}%
        </label>
        <input
          id={idVol}
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(volume * 100)}
          aria-valuetext={`${Math.round(volume * 100)} persen`}
          className="h-8 w-full cursor-pointer"
          onChange={(e) => aturVolume(Number(e.target.value) / 100)}
        />
      </div>
    </div>
  )
}
