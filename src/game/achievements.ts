import type { AttemptRecord } from './modes'

export const PLAYER_RECORD_STORAGE_KEY = 'nono2000.player-record.v1'

export const ACHIEVEMENT_IDS = [
  'first-decode',
  'against-the-clock',
  'perfect-signal',
] as const

export type AchievementId = (typeof ACHIEVEMENT_IDS)[number]

export interface AchievementDefinition {
  id: AchievementId
  name: string
  description: string
}

export interface PlayerRecord {
  version: 1
  achievements: Partial<Record<AchievementId, string>>
  perfectStreak: number
  bestPerfectStreak: number
}

export type CompletedAttempt = Pick<AttemptRecord, 'mode' | 'perfectEligible'>

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  {
    id: 'first-decode',
    name: 'First Decode',
    description: 'Complete any puzzle.',
  },
  {
    id: 'against-the-clock',
    name: 'Against the Clock',
    description: 'Complete a Timed puzzle before time expires.',
  },
  {
    id: 'perfect-signal',
    name: 'Perfect Streak',
    description: 'Complete Perfect puzzles without a mistake. One mistake resets the streak.',
  },
]

export function emptyPlayerRecord(): PlayerRecord {
  return {
    version: 1,
    achievements: {},
    perfectStreak: 0,
    bestPerfectStreak: 0,
  }
}

export function parsePlayerRecord(raw: string | null): PlayerRecord {
  if (!raw) return emptyPlayerRecord()

  try {
    const parsed = JSON.parse(raw) as Partial<PlayerRecord>
    if (parsed.version !== 1 || !parsed.achievements || typeof parsed.achievements !== 'object') {
      return emptyPlayerRecord()
    }

    const achievements: PlayerRecord['achievements'] = {}
    for (const id of ACHIEVEMENT_IDS) {
      const value = parsed.achievements[id]
      if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) achievements[id] = value
    }
    const perfectStreak = validStreak(parsed.perfectStreak) ? parsed.perfectStreak : 0
    const storedBest = validStreak(parsed.bestPerfectStreak) ? parsed.bestPerfectStreak : 0
    return {
      version: 1,
      achievements,
      perfectStreak,
      bestPerfectStreak: Math.max(perfectStreak, storedBest),
    }
  } catch {
    return emptyPlayerRecord()
  }
}

function validStreak(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0
}

function browserStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export function loadPlayerRecord(storage: Storage | null = browserStorage()): PlayerRecord {
  if (!storage) return emptyPlayerRecord()
  try {
    return parsePlayerRecord(storage.getItem(PLAYER_RECORD_STORAGE_KEY))
  } catch {
    return emptyPlayerRecord()
  }
}

export function savePlayerRecord(
  record: PlayerRecord,
  storage: Storage | null = browserStorage(),
): void {
  if (!storage) return
  try {
    storage.setItem(PLAYER_RECORD_STORAGE_KEY, JSON.stringify(record))
  } catch {
    // Local progress must never block the game.
  }
}

export function achievementsForAttempt(attempt: CompletedAttempt): AchievementId[] {
  const ids: AchievementId[] = ['first-decode']
  if (attempt.mode === 'timed') ids.push('against-the-clock')
  if (attempt.mode === 'perfect' && attempt.perfectEligible) ids.push('perfect-signal')
  return ids
}

export function unlockAchievements(
  record: PlayerRecord,
  ids: readonly AchievementId[],
  unlockedAt: string,
): { record: PlayerRecord; unlocked: AchievementId[] } {
  const achievements = { ...record.achievements }
  const unlocked = ids.filter((id) => !achievements[id])
  for (const id of unlocked) achievements[id] = unlockedAt
  return {
    record: unlocked.length > 0 ? { ...record, achievements } : record,
    unlocked,
  }
}

export function advancePerfectStreak(record: PlayerRecord): PlayerRecord {
  const perfectStreak = record.perfectStreak + 1
  return {
    ...record,
    perfectStreak,
    bestPerfectStreak: Math.max(record.bestPerfectStreak, perfectStreak),
  }
}

export function breakPerfectStreak(record: PlayerRecord): PlayerRecord {
  return record.perfectStreak === 0 ? record : { ...record, perfectStreak: 0 }
}

export function achievementDefinition(id: AchievementId): AchievementDefinition {
  return ACHIEVEMENTS.find((achievement) => achievement.id === id)!
}

export function formatAchievementDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}
