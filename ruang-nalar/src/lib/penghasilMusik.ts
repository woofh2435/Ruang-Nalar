// Penyintesis musik latar dengan WebAudio. Setiap lagu = "penghasil" yang membuat sebuah sesi.
// Sesi menjadwalkan bunyi sedikit ke depan (`jadwal(sampaiT)`) supaya tidak putus saat tab di latar belakang
// dan supaya bisa dirender offline untuk uji (OfflineAudioContext).

import { PENYETARA, POLA_DRUM, SKALA_AMBIEN, detikPerLangkah, frekMidi, geserAyun, type Akor, type Lagu } from './musik'
import { acak } from './rng'

export interface Sesi {
  /** Jadwalkan semua bunyi yang jatuh sebelum waktu konteks `sampaiT` (detik). Aman dipanggil berulang. */
  jadwal(sampaiT: number): void
  /** Hentikan semua sumber suara dan lepas semua simpul. */
  henti(): void
}

export type Penghasil = (c: BaseAudioContext, keluar: AudioNode, rng?: () => number) => Sesi

// ---------- alat bantu ----------

/** Wadah untuk melacak simpul dan sumber supaya bisa dibersihkan rapi. */
function buatPelacak() {
  const simpul: AudioNode[] = []
  const sumber: AudioScheduledSourceNode[] = []
  return {
    n<T extends AudioNode>(x: T): T {
      simpul.push(x)
      return x
    },
    s<T extends AudioScheduledSourceNode>(x: T): T {
      sumber.push(x)
      simpul.push(x)
      return x
    },
    bersihkan() {
      for (const s of sumber) {
        try {
          s.stop()
        } catch {
          /* belum mulai atau sudah berhenti */
        }
      }
      for (const n of simpul) {
        try {
          n.disconnect()
        } catch {
          /* sudah lepas */
        }
      }
      simpul.length = 0
      sumber.length = 0
    },
  }
}

type JenisNoise = 'putih' | 'pink' | 'cokelat' | 'kerisik'

/** Buffer derau. `kerisik` = desis tipis dengan letupan jarang seperti piringan hitam. Deterministik per biji. */
export function buatNoise(c: BaseAudioContext, detik: number, jenis: JenisNoise, biji: string): AudioBuffer {
  const r = acak(biji)
  const n = Math.max(8, Math.floor(c.sampleRate * detik))
  // sambungan putaran: hasil dibuat sepanjang n + tepi lalu ujungnya dilebur ke pangkal (equal-power),
  // sehingga tidak ada lubang atau detak setiap kali buffer berulang
  const tepi = Math.min(Math.floor(c.sampleRate * 0.05), Math.floor(n / 4))
  const m = n + tepi
  const a = new Float32Array(m)
  if (jenis === 'putih') {
    for (let i = 0; i < m; i++) a[i] = r() * 2 - 1
  } else if (jenis === 'pink') {
    // pendekatan Paul Kellet
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < m; i++) {
      const w = r() * 2 - 1
      b0 = 0.99886 * b0 + w * 0.0555179
      b1 = 0.99332 * b1 + w * 0.0750759
      b2 = 0.969 * b2 + w * 0.153852
      b3 = 0.8665 * b3 + w * 0.3104856
      b4 = 0.55 * b4 + w * 0.5329522
      b5 = -0.7616 * b5 - w * 0.016898
      a[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
      b6 = w * 0.115926
    }
  } else if (jenis === 'cokelat') {
    let x = 0
    for (let i = 0; i < m; i++) {
      x = (x + 0.02 * (r() * 2 - 1)) / 1.02
      a[i] = x * 3.5
    }
  } else {
    let letup = 0
    for (let i = 0; i < m; i++) {
      let v = (r() * 2 - 1) * 0.02
      if (r() < 0.00035) letup = (r() < 0.5 ? -1 : 1) * (0.25 + r() * 0.75)
      v += letup
      letup *= 0.55
      a[i] = v
    }
  }
  const buf = c.createBuffer(1, n, c.sampleRate)
  const d = buf.getChannelData(0)
  d.set(a.subarray(0, n))
  for (let i = 0; i < tepi; i++) {
    const k = (i / tepi) * (Math.PI / 2)
    d[i] = a[i] * Math.sin(k) + a[n + i] * Math.cos(k)
  }
  return buf
}

function panner(c: BaseAudioContext, nilai: number): StereoPannerNode | null {
  if (typeof c.createStereoPanner !== 'function') return null
  const p = c.createStereoPanner()
  p.pan.value = nilai
  return p
}

