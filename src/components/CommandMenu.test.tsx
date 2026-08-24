import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CommandMenu } from './CommandMenu'

describe('CommandMenu', () => {
  it('keeps system settings separate from puzzle configuration', () => {
    const close = vi.fn()
    const toggleMusic = vi.fn()
    const toggleSound = vi.fn()
    const rules = vi.fn()
    const disconnect = vi.fn()

    render(
      <CommandMenu
        inSession
        musicOn={false}
        onClose={close}
        onDisconnect={disconnect}
        onRules={rules}
        onToggleMusic={toggleMusic}
        onToggleSound={toggleSound}
        soundOn
      />,
    )

    expect(screen.queryByRole('group', { name: 'Grid size' })).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Difficulty' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /timer/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /reset/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /new puzzle/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Sounds On' }))
    fireEvent.click(screen.getByRole('button', { name: 'Music Off' }))
    fireEvent.click(screen.getByRole('button', { name: 'How to play' }))
    fireEvent.click(screen.getByRole('button', { name: 'Back to title' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close system menu' }))

    expect(toggleSound).toHaveBeenCalledOnce()
    expect(toggleMusic).toHaveBeenCalledOnce()
    expect(rules).toHaveBeenCalledOnce()
    expect(disconnect).toHaveBeenCalledOnce()
    expect(close).toHaveBeenCalledOnce()
  })

  it('hides the exit action outside a session', () => {
    render(
      <CommandMenu
        inSession={false}
        musicOn
        onClose={vi.fn()}
        onDisconnect={vi.fn()}
        onRules={vi.fn()}
        onToggleMusic={vi.fn()}
        onToggleSound={vi.fn()}
        soundOn
      />,
    )

    expect(screen.queryByRole('button', { name: 'Back to title' })).not.toBeInTheDocument()
  })
})
