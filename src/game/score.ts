export const MISTAKE_TIME_PENALTY_MS = 15_000

export type ScoreEventKind = 'correct-fill' | 'mistake'

export function applyMistakeTimePenalty(elapsed: number): number {
  return elapsed + MISTAKE_TIME_PENALTY_MS
}
