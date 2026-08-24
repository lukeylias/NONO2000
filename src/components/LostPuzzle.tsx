interface LostPuzzleProps {
  onNewGame: () => void
  onNextPuzzle: () => void
  onRetry: () => void
}

export function LostPuzzle({ onNewGame, onNextPuzzle, onRetry }: LostPuzzleProps) {
  return (
    <div className="lost-layout">
      <div className="lost-clock" aria-label="Countdown finished">
        <span>Time left</span>
        <strong>0:00.0</strong>
      </div>

      <section className="result-card is-lost" aria-labelledby="lost-heading">
        <p className="eyebrow">Sequence failed</p>
        <h2 id="lost-heading">Time over.</h2>
        <p className="lost-detail">Retry this puzzle or load a new grid.</p>
        <div className="result-actions">
          <button className="button secondary" onClick={onNewGame}>New</button>
          <button className="button secondary" onClick={onRetry}>Try again</button>
          <button className="button primary" onClick={onNextPuzzle}>Next</button>
        </div>
      </section>
    </div>
  )
}
