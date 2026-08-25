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
        onNewGame={newGame}
        onNextPuzzle={nextPuzzle}
        onReplay={replay}
        puzzle={puzzle}
      />,
    )

    expect(screen.getByText('Pattern revealed')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('Clean solve')).toBeInTheDocument()
    expect(screen.queryByText(/credits/i)).not.toBeInTheDocument()
    expect(screen.queryByText('Systems')).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Next grid size' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'New' }))
    fireEvent.click(screen.getByRole('button', { name: 'Replay' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    expect(newGame).toHaveBeenCalledOnce()
    expect(replay).toHaveBeenCalledOnce()
    expect(nextPuzzle).toHaveBeenCalledOnce()
  })

  it('shows the mistake count and marks each mistaken cell in the revealed grid', () => {
    const { container } = render(
      <SolvedPuzzle
        elapsed={42_300}
        mistakeCells={new Set(['0:0', '0:1'])}
        onNewGame={vi.fn()}
        onNextPuzzle={vi.fn()}
        onReplay={vi.fn()}
        puzzle={puzzle}
      />,
    )

    expect(screen.getByText('2 mistakes')).toBeInTheDocument()
    expect(screen.getByText('Puzzle solved')).toBeInTheDocument()
    expect(container.querySelectorAll('.result-mistake-marker')).toHaveLength(2)
    expect(container.querySelectorAll('.solved-picture > .was-mistake')).toHaveLength(2)
  })

  it('omits elapsed time for a relaxed puzzle', () => {
    render(
      <SolvedPuzzle
        elapsed={42_300}
        onNewGame={vi.fn()}
        onNextPuzzle={vi.fn()}
        onReplay={vi.fn()}
        puzzle={puzzle}
        showTime={false}
      />,
    )

    expect(screen.queryByText('0:42.3')).not.toBeInTheDocument()
  })

  it('labels a result that used hints as assisted', () => {
    render(
      <SolvedPuzzle
        elapsed={42_300}
        hintsUsed={2}
        onNewGame={vi.fn()}
        onNextPuzzle={vi.fn()}
        onReplay={vi.fn()}
        puzzle={puzzle}
      />,
    )

    expect(screen.getByText('Assisted solve')).toBeInTheDocument()
    expect(screen.getByText('2 hints used')).toBeInTheDocument()
    expect(screen.queryByText('Clean solve')).not.toBeInTheDocument()
    expect(screen.queryByText('Mistake')).not.toBeInTheDocument()
  })

})
