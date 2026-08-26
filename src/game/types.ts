export const BOARD_SIZES = [5, 10, 15] as const
export const GAME_MODES = ['relaxed', 'timed', 'perfect'] as const
export const TIMED_PRESETS = [1, 2, 5] as const

export type BoardSize = (typeof BOARD_SIZES)[number]
export type GameMode = (typeof GAME_MODES)[number]
export type TimedPreset = (typeof TIMED_PRESETS)[number]
export type BinaryCell = 0 | 1
export type BinaryGrid = BinaryCell[][]
export type CellMark = 'unknown' | 'filled' | 'crossed'
export type MarkGrid = CellMark[][]
export type PaintMode = 'filled' | 'crossed'
export const PUZZLE_DIFFICULTIES = ['beginner', 'standard', 'hard'] as const
export type PuzzleDifficulty = (typeof PUZZLE_DIFFICULTIES)[number]

export interface Puzzle {
  size: BoardSize
  seed: number
  solution: BinaryGrid
  rowClues: number[][]
  columnClues: number[][]
  symmetry: 'vertical' | 'none'
}

export interface LogicResult {
  board: number[][]
  contradiction: boolean
  solved: boolean
  rounds: number
}

export const UNKNOWN = -1
export const EMPTY = 0
export const FILLED = 1

export function createMarkGrid(size: number): MarkGrid {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => 'unknown' as const),
  )
}
