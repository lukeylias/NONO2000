import { useCallback, useEffect, useRef, useState } from 'react'
import { AchievementsModal } from './components/AchievementsModal'
import { BrandLogo } from './components/BrandLogo'
import { BootScreen } from './components/BootScreen'
import { CommandMenu } from './components/CommandMenu'
import { HowToPlay } from './components/HowToPlay'
import { LostPuzzle } from './components/LostPuzzle'
import { PuzzleBoard } from './components/PuzzleBoard'
import { PuzzleSetup } from './components/PuzzleSetup'
import { SolvedPuzzle } from './components/SolvedPuzzle'
import {
  applyPlayerMark,
  formatElapsed,
  getCountdownValue,
  hasCountdownExpired,
  isPuzzleComplete,
  solveLine,
} from './game/play'
import {
  applyMistakeTimePenalty,
  MISTAKE_TIME_PENALTY_MS,
  type ScoreEventKind,
} from './game/score'
import {
  advancePerfectStreak,
  achievementsForAttempt,
  breakPerfectStreak,
  loadPlayerRecord,
  savePlayerRecord,
  unlockAchievements,
  type AchievementId,
} from './game/achievements'
import {
  initialHintsForMode,
  modeLabel,
  resolveTimedLimitMs,
  type AttemptRecord,
} from './game/modes'
import { gameMusic } from './game/music'
import { nono2000Sound, type SoundCue } from './game/sound'
import {
  createMarkGrid,
  type BoardSize,
  type CellMark,
  type GameMode,
  type MarkGrid,
  type PaintMode,
  type Puzzle,
  type PuzzleDifficulty,
  type TimedPreset,
} from './game/types'

type GameStatus = 'generating' | 'playing' | 'perfect-failed' | 'solved' | 'lost'
const PERFECT_FAILURE_REVEAL_DELAY_MS = 700
type HintAxis = 'row' | 'column'

interface WorkerResponse {
  type: 'generated'
  requestId: number
  puzzle: Puzzle
}

