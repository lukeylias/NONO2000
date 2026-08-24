import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LostPuzzle } from './LostPuzzle'

describe('LostPuzzle', () => {
  it('offers retry and a new puzzle after the countdown finishes', () => {
    const retry = vi.fn()
    const newPuzzle = vi.fn()
    render(<LostPuzzle onNewPuzzle={newPuzzle} onRetry={retry} />)

    expect(screen.getByRole('heading', { name: 'Time over.' })).toBeInTheDocument()
    expect(screen.getByLabelText('Countdown finished')).toHaveTextContent('0:00.0')

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    fireEvent.click(screen.getByRole('button', { name: 'New puzzle' }))

    expect(retry).toHaveBeenCalledOnce()
    expect(newPuzzle).toHaveBeenCalledOnce()
  })
})
