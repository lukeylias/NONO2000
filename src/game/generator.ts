import { getGridClues } from './clues'
import {
  analyzeLogicDifficulty,
  boardMatchesSolution,
  countSolutions,
  solveByLogic,
} from './solver'
import type { BinaryGrid, BoardSize, Puzzle, PuzzleDifficulty } from './types'

interface GeneratorConfig {
  maxRuns: number
  symmetryChance: number
}

const CONFIG: Record<BoardSize, GeneratorConfig> = {
  5: { maxRuns: 2, symmetryChance: 1 },
  10: { maxRuns: 2, symmetryChance: 1 },
  15: { maxRuns: 3, symmetryChance: 0.5 },
}

function createRandom(seed: number) {
  let state = seed >>> 0 || 0x6d2b79f5
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function randomBetween(random: () => number, minimum: number, maximum: number): number {
  return minimum + random() * (maximum - minimum)
}

function makeOddOrEven(value: number, size: number): number {
  const wantedParity = size % 2
  let next = Math.max(1, Math.min(size, Math.round(value)))
  if (next % 2 !== wantedParity) next += next < size ? 1 : -1
  return next
}

function createEmptyGrid(size: BoardSize): BinaryGrid {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => 0 as const),
  ) as BinaryGrid
}

function transposeGrid(grid: BinaryGrid): BinaryGrid {
  return grid.map((_, column) => grid.map((row) => row[column])) as BinaryGrid
}

function generateSymmetricSmallCandidate(seed: number): {
  grid: BinaryGrid
  symmetry: 'vertical'
} {
  const size = 10
  const random = createRandom(seed)
  const widestRow = Math.floor(randomBetween(random, 2, size - 2))
  const curve = randomBetween(random, 0.58, 1.28)
  const topWidth = 2 + Math.floor(random() * 3) * 2
  const bottomWidth = 2 + Math.floor(random() * 3) * 2
  const notchEnabled = random() < 0.58
  const notchStart = Math.floor(randomBetween(random, 1, size - 3))
  const notchLength = 1 + Math.floor(random() * 3)
  const notchEnd = Math.min(size - 2, notchStart + notchLength)
  const notchWidth = random() < 0.72 ? 2 : 4
  const grid = createEmptyGrid(size)

  for (let row = 0; row < size; row += 1) {
    const distanceToEdge = row <= widestRow
      ? widestRow || 1
      : size - 1 - widestRow || 1
    const distance = Math.abs(row - widestRow) / distanceToEdge
    const edgeWidth = row < widestRow ? topWidth : bottomWidth
    const baseWidth = size - (size - edgeWidth) * Math.pow(distance, curve)
    const jitter = row === widestRow ? 0 : (Math.floor(random() * 3) - 1) * 2
    const width = row === widestRow
      ? size
      : makeOddOrEven(baseWidth + jitter, size)
    const left = Math.floor((size - width) / 2)
    const right = left + width

    for (let column = left; column < right; column += 1) grid[row][column] = 1

    const rowHasNotch = notchEnabled
      && row >= notchStart
      && row <= notchEnd
      && width >= notchWidth + 4
      && row !== widestRow

    if (rowHasNotch) {
      const notchLeft = (size - notchWidth) / 2
      for (let column = notchLeft; column < notchLeft + notchWidth; column += 1) {
        grid[row][column] = 0
      }
    }
  }

  return { grid, symmetry: 'vertical' }
}

function generateRibbonSmallCandidate(seed: number): {
  grid: BinaryGrid
  symmetry: 'none'
} {
  const size = 10
  const random = createRandom(seed ^ 0xa511e9b3)
  const grid = createEmptyGrid(size)
  const reverse = random() < 0.5
  let previousLeft = reverse ? size - 4 : 0

  for (let row = 0; row < size; row += 1) {
    const width = 3 + Math.floor(random() * 4)
    const progress = row / (size - 1)
    const eased = progress * progress * (3 - 2 * progress)
    const forwardLeft = Math.round((size - width) * eased)
    const targetLeft = reverse ? size - width - forwardLeft : forwardLeft
    const jitter = row === 0 || row === size - 1 ? 0 : Math.floor(random() * 3) - 1
    const minimumOverlapLeft = Math.max(0, previousLeft - width + 1)
    const maximumOverlapLeft = Math.min(size - width, previousLeft + 5)
    const left = Math.max(
      minimumOverlapLeft,
      Math.min(maximumOverlapLeft, Math.max(0, Math.min(size - width, targetLeft + jitter))),
    )

    for (let column = left; column < left + width; column += 1) grid[row][column] = 1
    previousLeft = left
  }

  return { grid: random() < 0.5 ? grid : transposeGrid(grid), symmetry: 'none' }
}

