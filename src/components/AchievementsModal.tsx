import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  ACHIEVEMENTS,
  formatAchievementDate,
  type PlayerRecord,
} from '../game/achievements'

interface AchievementsModalProps {
  record: PlayerRecord
  onClose: () => void
}

export function AchievementsModal({ record, onClose }: AchievementsModalProps) {
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    closeButton.current?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      previousFocus?.focus()
    }
  }, [onClose])

  return createPortal(
    <div className="modal-backdrop" onMouseDown={onClose} role="presentation">
      <section
        aria-labelledby="achievements-heading"
        aria-modal="true"
        className="modal-card achievements-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="modal-heading">
          <h2 id="achievements-heading">Achievements</h2>
          <button
            aria-label="Close achievements"
            className="terminal-close"
            onClick={onClose}
            ref={closeButton}
          >
            Close
          </button>
        </div>

        <div className="achievement-list">
          {ACHIEVEMENTS.map((achievement) => {
            const unlockedAt = record.achievements[achievement.id]
            return (
              <article className={unlockedAt ? 'is-unlocked' : 'is-locked'} key={achievement.id}>
                <span aria-hidden="true" className="achievement-mark">
                  {unlockedAt ? '✓' : '◇'}
                </span>
                <div>
                  <h3>{achievement.name}</h3>
                  <p>{achievement.description}</p>
                  {achievement.id === 'perfect-signal' ? (
                    <p className="achievement-progress">
                      Best perfect streak <strong>{record.bestPerfectStreak}</strong>
                    </p>
                  ) : null}
                  <small>{unlockedAt ? `Completed ${formatAchievementDate(unlockedAt)}` : 'Locked'}</small>
                </div>
              </article>
            )
          })}
        </div>

        <p className="achievement-storage-note">Saved on this device.</p>
      </section>
    </div>,
    document.body,
  )
}
