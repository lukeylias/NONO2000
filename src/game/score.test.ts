import { describe, expect, it } from 'vitest'
import {
  applyMistakeTimePenalty,
  MISTAKE_TIME_PENALTY_MS,
} from './score'

describe('timed mistake penalty', () => {
  it('adds 15 seconds to elapsed time', () => {
    expect(MISTAKE_TIME_PENALTY_MS).toBe(15_000)
    expect(applyMistakeTimePenalty(30_000)).toBe(45_000)
  })
})
