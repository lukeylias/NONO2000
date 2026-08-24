import { createPortal } from 'react-dom'

interface HowToPlayProps {
  onClose: () => void
}

export function HowToPlay({ onClose }: HowToPlayProps) {
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
          <div>
            <p className="eyebrow">Operator guide</p>
            <h2 id="how-to-play-heading">How to play</h2>
          </div>
          <button aria-label="Close how to play" className="icon-button" onClick={onClose}>Close</button>
        </div>

        <p>
          Each clue gives the length of a filled run. Multiple clues mean separate runs
          with at least one empty block between them.
        </p>

        <div className="clue-example" aria-label="Example clue 3, 1">
          <span>3</span><span>1</span>
          <div className="mini-line">
            <i className="filled" /><i className="filled" /><i className="filled" />
            <i /><i className="filled" />
          </div>
        </div>

        <ul>
          <li>On touch screens, choose Fill or Cross below the board, then tap or drag.</li>
          <li>With a mouse, left-click always fills and right-click always adds a Cross.</li>
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
