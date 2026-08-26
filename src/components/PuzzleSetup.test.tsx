import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PuzzleSetup } from './PuzzleSetup'

describe('PuzzleSetup', () => {
  it('puts mode before board configuration', () => {
    render(
      <PuzzleSetup
        difficulty="beginner"
        mode="relaxed"
        onBack={vi.fn()}
        onSelectDifficulty={vi.fn()}
        onSelectMode={vi.fn()}
        onSelectSize={vi.fn()}
        onSelectTimedPreset={vi.fn()}
        onStart={vi.fn()}
        size={5}
        timedPreset={1}
      />,
    )

    expect(screen.getAllByRole('group').map((group) => group.querySelector('legend')?.textContent)).toEqual([
      'Mode', 'Grid size', 'Difficulty',
    ])
  })

  it('keeps Timed limits directly beneath mode', () => {
    render(
      <PuzzleSetup
        difficulty="standard"
        mode="timed"
        onBack={vi.fn()}
        onSelectDifficulty={vi.fn()}
        onSelectMode={vi.fn()}
        onSelectSize={vi.fn()}
        onSelectTimedPreset={vi.fn()}
        onStart={vi.fn()}
        size={10}
        timedPreset={1}
      />,
    )

    expect(screen.getAllByRole('group').map((group) => group.querySelector('legend')?.textContent)).toEqual([
      'Mode', 'Time limit', 'Grid size', 'Difficulty',
    ])
  })

  it.each([5, 10, 15] as const)('offers difficulty selection for a %i×%i puzzle', (size) => {
    render(
      <PuzzleSetup
        difficulty="standard"
        mode="relaxed"
        onBack={vi.fn()}
        onSelectMode={vi.fn()}
        onSelectTimedPreset={vi.fn()}
        onSelectDifficulty={vi.fn()}
        onSelectSize={vi.fn()}
        onStart={vi.fn()}
        size={size}
        timedPreset={1}
      />,
    )

    expect(screen.getByRole('group', { name: 'Difficulty' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'standard' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('configures a puzzle before starting it', () => {
    const back = vi.fn()
    const selectMode = vi.fn()
    const selectTimedPreset = vi.fn()
    const selectDifficulty = vi.fn()
    const selectSize = vi.fn()
    const start = vi.fn()

    render(
      <PuzzleSetup
        difficulty="standard"
        mode="timed"
        onBack={back}
        onSelectMode={selectMode}
        onSelectTimedPreset={selectTimedPreset}
        onSelectDifficulty={selectDifficulty}
        onSelectSize={selectSize}
        onStart={start}
        size={10}
        timedPreset={1}
      />,
    )

    expect(screen.getByRole('heading', { name: 'New Puzzle' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '10×10' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'standard' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Timed' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '1 minute' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByText(/Auto/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '15×15' }))
    fireEvent.click(screen.getByRole('button', { name: 'hard' }))
    fireEvent.click(screen.getByRole('button', { name: 'Perfect' }))
    fireEvent.click(screen.getByRole('button', { name: '5 minutes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin puzzle' }))
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))

    expect(selectSize).toHaveBeenCalledWith(15)
    expect(selectDifficulty).toHaveBeenCalledWith('hard')
    expect(selectMode).toHaveBeenCalledWith('perfect')
    expect(selectTimedPreset).toHaveBeenCalledWith(5)
    expect(start).toHaveBeenCalledOnce()
    expect(back).toHaveBeenCalledOnce()
  })

  it('reuses the setup as a dismissible modal', () => {
    const back = vi.fn()

    render(
      <PuzzleSetup
        difficulty="beginner"
        mode="relaxed"
        onBack={back}
        onSelectMode={vi.fn()}
        onSelectTimedPreset={vi.fn()}
        onSelectDifficulty={vi.fn()}
        onSelectSize={vi.fn()}
        onStart={vi.fn()}
        presentation="modal"
        size={5}
        timedPreset={1}
      />,
    )

    expect(screen.getByRole('dialog', { name: 'New Puzzle' })).toBeInTheDocument()
    expect(screen.queryByText('New puzzle')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(back).toHaveBeenCalledOnce()
  })

  it('only exposes time presets while Timed is staged', () => {
    const { rerender } = render(
      <PuzzleSetup
        difficulty="hard"
        bestPerfectStreak={7}
        currentPerfectStreak={3}
        mode="relaxed"
        onBack={vi.fn()}
        onSelectDifficulty={vi.fn()}
        onSelectMode={vi.fn()}
        onSelectSize={vi.fn()}
        onSelectTimedPreset={vi.fn()}
        onStart={vi.fn()}
        size={15}
        timedPreset={1}
      />,
    )

    expect(screen.queryByRole('group', { name: 'Time limit' })).not.toBeInTheDocument()
    expect(screen.getByText('No clock. Use as many hints as you need.')).toBeInTheDocument()
    rerender(
      <PuzzleSetup
        difficulty="hard"
        bestPerfectStreak={7}
        currentPerfectStreak={3}
        mode="timed"
        onBack={vi.fn()}
        onSelectDifficulty={vi.fn()}
        onSelectMode={vi.fn()}
        onSelectSize={vi.fn()}
        onSelectTimedPreset={vi.fn()}
        onStart={vi.fn()}
        size={15}
        timedPreset={1}
      />,
    )
    expect(screen.getByRole('button', { name: '1 minute' })).toBeInTheDocument()
    expect(screen.getByText('Beat the clock with 3 hints. Hints and mistakes cost 15 seconds.')).toBeInTheDocument()
    expect(screen.queryByText(/achievement/i)).not.toBeInTheDocument()
  })

  it('shows the current and best run only when Perfect is selected', () => {
    const { container } = render(
      <PuzzleSetup
        bestPerfectStreak={7}
        currentPerfectStreak={3}
        difficulty="hard"
        mode="perfect"
        onBack={vi.fn()}
        onSelectDifficulty={vi.fn()}
        onSelectMode={vi.fn()}
        onSelectSize={vi.fn()}
        onSelectTimedPreset={vi.fn()}
        onStart={vi.fn()}
        size={15}
        timedPreset={1}
      />,
    )

    expect(container.querySelector('.perfect-history')).toHaveTextContent('Current streak 3')
    expect(container.querySelector('.perfect-history')).toHaveTextContent('Best 7')
    expect(screen.getByRole('button', { name: 'Perfect' })).toHaveClass('is-perfect-mode')
    expect(screen.queryByRole('button', { name: 'Momentum' })).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Difficulty' })).not.toBeInTheDocument()
    expect(screen.getByText(/Hard difficulty/)).toBeInTheDocument()
  })
})
