import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CommandMenu } from './CommandMenu'

describe('CommandMenu', () => {
  it.each([5, 10, 15] as const)('offers difficulty selection for a %i×%i puzzle', (size) => {
    render(
      <CommandMenu
        difficulty="hard"
        inSession
        musicOn
        onClose={vi.fn()}
        onDisconnect={vi.fn()}
        onNewPuzzle={vi.fn()}
        onReset={vi.fn()}
        onRules={vi.fn()}
        onSelectDifficulty={vi.fn()}
        onSelectSize={vi.fn()}
        onCycleTimer={vi.fn()}
        onToggleMusic={vi.fn()}
        onToggleSound={vi.fn()}
        size={size}
        soundOn
        timerMinutes={0}
      />,
    )

    expect(screen.getByRole('group', { name: 'Difficulty' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'hard' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('keeps session controls behind one working system panel', () => {
    const close = vi.fn()
    const selectDifficulty = vi.fn()
    const selectSize = vi.fn()
    const cycleTimer = vi.fn()
    const toggleMusic = vi.fn()
    const toggleSound = vi.fn()
    const reset = vi.fn()
    const newPuzzle = vi.fn()
    const rules = vi.fn()
    const disconnect = vi.fn()
    render(
      <CommandMenu
        difficulty="standard"
        inSession
        musicOn={false}
        onClose={close}
        onDisconnect={disconnect}
        onNewPuzzle={newPuzzle}
        onReset={reset}
        onRules={rules}
        onSelectDifficulty={selectDifficulty}
        onSelectSize={selectSize}
        onCycleTimer={cycleTimer}
        onToggleMusic={toggleMusic}
        onToggleSound={toggleSound}
        size={10}
        soundOn
        timerMinutes={2}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '5×5' }))
    fireEvent.click(screen.getByRole('button', { name: 'hard' }))
    fireEvent.click(screen.getByRole('button', { name: 'Timer 2 minutes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sounds On' }))
    fireEvent.click(screen.getByRole('button', { name: 'Music Off' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reset this grid' }))
    fireEvent.click(screen.getByRole('button', { name: 'New puzzle' }))
    expect(close).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'How to play' }))
    fireEvent.click(screen.getByRole('button', { name: 'Back to title' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close system menu' }))

    expect(selectSize).toHaveBeenCalledWith(5)
    expect(selectDifficulty).toHaveBeenCalledWith('hard')
    expect(cycleTimer).toHaveBeenCalledOnce()
    expect(toggleSound).toHaveBeenCalledOnce()
    expect(toggleMusic).toHaveBeenCalledOnce()
    expect(reset).toHaveBeenCalledOnce()
    expect(newPuzzle).toHaveBeenCalledOnce()
    expect(rules).toHaveBeenCalledOnce()
    expect(disconnect).toHaveBeenCalledOnce()
    expect(close).toHaveBeenCalledOnce()
  })
})
