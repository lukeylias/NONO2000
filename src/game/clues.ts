import type { BinaryGrid } from './types'

export function getLineClues(line: readonly number[]): number[] {
  const clues: number[] = []
  let run = 0

  for (const cell of line) {
    if (cell === 1) {
      run += 1
    } else if (run > 0) {
      clues.push(run)
      run = 0
    }
  }

  if (run > 0) clues.push(run)
  return clues
}

export function getGridClues(grid: BinaryGrid): {
  rowClues: number[][]
  columnClues: number[][]
} {
  const size = grid.length
  const rowClues = grid.map(getLineClues)
  const columnClues = Array.from({ length: size }, (_, column) =>
    getLineClues(grid.map((row) => row[column])),
  )

  return { rowClues, columnClues }
}

export function cluesEqual(left: readonly number[], right: readonly number[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}
