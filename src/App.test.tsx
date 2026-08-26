import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { PLAYER_RECORD_STORAGE_KEY } from './game/achievements'
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
    window.localStorage.clear()
    vi.stubGlobal('Worker', FakeWorker)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('stages New settings until Begin and keeps Next on the current configuration', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Quick puzzle' }))
    fireEvent.click(screen.getByRole('button', { name: '10×10' }))
    fireEvent.click(screen.getByRole('button', { name: 'standard' }))
    fireEvent.click(screen.getByRole('button', { name: 'Timed' }))
    fireEvent.click(screen.getByRole('button', { name: '5 minutes' }))

    expect(activeWorker.postMessage).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Begin puzzle' }))
    await screen.findByRole('grid', { name: '10 by 10 puzzle grid' })
    expect(activeWorker.postMessage).toHaveBeenLastCalledWith(expect.objectContaining({
      difficulty: 'standard',
      size: 10,
    }))
    expect(screen.getByText('standard · 10×10 grid · Timed')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open system menu' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'New Puzzle' }))
    expect(screen.getByRole('dialog', { name: 'New Puzzle' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Relaxed' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '5×5' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'beginner' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: '15×15' }))
    fireEvent.click(screen.getByRole('button', { name: 'hard' }))
    fireEvent.click(screen.getByRole('button', { name: 'Perfect' }))

    expect(activeWorker.postMessage).toHaveBeenCalledTimes(1)
    expect(screen.getByText('standard · 10×10 grid · Timed')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog', { name: 'New Puzzle' })).not.toBeInTheDocument()
    expect(activeWorker.postMessage).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'New Puzzle' }))
    expect(screen.getByRole('button', { name: 'Relaxed' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '5×5' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'beginner' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: '15×15' }))
    fireEvent.click(screen.getByRole('button', { name: 'Perfect' }))
    expect(screen.queryByRole('group', { name: 'Difficulty' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Begin puzzle' }))

    await screen.findByRole('grid', { name: '15 by 15 puzzle grid' })
    expect(activeWorker.postMessage).toHaveBeenLastCalledWith(expect.objectContaining({
      difficulty: 'hard',
      size: 15,
    }))
    expect(screen.getByText('hard · 15×15 grid · Perfect')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Perfect streak 0, best 0' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hints unavailable in Perfect mode' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Next Puzzle' }))
    await waitFor(() => expect(activeWorker.postMessage).toHaveBeenCalledTimes(3))
    expect(activeWorker.postMessage).toHaveBeenLastCalledWith(expect.objectContaining({
      difficulty: 'hard',
      size: 15,
    }))

    fireEvent.click(screen.getByRole('button', { name: 'Replay Puzzle' }))
    expect(activeWorker.postMessage).toHaveBeenCalledTimes(3)
  })

  it('locks the selected mode while keeping sound and music as quick settings', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Quick puzzle' }))
    fireEvent.click(screen.getByRole('button', { name: 'Timed' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin puzzle' }))
    await screen.findByRole('grid', { name: '5 by 5 puzzle grid' })

    expect(screen.getByText('beginner · 5×5 grid · Timed')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Time left /)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /timer mode/i })).not.toBeInTheDocument()

    fireEvent.pointerDown(
      screen.getByRole('gridcell', { name: 'Row 1, column 1, unknown' }),
      { button: 0, isPrimary: true, pointerType: 'mouse' },
    )
    fireEvent.pointerUp(window)
    expect(screen.getByRole('gridcell', { name: 'Row 1, column 1, filled' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Sounds: On' }))
    fireEvent.click(screen.getByRole('button', { name: 'Music: On' }))

    expect(screen.getByRole('button', { name: 'Sounds: Off' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Music: Off' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('restores the full Timed attempt on Reset and Next', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Quick puzzle' }))
    fireEvent.click(screen.getByRole('button', { name: 'Timed' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin puzzle' }))
    await screen.findByRole('grid', { name: '5 by 5 puzzle grid' })

    fireEvent.click(screen.getByRole('button', { name: 'Use hint, 3 remaining' }))
    fireEvent.click(screen.getByRole('button', { name: 'Use hint on row 1' }))
    expect(screen.getByRole('button', { name: 'Use hint, 2 remaining' })).toBeInTheDocument()
    expect(screen.getByText('-15 sec')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Replay Puzzle' }))
    expect(screen.getByRole('button', { name: 'Use hint, 3 remaining' })).toBeInTheDocument()
    expect(screen.getByRole('gridcell', { name: 'Row 1, column 1, unknown' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Next Puzzle' }))
    await waitFor(() => expect(activeWorker.postMessage).toHaveBeenCalledTimes(2))
    expect(screen.getByRole('button', { name: 'Use hint, 3 remaining' })).toBeInTheDocument()
  })

  it('gives Relaxed unlimited hints and hides its timer', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Quick puzzle' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin puzzle' }))
    await screen.findByRole('grid', { name: '5 by 5 puzzle grid' })

    expect(screen.getByRole('button', { name: 'Use unlimited hint' })).toBeEnabled()
    expect(screen.queryByLabelText(/^Time left /)).not.toBeInTheDocument()
  })

  it('ends a mistaken Perfect attempt and resets its current streak', async () => {
    window.localStorage.setItem(PLAYER_RECORD_STORAGE_KEY, JSON.stringify({
      version: 1,
      achievements: {},
      perfectStreak: 3,
      bestPerfectStreak: 5,
    }))
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Quick puzzle' }))
    fireEvent.click(screen.getByRole('button', { name: 'Perfect' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin puzzle' }))
    await screen.findByRole('grid', { name: '5 by 5 puzzle grid' })

    fireEvent.pointerDown(
      screen.getByRole('gridcell', { name: 'Row 1, column 2, unknown' }),
      { button: 0, isPrimary: true, pointerType: 'mouse' },
    )
    fireEvent.pointerUp(window)

    expect(screen.getByRole('grid', { name: '5 by 5 puzzle grid' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Perfect run ended.' })).not.toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Perfect run ended.' }, { timeout: 1_500 })).toBeInTheDocument()
    expect(screen.getByLabelText('Perfect streak ended')).toHaveTextContent('3')
    expect(screen.queryByRole('grid', { name: '5 by 5 puzzle grid' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Replay Puzzle' })).not.toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(PLAYER_RECORD_STORAGE_KEY) ?? '{}')).toMatchObject({
      perfectStreak: 0,
      bestPerfectStreak: 5,
    })

    fireEvent.click(screen.getByRole('button', { name: 'New Puzzle' }))
    expect(screen.getByRole('dialog', { name: 'New Puzzle' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Relaxed' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '5×5' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'beginner' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    fireEvent.click(screen.getByRole('button', { name: 'Next Puzzle' }))
    await screen.findByRole('grid', { name: '5 by 5 puzzle grid' })
    expect(activeWorker.postMessage).toHaveBeenLastCalledWith(expect.objectContaining({
      difficulty: 'hard',
      size: 5,
    }))
    expect(screen.getByText('hard · 5×5 grid · Perfect')).toBeInTheDocument()
  })

  it('advances and displays a successful Perfect streak', async () => {
    window.localStorage.setItem(PLAYER_RECORD_STORAGE_KEY, JSON.stringify({
      version: 1,
      achievements: {},
      perfectStreak: 2,
      bestPerfectStreak: 4,
    }))
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Quick puzzle' }))
    fireEvent.click(screen.getByRole('button', { name: 'Perfect' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin puzzle' }))
    await screen.findByRole('grid', { name: '5 by 5 puzzle grid' })

    for (let index = 1; index <= 5; index += 1) {
      fireEvent.pointerDown(
        screen.getByRole('gridcell', { name: `Row ${index}, column ${index}, unknown` }),
        { button: 0, isPrimary: true, pointerType: 'mouse' },
      )
      fireEvent.pointerUp(window)
    }

    expect(await screen.findByText(/Perfect streak/)).toHaveTextContent('3 · Best 4')
    expect(JSON.parse(window.localStorage.getItem(PLAYER_RECORD_STORAGE_KEY) ?? '{}')).toMatchObject({
      perfectStreak: 3,
      bestPerfectStreak: 4,
      achievements: { 'perfect-signal': expect.any(String) },
    })
  })

  it('persists unlocked achievements and renders them from the title', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Quick puzzle' }))
    fireEvent.click(screen.getByRole('button', { name: 'Begin puzzle' }))
    await screen.findByRole('grid', { name: '5 by 5 puzzle grid' })

    for (let index = 1; index <= 5; index += 1) {
      fireEvent.pointerDown(
        screen.getByRole('gridcell', { name: `Row ${index}, column ${index}, unknown` }),
        { button: 0, isPrimary: true, pointerType: 'mouse' },
      )
      fireEvent.pointerUp(window)
    }

    expect(await screen.findByText('Achievement unlocked')).toBeInTheDocument()
    expect(screen.getByText('First Decode')).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(PLAYER_RECORD_STORAGE_KEY) ?? '{}')).toMatchObject({
      version: 1,
      achievements: { 'first-decode': expect.any(String) },
    })
  })
})
