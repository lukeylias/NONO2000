import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LostPuzzle } from './LostPuzzle'

describe('LostPuzzle', () => {
  it('offers retry and a new puzzle after the countdown finishes', () => {
    const retry = vi.fn()
    const newPuzzle = vi.fn()
    const nextPuzzle = vi.fn()
    render(
      <LostPuzzle
        onNewPuzzle={newPuzzle}
        onNextPuzzle={nextPuzzle}
        onRetry={retry}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Time over.' })).toBeInTheDocument()
    expect(screen.getByLabelText('Countdown finished')).toHaveTextContent('0:00.0')

    fireEvent.click(screen.getByRole('button', { name: 'New Puzzle' }))
    fireEvent.click(screen.getByRole('button', { name: 'Replay Puzzle' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next Puzzle' }))

    expect(newPuzzle).toHaveBeenCalledOnce()
    expect(retry).toHaveBeenCalledOnce()
    expect(nextPuzzle).toHaveBeenCalledOnce()
  })

  it('shows the ended and best streak after a Perfect mistake', () => {
    const newPuzzle = vi.fn()
    const nextPuzzle = vi.fn()
    render(
      <LostPuzzle
        bestPerfectStreak={7}
        endedPerfectStreak={4}
        onNewPuzzle={newPuzzle}
        onNextPuzzle={nextPuzzle}
        onRetry={vi.fn()}
        reason="perfect"
      />,
    )

    expect(screen.getByRole('heading', { name: 'Perfect run ended.' })).toBeInTheDocument()
    expect(screen.getByLabelText('Perfect streak ended')).toHaveTextContent('4')
    expect(screen.getByLabelText('Perfect streak ended')).toHaveTextContent('Best 7')
    expect(screen.queryByText('Recovered')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Replay Puzzle' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Replay Puzzle' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Next Puzzle' }))
    fireEvent.click(screen.getByRole('button', { name: 'New Puzzle' }))
    expect(nextPuzzle).toHaveBeenCalledOnce()
    expect(newPuzzle).toHaveBeenCalledOnce()
  })
})
