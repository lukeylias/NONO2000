import { describe, expect, it } from 'vitest'
import { generatePuzzleSync } from './generator'
import { boardMatchesSolution, countSolutions, solveByLogic } from './solver'
import type { BoardSize, PuzzleDifficulty } from './types'

const samples = process.env.NONO2000_SOAK === '1' ? 100 : 2

for (const size of [5, 10, 15] as BoardSize[]) {
  describe(`${size}×${size} soak`, () => {
    it(`validates ${samples} accepted puzzles`, () => {
      const signatures = new Set<string>()

      for (let index = 0; index < samples; index += 1) {
        const startSeed = (Math.imul(index + 1, 0x45d9f3b) ^ 0x1234abcd) >>> 0
        const puzzle = generatePuzzleSync(size, startSeed, 50_000)
        const logic = solveByLogic(puzzle.rowClues, puzzle.columnClues)
        const density = puzzle.solution.flat().filter(Boolean).length / (size * size)
        const maxRuns = size <= 10 ? 2 : 3

        expect(density).toBeGreaterThanOrEqual(0.35)
        expect(density).toBeLessThanOrEqual(0.55)
        expect([...puzzle.rowClues, ...puzzle.columnClues].every((clues) => clues.length <= maxRuns)).toBe(true)
        expect(logic.solved).toBe(true)
        expect(boardMatchesSolution(logic.board, puzzle.solution)).toBe(true)
        expect(countSolutions(puzzle.rowClues, puzzle.columnClues)).toBe(1)
        signatures.add(puzzle.solution.flat().join(''))
      }

      if (size === 10) expect(signatures.size).toBeGreaterThanOrEqual(Math.ceil(samples * 0.75))
    }, samples === 100 ? 120_000 : 30_000)
  })
}

describe('10×10 difficulty soak', () => {
  for (const difficulty of ['beginner', 'standard', 'hard'] as PuzzleDifficulty[]) {
    it(`validates ${samples} ${difficulty} puzzles`, () => {
      const signatures = new Set<string>()

      for (let index = 0; index < samples; index += 1) {
        const startSeed = (Math.imul(index + 1, 0x27d4eb2d) ^ 0x9e3779b9) >>> 0
        const puzzle = generatePuzzleSync(10, startSeed, 100_000, difficulty)
        const logic = solveByLogic(puzzle.rowClues, puzzle.columnClues)

        expect(logic.solved).toBe(true)
        expect(boardMatchesSolution(logic.board, puzzle.solution)).toBe(true)
        expect(countSolutions(puzzle.rowClues, puzzle.columnClues)).toBe(1)
        signatures.add(puzzle.solution.flat().join(''))
      }

      expect(signatures.size).toBeGreaterThanOrEqual(Math.ceil(samples * 0.75))
    }, samples === 100 ? 120_000 : 30_000)
  }
})
