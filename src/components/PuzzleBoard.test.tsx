import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { getGridClues } from '../game/clues'
import {
  createMarkGrid,
  type BinaryGrid,
  type CellMark,
  type MarkGrid,
  type PaintMode,
  type Puzzle,
} from '../game/types'
import { applyPlayerMark, solveLine } from '../game/play'
import { PuzzleBoard } from './PuzzleBoard'

const solution = Array.from({ length: 10 }, (_, row) =>
  Array.from({ length: 10 }, (_, column) => (row === column ? 1 : 0)),
) as BinaryGrid
const clues = getGridClues(solution)
const puzzle: Puzzle = {
  size: 10,
  seed: 1,
  solution,
  rowClues: clues.rowClues,
  columnClues: clues.columnClues,
  symmetry: 'none',
}

function BoardHarness() {
  const [marks, setMarks] = useState(createMarkGrid(10))
  const paint = (row: number, column: number, mark: CellMark) => {
    setMarks((current) => applyPlayerMark(current, puzzle.solution, row, column, mark))
  }
  return <PuzzleBoard marks={marks} mode="filled" onPaint={paint} puzzle={puzzle} />
}

function TouchModeHarness() {
  const [marks, setMarks] = useState(createMarkGrid(10))
  const [mode, setMode] = useState<PaintMode>('filled')
  const [hintsRemaining, setHintsRemaining] = useState(3)
  const paint = (row: number, column: number, mark: CellMark) => {
    setMarks((current) => applyPlayerMark(current, puzzle.solution, row, column, mark))
  }
  const useHint = (axis: 'row' | 'column', index: number) => {
    setMarks((current) => solveLine(current, puzzle.solution, axis, index))
    setHintsRemaining((current) => current - 1)
  }
  return (
    <PuzzleBoard
      hintsRemaining={hintsRemaining}
      marks={marks}
      mode={mode}
      onHint={useHint}
      onModeChange={setMode}
      onPaint={paint}
      puzzle={puzzle}
    />
  )
}

