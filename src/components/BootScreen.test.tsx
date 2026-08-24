import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BootScreen } from './BootScreen'

describe('BootScreen', () => {
  it('keeps the landing screen focused on starting, help, and audio', () => {
    const start = vi.fn()
    const rules = vi.fn()
    const configure = vi.fn()
    const toggleMusic = vi.fn()
    const toggleSound = vi.fn()
    render(
      <BootScreen
        musicOn
        onConfigure={configure}
        onRules={rules}
        onStart={start}
        onToggleMusic={toggleMusic}
        onToggleSound={toggleSound}
        soundOn
      />,
    )

    expect(screen.getByRole('heading', { name: 'NONO2000' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '10×10' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sounds: On' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Music: On' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Sounds: On' }))
    fireEvent.click(screen.getByRole('button', { name: 'Music: On' }))
    fireEvent.click(screen.getByRole('button', { name: 'Start puzzle' }))
    fireEvent.click(screen.getByRole('button', { name: 'How to play' }))
    fireEvent.click(screen.getByRole('button', { name: 'System menu' }))

    expect(toggleSound).toHaveBeenCalledOnce()
    expect(toggleMusic).toHaveBeenCalledOnce()
    expect(start).toHaveBeenCalledOnce()
    expect(rules).toHaveBeenCalledOnce()
    expect(configure).toHaveBeenCalledOnce()
  })
})
