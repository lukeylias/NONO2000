import { cluesEqual, getLineClues } from './clues'
import { TIMER_MINUTES, type BinaryGrid, type CellMark, type MarkGrid, type Puzzle, type TimerMinutes } from './types'

export function updateMark(
  marks: MarkGrid,
  row: number,
  column: number,
  mark: CellMark,
): MarkGrid {
  if (marks[row][column] !== 'unknown' || mark === 'unknown') return marks
  const next = marks.map((line) => [...line])
  next[row][column] = mark
  return next
}

function autoCrossCompletedLines(
  marks: MarkGrid,
  solution: BinaryGrid,
  row: number,
  column: number,
): MarkGrid {
  const rowComplete = solution[row].every(
    (cell, columnIndex) => cell === 0 || marks[row][columnIndex] === 'filled',
  )
  const columnComplete = solution.every(
    (line, rowIndex) => line[column] === 0 || marks[rowIndex][column] === 'filled',
  )

  if (!rowComplete && !columnComplete) return marks

  const next = marks.map((line) => [...line])
  if (rowComplete) {
    solution[row].forEach((cell, columnIndex) => {
      if (cell === 0) next[row][columnIndex] = 'crossed'
    })
  }
  if (columnComplete) {
    solution.forEach((line, rowIndex) => {
      if (line[column] === 0) next[rowIndex][column] = 'crossed'
    })
  }
  return next
}

export function applyPlayerMark(
  marks: MarkGrid,
  solution: BinaryGrid,
  row: number,
  column: number,
  mark: CellMark,
): MarkGrid {
  if (marks[row][column] !== 'unknown' || mark === 'unknown') return marks

  const solutionCell = solution[row][column]
  if (mark === 'filled' && solutionCell === 0) return marks

  if (mark === 'crossed' && solutionCell === 1) {
    const next = updateMark(marks, row, column, 'filled')
    return autoCrossCompletedLines(next, solution, row, column)
  }

  const next = updateMark(marks, row, column, mark)
  return mark === 'filled'
    ? autoCrossCompletedLines(next, solution, row, column)
    : next
}

export function marksToBinary(marks: readonly CellMark[]): number[] {
  return marks.map((mark) => (mark === 'filled' ? 1 : 0))
}

export function isLineSatisfied(marks: readonly CellMark[], clues: readonly number[]): boolean {
  return cluesEqual(getLineClues(marksToBinary(marks)), clues)
}

export function isPuzzleComplete(marks: MarkGrid, solution: BinaryGrid): boolean {
  return marks.every((row, rowIndex) =>
    row.every((mark, columnIndex) =>
      solution[rowIndex][columnIndex] === 1 ? mark === 'filled' : mark !== 'filled',
    ),
  )
}

export function getColumnMarks(marks: MarkGrid, column: number): CellMark[] {
  return marks.map((row) => row[column])
}

export function formatElapsed(milliseconds: number): string {
  const totalTenths = Math.floor(milliseconds / 100)
  const tenths = totalTenths % 10
  const totalSeconds = Math.floor(totalTenths / 10)
  const seconds = totalSeconds % 60
  const minutes = Math.floor(totalSeconds / 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`
}

export function timerModeLabel(timerMinutes: TimerMinutes): string {
  if (timerMinutes === 0) return 'Relaxed'
  return `${timerMinutes} minute${timerMinutes === 1 ? '' : 's'}`
}

export function cycleTimerMinutes(timerMinutes: TimerMinutes): TimerMinutes {
  const currentIndex = TIMER_MINUTES.indexOf(timerMinutes)
  return TIMER_MINUTES[(currentIndex + 1) % TIMER_MINUTES.length]
}

export function getTimerValue(elapsed: number, timerMinutes: TimerMinutes): number {
  return timerMinutes > 0 ? Math.max(0, timerMinutes * 60_000 - elapsed) : elapsed
}

export function hasCountdownExpired(elapsed: number, timerMinutes: TimerMinutes): boolean {
  return timerMinutes > 0 && elapsed >= timerMinutes * 60_000
}

export function puzzleLabel(puzzle: Puzzle): string {
  return `${puzzle.size} by ${puzzle.size} nonogram puzzle`
}
