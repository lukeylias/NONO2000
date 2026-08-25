import { createPortal } from 'react-dom'

interface CommandMenuProps {
  inSession: boolean
  musicOn: boolean
  soundOn: boolean
  onClose: () => void
  onDisconnect: () => void
  onRules: () => void
  onToggleMusic: () => void
  onToggleSound: () => void
}

export function CommandMenu({
  inSession,
  musicOn,
  soundOn,
  onClose,
  onDisconnect,
  onRules,
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
          <h2 id="command-heading">System menu</h2>
          <button aria-label="Close system menu" className="terminal-close" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="command-toggles">
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
          <button onClick={onRules}>How to play</button>
          {inSession ? <button className="is-danger" onClick={onDisconnect}>Back to title</button> : null}
        </div>
      </aside>
    </div>,
    document.body,
  )
}
