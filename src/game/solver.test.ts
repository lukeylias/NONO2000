import { describe, expect, it } from 'vitest'
import { getGridClues, getLineClues } from './clues'
import { analyzeLogicDifficulty, countSolutions, getLinePatterns, solveByLogic } from './solver'
import type { BinaryGrid } from './types'

describe('clues', () => {
  it('extracts empty, solid, and separated runs', () => {
    expect(getLineClues([0, 0, 0])).toEqual([])
    expect(getLineClues([1, 1, 1])).toEqual([3])
    expect(getLineClues([1, 1, 0, 1, 0, 1, 1, 1])).toEqual([2, 1, 3])
  })
})

describe('line patterns', () => {
  it('enumerates every legal placement', () => {
    expect(getLinePatterns(5, [2, 1])).toHaveLength(3)
    expect(getLinePatterns(4, [])).toEqual([[0, 0, 0, 0]])
  })
})

describe('grid solving', () => {
  const heart: BinaryGrid = [
    [0, 1, 0, 1, 0],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0],
  ]

  it('solves a forced puzzle without guessing', () => {
    const clues = getGridClues(heart)
    const result = solveByLogic(clues.rowClues, clues.columnClues)

    expect(result.contradiction).toBe(false)
    expect(result.solved).toBe(true)
    expect(result.board).toEqual(heart)
    expect(countSolutions(clues.rowClues, clues.columnClues)).toBe(1)
    expect(analyzeLogicDifficulty(clues.rowClues, clues.columnClues)).toMatchObject({
      solved: true,
      sweeps: 4,
      openingDeductions: 11,
    })
  })

  it('detects more than one solution', () => {
    const rowClues = [[1], [1]]
    const columnClues = [[1], [1]]

    expect(solveByLogic(rowClues, columnClues).solved).toBe(false)
    expect(countSolutions(rowClues, columnClues)).toBe(2)
  })

  it('detects an impossible clue set', () => {
    expect(countSolutions([[2], []], [[2], []])).toBe(0)
  })
})
