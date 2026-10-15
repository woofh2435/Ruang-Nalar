// Suara ambient yang disintesis dengan WebAudio (tanpa file audio). Default MATI.
// Pad lembut + denting pentatonik acak. Hanya jalan setelah pengguna menekan tombol suara.

type PeluruAudio = typeof AudioContext

let ctx: AudioContext | null = null
let master: GainNode | null = null
let bel: GainNode | null = null
let nyala = false
let pewaktu: ReturnType<typeof setTimeout> | undefined
let oscillators: OscillatorNode[] = []
let hentiTimer: ReturnType<typeof setTimeout> | undefined

const SKALA = [587.33, 698.46, 783.99, 880, 1046.5, 1174.66] // D minor pentatonik, oktaf tinggi
const AKOR = [146.83, 220, 261.63, 329.63]

export const bunyiNyala = () => nyala
export const bunyiDidukung = () =>
  typeof window !== 'undefined' &&
  !!((window as unknown as { AudioContext?: PeluruAudio; webkitAudioContext?: PeluruAudio }).AudioContext ||
    (window as unknown as { webkitAudioContext?: PeluruAudio }).webkitAudioContext)

function buatCtx(): AudioContext | null {
  if (ctx) return ctx
  try {
    const W = window as unknown as { AudioContext?: PeluruAudio; webkitAudioContext?: PeluruAudio }
    const C = W.AudioContext ?? W.webkitAudioContext
    if (!C) return null
    ctx = new C()
    return ctx
  } catch {
    return null
  }
}

function denting(c: AudioContext, tujuan: AudioNode, frek: number, kuat = 0.08) {
  const o = c.createOscillator()
  const o2 = c.createOscillator()
  const g = c.createGain()
  const p = c.createStereoPanner ? c.createStereoPanner() : null
  o.type = 'sine'
  o2.type = 'triangle'
  o.frequency.value = frek
  o2.frequency.value = frek * 2.005
  const t = c.currentTime
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(kuat, t + 0.03)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2)
  o.connect(g)
  const g2 = c.createGain()
  g2.gain.value = 0.25
  o2.connect(g2).connect(g)
  if (p) {
    p.pan.value = Math.random() * 1.6 - 0.8
    g.connect(p).connect(tujuan)
  } else g.connect(tujuan)
  o.start(t)
  o2.start(t)
  o.stop(t + 3.4)
  o2.stop(t + 3.4)
}

function jadwalDenting() {
  if (!nyala || !ctx || !bel) return
  denting(ctx, bel, SKALA[Math.floor(Math.random() * SKALA.length)], 0.05)
  pewaktu = setTimeout(jadwalDenting, 2600 + Math.random() * 3800)
}

function mulai(): boolean {
  const c = buatCtx()
  if (!c) return false
  try {
    void c.resume()
    clearTimeout(hentiTimer)
    master = c.createGain()
    master.gain.value = 0.0001
    master.connect(c.destination)

    // pad
    const filter = c.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 900
    filter.Q.value = 0.6
    const lfo = c.createOscillator()
    const lfoGain = c.createGain()
    lfo.frequency.value = 0.07
    lfoGain.gain.value = 350
    lfo.connect(lfoGain).connect(filter.frequency)
    filter.connect(master)
    oscillators = [lfo]
    AKOR.forEach((f, i) => {
      for (const d of [-7, 6]) {
        const o = c.createOscillator()
        const g = c.createGain()
        o.type = i % 2 ? 'sine' : 'triangle'
        o.frequency.value = f
        o.detune.value = d
        g.gain.value = 0.07
        o.connect(g).connect(filter)
        o.start()
        oscillators.push(o)
      }
    })
    lfo.start()

    // denting dengan gema
    bel = c.createGain()
    bel.gain.value = 1
    const tunda = c.createDelay(1)
    tunda.delayTime.value = 0.42
    const umpan = c.createGain()
    umpan.gain.value = 0.38
    bel.connect(master)
    bel.connect(tunda)
    tunda.connect(umpan).connect(tunda)
    tunda.connect(master)

    const t = c.currentTime
    master.gain.setValueAtTime(0.0001, t)
    master.gain.exponentialRampToValueAtTime(0.5, t + 2.2)
    nyala = true
    pewaktu = setTimeout(jadwalDenting, 1200)
    return true
  } catch {
    nyala = false
    return false
  }
}

function henti() {
  nyala = false
  clearTimeout(pewaktu)
  const c = ctx
  const m = master
  const osc = oscillators
  oscillators = []
  if (c && m) {
    try {
      const t = c.currentTime
      m.gain.cancelScheduledValues(t)
      m.gain.setValueAtTime(Math.max(m.gain.value, 0.0001), t)
      m.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
    } catch {
      /* abaikan */
    }
    hentiTimer = setTimeout(() => {
      osc.forEach((o) => {
        try {
          o.stop()
        } catch {
          /* sudah berhenti */
        }
      })
      try {
        m.disconnect()
      } catch {
        /* abaikan */
      }
      if (!nyala && c.state === 'running') void c.suspend()
    }, 750)
  }
  master = null
  bel = null
}

/** Nyalakan / matikan suara. Mengembalikan keadaan akhir. */
export function setBunyi(on: boolean): boolean {
  if (on && !nyala) return mulai()
  if (!on && nyala) henti()
  return nyala
}

/** Denting kecil untuk umpan balik (kuis benar, bintang) — hanya terdengar kalau suara dinyalakan. */
export function dentingKecil(indeks = 0) {
  if (!nyala || !ctx || !master) return
  try {
    denting(ctx, master, SKALA[Math.abs(indeks) % SKALA.length], 0.07)
  } catch {
    /* abaikan */
  }
}