function ampul(g: GainNode, t: number, puncak: number, naik: number, turun: number) {
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, puncak), t + naik)
  g.gain.exponentialRampToValueAtTime(0.0001, t + naik + turun)
}

// ---------- ambien (pad + denting) ----------

/** Denting lonceng lembut. Dipakai juga oleh umpan balik kecil (kuis benar, bintang). */
export function denting(c: BaseAudioContext, tujuan: AudioNode, frek: number, kuat = 0.08, t = c.currentTime, rng: () => number = Math.random) {
  const o = c.createOscillator()
  const o2 = c.createOscillator()
  const g = c.createGain()
  const p = panner(c, rng() * 1.6 - 0.8)
  o.type = 'sine'
  o2.type = 'triangle'
  o.frequency.value = frek
  o2.frequency.value = frek * 2.005
  ampul(g, t, kuat, 0.03, 3.17)
  o.connect(g)
  const g2 = c.createGain()
  g2.gain.value = 0.25
  o2.connect(g2).connect(g)
  if (p) g.connect(p).connect(tujuan)
  else g.connect(tujuan)
  o.start(t)
  o2.start(t)
  o.stop(t + 3.4)
  o2.stop(t + 3.4)
}

const AKOR_AMBIEN = [146.83, 220, 261.63, 329.63]

export const ambien: Penghasil = (c, keluar, rng = Math.random) => {
  const L = buatPelacak()
  const filter = L.n(c.createBiquadFilter())
  filter.type = 'lowpass'
  filter.frequency.value = 900
  filter.Q.value = 0.6
  const lfo = L.s(c.createOscillator())
  const lfoGain = L.n(c.createGain())
  lfo.frequency.value = 0.07
  lfoGain.gain.value = 350
  lfo.connect(lfoGain).connect(filter.frequency)
  filter.connect(keluar)
  AKOR_AMBIEN.forEach((f, i) => {
    for (const d of [-7, 6]) {
      const o = L.s(c.createOscillator())
      const g = L.n(c.createGain())
      o.type = i % 2 ? 'sine' : 'triangle'
      o.frequency.value = f
      o.detune.value = d
      g.gain.value = 0.07
      o.connect(g).connect(filter)
      o.start()
    }
  })
  lfo.start()

  const bel = L.n(c.createGain())
  const tunda = L.n(c.createDelay(1))
  const umpan = L.n(c.createGain())
  tunda.delayTime.value = 0.42
  umpan.gain.value = 0.38
  bel.connect(keluar)
  bel.connect(tunda)
  tunda.connect(umpan).connect(tunda)
  tunda.connect(keluar)

  let berikut = c.currentTime + 1.2
  return {
    jadwal(sampai) {
      while (berikut < sampai) {
        denting(c, bel, SKALA_AMBIEN[Math.floor(rng() * SKALA_AMBIEN.length)], 0.05, berikut, rng)
        berikut += 2.6 + rng() * 3.8
      }
    },
    henti: () => L.bersihkan(),
  }
}

// ---------- lo-fi ----------

/** Satu nada piano listrik: sinus + harmonik kedua yang cepat padam + sedikit segitiga. */
function pianoListrik(c: BaseAudioContext, tujuan: AudioNode, frek: number, t: number, dur: number, vel: number) {
  const g = c.createGain()
  ampul(g, t, vel * 0.07, 0.012, dur)
  g.connect(tujuan)
  const g2 = c.createGain()
  ampul(g2, t, vel * 0.07 * 0.22, 0.008, Math.min(dur, 0.9))
  g2.connect(tujuan)
  const g3 = c.createGain()
  g3.gain.value = 0.12
  g3.connect(g)
  const a = c.createOscillator()
  const b = c.createOscillator()
  const d = c.createOscillator()
  a.type = 'sine'
  b.type = 'sine'
  d.type = 'triangle'
  a.frequency.value = frek
  b.frequency.value = frek * 2
  d.frequency.value = frek
  a.connect(g)
  b.connect(g2)
  d.connect(g3)
  const akhir = t + dur + 0.08
  for (const o of [a, b, d]) {
    o.start(t)
    o.stop(akhir)
  }
}

function bas(c: BaseAudioContext, tujuan: AudioNode, nomor: number, t: number, dur: number) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'sine'
  o.frequency.value = frekMidi(nomor)
  ampul(g, t, 0.17, 0.02, dur)
  o.connect(g).connect(tujuan)
  o.start(t)
  o.stop(t + dur + 0.1)
}

