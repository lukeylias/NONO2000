import { assetUrl } from '../asset-url'

const MUSIC_TRACK = assetUrl('audio/nostalgic-liquid-jungle-loop.mp3')
const MUSIC_VOLUME = 0.02

class GameMusic {
  private audio: HTMLAudioElement | null = null

  private setup(): HTMLAudioElement | null {
    if (this.audio) return this.audio
    if (typeof Audio === 'undefined') return null

    const audio = new Audio(MUSIC_TRACK)
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = MUSIC_VOLUME
    this.audio = audio
    return audio
  }

  setEnabled(enabled: boolean) {
    const audio = this.setup()
    if (!audio) return

    if (enabled) {
      void audio.play().catch(() => {
        // A later user interaction can retry playback if the browser blocks autoplay.
      })
      return
    }

    audio.pause()
  }
}

export const gameMusic = new GameMusic()
