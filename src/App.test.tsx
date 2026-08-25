import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { getGridClues } from './game/clues'
import type { BinaryGrid, BoardSize, Puzzle, PuzzleDifficulty } from './game/types'

vi.mock('./game/music', () => ({
  gameMusic: { setEnabled: vi.fn() },
}))

vi.mock('./game/sound', () => ({
  nono2000Sound: { play: vi.fn() },
}))

interface GenerateMessage {
  type: 'generate'
  requestId: number
  size: BoardSize
  difficulty: PuzzleDifficulty
}

let seed = 100
let activeWorker: FakeWorker

function makePuzzle(size: BoardSize): Puzzle {
  const solution = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => (row === column ? 1 : 0)),
  ) as BinaryGrid
  const clues = getGridClues(solution)

  seed += 1
  return {
    columnClues: clues.columnClues,
    rowClues: clues.rowClues,
    seed,
    size,
    solution,
    symmetry: 'none',
  }
}

class FakeWorker {
  onmessage: ((event: MessageEvent) => void) | null = null
  postMessage = vi.fn((message: GenerateMessage) => {
    queueMicrotask(() => {
      this.onmessage?.({
        data: {
          puzzle: makePuzzle(message.size),
          requestId: message.requestId,
          type: 'generated',
        },
      } as MessageEvent)
    })
  })
  terminate = vi.fn()

  constructor() {
    activeWorker = this
  }
}

describe('App puzzle controls', () => {
  beforeEach(() => {
    seed = 100
    vi.stubGlobal('Worker', FakeWorker)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('stages New settings until Begin and keeps Next on the current configuration', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Start puzzle' }))
    fireEvent.click(screen.getByRole('button', { name: '10×10' }))
    fireEvent.click(screen.getByRole('button', { name: 'standard' }))

    expect(activeWorker.postMessage).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Begin puzzle' }))
    await screen.findByRole('grid', { name: '10 by 10 puzzle grid' })
    expect(activeWorker.postMessage).toHaveBeenLastCalledWith(expect.objectContaining({
      difficulty: 'standard',
      size: 10,
    }))

    fireEvent.click(screen.getByRole('button', { name: 'New' }))
    expect(screen.getByRole('dialog', { name: 'Set the grid' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '15×15' }))
    fireEvent.click(screen.getByRole('button', { name: 'hard' }))

    expect(activeWorker.postMessage).toHaveBeenCalledTimes(1)
    expect(screen.getByText('standard · 10×10 grid')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog', { name: 'Set the grid' })).not.toBeInTheDocument()
    expect(activeWorker.postMessage).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'New' }))
    fireEvent.click(screen.getByRole('button', { name: '15×15' }))
    fireEvent.click(screen.getByRole('button', { name: 'hard' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin puzzle' }))

    await screen.findByRole('grid', { name: '15 by 15 puzzle grid' })
    expect(activeWorker.postMessage).toHaveBeenLastCalledWith(expect.objectContaining({
      difficulty: 'hard',
      size: 15,
    }))

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await waitFor(() => expect(activeWorker.postMessage).toHaveBeenCalledTimes(3))
    expect(activeWorker.postMessage).toHaveBeenLastCalledWith(expect.objectContaining({
      difficulty: 'hard',
      size: 15,
    }))

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(activeWorker.postMessage).toHaveBeenCalledTimes(3)
  })

  it('keeps timer, sound and music as quick settings', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Start puzzle' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin puzzle' }))
    await screen.findByRole('grid', { name: '5 by 5 puzzle grid' })

    const timer = screen.getByRole('button', { name: 'Timer mode, 1 minute' })

    fireEvent.pointerDown(
      screen.getByRole('gridcell', { name: 'Row 1, column 1, unknown' }),
      { button: 0, isPrimary: true, pointerType: 'mouse' },
    )
    fireEvent.pointerUp(window)
    expect(screen.getByRole('gridcell', { name: 'Row 1, column 1, filled' })).toBeInTheDocument()

    fireEvent.click(timer)
    expect(screen.getByRole('button', { name: 'Timer mode, 2 minutes' })).toBeInTheDocument()
    expect(screen.getByRole('gridcell', { name: 'Row 1, column 1, unknown' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Sounds: On' }))
    fireEvent.click(screen.getByRole('button', { name: 'Music: On' }))

    expect(screen.getByRole('button', { name: 'Sounds: Off' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Music: Off' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('keeps spent hints on Reset and restores them for Next', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Start puzzle' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin puzzle' }))
    await screen.findByRole('grid', { name: '5 by 5 puzzle grid' })

    fireEvent.click(screen.getByRole('button', { name: 'Use hint, 3 remaining' }))
    fireEvent.click(screen.getByRole('button', { name: 'Use hint on row 1' }))
    expect(screen.getByRole('button', { name: 'Use hint, 2 remaining' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByRole('button', { name: 'Use hint, 2 remaining' })).toBeInTheDocument()
    expect(screen.getByRole('gridcell', { name: 'Row 1, column 1, unknown' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await waitFor(() => expect(activeWorker.postMessage).toHaveBeenCalledTimes(2))
    expect(screen.getByRole('button', { name: 'Use hint, 3 remaining' })).toBeInTheDocument()
  })
})
