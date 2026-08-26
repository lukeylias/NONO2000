import type { GameMode, TimedPreset } from './types'

export const TIMED_HINTS_PER_PUZZLE = 3

export type ResultOutcome = 'clean' | 'assisted' | 'recovered'

export interface AttemptRecord {
  mode: GameMode
  elapsedTimeMs: number
  hintsUsed: number
  mistakes: number
  perfectEligible: boolean
}

export function resolveTimedMinutes(preset: TimedPreset): number {
  return preset
}

export function resolveTimedLimitMs(preset: TimedPreset): number {
  return resolveTimedMinutes(preset) * 60_000
}

export function initialHintsForMode(mode: GameMode): number | null {
  if (mode === 'relaxed') return null
  if (mode === 'timed') return TIMED_HINTS_PER_PUZZLE
  return 0
}

export function modeLabel(mode: GameMode): string {
  if (mode === 'relaxed') return 'Relaxed'
  if (mode === 'timed') return 'Timed'
  return 'Perfect'
}

export function classifyResult(
  mode: GameMode,
  hintsUsed: number,
  mistakeCount: number,
  perfectEligible: boolean,
): ResultOutcome {
  if (mistakeCount > 0 || (mode === 'perfect' && !perfectEligible)) return 'recovered'
  if (hintsUsed > 0) return 'assisted'
  return 'clean'
}

export function resultOutcomeLabel(outcome: ResultOutcome): string {
  if (outcome === 'clean') return 'Clean solve'
  if (outcome === 'assisted') return 'Assisted solve'
  return 'Recovered solve'
}
