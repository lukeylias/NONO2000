import { formatElapsed } from '../game/play'
import { achievementDefinition, type AchievementId } from '../game/achievements'
import { classifyResult, modeLabel, resultOutcomeLabel } from '../game/modes'
import type { GameMode, Puzzle } from '../game/types'

interface SolvedPuzzleProps {
  puzzle: Puzzle
  elapsed: number
  mistakeCells?: ReadonlySet<string>
  hintsUsed?: number
  mode: GameMode
  perfectEligible?: boolean
  unlockedAchievements?: readonly AchievementId[]
  perfectStreak?: number
  bestPerfectStreak?: number
  onNewPuzzle: () => void
  onNextPuzzle: () => void
  onReplay: () => void
}

const EMPTY_MISTAKES = new Set<string>()

export function SolvedPuzzle({
  puzzle,
  elapsed,
  mistakeCells = EMPTY_MISTAKES,
  hintsUsed = 0,
  mode,
  perfectEligible = true,
  unlockedAchievements = [],
  perfectStreak = 0,
  bestPerfectStreak = 0,
  onNewPuzzle,
  onNextPuzzle,
  onReplay,
}: SolvedPuzzleProps) {
  const mistakeCount = mistakeCells.size
  const outcome = classifyResult(mode, hintsUsed, mistakeCount, perfectEligible)
  const hintSummary = hintsUsed === 0
    ? 'No hints'
    : `${hintsUsed} ${hintsUsed === 1 ? 'hint' : 'hints'}`
  const mistakeSummary = mistakeCount === 0
    ? 'No mistakes'
    : `${mistakeCount} ${mistakeCount === 1 ? 'mistake' : 'mistakes'}`

  return (
    <section className="solved-layout" aria-labelledby="solved-heading">
      <div
        className="solved-picture"
        style={{ '--grid-size': puzzle.size } as React.CSSProperties}
        aria-label={outcome === 'clean'
          ? 'Revealed picture, clean solve'
          : outcome === 'assisted'
            ? `Revealed picture, assisted with ${hintsUsed} ${hintsUsed === 1 ? 'hint' : 'hints'}`
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
        <div className="result-summary">
          <p className="result-outcome">
            {resultOutcomeLabel(outcome)}
          </p>
          <p className="result-meta">
            {modeLabel(mode)} · {puzzle.size}×{puzzle.size} grid · {hintSummary} · {mistakeSummary}
          </p>
          {mode === 'timed' ? <p className="result-time">Time {formatElapsed(elapsed)}</p> : null}
          {mode === 'perfect' ? (
            <p className="result-perfect-streak">
              Perfect streak <strong>{perfectStreak}</strong> · Best {bestPerfectStreak}
            </p>
          ) : null}
          {unlockedAchievements.length > 0 ? (
            <div className="result-achievements" aria-live="polite">
              <span>{unlockedAchievements.length === 1 ? 'Achievement unlocked' : 'Achievements unlocked'}</span>
              <strong>{unlockedAchievements
                .map((id) => achievementDefinition(id).name)
                .join(' · ')}</strong>
            </div>
          ) : null}
        </div>
        <div className="result-actions">
          <button className="button secondary" onClick={onNewPuzzle}>New Puzzle</button>
          {mode !== 'perfect' ? (
            <button className="button secondary" onClick={onReplay}>Replay Puzzle</button>
          ) : null}
          <button className="button primary" onClick={onNextPuzzle}>Next Puzzle</button>
        </div>
      </div>
    </section>
  )
}
