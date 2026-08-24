import { BrandLogo } from './BrandLogo'

interface BootScreenProps {
  musicOn: boolean
  soundOn: boolean
  onStart: () => void
  onRules: () => void
  onToggleMusic: () => void
  onToggleSound: () => void
}

export function BootScreen({
  musicOn,
  soundOn,
  onStart,
  onRules,
  onToggleMusic,
  onToggleSound,
}: BootScreenProps) {
  return (
    <main className="boot-screen">
      <section className="boot-console" aria-labelledby="boot-title">
        <p className="boot-status">Picture logic system</p>
        <h1 id="boot-title">
          <BrandLogo variant="boot" />
        </h1>
        <p className="boot-line">Nostalgic 2000s nonogram vibes.</p>

        <button className="boot-start" onClick={onStart}>
          Start puzzle
        </button>

        <nav className="boot-menu" aria-label="Main menu">
          <button onClick={onRules}>How to play</button>
          <button
            aria-label={`Sounds: ${soundOn ? 'On' : 'Off'}`}
            aria-pressed={soundOn}
            onClick={onToggleSound}
          >
            Sounds {soundOn ? 'on' : 'off'}
          </button>
          <button
            aria-label={`Music: ${musicOn ? 'On' : 'Off'}`}
            aria-pressed={musicOn}
            onClick={onToggleMusic}
          >
            Music {musicOn ? 'on' : 'off'}
          </button>
        </nav>
      </section>
    </main>
  )
}
