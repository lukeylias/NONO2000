import { Square, X } from '@phosphor-icons/react'
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'

interface HowToPlayProps {
  onClose: () => void
}

type ExampleMark = 'unknown' | 'filled' | 'crossed'
type ExampleTool = 'filled' | 'crossed'

const STARTING_MARKS: ExampleMark[] = ['unknown', 'unknown', 'unknown', 'crossed', 'unknown']
const CONFETTI_PIECES = Array.from({ length: 12 }, (_, index) => index)

export function HowToPlay({ onClose }: HowToPlayProps) {
  const [exampleMarks, setExampleMarks] = useState<ExampleMark[]>(() => [...STARTING_MARKS])
  const [exampleTool, setExampleTool] = useState<ExampleTool>('filled')
  const [exampleError, setExampleError] = useState<{ index: number; mark: ExampleTool } | null>(null)
  const [exampleSolved, setExampleSolved] = useState(false)
  const resetTimer = useRef<number | null>(null)

  useEffect(() => () => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current)
  }, [])

  function resetExample() {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current)
    resetTimer.current = null
    setExampleMarks([...STARTING_MARKS])
    setExampleError(null)
    setExampleSolved(false)
  }

  function markExampleCell(index: number, mark = exampleTool) {
    if (exampleSolved || exampleError || exampleMarks[index] !== 'unknown') return

    const expectsFill = index < 3
    const isCorrect = (expectsFill && mark === 'filled') || (!expectsFill && mark === 'crossed')
    if (!isCorrect) {
      setExampleError({ index, mark })
      resetTimer.current = window.setTimeout(resetExample, 700)
      return
    }

    const nextMarks = exampleMarks.map((current, cellIndex) => (
      cellIndex === index ? mark : current
    ))
    const filledRunComplete = nextMarks.slice(0, 3).every((current) => current === 'filled')
    if (filledRunComplete) {
      nextMarks[4] = 'crossed'
      setExampleSolved(true)
    }
    setExampleMarks(nextMarks)
  }

  function crossExampleCell(event: MouseEvent, index: number) {
    event.preventDefault()
    markExampleCell(index, 'crossed')
  }

  return createPortal(
    <div className="modal-backdrop" onMouseDown={onClose} role="presentation">
      <section
        aria-labelledby="how-to-play-heading"
        aria-modal="true"
        className="modal-card"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="modal-heading">
          <h2 id="how-to-play-heading">How to play</h2>
          <button aria-label="Close how to play" className="icon-button" onClick={onClose}>Close</button>
        </div>

        <p>
          Each clue gives the length of a filled run. Multiple clues mean separate runs
          with at least one empty block between them.
        </p>

        <section
          aria-labelledby="practice-row-heading"
          className={`clue-example${exampleSolved ? ' is-solved' : ''}`}
        >
          <div className="clue-example-heading">
            <div>
              <p className="eyebrow">Try it</p>
              <h3 id="practice-row-heading">Complete the row</h3>
            </div>
            <button
              className="clue-example-reset"
              disabled={exampleMarks.every((mark, index) => mark === STARTING_MARKS[index]) && !exampleError}
              onClick={resetExample}
              type="button"
            >
              Reset
            </button>
          </div>

          <p className="clue-example-instruction">
            The clue is 3. The fourth block is already crossed.
          </p>

          <div className="clue-example-playfield">
            <div className="guide-example-board" style={{ '--cell-size': '48px' } as CSSProperties}>
              <div
                aria-label="Row clue 3"
                className={`row-clue${exampleSolved ? ' is-satisfied' : ''}`}
              >
                <span>3</span>
              </div>
              <div aria-label="Practice row" className="puzzle-grid guide-example-grid" role="grid">
                {exampleMarks.map((mark, index) => {
                  const isError = exampleError?.index === index
                  return (
                    <button
                      aria-disabled={exampleSolved || Boolean(exampleError) || mark !== 'unknown'}
                      aria-label={`Block ${index + 1}, ${isError ? 'error' : mark}${index === 3 ? ', preset' : ''}`}
                      className={[
                        'puzzle-cell',
                        `is-${mark}`,
                        isError ? 'is-error is-error-fill' : '',
                        index === 4 ? 'is-last-column' : '',
                        'is-last-row',
                      ].filter(Boolean).join(' ')}
                      key={index}
                      onClick={() => markExampleCell(index)}
                      onContextMenu={(event) => crossExampleCell(event, index)}
                      role="gridcell"
                      type="button"
                    />
                  )
                })}
              </div>
            </div>

            <button
              aria-checked={exampleTool === 'filled'}
              aria-label={`Primary mark: ${exampleTool === 'filled' ? 'Fill' : 'Cross'}`}
              className={`mark-mode-toggle guide-example-toggle is-${exampleTool}`}
              onClick={() => setExampleTool(exampleTool === 'filled' ? 'crossed' : 'filled')}
              role="switch"
              type="button"
            >
              <span className={`mark-mode-option ${exampleTool === 'crossed' ? 'is-active' : ''}`}>
                <X aria-hidden="true" weight="bold" />
              </span>
              <span className={`mark-mode-option ${exampleTool === 'filled' ? 'is-active' : ''}`}>
                <Square aria-hidden="true" weight="fill" />
              </span>
            </button>

            {exampleSolved ? (
              <div aria-hidden="true" className="guide-success-confetti">
                {CONFETTI_PIECES.map((piece) => <span key={piece} />)}
              </div>
            ) : null}
          </div>

          <p
            aria-live="polite"
            className={`clue-example-feedback${exampleSolved ? ' is-solved' : ''}${exampleError ? ' is-error' : ''}`}
          >
            {exampleSolved
              ? 'Solved. Three filled blocks, then two crosses.'
              : exampleError
                ? 'Not quite. Resetting the row.'
                : 'Fill the three-block run. You can cross the last block yourself.'}
          </p>
        </section>

        <ul>
          <li>Choose Fill or Cross below the board, then click, tap, or drag.</li>
          <li>With a mouse, right-click is a quick Cross shortcut without changing the switch.</li>
          <li>A wrong mark stops the current drag. Release and start a new drag to continue.</li>
          <li>Once marked, a block is locked for that attempt.</li>
          <li>A wrong Fill can be corrected with a Cross. A wrong Cross still fills a required block, but keeps its red X.</li>
          <li>In timed mode, every wrong Fill or Cross removes 15 seconds.</li>
          <li>Clear a row or column and its remaining blocks are crossed automatically.</li>
          <li>Choose a 1, 2, or 5 minute countdown. Relaxed mode has no clock.</li>
        </ul>

        <button className="button primary modal-action" onClick={onClose}>Got it</button>
      </section>
    </div>,
    document.body,
  )
}