function generateBlockSmallCandidate(seed: number): {
  grid: BinaryGrid
  symmetry: 'none'
} {
  const size = 10
  const random = createRandom(seed ^ 0x63d83595)
  const grid = createEmptyGrid(size)
  const horizontalRow = Math.floor(randomBetween(random, 1, size - 1))
  const verticalColumn = Math.floor(randomBetween(random, 1, size - 1))
  const horizontalThickness = random() < 0.55 ? 1 : 2
  const verticalThickness = random() < 0.55 ? 1 : 2
  const targetCells = Math.floor(randomBetween(random, 38, 55))

  for (let row = horizontalRow; row < Math.min(size, horizontalRow + horizontalThickness); row += 1) {
    for (let column = 0; column < size; column += 1) grid[row][column] = 1
  }
  for (let row = 0; row < size; row += 1) {
    for (let column = verticalColumn; column < Math.min(size, verticalColumn + verticalThickness); column += 1) {
      grid[row][column] = 1
    }
  }

  let filledCells = grid.flat().filter(Boolean).length
  for (let stamp = 0; stamp < 18 && filledCells < targetCells; stamp += 1) {
    const stampWidth = 2 + Math.floor(random() * 4)
    const stampHeight = 2 + Math.floor(random() * 4)
    const top = Math.floor(randomBetween(random, 0, size - stampHeight + 1))
    const left = Math.floor(randomBetween(random, 0, size - stampWidth + 1))
    let touchesShape = false

    for (let row = Math.max(0, top - 1); row < Math.min(size, top + stampHeight + 1); row += 1) {
      for (let column = Math.max(0, left - 1); column < Math.min(size, left + stampWidth + 1); column += 1) {
        if (grid[row][column] === 1) touchesShape = true
      }
    }

    if (!touchesShape) continue

    for (let row = top; row < top + stampHeight && filledCells < targetCells; row += 1) {
      for (let column = left; column < left + stampWidth && filledCells < targetCells; column += 1) {
        if (grid[row][column] === 0) {
          grid[row][column] = 1
          filledCells += 1
        }
      }
    }
  }

  return { grid, symmetry: 'none' }
}

function generateWovenSmallCandidate(seed: number): {
  grid: BinaryGrid
  symmetry: 'none'
} {
  const size = 10
  const random = createRandom(seed ^ 0x7f4a7c15)
  const base = generateRibbonSmallCandidate(seed ^ 0x51ed270b).grid
  const grid = base.map((row) => [...row]) as BinaryGrid
  const targetCells = Math.floor(randomBetween(random, 40, 55))
  let filledCells = grid.flat().filter(Boolean).length

  for (let stamp = 0; stamp < 28 && filledCells < targetCells; stamp += 1) {
    const filled = grid.flatMap((row, rowIndex) =>
      row.flatMap((cell, columnIndex) => cell ? [{ row: rowIndex, column: columnIndex }] : []),
    )
    const anchor = filled[Math.floor(random() * filled.length)]
    const stampWidth = 1 + Math.floor(random() * 4)
    const stampHeight = 1 + Math.floor(random() * 4)
    const top = Math.max(0, Math.min(size - stampHeight, anchor.row + Math.floor(random() * 3) - 1))
    const left = Math.max(0, Math.min(size - stampWidth, anchor.column + Math.floor(random() * 3) - 1))

    for (let row = top; row < top + stampHeight && filledCells < targetCells; row += 1) {
      for (let column = left; column < left + stampWidth && filledCells < targetCells; column += 1) {
        if (grid[row][column] === 0) {
          grid[row][column] = 1
          filledCells += 1
        }
      }
    }
  }

  return { grid, symmetry: 'none' }
}

function generateSmallCandidate(seed: number, difficulty: PuzzleDifficulty): {
  grid: BinaryGrid
  symmetry: 'vertical' | 'none'
} {
  const family = createRandom(seed ^ 0xc2b2ae35)()
  if (difficulty !== 'beginner') {
    return family < 0.55
      ? generateRibbonSmallCandidate(seed)
      : generateWovenSmallCandidate(seed)
  }
  if (family < 0.34) return generateSymmetricSmallCandidate(seed)
  if (family < 0.67) return generateRibbonSmallCandidate(seed)
  return generateBlockSmallCandidate(seed)
}

function generateCandidate(size: BoardSize, seed: number, difficulty: PuzzleDifficulty): {
  grid: BinaryGrid
  symmetry: 'vertical' | 'none'
} {
  if (size === 10) return generateSmallCandidate(seed, difficulty)

  const random = createRandom(seed)
  const symmetry = random() < CONFIG[size].symmetryChance ? 'vertical' : 'none'
  const peakRow = Math.floor(randomBetween(random, size * 0.3, size * 0.7))
  const edgeWidth = randomBetween(random, size * 0.08, size * 0.24)
  const curve = randomBetween(random, 0.48, 0.78)
  const spine = symmetry === 'vertical'
    ? (size - 1) / 2
    : Math.floor(randomBetween(random, size * 0.35, size * 0.65))
  const phase = randomBetween(random, 0, Math.PI * 2)
  const frequency = randomBetween(random, 0.45, 0.95)
  const grid = createEmptyGrid(size)

  for (let row = 0; row < size; row += 1) {
    const furthest = row < peakRow ? Math.max(1, peakRow) : Math.max(1, size - 1 - peakRow)
    const distance = Math.abs(row - peakRow) / furthest
    const rawWidth = size - (size - edgeWidth) * Math.pow(distance, curve)
    const width = symmetry === 'vertical'
      ? makeOddOrEven(rawWidth, size)
      : Math.max(1, Math.min(size, Math.round(rawWidth)))

    let left: number
    if (symmetry === 'vertical') {
      left = Math.floor((size - width) / 2)
    } else {
      const drift = Math.sin(row * frequency + phase) * Math.min(size * 0.13, width * 0.35)
      const idealLeft = Math.round(spine + drift - (width - 1) / 2)
      left = Math.max(0, Math.min(size - width, idealLeft))
      left = Math.min(left, spine)
      left = Math.max(left, spine - width + 1)
    }

    for (let column = left; column < left + width; column += 1) grid[row][column] = 1
  }

  return { grid, symmetry }
}

