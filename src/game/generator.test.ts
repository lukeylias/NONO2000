import { describe, expect, it } from 'vitest'
import { getGridClues } from './clues'
import { generatePuzzleSync } from './generator'
import { analyzeLogicDifficulty, boardMatchesSolution, countSolutions, solveByLogic } from './solver'
import type { BoardSize, PuzzleDifficulty } from './types'

for (const size of [5, 10, 15] as BoardSize[]) {
  describe(`${size}×${size} generation`, () => {
    it('creates a deterministic, unique, logic-solvable puzzle', () => {
      const puzzle = generatePuzzleSync(size, 123456789, 50_000)
      const repeated = generatePuzzleSync(size, 123456789, 50_000)
      const clues = getGridClues(puzzle.solution)
      const logic = solveByLogic(puzzle.rowClues, puzzle.columnClues)

      expect(repeated.seed).toBe(puzzle.seed)
      expect(repeated.solution).toEqual(puzzle.solution)
      expect(clues.rowClues).toEqual(puzzle.rowClues)
      expect(clues.columnClues).toEqual(puzzle.columnClues)
      expect(logic.solved).toBe(true)
      expect(boardMatchesSolution(logic.board, puzzle.solution)).toBe(true)
      expect(countSolutions(puzzle.rowClues, puzzle.columnClues)).toBe(1)
    }, 30_000)
  })
}

describe('10×10 seed variety', () => {
  it('turns a spread of seeds into meaningfully different accepted boards', () => {
    const puzzles = Array.from({ length: 24 }, (_, index) => {
      const startSeed = (Math.imul(index + 1, 0x45d9f3b) ^ 0x17c9a31d) >>> 0
      return generatePuzzleSync(10, startSeed, 50_000)
    })
    const signatures = new Set(puzzles.map((puzzle) => puzzle.solution.flat().join('')))
    const symmetries = new Set(puzzles.map((puzzle) => puzzle.symmetry))

    expect(signatures.size).toBeGreaterThanOrEqual(18)
    expect(symmetries).toEqual(new Set(['vertical', 'none']))
    expect(puzzles.some((puzzle) =>
      [...puzzle.rowClues, ...puzzle.columnClues].some((clues) => clues.length === 2),
    )).toBe(true)
  }, 30_000)
})

describe('all-size difficulty bands', () => {
  const bands: Record<BoardSize, Record<PuzzleDifficulty, [number, number]>> = {
    5: {
      beginner: [1, 3],
      standard: [4, 5],
      hard: [6, Number.POSITIVE_INFINITY],
    },
    10: {
      beginner: [1, 4],
      standard: [5, 6],
      hard: [7, Number.POSITIVE_INFINITY],
    },
    15: {
      beginner: [1, 5],
      standard: [6, 8],
      hard: [9, Number.POSITIVE_INFINITY],
    },
  }

  for (const size of [5, 10, 15] as BoardSize[]) {
    for (const difficulty of ['beginner', 'standard', 'hard'] as PuzzleDifficulty[]) {
      it(`generates ${size}×${size} ${difficulty} puzzles in the intended deduction band`, () => {
        const signatures = new Set<string>()

        for (let index = 0; index < 8; index += 1) {
          const startSeed = (Math.imul(index + 1, 0x27d4eb2d) ^ 0x85ebca6b) >>> 0
          const puzzle = generatePuzzleSync(size, startSeed, 500_000, difficulty)
          const analysis = analyzeLogicDifficulty(puzzle.rowClues, puzzle.columnClues)
          const [minimum, maximum] = bands[size][difficulty]

          expect(analysis.sweeps).toBeGreaterThanOrEqual(minimum)
          expect(analysis.sweeps).toBeLessThanOrEqual(maximum)
          expect(countSolutions(puzzle.rowClues, puzzle.columnClues)).toBe(1)

          if (difficulty !== 'beginner' && size > 5) {
            expect([...puzzle.rowClues, ...puzzle.columnClues].every((clues) =>
              clues.reduce((total, clue) => total + clue, 0) + clues.length - 1 < size,
            )).toBe(true)
          }

          signatures.add(puzzle.solution.flat().join(''))
        }

        expect(signatures.size).toBeGreaterThanOrEqual(6)
      }, 60_000)
    }
  }
})