function kick(c: BaseAudioContext, tujuan: AudioNode, t: number, v: number) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.frequency.setValueAtTime(130, t)
  o.frequency.exponentialRampToValueAtTime(42, t + 0.13)
  ampul(g, t, 0.42 * v, 0.006, 0.3)
  o.connect(g).connect(tujuan)
  o.start(t)
  o.stop(t + 0.4)
}

function derauSekali(c: BaseAudioContext, buf: AudioBuffer, tujuan: AudioNode, t: number, dur: number, rng: () => number, tipe: BiquadFilterType, frek: number, q: number, puncak: number, turun: number) {
  const s = c.createBufferSource()
  const f = c.createBiquadFilter()
  const g = c.createGain()
  s.buffer = buf
  f.type = tipe
  f.frequency.value = frek
  f.Q.value = q
  ampul(g, t, puncak, 0.002, turun)
  s.connect(f).connect(g).connect(tujuan)
  s.start(t, rng() * Math.max(0, buf.duration - dur - 0.01), dur)
}

function snare(c: BaseAudioContext, noise: AudioBuffer, tujuan: AudioNode, t: number, v: number, rng: () => number) {
  derauSekali(c, noise, tujuan, t, 0.2, rng, 'bandpass', 1900, 0.9, 0.2 * v, 0.17)
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'triangle'
  o.frequency.setValueAtTime(190, t)
  o.frequency.exponentialRampToValueAtTime(150, t + 0.08)
  ampul(g, t, 0.12 * v, 0.003, 0.09)
  o.connect(g).connect(tujuan)
  o.start(t)
  o.stop(t + 0.15)
}

export function lofi(lagu: Lagu): Penghasil {
  const p = lagu.lofi
  if (!p) throw new Error(`Lagu ${lagu.id} bukan lo-fi`)
  return (c, keluar, rng = Math.random) => {
    const L = buatPelacak()
    const dt = detikPerLangkah(p.bpm)

    // jalur instrumen: lowpass hangat + goyangan pita (tape wow) lewat tundaan yang bergetar pelan
    const instrumen = L.n(c.createGain())
    const lp = L.n(c.createBiquadFilter())
    lp.type = 'lowpass'
    lp.frequency.value = 2400
    lp.Q.value = 0.5
    const wow = L.n(c.createDelay(0.1))
    wow.delayTime.value = 0.015
    const lfo = L.s(c.createOscillator())
    const lfoG = L.n(c.createGain())
    lfo.frequency.value = 0.45
    lfoG.gain.value = 0.0007
    lfo.connect(lfoG).connect(wow.delayTime)
    lfo.start()
    instrumen.connect(lp).connect(wow).connect(keluar)

    // jalur drum
    const drum = L.n(c.createGain())
    const dlp = L.n(c.createBiquadFilter())
    dlp.type = 'lowpass'
    dlp.frequency.value = 6500
    drum.connect(dlp).connect(keluar)

    // desis piringan hitam
    const kerisik = L.s(c.createBufferSource())
    kerisik.buffer = buatNoise(c, 5, 'kerisik', 'kerisik-' + lagu.id)
    kerisik.loop = true
    const khp = L.n(c.createBiquadFilter())
    khp.type = 'highpass'
    khp.frequency.value = 1200
    const kg = L.n(c.createGain())
    kg.gain.value = 0.032
    kerisik.connect(khp).connect(kg).connect(keluar)
    kerisik.start()

    const noise = buatNoise(c, 1.5, 'putih', 'drum-' + lagu.id)
    let langkah = 0
    let tLangkah = c.currentTime + 0.4

    const mainkanAkor = (a: Akor, t: number, dur: number, vel: number, semua: boolean) => {
      const nada = semua ? a.nada : a.nada.slice(1, 3)
      nada.forEach((n, i) => pianoListrik(c, instrumen, frekMidi(n), t + i * 0.011 + rng() * 0.006, dur, vel))
    }

    return {
      jadwal(sampai) {
        while (tLangkah < sampai) {
          const s = langkah % 16
          const bar = Math.floor(langkah / 16)
          const akor = p.progresi[bar % p.progresi.length]
          const t = tLangkah + geserAyun(s, p.bpm, p.ayun) + (s === 0 ? 0 : rng() * 0.008)

          if (s === 0) {
            mainkanAkor(akor, t, dt * 15, 0.95, true)
            bas(c, instrumen, akor.bas, t, dt * 14)
          }
          if (s === 10) mainkanAkor(akor, t, dt * 5, 0.5, false)

          if (POLA_DRUM.kick.includes(s)) kick(c, drum, t, s === 0 ? 1 : 0.7)
          if (POLA_DRUM.snare.includes(s)) snare(c, noise, drum, t, 0.9 + rng() * 0.2, rng)
          const kuatHat = POLA_DRUM.hat[s]
          if (kuatHat) derauSekali(c, noise, drum, t, 0.06, rng, 'highpass', 7500, 0.7, 0.045 * kuatHat * (0.8 + rng() * 0.4), 0.05)

          // melodi jarang, hanya di ketukan 1/8
          if (s % 2 === 0 && s !== 0 && rng() < 0.2) {
            const n = p.melodi[Math.floor(rng() * p.melodi.length)]
            pianoListrik(c, instrumen, frekMidi(n), t, dt * 6, 0.55)
          }
          langkah++
          tLangkah += dt
        }
      },
      henti: () => L.bersihkan(),
    }
  }
}

