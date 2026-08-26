import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { getGridClues } from '../game/clues'
import type { BinaryGrid, Puzzle } from '../game/types'
import { SolvedPuzzle } from './SolvedPuzzle'

const solution = Array.from({ length: 10 }, (_, row) =>
  Array.from({ length: 10 }, (_, column) => (row === column ? 1 : 0)),
) as BinaryGrid
const clues = getGridClues(solution)
const puzzle: Puzzle = {
  size: 10,
  seed: 17,
  solution,
  rowClues: clues.rowClues,
  columnClues: clues.columnClues,
  symmetry: 'none',
}

describe('SolvedPuzzle', () => {
  it('shows a clean result and offers the shared puzzle actions', () => {
    const newGame = vi.fn()
    const nextPuzzle = vi.fn()
    const replay = vi.fn()
    render(
      <SolvedPuzzle
        elapsed={42_300}
        mode="timed"
        onNewPuzzle={newGame}
        onNextPuzzle={nextPuzzle}
        onReplay={replay}
        puzzle={puzzle}
      />,
    )

    expect(screen.getByText('Pattern revealed')).toBeInTheDocument()
    expect(screen.getByText('Clean solve')).toBeInTheDocument()
    expect(screen.getByText('Timed · 10×10 grid · No hints · No mistakes')).toBeInTheDocument()
    expect(screen.getByText('Time 0:42.3')).toBeInTheDocument()
    expect(screen.queryByText(/credits/i)).not.toBeInTheDocument()
    expect(screen.queryByText('Systems')).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Next grid size' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'New Puzzle' }))
    fireEvent.click(screen.getByRole('button', { name: 'Replay Puzzle' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next Puzzle' }))

    expect(newGame).toHaveBeenCalledOnce()
    expect(replay).toHaveBeenCalledOnce()
    expect(nextPuzzle).toHaveBeenCalledOnce()
  })

  it('shows the mistake count and marks each mistaken cell in the revealed grid', () => {
    const { container } = render(
      <SolvedPuzzle
        elapsed={42_300}
        mode="relaxed"
        mistakeCells={new Set(['0:0', '0:1'])}
        onNewPuzzle={vi.fn()}
        onNextPuzzle={vi.fn()}
        onReplay={vi.fn()}
        puzzle={puzzle}
      />,
    )

    expect(screen.getByText('Relaxed · 10×10 grid · No hints · 2 mistakes')).toBeInTheDocument()
    expect(screen.getByText('Recovered solve')).toBeInTheDocument()
    expect(container.querySelectorAll('.result-mistake-marker')).toHaveLength(2)
    expect(container.querySelectorAll('.solved-picture > .was-mistake')).toHaveLength(2)
  })

  it('omits elapsed time for a relaxed puzzle', () => {
    render(
      <SolvedPuzzle
        elapsed={42_300}
        mode="relaxed"
        onNewPuzzle={vi.fn()}
        onNextPuzzle={vi.fn()}
        onReplay={vi.fn()}
        puzzle={puzzle}
      />,
    )

    expect(screen.queryByText('Time 0:42.3')).not.toBeInTheDocument()
  })

  it('labels a result that used hints as assisted', () => {
    render(
      <SolvedPuzzle
        elapsed={42_300}
        hintsUsed={2}
        mode="relaxed"
        onNewPuzzle={vi.fn()}
        onNextPuzzle={vi.fn()}
        onReplay={vi.fn()}
        puzzle={puzzle}
      />,
    )

    expect(screen.getByText('Assisted solve')).toBeInTheDocument()
    expect(screen.getByText('Relaxed · 10×10 grid · 2 hints · No mistakes')).toBeInTheDocument()
    expect(screen.queryByText('Clean solve')).not.toBeInTheDocument()
  })

  it('shows the Perfect streak and achievement announcements', () => {
    render(
      <SolvedPuzzle
        elapsed={42_300}
        mode="perfect"
        onNewPuzzle={vi.fn()}
        onNextPuzzle={vi.fn()}
        onReplay={vi.fn()}
        bestPerfectStreak={5}
        perfectStreak={3}
        puzzle={puzzle}
        unlockedAchievements={['first-decode']}
      />,
    )

    expect(screen.getByText(/Perfect streak/)).toHaveTextContent('3 · Best 5')
    expect(screen.getByText('Clean solve')).toBeInTheDocument()
    expect(screen.getByText('Achievement unlocked')).toBeInTheDocument()
    expect(screen.getByText('First Decode')).toBeInTheDocument()
    expect(screen.queryByText(/^Time /)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Replay Puzzle' })).not.toBeInTheDocument()
  })
})
