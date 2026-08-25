export type SoundCue =
  | 'click'
  | 'fill'
  | 'cross'
  | 'clear'
  | 'mistake'
  | 'line'
  | 'hint'
  | 'ready'
  | 'lose'
  | 'solve'

type BrowserWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext
}

class Nono2000Sound {
  private context: AudioContext | null = null
  private dry: GainNode | null = null
  private reverb: ConvolverNode | null = null
  private wet: GainNode | null = null

  private setup(): AudioContext | null {
    if (this.context) {
      if (this.context.state === 'suspended') void this.context.resume()
      return this.context
    }

    const AudioContextClass = window.AudioContext || (window as BrowserWindow).webkitAudioContext
    if (!AudioContextClass) return null

    const context = new AudioContextClass()
    const master = context.createGain()
    const dry = context.createGain()
    const wet = context.createGain()
    const reverb = context.createConvolver()
    const impulseLength = Math.floor(context.sampleRate * 0.22)
    const impulse = context.createBuffer(2, impulseLength, context.sampleRate)

    for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
      const data = impulse.getChannelData(channel)
      for (let index = 0; index < impulseLength; index += 1) {
        const decay = Math.pow(1 - index / impulseLength, 3)
        data[index] = (Math.random() * 2 - 1) * decay
      }
    }

    reverb.buffer = impulse
    master.gain.value = 0.26
    dry.gain.value = 0.88
    wet.gain.value = 0.16
    dry.connect(master)
    reverb.connect(wet)
    wet.connect(master)
    master.connect(context.destination)

    this.context = context
    this.dry = dry
    this.reverb = reverb
    this.wet = wet
    return context
  }

  private tone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay = 0,
    endFrequency = frequency,
  ) {
    const context = this.setup()
    if (!context || !this.dry || !this.reverb) return
    const now = context.currentTime + delay
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, now)
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    oscillator.connect(gain)
    gain.connect(this.dry)
    gain.connect(this.reverb)
    oscillator.start(now)
    oscillator.stop(now + duration + 0.02)
  }

  play(cue: SoundCue) {
    switch (cue) {
      case 'click':
        this.tone(260, 0.045, 'square', 0.16, 0, 190)
        break
      case 'fill':
        this.tone(132, 0.075, 'triangle', 0.28, 0, 92)
        this.tone(264, 0.045, 'square', 0.08, 0.008, 220)
        break
      case 'cross':
        this.tone(560, 0.055, 'square', 0.11, 0, 360)
        break
      case 'clear':
        this.tone(310, 0.065, 'sine', 0.13, 0, 170)
        break
      case 'mistake':
        this.tone(126, 0.18, 'sawtooth', 0.2, 0, 72)
        this.tone(142, 0.16, 'square', 0.08, 0.018, 68)
        break
      case 'line':
        this.tone(440, 0.11, 'square', 0.08)
        this.tone(660, 0.12, 'square', 0.07, 0.065)
        this.tone(880, 0.14, 'triangle', 0.1, 0.13)
        break
      case 'hint':
        this.tone(520, 0.1, 'sine', 0.1)
        this.tone(780, 0.16, 'triangle', 0.1, 0.07)
        this.tone(1040, 0.2, 'sine', 0.08, 0.15)
        break
      case 'ready':
        this.tone(180, 0.08, 'triangle', 0.1)
        this.tone(270, 0.09, 'triangle', 0.1, 0.07)
        break
      case 'lose':
        this.tone(220, 0.2, 'square', 0.1, 0, 145)
        this.tone(165, 0.24, 'sawtooth', 0.08, 0.15, 82)
        this.tone(110, 0.32, 'triangle', 0.12, 0.31, 55)
        break
      case 'solve':
        this.tone(330, 0.18, 'square', 0.09)
        this.tone(440, 0.18, 'square', 0.08, 0.09)
        this.tone(660, 0.22, 'triangle', 0.13, 0.19)
        this.tone(880, 0.28, 'triangle', 0.12, 0.31)
        break
    }
  }
}

export const nono2000Sound = new Nono2000Sound()