// ---------- hujan ----------

function tetes(c: BaseAudioContext, tujuan: AudioNode, t: number, rng: () => number) {
  const o = c.createOscillator()
  const g = c.createGain()
  const p = panner(c, rng() * 1.8 - 0.9)
  const f = 1800 + rng() * 2800
  o.type = 'sine'
  o.frequency.setValueAtTime(f, t)
  o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.05)
  ampul(g, t, 0.012 + rng() * 0.03, 0.002, 0.045)
  o.connect(g)
  if (p) g.connect(p).connect(tujuan)
  else g.connect(tujuan)
  o.start(t)
  o.stop(t + 0.08)
}

export const hujan: Penghasil = (c, keluar, rng = Math.random) => {
  const L = buatPelacak()

  const pink = L.s(c.createBufferSource())
  pink.buffer = buatNoise(c, 8, 'pink', 'hujan-pink')
  pink.loop = true
  const hp = L.n(c.createBiquadFilter())
  hp.type = 'highpass'
  hp.frequency.value = 350
  const lp = L.n(c.createBiquadFilter())
  lp.type = 'lowpass'
  lp.frequency.value = 8000
  const dasar = L.n(c.createGain())
  dasar.gain.value = 0.9
  pink.connect(hp).connect(lp).connect(dasar).connect(keluar)
  pink.start()

  // lapisan desir yang naik turun pelan (angin menyapu hujan)
  const putih = L.s(c.createBufferSource())
  putih.buffer = buatNoise(c, 6, 'putih', 'hujan-putih')
  putih.loop = true
  const bp = L.n(c.createBiquadFilter())
  bp.type = 'bandpass'
  bp.frequency.value = 3400
  bp.Q.value = 0.6
  const desir = L.n(c.createGain())
  desir.gain.value = 0.08
  const lfo = L.s(c.createOscillator())
  const lfoG = L.n(c.createGain())
  lfo.frequency.value = 0.13
  lfoG.gain.value = 0.04
  lfo.connect(lfoG).connect(desir.gain)
  putih.connect(bp).connect(desir).connect(keluar)
  putih.start()
  lfo.start()

  const bunyiTetes = L.n(c.createGain())
  bunyiTetes.connect(keluar)
  const guruhBuf = buatNoise(c, 6, 'cokelat', 'hujan-guruh')

  let tTetes = c.currentTime + 0.3
  let tGuruh = c.currentTime + 25 + rng() * 50
  return {
    jadwal(sampai) {
      while (tTetes < sampai) {
        tetes(c, bunyiTetes, tTetes, rng)
        tTetes += 0.07 + rng() * 0.3
      }
      while (tGuruh < sampai) {
        const s = c.createBufferSource()
        const f = c.createBiquadFilter()
        const g = c.createGain()
        s.buffer = guruhBuf
        f.type = 'lowpass'
        f.frequency.setValueAtTime(190, tGuruh)
        f.frequency.exponentialRampToValueAtTime(70, tGuruh + 6)
        g.gain.setValueAtTime(0.0001, tGuruh)
        g.gain.exponentialRampToValueAtTime(0.4, tGuruh + 1.4)
        g.gain.exponentialRampToValueAtTime(0.0001, tGuruh + 7)
        s.connect(f).connect(g).connect(keluar)
        s.start(tGuruh)
        s.stop(tGuruh + 7.2)
        tGuruh += 55 + rng() * 80
      }
    },
    henti: () => L.bersihkan(),
  }
}

// ---------- alam (sungai, angin, burung) ----------

