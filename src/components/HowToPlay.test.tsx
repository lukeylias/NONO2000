import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HowToPlay } from './HowToPlay'

describe('HowToPlay', () => {
  afterEach(() => vi.useRealTimers())

  it('starts with a five-block row and the fourth block crossed', () => {
    render(<HowToPlay onClose={vi.fn()} />)

    expect(screen.queryByText('Operator guide')).not.toBeInTheDocument()
    expect(screen.getByRole('grid', { name: 'Practice row' })).toBeInTheDocument()
    expect(screen.getAllByRole('gridcell')).toHaveLength(5)
    expect(screen.getByRole('gridcell', { name: 'Block 4, crossed, preset' })).toBeInTheDocument()
    expect(screen.getByRole('gridcell', { name: 'Block 5, unknown' })).toBeInTheDocument()
  })

  it('auto-crosses the final block and celebrates when the run is complete', () => {
    render(<HowToPlay onClose={vi.fn()} />)

    for (const index of [1, 2, 3]) {
      fireEvent.click(screen.getByRole('gridcell', { name: `Block ${index}, unknown` }))
    }

    expect(screen.getByRole('gridcell', { name: 'Block 5, crossed' })).toBeInTheDocument()
    expect(screen.getByText(/Solved/)).toBeInTheDocument()
    expect(document.querySelectorAll('.guide-success-confetti span')).toHaveLength(12)
  })

  it('accepts a manually crossed final block before solving', () => {
    render(<HowToPlay onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('switch', { name: 'Primary mark: Fill' }))
    fireEvent.click(screen.getByRole('gridcell', { name: 'Block 5, unknown' }))
    fireEvent.click(screen.getByRole('switch', { name: 'Primary mark: Cross' }))
    for (const index of [1, 2, 3]) {
      fireEvent.click(screen.getByRole('gridcell', { name: `Block ${index}, unknown` }))
    }

    expect(screen.getByText(/Solved/)).toBeInTheDocument()
  })

  it('shows a mistake and restores the starting row', () => {
    vi.useFakeTimers()
    render(<HowToPlay onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('switch', { name: 'Primary mark: Fill' }))
    fireEvent.click(screen.getByRole('gridcell', { name: 'Block 1, unknown' }))

    expect(screen.getByRole('gridcell', { name: 'Block 1, error' })).toHaveClass('is-error')
    expect(screen.getByText(/Resetting/)).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(700))

    expect(screen.getByRole('gridcell', { name: 'Block 1, unknown' })).toBeInTheDocument()
    expect(screen.getByRole('gridcell', { name: 'Block 4, crossed, preset' })).toBeInTheDocument()
  })
})
