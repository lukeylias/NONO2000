import { EMPTY, FILLED, UNKNOWN, type LogicResult } from './types'

export interface LogicDifficulty {
  solved: boolean
  sweeps: number
  openingDeductions: number
  maxSweepDeductions: number
  deductionsPerSweep: number[]
}

const patternCache = new Map<string, number[][]>()

export function getLinePatterns(length: number, clues: readonly number[]): number[][] {
  const cacheKey = `${length}:${clues.join(',')}`
  const cached = patternCache.get(cacheKey)
  if (cached) return cached

  if (clues.length === 0) {
    const emptyPattern = [Array.from({ length }, () => EMPTY)]
    patternCache.set(cacheKey, emptyPattern)
    return emptyPattern
  }

  const patterns: number[][] = []
  const remainingLengths = clues.map((_, index) => {
    const runs = clues.slice(index).reduce((total, clue) => total + clue, 0)
    const spaces = clues.length - index - 1
    return runs + spaces
  })

  const placeRun = (clueIndex: number, startAt: number, pattern: number[]) => {
    const runLength = clues[clueIndex]
    const latestStart = length - remainingLengths[clueIndex]

    for (let start = startAt; start <= latestStart; start += 1) {
      const next = pattern.slice()
      for (let cell = start; cell < start + runLength; cell += 1) next[cell] = FILLED

      if (clueIndex === clues.length - 1) {
        patterns.push(next)
      } else {
        placeRun(clueIndex + 1, start + runLength + 1, next)
      }
    }
  }

  placeRun(0, 0, Array.from({ length }, () => EMPTY))
  patternCache.set(cacheKey, patterns)
  return patterns
}

function patternMatches(pattern: readonly number[], known: readonly number[]): boolean {
  return pattern.every((cell, index) => known[index] === UNKNOWN || known[index] === cell)
}

function applyLine(
  known: readonly number[],
  clues: readonly number[],
): { line: number[]; contradiction: boolean; changed: boolean } {
  const candidates = getLinePatterns(known.length, clues).filter((pattern) =>
    patternMatches(pattern, known),
  )

  if (candidates.length === 0) {
    return { line: [...known], contradiction: true, changed: false }
  }

  const line = [...known]
  let changed = false

  for (let index = 0; index < known.length; index += 1) {
    const first = candidates[0][index]
    if (candidates.every((candidate) => candidate[index] === first) && line[index] === UNKNOWN) {
      line[index] = first
      changed = true
    }
  }

  return { line, contradiction: false, changed }
}

function countUnknown(board: readonly number[][]): number {
  return board.reduce(
    (total, row) => total + row.filter((cell) => cell === UNKNOWN).length,
    0,
  )
}

/**
 * Measures a puzzle using alternating horizontal and vertical Settle sweeps.
 * This mirrors the local-reasoning difficulty measure proposed by Batenburg et al.
 */
export function analyzeLogicDifficulty(
  rowClues: readonly number[][],
  columnClues: readonly number[][],
): LogicDifficulty {
  const height = rowClues.length
  const width = columnClues.length
  const board = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => UNKNOWN),
  )
  const deductionsPerSweep: number[] = []
  let horizontal = true
  let consecutiveStalls = 0
  const maxSweeps = height * width + 1

  while (countUnknown(board) > 0 && deductionsPerSweep.length < maxSweeps) {
    const unknownBefore = countUnknown(board)

    if (horizontal) {
      for (let row = 0; row < height; row += 1) {
        const result = applyLine(board[row], rowClues[row])
        if (result.contradiction) {
          return {
            solved: false,
            sweeps: deductionsPerSweep.length,
            openingDeductions: deductionsPerSweep[0] ?? 0,
            maxSweepDeductions: Math.max(0, ...deductionsPerSweep),
            deductionsPerSweep,
          }
        }
        board[row] = result.line
      }
    } else {
      for (let column = 0; column < width; column += 1) {
        const known = board.map((row) => row[column])
        const result = applyLine(known, columnClues[column])
        if (result.contradiction) {
          return {
            solved: false,
            sweeps: deductionsPerSweep.length,
            openingDeductions: deductionsPerSweep[0] ?? 0,
            maxSweepDeductions: Math.max(0, ...deductionsPerSweep),
            deductionsPerSweep,
          }
        }
        result.line.forEach((cell, row) => {
          board[row][column] = cell
        })
      }
    }

    const deductions = unknownBefore - countUnknown(board)
    deductionsPerSweep.push(deductions)
    consecutiveStalls = deductions === 0 ? consecutiveStalls + 1 : 0
    if (consecutiveStalls >= 2) break
    horizontal = !horizontal
  }

  return {
    solved: countUnknown(board) === 0,
    sweeps: deductionsPerSweep.length,
    openingDeductions: deductionsPerSweep[0] ?? 0,
    maxSweepDeductions: Math.max(0, ...deductionsPerSweep),
    deductionsPerSweep,
  }
}

export function solveByLogic(
  rowClues: readonly number[][],
  columnClues: readonly number[][],
  initialBoard?: readonly number[][],
): LogicResult {
  const size = rowClues.length
  const board = initialBoard
    ? initialBoard.map((row) => [...row])
    : Array.from({ length: size }, () => Array.from({ length: size }, () => UNKNOWN))

  let rounds = 0
  let changed = true

  while (changed && rounds < size * size) {
    changed = false
    rounds += 1

    for (let row = 0; row < size; row += 1) {
      const result = applyLine(board[row], rowClues[row])
      if (result.contradiction) return { board, contradiction: true, solved: false, rounds }
      if (result.changed) {
        board[row] = result.line
        changed = true
      }
    }

    for (let column = 0; column < size; column += 1) {
      const known = board.map((row) => row[column])
      const result = applyLine(known, columnClues[column])
      if (result.contradiction) return { board, contradiction: true, solved: false, rounds }
      if (result.changed) {
        result.line.forEach((cell, row) => {
          board[row][column] = cell
        })
        changed = true
      }
    }
  }

  return {
    board,
    contradiction: false,
    solved: board.every((row) => row.every((cell) => cell !== UNKNOWN)),
    rounds,
  }
}

export function countSolutions(
  rowClues: readonly number[][],
  columnClues: readonly number[][],
  limit = 2,
): number {
  const size = rowClues.length

  const search = (board: number[][]): number => {
    const result = solveByLogic(rowClues, columnClues, board)
    if (result.contradiction) return 0
    if (result.solved) return 1

    let targetRow = -1
    let targetColumn = -1
    for (let row = 0; row < size && targetRow === -1; row += 1) {
      targetColumn = result.board[row].findIndex((cell) => cell === UNKNOWN)
      if (targetColumn !== -1) targetRow = row
    }

    let total = 0
    for (const guess of [FILLED, EMPTY]) {
      const next = result.board.map((row) => [...row])
      next[targetRow][targetColumn] = guess
      total += search(next)
      if (total >= limit) return limit
    }
    return total
  }

  return search(
    Array.from({ length: size }, () => Array.from({ length: size }, () => UNKNOWN)),
  )
}

export function boardMatchesSolution(board: readonly number[][], solution: readonly number[][]): boolean {
  return board.every((row, rowIndex) =>
    row.every((cell, columnIndex) => cell === solution[rowIndex][columnIndex]),
  )
}