function kicau(c: BaseAudioContext, tujuan: AudioNode, t: number, rng: () => number) {
  const p = panner(c, rng() * 1.6 - 0.8)
  const akhir: AudioNode = p ?? tujuan
  if (p) p.connect(tujuan)
  const dasar = 2300 + rng() * 2200
  const jenis = rng() < 0.5 ? 'rentet' : 'siul'
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'sine'
  if (jenis === 'rentet') {
    // rentetan kicau pendek naik
    const n = 3 + Math.floor(rng() * 4)
    g.gain.setValueAtTime(0.0001, t)
    for (let i = 0; i < n; i++) {
      const tt = t + i * 0.105
      o.frequency.setValueAtTime(dasar, tt)
      o.frequency.exponentialRampToValueAtTime(dasar * 1.32, tt + 0.07)
      g.gain.setValueAtTime(0.0001, tt)
      g.gain.exponentialRampToValueAtTime(0.065, tt + 0.015)
      g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.085)
    }
    o.start(t)
    o.stop(t + n * 0.105 + 0.1)
  } else {
    // siulan dua nada turun
    o.frequency.setValueAtTime(dasar * 1.15, t)
    o.frequency.exponentialRampToValueAtTime(dasar * 0.85, t + 0.3)
    o.frequency.setValueAtTime(dasar * 1.05, t + 0.42)
    o.frequency.exponentialRampToValueAtTime(dasar * 0.75, t + 0.75)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.055, t + 0.05)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34)
    g.gain.setValueAtTime(0.0001, t + 0.42)
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.47)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8)
    o.start(t)
    o.stop(t + 0.85)
  }
  o.connect(g).connect(akhir)
}

export const alam: Penghasil = (c, keluar, rng = Math.random) => {
  const L = buatPelacak()
  const pink = buatNoise(c, 8, 'pink', 'alam-pink')

  const lapis = (frek: number, q: number, gain: number, lfoHz: number, lfoDalam: number, tipe: BiquadFilterType = 'bandpass') => {
    const s = L.s(c.createBufferSource())
    s.buffer = pink
    s.loop = true
    // tiap lapis mulai dari titik berbeda supaya tidak sefase
    const f = L.n(c.createBiquadFilter())
    f.type = tipe
    f.frequency.value = frek
    f.Q.value = q
    const g = L.n(c.createGain())
    g.gain.value = gain
    const lfo = L.s(c.createOscillator())
    const lg = L.n(c.createGain())
    lfo.frequency.value = lfoHz
    lg.gain.value = lfoDalam
    lfo.connect(lg).connect(f.frequency)
    s.connect(f).connect(g).connect(keluar)
    s.start(0, rng() * 4)
    lfo.start()
  }
  lapis(850, 0.8, 0.5, 0.23, 300) // aliran utama
  lapis(2200, 1.1, 0.16, 0.37, 600) // riak
  lapis(450, 0.7, 0.3, 0.06, 90, 'lowpass') // angin

  // burung dengan sedikit gema hutan
  const burung = L.n(c.createGain())
  const tunda = L.n(c.createDelay(1))
  const umpan = L.n(c.createGain())
  tunda.delayTime.value = 0.31
  umpan.gain.value = 0.26
  burung.connect(keluar)
  burung.connect(tunda)
  tunda.connect(umpan).connect(tunda)
  tunda.connect(keluar)

  let berikut = c.currentTime + 2
  return {
    jadwal(sampai) {
      while (berikut < sampai) {
        kicau(c, burung, berikut, rng)
        berikut += 2.5 + rng() * 6
      }
    },
    henti: () => L.bersihkan(),
  }
}

/** Penghasil untuk sebuah lagu menurut jenisnya, sudah diseragamkan kenyaringannya. */
export function buatPenghasil(lagu: Lagu): Penghasil {
  const inti = ((): Penghasil => {
    switch (lagu.jenis) {
      case 'lofi':
        return lofi(lagu)
      case 'hujan':
        return hujan
      case 'alam':
        return alam
      default:
        return ambien
    }
  })()
  return (c, keluar, rng) => {
    const penyetara = c.createGain()
    penyetara.gain.value = PENYETARA[lagu.jenis]
    penyetara.connect(keluar)
    const s = inti(c, penyetara, rng)
    return {
      jadwal: (t) => s.jadwal(t),
      henti: () => {
        s.henti()
        try {
          penyetara.disconnect()
        } catch {
          /* sudah lepas */
        }
      },
    }
  }
}