const adjacentSolution = [
  [0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
] as BinaryGrid
const adjacentClues = getGridClues(adjacentSolution)
const adjacentPuzzle: Puzzle = {
  size: 5,
  seed: 2,
  solution: adjacentSolution,
  rowClues: adjacentClues.rowClues,
  columnClues: adjacentClues.columnClues,
  symmetry: 'none',
}
const adjacentMarks: MarkGrid = [
  ['crossed', 'crossed', 'crossed', 'crossed', 'unknown'],
  ['unknown', 'unknown', 'unknown', 'unknown', 'filled'],
  ['unknown', 'unknown', 'unknown', 'unknown', 'filled'],
  ['unknown', 'unknown', 'unknown', 'unknown', 'filled'],
  ['unknown', 'unknown', 'unknown', 'unknown', 'unknown'],
]

function AdjacentAutoCompletionHarness() {
  const [marks, setMarks] = useState(adjacentMarks)
  const paint = (row: number, column: number, mark: CellMark) => {
    setMarks((current) => applyPlayerMark(current, adjacentPuzzle.solution, row, column, mark))
  }
  return <PuzzleBoard marks={marks} mode="filled" onPaint={paint} puzzle={adjacentPuzzle} />
}

describe('PuzzleBoard', () => {
  it('lets touch users select Cross as the primary mark', () => {
    render(<TouchModeHarness />)

    const markMode = screen.getByRole('switch', { name: 'Primary mark: Fill' })
    expect(markMode).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(markMode)
    expect(screen.getByRole('switch', { name: 'Primary mark: Cross' })).toHaveAttribute(
      'aria-checked',
      'false',
    )

    fireEvent.pointerDown(
      screen.getByRole('gridcell', { name: 'Row 1, column 2, unknown' }),
      { isPrimary: true, pointerId: 1, pointerType: 'touch' },
    )
    fireEvent.pointerUp(window, { pointerId: 1, pointerType: 'touch' })

    expect(screen.getByRole('gridcell', { name: 'Row 1, column 2, crossed' })).toBeInTheDocument()
  })

  it('uses the selected primary mark for mouse input', () => {
    const paint = vi.fn()
    render(
      <PuzzleBoard
        marks={createMarkGrid(10)}
        mode="crossed"
        onModeChange={vi.fn()}
        onPaint={paint}
        puzzle={puzzle}
      />,
    )

    fireEvent.pointerDown(
      screen.getByRole('gridcell', { name: 'Row 1, column 2, unknown' }),
      { button: 0, isPrimary: true, pointerType: 'mouse' },
    )
    fireEvent.pointerUp(window)

    expect(paint).toHaveBeenCalledWith(0, 1, 'crossed')
  })

  it('completes a chosen row and spends one hint', () => {
    render(<TouchModeHarness />)

    fireEvent.click(screen.getByRole('button', { name: 'Use hint, 3 remaining' }))
    expect(screen.getByText('Choose a row or column')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Use hint on row 1' }))

    const hintedCell = screen.getByRole('gridcell', { name: 'Row 1, column 1, filled' })
    expect(hintedCell).toBeInTheDocument()
    expect(hintedCell.querySelector('.hint-line-reveal')).toBeInTheDocument()
    expect(hintedCell.querySelector('.line-clear-flash.is-row')).not.toBeInTheDocument()
    expect(screen.getByRole('gridcell', { name: 'Row 1, column 2, crossed' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Use hint, 2 remaining' })).toBeInTheDocument()
    expect(screen.queryByText('Choose a row or column')).not.toBeInTheDocument()
  })

  it('supports column hints and cancels targeting with Escape', () => {
    render(<TouchModeHarness />)

    fireEvent.click(screen.getByRole('button', { name: 'Use hint, 3 remaining' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByText('Choose a row or column')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Use hint, 3 remaining' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Use hint, 3 remaining' }))
    fireEvent.click(screen.getByRole('button', { name: 'Use hint on column 2' }))
    expect(screen.getByRole('gridcell', { name: 'Row 1, column 2, crossed' })).toBeInTheDocument()
    expect(screen.getByRole('gridcell', { name: 'Row 2, column 2, filled' })).toBeInTheDocument()
  })

  it('locks a filled cell after it is painted', () => {
    render(<BoardHarness />)
    const cell = screen.getByRole('gridcell', { name: 'Row 1, column 1, unknown' })

    fireEvent.pointerDown(cell, { button: 0, isPrimary: true, pointerType: 'mouse' })
    fireEvent.pointerUp(window)
    expect(screen.getByRole('gridcell', { name: 'Row 1, column 1, filled' })).toBeInTheDocument()

    fireEvent.pointerDown(screen.getByRole('gridcell', { name: 'Row 1, column 1, filled' }), {
      button: 0,
      isPrimary: true,
      pointerType: 'mouse',
    })
    fireEvent.pointerUp(window)
    expect(screen.getByRole('gridcell', { name: 'Row 1, column 1, filled' })).toBeInTheDocument()
  })

  it('locks a cross after it is placed', () => {
    render(<BoardHarness />)
    const cell = screen.getByRole('gridcell', { name: 'Row 1, column 2, unknown' })

    fireEvent.contextMenu(cell)
    expect(screen.getByRole('gridcell', { name: 'Row 1, column 2, crossed' })).toBeInTheDocument()
    fireEvent.contextMenu(screen.getByRole('gridcell', { name: 'Row 1, column 2, crossed' }))
    expect(screen.getByRole('gridcell', { name: 'Row 1, column 2, crossed' })).toBeInTheDocument()
  })

  it('keeps a red error cross until the cell receives a valid mark', () => {
    render(<BoardHarness />)
    const emptyCell = screen.getByRole('gridcell', { name: 'Row 1, column 2, unknown' })

    fireEvent.pointerDown(emptyCell, { button: 0, isPrimary: true, pointerType: 'mouse' })
    fireEvent.pointerUp(window)

    const errorCell = screen.getByRole('gridcell', { name: 'Row 1, column 2, error' })
    expect(errorCell).toHaveClass('is-error')
    expect(errorCell).toHaveClass('is-unknown')

    fireEvent.animationEnd(errorCell)
    expect(screen.getByRole('gridcell', { name: 'Row 1, column 2, error' })).toHaveClass(
      'is-error',
    )

    fireEvent.contextMenu(errorCell)
    expect(screen.getByRole('gridcell', { name: 'Row 1, column 2, crossed' })).not.toHaveClass(
      'is-error',
    )
  })

  it('counts a wrong Cross as a fill while keeping its red error cross', () => {
    render(<BoardHarness />)
    const filledSolutionCell = screen.getByRole('gridcell', {
      name: 'Row 1, column 1, unknown',
    })

    fireEvent.contextMenu(filledSolutionCell)

    const errorCell = screen.getByRole('gridcell', { name: 'Row 1, column 1, error' })
    expect(errorCell).toHaveClass('is-error-fill')
    expect(errorCell).toHaveClass('is-filled')
    expect(errorCell.querySelector('.error-cross')).toBeInTheDocument()

    fireEvent.pointerDown(errorCell, { button: 0, isPrimary: true, pointerType: 'mouse' })
    fireEvent.pointerUp(window)
    expect(screen.getByRole('gridcell', { name: 'Row 1, column 1, error' })).toHaveClass('is-error')
  })

  it('keeps a wrong Cross locked after it has counted as a fill', () => {
    render(<BoardHarness />)
    const cell = screen.getByRole('gridcell', { name: 'Row 1, column 1, unknown' })

    fireEvent.contextMenu(cell)
    fireEvent.contextMenu(screen.getByRole('gridcell', { name: 'Row 1, column 1, error' }))

    expect(screen.getByRole('gridcell', { name: 'Row 1, column 1, error' })).toHaveClass(
      'is-filled',
    )
  })

  it('scores a wrong Cross as a mistake and leaves a correct Cross neutral', () => {
    const score = vi.fn()
    const paint = vi.fn()
    render(
      <PuzzleBoard
        marks={createMarkGrid(10)}
        mode="filled"
        onPaint={paint}
        onScoreEvent={score}
        puzzle={puzzle}
      />,
    )

    fireEvent.contextMenu(screen.getByRole('gridcell', { name: 'Row 1, column 1, unknown' }))
    fireEvent.contextMenu(screen.getByRole('gridcell', { name: 'Row 1, column 2, unknown' }))

    expect(score).toHaveBeenCalledOnce()
    expect(score).toHaveBeenCalledWith(0, 0, 'mistake')
    expect(paint).toHaveBeenNthCalledWith(1, 0, 0, 'crossed')
    expect(paint).toHaveBeenNthCalledWith(2, 0, 1, 'crossed')
  })

  it('auto-crosses the empty squares in a completed line', () => {
    const { container } = render(<BoardHarness />)

    fireEvent.pointerDown(screen.getByRole('gridcell', { name: 'Row 1, column 1, unknown' }), {
      button: 0,
      isPrimary: true,
      pointerType: 'mouse',
    })
    fireEvent.pointerUp(window)

    expect(screen.getByRole('gridcell', { name: 'Row 1, column 2, crossed' })).toBeInTheDocument()
    expect(screen.getByRole('gridcell', { name: 'Row 2, column 1, crossed' })).toBeInTheDocument()

    const rowSweep = container.querySelectorAll<HTMLElement>('.line-clear-flash.is-row')
    const columnSweep = container.querySelectorAll<HTMLElement>('.line-clear-flash.is-column')
    expect(rowSweep).toHaveLength(10)
    expect(columnSweep).toHaveLength(10)
    expect(rowSweep[0].style.getPropertyValue('--line-clear-delay')).toBe('216ms')
    expect(rowSweep[9].style.getPropertyValue('--line-clear-delay')).toBe('0ms')
    expect(columnSweep[0].style.getPropertyValue('--line-clear-delay')).toBe('216ms')
    expect(columnSweep[9].style.getPropertyValue('--line-clear-delay')).toBe('0ms')
  })

  it('animates a row resolved by an adjacent column auto-cross', () => {
    render(<AdjacentAutoCompletionHarness />)

    const rowCellBefore = screen.getByRole('gridcell', { name: 'Row 1, column 1, crossed' })
    expect(rowCellBefore.querySelector('.line-clear-flash.is-row')).not.toBeInTheDocument()

    fireEvent.pointerDown(
      screen.getByRole('gridcell', { name: 'Row 5, column 5, unknown' }),
      { button: 0, isPrimary: true, pointerType: 'mouse' },
    )
    fireEvent.pointerUp(window)

    const rowCellAfter = screen.getByRole('gridcell', { name: 'Row 1, column 1, crossed' })
    expect(rowCellAfter.querySelector('.line-clear-flash.is-row')).toBeInTheDocument()
    expect(screen.getByRole('gridcell', { name: 'Row 1, column 5, crossed' })).toBeInTheDocument()
  })

  it('does not replace an existing fill or cross with the opposite mark', () => {
    render(<BoardHarness />)

    fireEvent.pointerDown(screen.getByRole('gridcell', { name: 'Row 1, column 1, unknown' }), {
      button: 0,
      isPrimary: true,
      pointerType: 'mouse',
    })
    fireEvent.pointerUp(window)

    const crossedCell = screen.getByRole('gridcell', { name: 'Row 1, column 2, crossed' })
    fireEvent.pointerDown(crossedCell, { button: 0, isPrimary: true, pointerType: 'mouse' })
    fireEvent.pointerUp(window)
    expect(screen.getByRole('gridcell', { name: 'Row 1, column 2, crossed' })).toHaveClass(
      'is-crossed',
    )

    const filledCell = screen.getByRole('gridcell', { name: 'Row 1, column 1, filled' })
    fireEvent.contextMenu(filledCell)
    expect(screen.getByRole('gridcell', { name: 'Row 1, column 1, filled' })).not.toHaveClass(
      'is-error',
    )
  })

  it('skips locked cells while a drag continues', () => {
    const marks = createMarkGrid(10)
    marks[0][0] = 'filled'
    const paint = vi.fn()
    render(<PuzzleBoard marks={marks} mode="filled" onPaint={paint} puzzle={puzzle} />)

    const start = screen.getByRole('gridcell', { name: 'Row 2, column 2, unknown' })
    const locked = screen.getByRole('gridcell', { name: 'Row 1, column 1, filled' })
    const later = screen.getByRole('gridcell', { name: 'Row 3, column 3, unknown' })

    fireEvent.pointerDown(start, { button: 0, isPrimary: true, pointerType: 'mouse' })
    fireEvent.mouseEnter(locked)
    fireEvent.mouseEnter(later)
    fireEvent.pointerUp(window)

    expect(paint).toHaveBeenCalledTimes(2)
    expect(paint).toHaveBeenNthCalledWith(1, 1, 1, 'filled')
    expect(paint).toHaveBeenNthCalledWith(2, 2, 2, 'filled')
  })

  it('visits each dragged cell once', () => {
    const paint = vi.fn()
    render(
      <PuzzleBoard marks={createMarkGrid(10)} mode="filled" onPaint={paint} puzzle={puzzle} />,
    )
    const first = screen.getByRole('gridcell', { name: 'Row 1, column 1, unknown' })
    const second = screen.getByRole('gridcell', { name: 'Row 2, column 2, unknown' })

    fireEvent.pointerDown(first, { button: 0, isPrimary: true, pointerType: 'mouse' })
    fireEvent.mouseEnter(second)
    fireEvent.mouseEnter(first)
    fireEvent.mouseEnter(second)
    fireEvent.pointerUp(window)

    expect(paint).toHaveBeenCalledTimes(2)
    expect(paint).toHaveBeenNthCalledWith(1, 0, 0, 'filled')
    expect(paint).toHaveBeenNthCalledWith(2, 1, 1, 'filled')
  })

  it('paints cells while a touch pointer moves across the grid', () => {
    const paint = vi.fn()
    render(
      <PuzzleBoard marks={createMarkGrid(10)} mode="filled" onPaint={paint} puzzle={puzzle} />,
    )
    const grid = screen.getByRole('grid')
    const first = screen.getByRole('gridcell', { name: 'Row 1, column 1, unknown' })
    const second = screen.getByRole('gridcell', { name: 'Row 2, column 2, unknown' })
    const originalElementFromPoint = document.elementFromPoint
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => second),
    })

    fireEvent.pointerDown(first, { isPrimary: true, pointerId: 1, pointerType: 'touch' })
    fireEvent.pointerMove(grid, {
      clientX: 20,
      clientY: 20,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'touch',
    })
    fireEvent.pointerUp(window, { pointerId: 1, pointerType: 'touch' })

    expect(paint).toHaveBeenCalledTimes(2)
    expect(paint).toHaveBeenNthCalledWith(1, 0, 0, 'filled')
    expect(paint).toHaveBeenNthCalledWith(2, 1, 1, 'filled')

    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: originalElementFromPoint,
    })
  })

  it('stops the active drag after a mistaken cell', () => {
    const paint = vi.fn()
    render(
      <PuzzleBoard marks={createMarkGrid(10)} mode="filled" onPaint={paint} puzzle={puzzle} />,
    )
    const first = screen.getByRole('gridcell', { name: 'Row 1, column 1, unknown' })
    const mistake = screen.getByRole('gridcell', { name: 'Row 1, column 2, unknown' })
    const laterValidCell = screen.getByRole('gridcell', { name: 'Row 2, column 2, unknown' })

    fireEvent.pointerDown(first, { button: 0, isPrimary: true, pointerType: 'mouse' })
    fireEvent.mouseEnter(mistake)
    fireEvent.mouseEnter(laterValidCell)
    fireEvent.pointerUp(window)

    expect(paint).toHaveBeenCalledTimes(1)
    expect(paint).toHaveBeenCalledWith(0, 0, 'filled')
    expect(screen.getByRole('gridcell', { name: 'Row 1, column 2, error' })).toBeInTheDocument()
  })

  it('emits sound feedback cues for successful and mistaken marks', () => {
    const feedback = vi.fn()
    const score = vi.fn()
    render(
      <PuzzleBoard
        marks={createMarkGrid(10)}
        mode="filled"
        onFeedback={feedback}
        onPaint={vi.fn()}
        onScoreEvent={score}
        puzzle={puzzle}
      />,
    )

    fireEvent.pointerDown(screen.getByRole('gridcell', { name: 'Row 1, column 2, unknown' }), {
      button: 0,
      isPrimary: true,
      pointerType: 'mouse',
    })
    fireEvent.pointerUp(window)
    fireEvent.pointerDown(screen.getByRole('gridcell', { name: 'Row 1, column 1, unknown' }), {
      button: 0,
      isPrimary: true,
      pointerType: 'mouse',
    })
    fireEvent.pointerUp(window)

    expect(feedback).toHaveBeenNthCalledWith(1, 'mistake')
    expect(feedback).toHaveBeenNthCalledWith(2, 'line')
    expect(score).toHaveBeenNthCalledWith(1, 0, 1, 'mistake')
    expect(score).toHaveBeenNthCalledWith(2, 0, 0, 'correct-fill')
  })

  it('shows the finished pattern without accepting marks during a preview', () => {
    const paint = vi.fn()
    render(
      <PuzzleBoard
        marks={createMarkGrid(10)}
        mode="filled"
        onPaint={paint}
        puzzle={puzzle}
        revealingSolution
      />,
    )

    const filledPreview = screen.getByRole('gridcell', { name: 'Row 1, column 1, unknown' })
    const emptyPreview = screen.getByRole('gridcell', { name: 'Row 1, column 2, unknown' })
    expect(filledPreview).toHaveClass('is-preview-filled')
    expect(emptyPreview).toHaveClass('is-preview-empty')

    fireEvent.pointerDown(filledPreview, {
      button: 0,
      isPrimary: true,
      pointerType: 'mouse',
    })
    fireEvent.contextMenu(emptyPreview)
    expect(paint).not.toHaveBeenCalled()
  })

  it('reports board interaction before applying a mark', () => {
    const interaction = vi.fn()
    const paint = vi.fn()
    render(
      <PuzzleBoard
        marks={createMarkGrid(10)}
        mode="filled"
        onInteraction={interaction}
        onPaint={paint}
        puzzle={puzzle}
      />,
    )

    const cell = screen.getByRole('gridcell', { name: 'Row 1, column 1, unknown' })
    fireEvent.pointerDown(cell, { button: 0, isPrimary: true, pointerType: 'mouse' })

    expect(interaction).toHaveBeenCalledOnce()
    expect(paint).toHaveBeenCalledWith(0, 0, 'filled')
  })

})
