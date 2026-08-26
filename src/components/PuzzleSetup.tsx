import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { modeLabel } from '../game/modes'
import {
  BOARD_SIZES,
  GAME_MODES,
  PUZZLE_DIFFICULTIES,
  TIMED_PRESETS,
  type BoardSize,
  type GameMode,
  type PuzzleDifficulty,
  type TimedPreset,
} from '../game/types'

interface PuzzleSetupProps {
  size: BoardSize
  difficulty: PuzzleDifficulty
  mode: GameMode
  timedPreset: TimedPreset
  currentPerfectStreak?: number
  bestPerfectStreak?: number
  presentation?: 'page' | 'modal'
  onBack: () => void
  onSelectMode: (mode: GameMode) => void
  onSelectTimedPreset: (preset: TimedPreset) => void
  onSelectDifficulty: (difficulty: PuzzleDifficulty) => void
  onSelectSize: (size: BoardSize) => void
  onStart: () => void
}

const MODE_DESCRIPTIONS: Record<GameMode, string> = {
  relaxed: 'No clock. Use as many hints as you need.',
  timed: 'Beat the clock with 3 hints. Hints and mistakes cost 15 seconds.',
  perfect: 'Hard difficulty. No clock or hints. One mistake ends the run and resets your current streak.',
}

export function PuzzleSetup({
  size,
  difficulty,
  mode,
  timedPreset,
  currentPerfectStreak = 0,
  bestPerfectStreak = 0,
  onBack,
  onSelectMode,
  onSelectTimedPreset,
  onSelectDifficulty,
  onSelectSize,
  onStart,
  presentation = 'page',
}: PuzzleSetupProps) {
  const isModal = presentation === 'modal'
  useEffect(() => {
    if (!isModal) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onBack()
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isModal, onBack])

  const setupConsole = (
    <section
      aria-labelledby="setup-title"
      aria-modal={isModal || undefined}
      className={`boot-console setup-console ${isModal ? 'setup-modal' : ''}`}
      onMouseDown={isModal ? (event) => event.stopPropagation() : undefined}
      role={isModal ? 'dialog' : undefined}
    >
      <h2 id="setup-title">New Puzzle</h2>
      <p className="setup-line">Choose your puzzle, then begin.</p>

      <div className="boot-options" aria-label="Puzzle options">
        <fieldset>
          <legend>Mode</legend>
          <div className="boot-option-group">
            {GAME_MODES.map((gameMode) => (
              <button
                aria-pressed={mode === gameMode}
                className={gameMode === 'perfect' ? 'is-perfect-mode' : undefined}
                key={gameMode}
                onClick={() => onSelectMode(gameMode)}
              >
                {modeLabel(gameMode)}
              </button>
            ))}
          </div>
          <p
            aria-live="polite"
            className={`mode-description is-${mode}`}
            key={mode}
          >
            {MODE_DESCRIPTIONS[mode]}
          </p>
          {mode === 'perfect' ? (
            <p className="perfect-history">
              Current streak <strong>{currentPerfectStreak}</strong>
              <span aria-hidden="true">·</span>
              Best <strong>{bestPerfectStreak}</strong>
            </p>
          ) : null}
        </fieldset>

        {mode === 'timed' ? (
          <fieldset className="mode-time-options">
            <legend>Time limit</legend>
            <div className="boot-option-group">
              {TIMED_PRESETS.map((preset) => (
                <button
                  aria-label={`${preset} minute${preset === 1 ? '' : 's'}`}
                  aria-pressed={timedPreset === preset}
                  key={preset}
                  onClick={() => onSelectTimedPreset(preset)}
                >
                  {preset} min
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        <fieldset>
          <legend>Grid size</legend>
          <div className="boot-option-group">
            {BOARD_SIZES.map((boardSize) => (
              <button
                aria-pressed={size === boardSize}
                key={boardSize}
                onClick={() => onSelectSize(boardSize)}
              >
                {boardSize}×{boardSize}
              </button>
            ))}
          </div>
        </fieldset>

        {mode !== 'perfect' ? (
          <fieldset>
            <legend>Difficulty</legend>
            <div className="boot-option-group">
              {PUZZLE_DIFFICULTIES.map((level) => (
                <button
                  aria-pressed={difficulty === level}
                  key={level}
                  onClick={() => onSelectDifficulty(level)}
                >
                  {level}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

      </div>

      <button className="boot-start" onClick={onStart}>
        Begin puzzle
      </button>
      <nav className="boot-menu" aria-label={isModal ? 'New puzzle dialog' : 'Setup menu'}>
        <button onClick={onBack}>{isModal ? 'Cancel' : 'Back'}</button>
      </nav>
    </section>
  )

  if (isModal) {
    return createPortal(
      <div className="command-backdrop setup-backdrop" onMouseDown={onBack} role="presentation">
        {setupConsole}
      </div>,
      document.body,
    )
  }

  return (
    <main className="boot-screen setup-screen">
      {setupConsole}
    </main>
  )
}