function lineResolvesImmediately(clues: readonly number[], lineLength: number): boolean {
  return clues.reduce((total, clue) => total + clue, 0) + Math.max(0, clues.length - 1) === lineLength
}

export function matchesPuzzleDifficulty(
  difficulty: PuzzleDifficulty,
  rowClues: readonly number[][],
  columnClues: readonly number[][],
): boolean {
  const clues = [...rowClues, ...columnClues]
  const lineLength = columnClues.length
  const analysis = analyzeLogicDifficulty(rowClues, columnClues)
  if (!analysis.solved) return false

  if (difficulty === 'beginner') return analysis.sweeps <= 4
  if (clues.some((line) => lineResolvesImmediately(line, lineLength))) return false

  if (difficulty === 'standard') {
    return analysis.sweeps >= 5
      && analysis.sweeps <= 6
      && analysis.openingDeductions <= 45
  }

  return analysis.sweeps >= 7
    && analysis.openingDeductions <= 30
    && analysis.maxSweepDeductions <= 45
}

function density(grid: BinaryGrid): number {
  const filled = grid.flat().filter(Boolean).length
  return filled / (grid.length * grid.length)
}

function hasSingleComponent(grid: BinaryGrid): boolean {
  const size = grid.length
  const first = grid.flatMap((row, rowIndex) =>
    row.map((cell, columnIndex) => ({ cell, row: rowIndex, column: columnIndex })),
  ).find(({ cell }) => cell === 1)
  if (!first) return false

  const seen = new Set<string>()
  const queue = [{ row: first.row, column: first.column }]

  while (queue.length > 0) {
    const current = queue.shift()!
    const key = `${current.row}:${current.column}`
    if (seen.has(key)) continue
    seen.add(key)

    for (const [row, column] of [
      [current.row - 1, current.column],
      [current.row + 1, current.column],
      [current.row, current.column - 1],
      [current.row, current.column + 1],
    ]) {
      if (row >= 0 && row < size && column >= 0 && column < size && grid[row][column] === 1) {
        queue.push({ row, column })
      }
    }
  }

  return seen.size === grid.flat().filter(Boolean).length
}

export function validatePuzzleCandidate(
  size: BoardSize,
  seed: number,
  difficulty: PuzzleDifficulty = 'beginner',
): Puzzle | null {
  const { grid, symmetry } = generateCandidate(size, seed, difficulty)
  const fillDensity = density(grid)
  if (fillDensity < 0.35 || fillDensity > 0.55) return null
  if (!hasSingleComponent(grid)) return null
  if (grid.some((row) => row.every((cell) => cell === 0))) return null
  if (grid[0].some((_, column) => grid.every((row) => row[column] === 0))) return null

  const { rowClues, columnClues } = getGridClues(grid)
  const maxRuns = CONFIG[size].maxRuns
  if ([...rowClues, ...columnClues].some((clues) => clues.length > maxRuns)) return null

  const logic = solveByLogic(rowClues, columnClues)
  if (!logic.solved || !boardMatchesSolution(logic.board, grid)) return null
  if (size === 10 && !matchesPuzzleDifficulty(difficulty, rowClues, columnClues)) return null
  if (countSolutions(rowClues, columnClues) !== 1) return null

  return {
    size,
    seed: seed >>> 0,
    solution: grid,
    rowClues,
    columnClues,
    symmetry,
  }
}

export function generatePuzzleSync(
  size: BoardSize,
  startSeed: number,
  maxAttempts = 20_000,
  difficulty: PuzzleDifficulty = 'beginner',
): Puzzle {
  let seed = startSeed >>> 0
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const puzzle = validatePuzzleCandidate(size, seed, difficulty)
    if (puzzle) return puzzle
    seed = (seed + 0x9e3779b9) >>> 0
  }
  throw new Error(`Unable to generate a valid ${size}×${size} puzzle after ${maxAttempts} attempts.`)
}

export function randomSeed(): number {
  const values = new Uint32Array(1)
  crypto.getRandomValues(values)
  return values[0]
}
