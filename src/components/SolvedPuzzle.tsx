import { formatElapsed } from '../game/play'
import type { Puzzle } from '../game/types'

interface SolvedPuzzleProps {
  puzzle: Puzzle
  elapsed: number
  mistakeCells?: ReadonlySet<string>
  showTime?: boolean
  onNewGame: () => void
  onNextPuzzle: () => void
  onReplay: () => void
}

const EMPTY_MISTAKES = new Set<string>()

export function SolvedPuzzle({
  puzzle,
  elapsed,
  mistakeCells = EMPTY_MISTAKES,
  showTime = true,
  onNewGame,
  onNextPuzzle,
  onReplay,
}: SolvedPuzzleProps) {
  const mistakeCount = mistakeCells.size
  const isPerfect = mistakeCount === 0

  return (
    <section className="solved-layout" aria-labelledby="solved-heading">
      <div
        className="solved-picture"
        style={{ '--grid-size': puzzle.size } as React.CSSProperties}
        aria-label={isPerfect
          ? 'Revealed picture, clean solve'
          : `Revealed picture with ${mistakeCount} ${mistakeCount === 1 ? 'mistake' : 'mistakes'}`}
        role="img"
      >
        {puzzle.solution.flatMap((row, rowIndex) =>
          row.map((cell, columnIndex) => {
            const key = `${rowIndex}:${columnIndex}`
            const wasMistake = mistakeCells.has(key)
            return (
              <div
                className={[
                  cell === 1 ? 'is-filled' : '',
                  wasMistake ? 'was-mistake' : '',
                ].filter(Boolean).join(' ')}
                key={key}
                style={{
                  '--reveal-delay': `${Math.min((rowIndex + columnIndex) * 14, 260)}ms`,
                } as React.CSSProperties}
              >
                {wasMistake ? <span aria-hidden="true" className="result-mistake-marker" /> : null}
              </div>
            )
          }),
        )}
      </div>

      <div className="result-card">
        <h2 id="solved-heading">Pattern revealed</h2>
        <div className={`result-status ${isPerfect ? 'is-perfect' : 'has-mistakes'}`}>
          <span>{isPerfect ? 'Clean solve' : 'Puzzle solved'}</span>
          <strong>{isPerfect ? '100%' : `${mistakeCount} ${mistakeCount === 1 ? 'mistake' : 'mistakes'}`}</strong>
        </div>
        <div className="result-key" aria-label="Result key">
          <span><i className="is-correct" />Correct</span>
          {!isPerfect ? <span><i className="is-mistake" />Mistake</span> : null}
        </div>
        {showTime ? <p className="result-time">{formatElapsed(elapsed)}</p> : null}
        <p className="result-detail">{puzzle.size}×{puzzle.size} grid</p>
        <div className="result-actions">
          <button className="button secondary" onClick={onNewGame}>New</button>
          <button className="button secondary" onClick={onReplay}>Replay</button>
          <button className="button primary" onClick={onNextPuzzle}>Next</button>
        </div>
      </div>
    </section>
  )
}
