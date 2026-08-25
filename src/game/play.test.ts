import { describe, expect, it } from 'vitest'
import { createMarkGrid, type BinaryGrid } from './types'
import {
  applyPlayerMark,
  cycleTimerMinutes,
  formatElapsed,
  getTimerValue,
  hasCountdownExpired,
  isLineSatisfied,
  isPuzzleComplete,
  solveLine,
  timerModeLabel,
  updateMark,
} from './play'

describe('play state', () => {
  it('locks a cell after its first mark without mutating the previous board', () => {
    const original = createMarkGrid(2)
    const filled = updateMark(original, 0, 0, 'filled')
    const crossed = updateMark(filled, 0, 0, 'crossed')

    expect(original[0][0]).toBe('unknown')
    expect(filled[0][0]).toBe('filled')
    expect(crossed).toBe(filled)
    expect(crossed[0][0]).toBe('filled')
  })

  it('checks clues from filled marks only', () => {
    expect(isLineSatisfied(['filled', 'filled', 'crossed', 'filled'], [2, 1])).toBe(true)
    expect(isLineSatisfied(['filled', 'crossed', 'filled', 'filled'], [2, 1])).toBe(false)
  })

  it('rejects a wrong Fill but counts a wrong Cross as the required fill', () => {
    const solution: BinaryGrid = [[1, 0], [0, 1]]
    const marks = createMarkGrid(2)

    expect(applyPlayerMark(marks, solution, 0, 1, 'filled')).toBe(marks)
    expect(applyPlayerMark(marks, solution, 0, 0, 'crossed')).toEqual([
      ['filled', 'crossed'],
      ['crossed', 'unknown'],
    ])
  })

  it('allows a wrong Cross to complete the puzzle as a filled square', () => {
    const solution: BinaryGrid = [[1, 0], [0, 1]]
    const marks = [
      ['unknown', 'crossed'],
      ['crossed', 'filled'],
    ] as const
    const next = applyPlayerMark(marks.map((row) => [...row]), solution, 0, 0, 'crossed')

    expect(isPuzzleComplete(next, solution)).toBe(true)
  })

  it('does not change an accepted fill or cross', () => {
    const solution: BinaryGrid = [[1, 0], [0, 1]]
    const marks = createMarkGrid(2)
    const filled = applyPlayerMark(marks, solution, 0, 0, 'filled')
    const crossed = applyPlayerMark(filled, solution, 0, 1, 'crossed')

    expect(applyPlayerMark(crossed, solution, 0, 0, 'crossed')).toBe(crossed)
    expect(applyPlayerMark(crossed, solution, 0, 1, 'filled')).toBe(crossed)
    expect(applyPlayerMark(crossed, solution, 0, 0, 'unknown')).toBe(crossed)
  })

  it('auto-crosses empty cells when a row and column are complete', () => {
    const solution: BinaryGrid = [[1, 0], [0, 1]]
    const marks = createMarkGrid(2)
    const next = applyPlayerMark(marks, solution, 0, 0, 'filled')

    expect(next).toEqual([
      ['filled', 'crossed'],
      ['crossed', 'unknown'],
    ])
  })

  it('solves a selected row or column without mutating the previous board', () => {
    const solution: BinaryGrid = [[1, 0], [0, 1]]
    const marks = createMarkGrid(2)

    const rowSolved = solveLine(marks, solution, 'row', 0)
    const columnSolved = solveLine(rowSolved, solution, 'column', 1)

    expect(marks).toEqual([
      ['unknown', 'unknown'],
      ['unknown', 'unknown'],
    ])
    expect(rowSolved).toEqual([
      ['filled', 'crossed'],
      ['unknown', 'unknown'],
    ])
    expect(columnSolved).toEqual([
      ['filled', 'crossed'],
      ['unknown', 'filled'],
    ])
  })

  it('ignores crosses when checking puzzle completion', () => {
    const solution: BinaryGrid = [[1, 0], [0, 1]]
    const marks = [
      ['filled', 'crossed'],
      ['unknown', 'filled'],
    ] as const

    expect(isPuzzleComplete(marks.map((row) => [...row]), solution)).toBe(true)
  })

  it('formats a compact running time', () => {
    expect(formatElapsed(0)).toBe('0:00.0')
    expect(formatElapsed(65_987)).toBe('1:05.9')
  })

  it('counts down from the selected duration and clamps at zero', () => {
    expect(formatElapsed(getTimerValue(0, 1))).toBe('1:00.0')
    expect(formatElapsed(getTimerValue(0, 2))).toBe('2:00.0')
    expect(formatElapsed(getTimerValue(0, 5))).toBe('5:00.0')
    expect(getTimerValue(30_000, 2)).toBe(90_000)
    expect(getTimerValue(125_000, 2)).toBe(0)
  })

  it('counts up when countdown is disabled', () => {
    expect(getTimerValue(65_987, 0)).toBe(65_987)
  })

  it('expires only when an enabled countdown reaches zero', () => {
    expect(hasCountdownExpired(59_999, 1)).toBe(false)
    expect(hasCountdownExpired(60_000, 1)).toBe(true)
    expect(hasCountdownExpired(299_999, 5)).toBe(false)
    expect(hasCountdownExpired(300_000, 5)).toBe(true)
    expect(hasCountdownExpired(180_000, 0)).toBe(false)
  })

  it('cycles through relaxed, one, two, and five minute modes', () => {
    expect(cycleTimerMinutes(0)).toBe(1)
    expect(cycleTimerMinutes(1)).toBe(2)
    expect(cycleTimerMinutes(2)).toBe(5)
    expect(cycleTimerMinutes(5)).toBe(0)
    expect(timerModeLabel(0)).toBe('Relaxed')
    expect(timerModeLabel(1)).toBe('1 minute')
    expect(timerModeLabel(5)).toBe('5 minutes')
  })
})
