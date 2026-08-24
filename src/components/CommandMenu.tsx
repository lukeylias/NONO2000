import { createPortal } from 'react-dom'
import { timerModeLabel } from '../game/play'
import {
  BOARD_SIZES,
  PUZZLE_DIFFICULTIES,
  type BoardSize,
  type PuzzleDifficulty,
  type TimerMinutes,
} from '../game/types'

interface CommandMenuProps {
  difficulty: PuzzleDifficulty
  inSession: boolean
  musicOn: boolean
  size: BoardSize
  soundOn: boolean
  timerMinutes: TimerMinutes
  onClose: () => void
  onDisconnect: () => void
  onNewPuzzle: () => void
  onReset: () => void
  onRules: () => void
  onSelectDifficulty: (difficulty: PuzzleDifficulty) => void
  onSelectSize: (size: BoardSize) => void
  onCycleTimer: () => void
  onToggleMusic: () => void
  onToggleSound: () => void
}

export function CommandMenu({
  difficulty,
  inSession,
  musicOn,
  size,
  soundOn,
  timerMinutes,
  onClose,
  onDisconnect,
  onNewPuzzle,
  onReset,
  onRules,
  onSelectDifficulty,
  onSelectSize,
  onCycleTimer,
  onToggleMusic,
  onToggleSound,
}: CommandMenuProps) {
  return createPortal(
    <div className="command-backdrop" onMouseDown={onClose} role="presentation">
      <aside
        aria-labelledby="command-heading"
        aria-modal="true"
        className="command-menu"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="command-heading">
          <div>
            <p>Configure the next puzzle</p>
            <h2 id="command-heading">System menu</h2>
          </div>
          <button aria-label="Close system menu" className="terminal-close" onClick={onClose}>
            Close
          </button>
        </div>

        <fieldset className="command-group">
          <legend>Grid size</legend>
          <div className="command-sizes">
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

        <fieldset className="command-group">
          <legend>Difficulty</legend>
          <div className="command-difficulties">
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

        <div className="command-toggles">
          <button aria-label={`Timer ${timerModeLabel(timerMinutes)}`} onClick={onCycleTimer}>
            Timer <span>{timerModeLabel(timerMinutes)}</span>
          </button>
          <div aria-label="Audio" className="command-audio-group" role="group">
            <p>Audio</p>
            <div>
              <button aria-pressed={soundOn} onClick={onToggleSound}>
                Sounds <span>{soundOn ? 'On' : 'Off'}</span>
              </button>
              <button aria-pressed={musicOn} onClick={onToggleMusic}>
                Music <span>{musicOn ? 'On' : 'Off'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="command-actions">
          {inSession ? <button onClick={onReset}>Reset this grid</button> : null}
          {inSession ? <button onClick={onNewPuzzle}>New puzzle</button> : null}
          <button onClick={onRules}>How to play</button>
          {inSession ? <button className="is-danger" onClick={onDisconnect}>Back to title</button> : null}
        </div>
      </aside>
    </div>,
    document.body,
  )
}
