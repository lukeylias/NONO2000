import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { timerModeLabel } from '../game/play'
import {
  BOARD_SIZES,
  PUZZLE_DIFFICULTIES,
  type BoardSize,
  type PuzzleDifficulty,
  type TimerMinutes,
} from '../game/types'

interface PuzzleSetupProps {
  size: BoardSize
  difficulty: PuzzleDifficulty
  timerMinutes: TimerMinutes
  presentation?: 'page' | 'modal'
  onBack: () => void
  onCycleTimer: () => void
  onSelectDifficulty: (difficulty: PuzzleDifficulty) => void
  onSelectSize: (size: BoardSize) => void
  onStart: () => void
}

export function PuzzleSetup({
  size,
  difficulty,
  timerMinutes,
  onBack,
  onCycleTimer,
  onSelectDifficulty,
  onSelectSize,
  onStart,
  presentation = 'page',
}: PuzzleSetupProps) {
  const timerLabel = timerModeLabel(timerMinutes)
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
      <p className="boot-status">New puzzle</p>
      <h2 id="setup-title">Set the grid</h2>
      <p className="setup-line">Choose your puzzle, then begin.</p>

      <div className="boot-options" aria-label="Puzzle options">
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

        <button
          aria-label={`Timer: ${timerLabel}`}
          className={`setup-timer ${timerMinutes > 0 ? 'is-timed' : 'is-relaxed'}`}
          onClick={onCycleTimer}
        >
          <span>Timer</span>
          <strong>{timerLabel}</strong>
          <small>Press to cycle</small>
        </button>
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
