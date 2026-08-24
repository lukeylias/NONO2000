import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { getColumnMarks, isLineSatisfied } from '../game/play'
import type { ScoreEventKind } from '../game/score'
import type { SoundCue } from '../game/sound'
import type { CellMark, MarkGrid, PaintMode, Puzzle } from '../game/types'

interface PuzzleBoardProps {
  puzzle: Puzzle
  marks: MarkGrid
  mode: PaintMode
  onPaint: (row: number, column: number, mark: CellMark) => void
  onFeedback?: (cue: SoundCue) => void
  onInteraction?: () => void
  onModeChange?: (mode: PaintMode) => void
  onScoreEvent?: (row: number, column: number, kind: ScoreEventKind) => void
  revealingSolution?: boolean
  cornerContent?: ReactNode
}

interface DragState {
  mark: CellMark
  visited: Set<string>
}

const LINE_SWEEP_STEP_MS = 24
const CLUE_SETTLE_LEAD_MS = 70

function cellSize(size: number): number {
  if (size === 5) return 92
  if (size === 10) return 66
  if (size === 15) return 46
  return 30
}

export function PuzzleBoard({
  puzzle,
  marks,
  mode,
  onPaint,
  onFeedback,
  onInteraction,
  onModeChange,
  onScoreEvent,
  revealingSolution = false,
  cornerContent,
}: PuzzleBoardProps) {
  const drag = useRef<DragState | null>(null)
  const [errorMarks, setErrorMarks] = useState<Map<string, CellMark>>(() => new Map())
  const [hoveredCell, setHoveredCell] = useState<{ row: number; column: number } | null>(null)
  const size = puzzle.size
  const rowSatisfied = useMemo(
    () => marks.map((row, index) => isLineSatisfied(row, puzzle.rowClues[index])),
    [marks, puzzle.rowClues],
  )
  const columnSatisfied = useMemo(
    () => puzzle.columnClues.map((clues, column) =>
      isLineSatisfied(getColumnMarks(marks, column), clues),
    ),
    [marks, puzzle.columnClues],
  )

  useEffect(() => {
    const finishDrag = () => {
      drag.current = null
    }
    window.addEventListener('pointerup', finishDrag)
    window.addEventListener('pointercancel', finishDrag)
    window.addEventListener('blur', finishDrag)
    return () => {
      window.removeEventListener('pointerup', finishDrag)
      window.removeEventListener('pointercancel', finishDrag)
      window.removeEventListener('blur', finishDrag)
    }
  }, [])

  const addError = (key: string, mark: CellMark) => {
    setErrorMarks((current) => new Map(current).set(key, mark))
  }

  const clearError = (key: string) => {
    setErrorMarks((current) => {
      if (!current.has(key)) return current
      const next = new Map(current)
      next.delete(key)
      return next
    })
  }

  const isMistake = (row: number, column: number, mark: CellMark) =>
    (mark === 'filled' && puzzle.solution[row][column] === 0) ||
    (mark === 'crossed' && puzzle.solution[row][column] === 1)

  const completesLine = (row: number, column: number, mark: CellMark) => {
    if (mark !== 'filled') return false
    const completesRow = puzzle.solution[row].every(
      (cell, columnIndex) => cell === 0 || columnIndex === column || marks[row][columnIndex] === 'filled',
    )
    const completesColumn = puzzle.solution.every(
      (line, rowIndex) => line[column] === 0 || rowIndex === row || marks[rowIndex][column] === 'filled',
    )
    return completesRow || completesColumn
  }

  const applyOnce = (row: number, column: number) => {
    if (!drag.current || revealingSolution) return
    const key = `${row}:${column}`
    if (drag.current.visited.has(key)) return
    drag.current.visited.add(key)
    if (marks[row][column] !== 'unknown') return
    if (isMistake(row, column, drag.current.mark)) {
      addError(key, drag.current.mark)
      onFeedback?.('mistake')
      onScoreEvent?.(row, column, 'mistake')
      if (drag.current.mark === 'crossed') onPaint(row, column, 'crossed')
      drag.current = null
      return
    }
    if (drag.current.mark === 'filled') {
      onScoreEvent?.(row, column, 'correct-fill')
    }
    clearError(key)
    onPaint(row, column, drag.current.mark)
    onFeedback?.(
      completesLine(row, column, drag.current.mark)
        ? 'line'
        : drag.current.mark === 'filled' ? 'fill' : 'cross',
    )
  }

  const startDrag = (event: PointerEvent<HTMLDivElement>, row: number, column: number) => {
    if (
      event.isPrimary === false ||
      (event.pointerType === 'mouse' && event.button !== 0) ||
      revealingSolution
    ) return
    event.preventDefault()
    onInteraction?.()
    const primaryMark = event.pointerType === 'mouse' ? 'filled' : mode
    const key = `${row}:${column}`
    const errorMark = errorMarks.get(key)
    if (marks[row][column] !== 'unknown') {
      drag.current = null
      return
    }
    if (errorMark === primaryMark) {
      clearError(key)
      onFeedback?.('clear')
      drag.current = null
      return
    }
    drag.current = { mark: primaryMark, visited: new Set() }
    applyOnce(row, column)
  }

  const continuePointerDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || event.isPrimary === false) return
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-grid-cell]')
    if (!target || !event.currentTarget.contains(target)) return
    const row = Number(target.dataset.row)
    const column = Number(target.dataset.column)
    if (!Number.isInteger(row) || !Number.isInteger(column)) return
    setHoveredCell({ row, column })
    applyOnce(row, column)
  }

  const crossCell = (event: MouseEvent, row: number, column: number) => {
    event.preventDefault()
    if (revealingSolution) return
    onInteraction?.()
    const key = `${row}:${column}`
    const errorMark = errorMarks.get(key)
    if (marks[row][column] !== 'unknown') return
    if (errorMark === 'crossed') {
      clearError(key)
      onFeedback?.('clear')
      return
    }
    const mark = 'crossed'
    if (isMistake(row, column, mark)) {
      addError(key, mark)
      onFeedback?.('mistake')
      onScoreEvent?.(row, column, 'mistake')
      onPaint(row, column, mark)
      return
    }
    clearError(key)
    onPaint(row, column, mark)
    onFeedback?.('cross')
  }

  const style = {
    '--base-cell-size': `${cellSize(size)}px`,
    '--grid-size': size,
  } as CSSProperties

  return (
    <div className="puzzle-layout" style={style}>
      <div className="board-corner">
        {cornerContent ?? <span>{size}×{size}</span>}
      </div>

      <div className="column-clues" aria-label="Column clues">
        {puzzle.columnClues.map((clues, column) => (
          <div
            className={[
              'column-clue',
              columnSatisfied[column] ? 'is-satisfied' : '',
              hoveredCell?.column === column ? 'is-active' : '',
            ].filter(Boolean).join(' ')}
            key={`column-${column}`}
            style={{
              '--clue-clear-delay': `${size * LINE_SWEEP_STEP_MS + CLUE_SETTLE_LEAD_MS}ms`,
            } as CSSProperties}
          >
            {clues.map((clue, index) => <span key={index}>{clue}</span>)}
          </div>
        ))}
      </div>

      <div className="row-clues" aria-label="Row clues">
        {puzzle.rowClues.map((clues, row) => (
          <div
            className={[
              'row-clue',
              rowSatisfied[row] ? 'is-satisfied' : '',
              hoveredCell?.row === row ? 'is-active' : '',
            ].filter(Boolean).join(' ')}
            key={`row-${row}`}
            style={{
              '--clue-clear-delay': `${size * LINE_SWEEP_STEP_MS + CLUE_SETTLE_LEAD_MS}ms`,
            } as CSSProperties}
          >
            {clues.map((clue, index) => <span key={index}>{clue}</span>)}
          </div>
        ))}
      </div>

      <div
        className={`puzzle-grid ${revealingSolution ? 'is-previewing' : ''}`}
        onMouseLeave={() => setHoveredCell(null)}
        onPointerMove={continuePointerDrag}
        role="grid"
        aria-label={`${size} by ${size} puzzle grid`}
      >
        {marks.map((row, rowIndex) =>
          row.map((mark, columnIndex) => (
            <div
              aria-label={`Row ${rowIndex + 1}, column ${columnIndex + 1}, ${
                errorMarks.has(`${rowIndex}:${columnIndex}`) ? 'error' : mark
              }`}
              className={[
                'puzzle-cell',
                `is-${mark}`,
                errorMarks.has(`${rowIndex}:${columnIndex}`) ? 'is-error' : '',
                errorMarks.has(`${rowIndex}:${columnIndex}`) && puzzle.solution[rowIndex][columnIndex] === 1
                  ? 'is-error-fill'
                  : '',
                revealingSolution && puzzle.solution[rowIndex][columnIndex] === 1
                  ? 'is-preview-filled'
                  : '',
                revealingSolution && puzzle.solution[rowIndex][columnIndex] === 0
                  ? 'is-preview-empty'
                  : '',
                (columnIndex + 1) % 5 === 0 && columnIndex < size - 1 ? 'major-column' : '',
                (rowIndex + 1) % 5 === 0 && rowIndex < size - 1 ? 'major-row' : '',
                columnIndex === size - 1 ? 'is-last-column' : '',
                rowIndex === size - 1 ? 'is-last-row' : '',
              ].filter(Boolean).join(' ')}
              key={`${rowIndex}:${columnIndex}`}
              data-column={columnIndex}
              data-grid-cell
              data-row={rowIndex}
              onContextMenu={(event) => crossCell(event, rowIndex, columnIndex)}
              onPointerDown={(event) => startDrag(event, rowIndex, columnIndex)}
              onMouseEnter={() => {
                setHoveredCell({ row: rowIndex, column: columnIndex })
                applyOnce(rowIndex, columnIndex)
              }}
              role="gridcell"
            >
              {errorMarks.has(`${rowIndex}:${columnIndex}`) ? (
                <span aria-hidden="true" className="error-cross" />
              ) : null}
              {rowSatisfied[rowIndex] ? (
                <span
                  aria-hidden="true"
                  className="line-clear-flash is-row"
                  style={{
                    '--line-clear-delay': `${(size - 1 - columnIndex) * LINE_SWEEP_STEP_MS}ms`,
                  } as CSSProperties}
                />
              ) : null}
              {columnSatisfied[columnIndex] ? (
                <span
                  aria-hidden="true"
                  className="line-clear-flash is-column"
                  style={{
                    '--line-clear-delay': `${(size - 1 - rowIndex) * LINE_SWEEP_STEP_MS}ms`,
                  } as CSSProperties}
                />
              ) : null}
            </div>
          )),
        )}
      </div>

      {onModeChange ? (
        <div className="paint-mode-selector" aria-label="Primary mark" role="group">
          <button
            aria-pressed={mode === 'filled'}
            className="paint-mode-fill"
            onClick={() => onModeChange('filled')}
            type="button"
          >
            Fill
          </button>
          <button
            aria-pressed={mode === 'crossed'}
            className="paint-mode-cross"
            onClick={() => onModeChange('crossed')}
            type="button"
          >
            Cross
          </button>
        </div>
      ) : null}
    </div>
  )
}
