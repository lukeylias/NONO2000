interface LostPuzzleProps {
  reason?: 'timeout' | 'perfect'
  endedPerfectStreak?: number
  bestPerfectStreak?: number
  onNewPuzzle: () => void
  onNextPuzzle: () => void
  onRetry: () => void
}

export function LostPuzzle({
  reason = 'timeout',
  endedPerfectStreak = 0,
  bestPerfectStreak = 0,
  onNewPuzzle,
  onNextPuzzle,
  onRetry,
}: LostPuzzleProps) {
  const perfectFailed = reason === 'perfect'
  return (
    <div className="lost-layout">
      {perfectFailed ? (
        <div
          className="lost-clock is-perfect-streak"
          aria-label="Perfect streak ended"
        >
          <span>Perfect streak</span>
          <strong>{endedPerfectStreak}</strong>
          <small>Best {bestPerfectStreak}</small>
        </div>
      ) : (
        <div className="lost-clock" aria-label="Countdown finished">
          <span>Time left</span>
          <strong>0:00.0</strong>
        </div>
      )}

      <section className="result-card is-lost" aria-labelledby="lost-heading">
        <p className="eyebrow">Sequence failed</p>
        <h2 id="lost-heading">
          {perfectFailed ? 'Perfect run ended.' : 'Time over.'}
        </h2>
        <p className="lost-detail">
          {perfectFailed
            ? 'One mistake reset your current streak.'
            : 'Retry this puzzle or load a new grid.'}
        </p>
        {perfectFailed ? (
          <div className="result-actions is-perfect-failure">
            <button className="button secondary" onClick={onNewPuzzle}>New Puzzle</button>
            <button className="button primary" onClick={onNextPuzzle}>Next Puzzle</button>
          </div>
        ) : (
          <div className="result-actions">
            <button className="button secondary" onClick={onNewPuzzle}>New Puzzle</button>
            <button className="button secondary" onClick={onRetry}>Replay Puzzle</button>
            <button className="button primary" onClick={onNextPuzzle}>Next Puzzle</button>
          </div>
        )}
      </section>
    </div>
  )
}
