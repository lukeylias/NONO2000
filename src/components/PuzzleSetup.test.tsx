import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PuzzleSetup } from './PuzzleSetup'

describe('PuzzleSetup', () => {
  it.each([5, 10, 15] as const)('offers difficulty selection for a %i×%i puzzle', (size) => {
    render(
      <PuzzleSetup
        difficulty="standard"
        onBack={vi.fn()}
        onCycleTimer={vi.fn()}
        onSelectDifficulty={vi.fn()}
        onSelectSize={vi.fn()}
        onStart={vi.fn()}
        size={size}
        timerMinutes={0}
      />,
    )

    expect(screen.getByRole('group', { name: 'Difficulty' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'standard' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('configures a puzzle before starting it', () => {
    const back = vi.fn()
    const cycleTimer = vi.fn()
    const selectDifficulty = vi.fn()
    const selectSize = vi.fn()
    const start = vi.fn()

    render(
      <PuzzleSetup
        difficulty="standard"
        onBack={back}
        onCycleTimer={cycleTimer}
        onSelectDifficulty={selectDifficulty}
        onSelectSize={selectSize}
        onStart={start}
        size={10}
        timerMinutes={1}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Set the grid' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '10×10' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'standard' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Timer: 1 minute' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '15×15' }))
    fireEvent.click(screen.getByRole('button', { name: 'hard' }))
    fireEvent.click(screen.getByRole('button', { name: 'Timer: 1 minute' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin puzzle' }))
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))

    expect(selectSize).toHaveBeenCalledWith(15)
    expect(selectDifficulty).toHaveBeenCalledWith('hard')
    expect(cycleTimer).toHaveBeenCalledOnce()
    expect(start).toHaveBeenCalledOnce()
    expect(back).toHaveBeenCalledOnce()
  })
})