export function App() {
  const [booted, setBooted] = useState(false)
  const [size, setSize] = useState<BoardSize>(5)
  const [difficulty, setDifficulty] = useState<PuzzleDifficulty>('beginner')
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [marks, setMarks] = useState<MarkGrid>(() => createMarkGrid(5))
  const [paintMode, setPaintMode] = useState<PaintMode>('filled')
  const [status, setStatus] = useState<GameStatus>('generating')
  const [elapsed, setElapsed] = useState(0)
  const [timerKey, setTimerKey] = useState(0)
  const [showRules, setShowRules] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [soundOn, setSoundOn] = useState(true)
  const [musicOn, setMusicOn] = useState(true)
  const [gameMode, setGameMode] = useState<GameMode>('relaxed')
  const [timedPreset, setTimedPreset] = useState<TimedPreset>(1)
  const [setupSize, setSetupSize] = useState<BoardSize>(5)
  const [setupDifficulty, setSetupDifficulty] = useState<PuzzleDifficulty>('beginner')
  const [setupMode, setSetupMode] = useState<GameMode>('relaxed')
  const [setupTimedPreset, setSetupTimedPreset] = useState<TimedPreset>(1)
  const [isPaused, setIsPaused] = useState(false)
  const [timePenaltyPulse, setTimePenaltyPulse] = useState(0)
  const [mistakes, setMistakes] = useState<Set<string>>(() => new Set())
  const [hintsRemaining, setHintsRemaining] = useState<number | null>(null)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [perfectEligible, setPerfectEligible] = useState(true)
  const [newlyUnlocked, setNewlyUnlocked] = useState<AchievementId[]>([])
  const [completedPerfectStreak, setCompletedPerfectStreak] = useState(0)
  const [endedPerfectStreak, setEndedPerfectStreak] = useState(0)
  const [playerRecord, setPlayerRecord] = useState(loadPlayerRecord)
  const worker = useRef<Worker | null>(null)
  const requestId = useRef(0)
  const startedAt = useRef(0)
  const pausedElapsed = useRef(0)
  const soundEnabled = useRef(true)
  const musicEnabled = useRef(true)
  const setupPausedGame = useRef(false)
  const recordedAttempt = useRef<string | null>(null)
  const perfectFailureTimeout = useRef<number | null>(null)
  const countdownOn = gameMode === 'timed'
  const timeLimitMs = gameMode === 'timed' ? resolveTimedLimitMs(timedPreset) : 0
  const attemptRecord: AttemptRecord = {
    mode: gameMode,
    elapsedTimeMs: elapsed,
    hintsUsed,
    mistakes: mistakes.size,
    perfectEligible,
  }

  const playSound = useCallback((cue: SoundCue) => {
    if (soundEnabled.current) nono2000Sound.play(cue)
  }, [])

  useEffect(() => {
    gameMusic.setEnabled(true)
  }, [])

  const restartTimer = useCallback(() => {
    setElapsed(0)
    setIsPaused(false)
    pausedElapsed.current = 0
    startedAt.current = performance.now()
    setTimerKey((key) => key + 1)
  }, [])

  const resetAttemptState = useCallback((mode: GameMode) => {
    if (perfectFailureTimeout.current !== null) {
      window.clearTimeout(perfectFailureTimeout.current)
      perfectFailureTimeout.current = null
    }
    setElapsed(0)
    setIsPaused(false)
    pausedElapsed.current = 0
    setTimePenaltyPulse(0)
    setMistakes(new Set())
    setHintsRemaining(initialHintsForMode(mode))
    setHintsUsed(0)
    setPerfectEligible(true)
    setNewlyUnlocked([])
    setCompletedPerfectStreak(0)
    setEndedPerfectStreak(0)
    recordedAttempt.current = null
  }, [])

  useEffect(() => () => {
    if (perfectFailureTimeout.current !== null) {
      window.clearTimeout(perfectFailureTimeout.current)
    }
  }, [])

  const requestPuzzle = useCallback((
    nextSize: BoardSize,
    nextDifficulty: PuzzleDifficulty = difficulty,
    nextMode: GameMode = gameMode,
    nextTimedPreset: TimedPreset = timedPreset,
  ) => {
    const nextRequestId = requestId.current + 1
    requestId.current = nextRequestId
    setSize(nextSize)
    setDifficulty(nextDifficulty)
    setGameMode(nextMode)
    setTimedPreset(nextTimedPreset)
    setPuzzle(null)
    setMarks(createMarkGrid(nextSize))
    setPaintMode('filled')
    resetAttemptState(nextMode)
    setStatus('generating')
    worker.current?.postMessage({
      type: 'generate',
      requestId: nextRequestId,
      size: nextSize,
      difficulty: nextDifficulty,
    })
  }, [difficulty, gameMode, resetAttemptState, timedPreset])

  useEffect(() => {
    const generator = new Worker(new URL('./game/generator.worker.ts', import.meta.url), {
      type: 'module',
    })
    worker.current = generator
    generator.onmessage = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.type !== 'generated' || event.data.requestId !== requestId.current) return
      setPuzzle(event.data.puzzle)
      setMarks(createMarkGrid(event.data.puzzle.size))
      setStatus('playing')
      restartTimer()
      playSound('ready')
    }

    return () => {
      generator.terminate()
      worker.current = null
    }
  }, [playSound, restartTimer])

  useEffect(() => {
    if (status !== 'playing' || isPaused) return
    const update = () => setElapsed(performance.now() - startedAt.current)
    update()
    const timer = window.setInterval(update, 100)
    return () => window.clearInterval(timer)
  }, [isPaused, status, timerKey])

  useEffect(() => {
    if (status !== 'playing' || !puzzle || isPaused) return
    if (countdownOn && hasCountdownExpired(elapsed, timeLimitMs)) {
      setStatus('lost')
      playSound('lose')
      return
    }
    if (isPuzzleComplete(marks, puzzle.solution)) {
      setStatus('solved')
      playSound('solve')
    }
  }, [countdownOn, elapsed, isPaused, marks, playSound, puzzle, status, timeLimitMs])

  useEffect(() => {
    if (status !== 'solved' || !puzzle) return
    const attemptKey = `${puzzle.seed}:${timerKey}`
    if (recordedAttempt.current === attemptKey) return
    recordedAttempt.current = attemptKey

    const progressedRecord = gameMode === 'perfect'
      ? advancePerfectStreak(playerRecord)
      : playerRecord
    if (gameMode === 'perfect') setCompletedPerfectStreak(progressedRecord.perfectStreak)

    const eligibleAchievements = achievementsForAttempt({
      mode: attemptRecord.mode,
      perfectEligible: attemptRecord.perfectEligible,
    })
    const result = unlockAchievements(progressedRecord, eligibleAchievements, new Date().toISOString())
    setNewlyUnlocked(result.unlocked)
    if (result.record !== playerRecord) {
      setPlayerRecord(result.record)
      savePlayerRecord(result.record)
    }
  }, [attemptRecord.mode, attemptRecord.perfectEligible, playerRecord, puzzle, status, timerKey])

  const paint = (row: number, column: number, mark: CellMark) => {
    if (status !== 'playing' || !puzzle) return
    setMarks((current) => applyPlayerMark(current, puzzle.solution, row, column, mark))
  }

  const useHint = (axis: HintAxis, index: number) => {
    if (
      status !== 'playing'
      || !puzzle
      || gameMode === 'perfect'
      || (hintsRemaining !== null && hintsRemaining <= 0)
    ) return
    setMarks((current) => solveLine(current, puzzle.solution, axis, index))
    if (hintsRemaining !== null) {
      setHintsRemaining((current) => current === null ? null : Math.max(0, current - 1))
    }
    setHintsUsed((current) => current + 1)
    if (gameMode === 'timed') applyTimedPenalty()
  }

  const applyTimedPenalty = () => {
    if (gameMode !== 'timed') return
    const elapsedBeforePenalty = performance.now() - startedAt.current
    startedAt.current -= MISTAKE_TIME_PENALTY_MS
    setElapsed(applyMistakeTimePenalty(elapsedBeforePenalty))
    setTimePenaltyPulse((current) => current + 1)
  }

  const recordScore = (row: number, column: number, kind: ScoreEventKind) => {
    if (status !== 'playing' || !puzzle) return

    if (kind !== 'mistake') return

    setMistakes((current) => {
      const next = new Set(current)
      next.add(`${row}:${column}`)
      return next
    })

    if (gameMode === 'perfect') {
      setPerfectEligible(false)
      setEndedPerfectStreak(playerRecord.perfectStreak)
      const nextRecord = breakPerfectStreak(playerRecord)
      if (nextRecord !== playerRecord) {
        setPlayerRecord(nextRecord)
        savePlayerRecord(nextRecord)
      }
      setStatus('perfect-failed')
      perfectFailureTimeout.current = window.setTimeout(() => {
        perfectFailureTimeout.current = null
        setStatus('lost')
        playSound('lose')
      }, PERFECT_FAILURE_REVEAL_DELAY_MS)
      return
    }
    if (gameMode === 'timed') applyTimedPenalty()
  }

  const reset = () => {
    if (!puzzle) return
    setMarks(createMarkGrid(puzzle.size))
    setStatus('playing')
    resetAttemptState(gameMode)
    restartTimer()
  }

  const toggleSound = () => {
    const next = !soundEnabled.current
    soundEnabled.current = next
    setSoundOn(next)
    if (next) nono2000Sound.play('click')
  }

  const toggleMusic = () => {
    const next = !musicEnabled.current
    musicEnabled.current = next
    setMusicOn(next)
    gameMusic.setEnabled(next)
  }

  const startMusicIfEnabled = () => {
    if (musicEnabled.current) gameMusic.setEnabled(true)
  }

  const pauseTimer = () => {
    const frozenElapsed = performance.now() - startedAt.current
    pausedElapsed.current = frozenElapsed
    setElapsed(frozenElapsed)
    setIsPaused(true)
  }

  const togglePause = () => {
    if (!countdownOn || status !== 'playing') return

    if (isPaused) {
      resumeTimer()
      return
    }

    pauseTimer()
  }

  const resumeTimer = () => {
    startedAt.current = performance.now() - pausedElapsed.current
    setIsPaused(false)
    setTimerKey((key) => key + 1)
  }

  const resumeOnBoardInteraction = () => {
    if (countdownOn && isPaused && status === 'playing') resumeTimer()
  }

  const clickThen = (action: () => void) => {
    playSound('click')
    action()
  }

  const openAchievements = () => {
    setShowMenu(false)
    setShowAchievements(true)
  }

  const openSetup = () => {
    setSetupSize(5)
    setSetupDifficulty('beginner')
    setSetupMode('relaxed')
    setSetupTimedPreset(1)
    setShowMenu(false)
    setShowSetup(true)

    const shouldPause = booted && countdownOn && status === 'playing' && !isPaused
    setupPausedGame.current = shouldPause
    if (shouldPause) pauseTimer()
  }

  const closeSetup = () => {
    setShowSetup(false)
    if (setupPausedGame.current && status === 'playing') resumeTimer()
    setupPausedGame.current = false
  }

  const beginSetupPuzzle = () => {
    const nextDifficulty = setupMode === 'perfect' ? 'hard' : setupDifficulty
    setShowSetup(false)
    setBooted(true)
    setSize(setupSize)
    setDifficulty(nextDifficulty)
    setGameMode(setupMode)
    setTimedPreset(setupTimedPreset)
    setupPausedGame.current = false
    requestPuzzle(setupSize, nextDifficulty, setupMode, setupTimedPreset)
  }

  const chooseSetupSize = (nextSize: BoardSize) => {
    clickThen(() => setSetupSize(nextSize))
  }

  const chooseSetupDifficulty = (nextDifficulty: PuzzleDifficulty) => {
    clickThen(() => setSetupDifficulty(nextDifficulty))
  }

  const chooseSetupMode = (nextMode: GameMode) => {
    clickThen(() => {
      setSetupMode(nextMode)
      if (nextMode === 'perfect') setSetupDifficulty('hard')
    })
  }

  const chooseSetupTimedPreset = (nextPreset: TimedPreset) => {
    clickThen(() => setSetupTimedPreset(nextPreset))
  }

  const disconnect = () => {
    clickThen(() => {
      requestId.current += 1
      setBooted(false)
      setPuzzle(null)
      setMarks(createMarkGrid(size))
      setElapsed(0)
      setMistakes(new Set())
      setStatus('generating')
      setShowMenu(false)
      setShowSetup(false)
      setShowAchievements(false)
      setupPausedGame.current = false
    })
  }

  const timerValue = getCountdownValue(elapsed, timeLimitMs)
  const timerLabel = isPaused ? 'Paused' : 'Time left'
  const timerUrgent = countdownOn && !isPaused && status === 'playing' && timerValue <= 30_000

  const systemPanel = (
    <aside className="system-panel" aria-label="Game system panel">
      <header className="terminal-header">
        <div className="terminal-title">
          <strong>
            <BrandLogo variant="header" />
          </strong>
        </div>
      </header>

      <div className="game-topline">
        <p>{difficulty} · {size}×{size} grid · {modeLabel(gameMode)}</p>
        <div className="panel-game-actions" aria-label="Puzzle actions">
          <button onClick={() => clickThen(openSetup)}>
            New Puzzle
          </button>
          <button onClick={() => clickThen(reset)}>Replay Puzzle</button>
          <button
            className="is-primary"
            onClick={() => clickThen(() => requestPuzzle(size, difficulty, gameMode, timedPreset))}
          >
            Next Puzzle
          </button>
        </div>
        <div className="panel-quick-settings" aria-label="Quick settings">
          <button
            aria-label="Open system menu"
            className="panel-menu-trigger"
            onClick={() => clickThen(() => setShowMenu(true))}
          >
            <span>System</span>
            <strong>Menu</strong>
          </button>
          <button
            aria-label={`Sounds: ${soundOn ? 'On' : 'Off'}`}
            aria-pressed={soundOn}
            onClick={() => clickThen(toggleSound)}
          >
            <span>Sound</span>
            <strong>{soundOn ? 'On' : 'Off'}</strong>
          </button>
          <button
            aria-label={`Music: ${musicOn ? 'On' : 'Off'}`}
            aria-pressed={musicOn}
            onClick={() => clickThen(toggleMusic)}
          >
            <span>Music</span>
            <strong>{musicOn ? 'On' : 'Off'}</strong>
          </button>
        </div>
        <div className="session-metrics">
          {countdownOn ? (
            <div className="timer-wrap">
              <div
                className={`timer ${timerUrgent ? 'is-urgent' : ''} ${isPaused ? 'is-paused' : ''}`}
                aria-label={`${timerLabel} ${formatElapsed(timerValue)}`}
              >
                <span>{timerLabel}</span>
                <strong>{formatElapsed(timerValue)}</strong>
              </div>
              <button
                aria-label={isPaused ? 'Resume timer' : 'Pause timer'}
                aria-pressed={isPaused}
                className={`timer-pause-button ${isPaused ? 'is-paused' : ''}`}
                onClick={() => clickThen(togglePause)}
              >
                {isPaused ? (
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M7 4.8v14.4L19 12 7 4.8Z" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M6.5 5h4v14h-4zM13.5 5h4v14h-4z" />
                  </svg>
                )}
              </button>
              {timePenaltyPulse > 0 ? (
                <span className="time-penalty" key={timePenaltyPulse}>-15 sec</span>
              ) : null}
            </div>
          ) : gameMode === 'perfect' ? (
            <div
              aria-label={`Perfect streak ${playerRecord.perfectStreak}, best ${playerRecord.bestPerfectStreak}`}
              className="perfect-streak-metric"
              role="status"
            >
              <span>Perfect streak</span>
              <strong>{playerRecord.perfectStreak}</strong>
              <small>Best {playerRecord.bestPerfectStreak}</small>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )

  const sharedOverlays = (
    <>
      {showMenu ? (
        <CommandMenu
          inSession={booted}
          onAchievements={() => clickThen(openAchievements)}
          onClose={() => clickThen(() => setShowMenu(false))}
          onDisconnect={disconnect}
          onRules={() => clickThen(() => {
            setShowMenu(false)
            setShowRules(true)
          })}
          onToggleMusic={() => clickThen(toggleMusic)}
          onToggleSound={toggleSound}
          musicOn={musicOn}
          soundOn={soundOn}
        />
      ) : null}
      {booted && showSetup ? (
        <PuzzleSetup
          bestPerfectStreak={playerRecord.bestPerfectStreak}
          currentPerfectStreak={playerRecord.perfectStreak}
          difficulty={setupDifficulty}
          mode={setupMode}
          onBack={() => clickThen(closeSetup)}
          onSelectDifficulty={chooseSetupDifficulty}
          onSelectMode={chooseSetupMode}
          onSelectSize={chooseSetupSize}
          onSelectTimedPreset={chooseSetupTimedPreset}
          onStart={() => clickThen(beginSetupPuzzle)}
          presentation="modal"
          size={setupSize}
          timedPreset={setupTimedPreset}
        />
      ) : null}
      {showRules ? <HowToPlay onClose={() => clickThen(() => setShowRules(false))} /> : null}
      {showAchievements ? (
        <AchievementsModal
          onClose={() => clickThen(() => setShowAchievements(false))}
          record={playerRecord}
        />
      ) : null}
    </>
  )

  if (!booted) {
    return (
      <div
        className="terminal-shell is-booting"
        onKeyDown={startMusicIfEnabled}
        onPointerDown={startMusicIfEnabled}
      >
        {showSetup ? (
          <PuzzleSetup
            bestPerfectStreak={playerRecord.bestPerfectStreak}
            currentPerfectStreak={playerRecord.perfectStreak}
            difficulty={setupDifficulty}
            mode={setupMode}
            onBack={() => clickThen(closeSetup)}
            onSelectDifficulty={chooseSetupDifficulty}
            onSelectMode={chooseSetupMode}
            onSelectSize={chooseSetupSize}
            onSelectTimedPreset={chooseSetupTimedPreset}
            onStart={() => clickThen(beginSetupPuzzle)}
            size={setupSize}
            timedPreset={setupTimedPreset}
          />
        ) : (
          <BootScreen
            onAchievements={() => clickThen(openAchievements)}
            onRules={() => clickThen(() => setShowRules(true))}
            onStart={() => clickThen(openSetup)}
            onToggleMusic={() => clickThen(toggleMusic)}
            onToggleSound={toggleSound}
            musicOn={musicOn}
            soundOn={soundOn}
          />
        )}
        {sharedOverlays}
      </div>
    )
  }

  return (
    <div
      className="terminal-shell"
      onKeyDown={startMusicIfEnabled}
      onPointerDown={startMusicIfEnabled}
    >
      <main className="game-main">

        <section className={`game-card is-${status}`}>
          {status === 'generating' || !puzzle ? (
            <div className="generating-state" aria-live="polite">
              <div className="terminal-cursor" aria-hidden="true" />
              <p>Generating puzzle</p>
              <span>Checking clue sequence...</span>
            </div>
          ) : status === 'solved' ? (
            <SolvedPuzzle
              bestPerfectStreak={playerRecord.bestPerfectStreak}
              elapsed={attemptRecord.elapsedTimeMs}
              mistakeCells={mistakes}
              hintsUsed={attemptRecord.hintsUsed}
              mode={attemptRecord.mode}
              onNewPuzzle={() => clickThen(openSetup)}
              onNextPuzzle={() => clickThen(() => requestPuzzle(size, difficulty, gameMode, timedPreset))}
              onReplay={() => clickThen(reset)}
              perfectEligible={attemptRecord.perfectEligible}
              perfectStreak={completedPerfectStreak}
              puzzle={puzzle}
              unlockedAchievements={newlyUnlocked}
            />
          ) : status === 'lost' ? (
            <LostPuzzle
              bestPerfectStreak={playerRecord.bestPerfectStreak}
              endedPerfectStreak={endedPerfectStreak}
              onNewPuzzle={() => clickThen(openSetup)}
              onNextPuzzle={() => clickThen(() => requestPuzzle(size, difficulty, gameMode, timedPreset))}
              onRetry={() => clickThen(reset)}
              reason={gameMode === 'perfect' ? 'perfect' : 'timeout'}
            />
          ) : (
            <>
              <PuzzleBoard
                cornerContent={systemPanel}
                key={`${puzzle.seed}:${timerKey}`}
                marks={marks}
                mode={paintMode}
                hintsRemaining={hintsRemaining}
                hintsDisabledReason={gameMode === 'perfect'
                  ? 'Hints unavailable in Perfect mode'
                  : undefined}
                onFeedback={playSound}
                onInteraction={resumeOnBoardInteraction}
                onHint={gameMode === 'perfect' ? undefined : useHint}
                onModeChange={(nextMode) => clickThen(() => setPaintMode(nextMode))}
                onPaint={paint}
                onScoreEvent={recordScore}
                puzzle={puzzle}
              />
            </>
          )}
        </section>
      </main>

      {sharedOverlays}
    </div>
  )
}
