import { describe, expect, it } from 'vitest'
import {
  classifyResult,
  initialHintsForMode,
  resolveTimedLimitMs,
  resolveTimedMinutes,
} from './modes'

describe('play modes', () => {
  it.each([1, 2, 5] as const)('uses a manual %i minute override', (preset) => {
    expect(resolveTimedMinutes(preset)).toBe(preset)
    expect(resolveTimedLimitMs(preset)).toBe(preset * 60_000)
  })

  it('defines mode-specific hint allowances', () => {
    expect(initialHintsForMode('relaxed')).toBeNull()
    expect(initialHintsForMode('timed')).toBe(3)
    expect(initialHintsForMode('perfect')).toBe(0)
  })

  it('classifies clean, assisted, and recovered attempts', () => {
    expect(classifyResult('relaxed', 0, 0, true)).toBe('clean')
    expect(classifyResult('timed', 1, 0, true)).toBe('assisted')
    expect(classifyResult('relaxed', 0, 1, true)).toBe('recovered')
    expect(classifyResult('perfect', 0, 0, false)).toBe('recovered')
  })
})
