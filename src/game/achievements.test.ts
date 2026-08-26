import { describe, expect, it, vi } from 'vitest'
import {
  PLAYER_RECORD_STORAGE_KEY,
  achievementsForAttempt,
  advancePerfectStreak,
  breakPerfectStreak,
  emptyPlayerRecord,
  loadPlayerRecord,
  parsePlayerRecord,
  savePlayerRecord,
  unlockAchievements,
} from './achievements'

describe('device-local achievements', () => {
  it('recovers from missing, malformed, and incompatible records', () => {
    expect(parsePlayerRecord(null)).toEqual(emptyPlayerRecord())
    expect(parsePlayerRecord('{broken')).toEqual(emptyPlayerRecord())
    expect(parsePlayerRecord('{"version":2,"achievements":{}}')).toEqual(emptyPlayerRecord())
  })

  it('keeps only valid achievement dates', () => {
    expect(parsePlayerRecord(JSON.stringify({
      version: 1,
      achievements: {
        'first-decode': '2026-08-26T01:02:03.000Z',
        'against-the-clock': 'not-a-date',
        invented: '2026-08-26T01:02:03.000Z',
      },
    }))).toEqual({
      version: 1,
      achievements: { 'first-decode': '2026-08-26T01:02:03.000Z' },
      perfectStreak: 0,
      bestPerfectStreak: 0,
    })
  })

  it('migrates older records and sanitises streak counts', () => {
    expect(parsePlayerRecord(JSON.stringify({ version: 1, achievements: {} }))).toEqual(emptyPlayerRecord())
    expect(parsePlayerRecord(JSON.stringify({
      version: 1,
      achievements: {},
      perfectStreak: 4,
      bestPerfectStreak: 2,
    }))).toMatchObject({ perfectStreak: 4, bestPerfectStreak: 4 })
    expect(parsePlayerRecord(JSON.stringify({
      version: 1,
      achievements: {},
      perfectStreak: -2,
      bestPerfectStreak: 7.5,
    }))).toMatchObject({ perfectStreak: 0, bestPerfectStreak: 0 })
  })

  it('evaluates the three starter requirements', () => {
    expect(achievementsForAttempt({ mode: 'relaxed', perfectEligible: true })).toEqual(['first-decode'])
    expect(achievementsForAttempt({ mode: 'timed', perfectEligible: true })).toEqual([
      'first-decode', 'against-the-clock',
    ])
    expect(achievementsForAttempt({ mode: 'perfect', perfectEligible: true })).toEqual([
      'first-decode', 'perfect-signal',
    ])
    expect(achievementsForAttempt({ mode: 'perfect', perfectEligible: false })).toEqual(['first-decode'])
  })

  it('unlocks permanently and idempotently with the first completion date', () => {
    const first = unlockAchievements(emptyPlayerRecord(), ['first-decode'], '2026-08-26T01:00:00.000Z')
    const second = unlockAchievements(first.record, ['first-decode'], '2026-08-27T01:00:00.000Z')

    expect(first.unlocked).toEqual(['first-decode'])
    expect(second.unlocked).toEqual([])
    expect(second.record).toBe(first.record)
    expect(second.record.achievements['first-decode']).toBe('2026-08-26T01:00:00.000Z')
  })

  it('advances, preserves, and breaks a Perfect streak', () => {
    const first = advancePerfectStreak(emptyPlayerRecord())
    const second = advancePerfectStreak(first)
    const broken = breakPerfectStreak(second)

    expect(second).toMatchObject({ perfectStreak: 2, bestPerfectStreak: 2 })
    expect(broken).toMatchObject({ perfectStreak: 0, bestPerfectStreak: 2 })
    expect(breakPerfectStreak(broken)).toBe(broken)
  })

  it('loads, saves, and tolerates unavailable storage', () => {
    const setItem = vi.fn()
    const storage = {
      getItem: vi.fn(() => null),
      setItem,
    } as unknown as Storage
    const record = emptyPlayerRecord()

    expect(loadPlayerRecord(storage)).toEqual(record)
    savePlayerRecord(record, storage)
    expect(setItem).toHaveBeenCalledWith(PLAYER_RECORD_STORAGE_KEY, JSON.stringify(record))

    const unavailable = {
      getItem: vi.fn(() => { throw new Error('blocked') }),
      setItem: vi.fn(() => { throw new Error('blocked') }),
    } as unknown as Storage
    expect(loadPlayerRecord(unavailable)).toEqual(record)
    expect(() => savePlayerRecord(record, unavailable)).not.toThrow()
  })
})
