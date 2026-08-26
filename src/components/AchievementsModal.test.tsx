import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AchievementsModal } from './AchievementsModal'

describe('AchievementsModal', () => {
  it('shows locked and unlocked achievements with local-storage context', () => {
    render(
      <AchievementsModal
        onClose={vi.fn()}
        record={{
          version: 1,
          achievements: { 'first-decode': '2026-08-26T01:02:03.000Z' },
          perfectStreak: 2,
          bestPerfectStreak: 5,
        }}
      />,
    )

    expect(screen.getByRole('dialog', { name: 'Achievements' })).toBeInTheDocument()
    expect(screen.getByText('First Decode')).toBeInTheDocument()
    expect(screen.getByText('Against the Clock')).toBeInTheDocument()
    expect(screen.getByText('Perfect Streak')).toBeInTheDocument()
    expect(screen.getByText('Best perfect streak')).toHaveTextContent('5')
    expect(screen.getByText('Completed 26 Aug 2026')).toBeInTheDocument()
    expect(screen.getAllByText('Locked')).toHaveLength(2)
    expect(screen.getByText('Saved on this device.')).toBeInTheDocument()
  })

  it('focuses its close control and closes with Escape', () => {
    const close = vi.fn()
    render(<AchievementsModal
      onClose={close}
      record={{
        version: 1,
        achievements: {},
        perfectStreak: 0,
        bestPerfectStreak: 0,
      }}
    />)

    expect(screen.getByRole('button', { name: 'Close achievements' })).toHaveFocus()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(close).toHaveBeenCalledOnce()
  })
})
