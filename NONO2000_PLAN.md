# NONO2000 product and implementation notes

## Product

NONO2000 is a local-first nonogram game inspired by the clean, colorful puzzle interfaces of the early 2000s. The game generates a new validated puzzle whenever the player asks for one.

The current board sizes are:

- 5x5
- 10x10
- 15x15

The 10x10 board also has Beginner, Standard, and Hard generation profiles. Board size and difficulty shape the generator. They do not change the rules.

## Rules

1. Each row and column has clues describing consecutive runs of filled cells.
2. Separate clue numbers require at least one empty cell between their runs.
3. Left-clicking fills a cell. Right-clicking crosses a cell.
4. Marked cells remain locked for the current attempt.
5. A wrong mark remains visible and stops the current drag.
6. A wrong Cross on a required cell still counts as a fill and keeps its red error X.
7. Completing a row or column crosses its remaining empty cells.
8. The puzzle finishes when every required cell is filled.

## Session options

- Relaxed mode has no visible timer.
- Timed modes last 1, 2, or 5 minutes.
- Each wrong Fill or Cross removes 15 seconds in timed mode.
- Pause stops the countdown. A board interaction resumes play.
- Reset clears the current attempt and keeps the puzzle.
- New generates another puzzle using the current settings.

## Puzzle generation

The generator runs in a Web Worker. It uses an internal random seed, extracts row and column clues, and rejects a candidate unless:

- it satisfies the size-specific shape constraints;
- it has exactly one solution;
- the line-pattern solver can finish it with forced deductions;
- the seed reproduces the same accepted puzzle.

Seeds stay internal. Players can generate as many new puzzles as they want.

## Interface

- The title screen uses the NONO2000 wordmark and opens a separate puzzle setup card.
- The setup card contains grid size, 10x10 difficulty, and timer selection.
- The game screen keeps its system menu in the top-left and centers the board.
- Row and column clues use the same placement as the board they describe.
- Filled cells use the cyan textured keycap treatment.
- Crosses and major grid dividers use orange.
- Sounds and music have separate controls.
- The solved screen reports either a clean 100% solve or the number of mistakes.

## Technical shape

- Vite
- React
- TypeScript
- Vitest and Testing Library
- No backend, account, analytics, or persistence
- GitHub Pages deployment through GitHub Actions

## Verification

The automated suite covers clue extraction, solving, solution counting, deterministic generation, generator constraints, timers, marking, drag behavior, right-click, reset, new puzzle, size changes, pause and resume, completion, and result feedback.

Run the standard checks with:

```bash
npm test
npm run build
```

Run the 100-puzzle-per-size generation check with:

```bash
npm run test:soak
```
