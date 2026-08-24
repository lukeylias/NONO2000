import { useCallback, useEffect, useRef, useState } from 'react'
import { BootScreen } from './components/BootScreen'
import { CommandMenu } from './components/CommandMenu'
import { HowToPlay } from './components/HowToPlay'
import { LostPuzzle } from './components/LostPuzzle'
import { PuzzleBoard } from './components/PuzzleBoard'
import { PuzzleSetup } from './components/PuzzleSetup'
import { SolvedPuzzle } from './components/SolvedPuzzle'
import {
  applyPlayerMark,
  cycleTimerMinutes,
  formatElapsed,
  getTimerValue,
  hasCountdownExpired,
  isPuzzleComplete,
  timerModeLabel,
} from './game/play'
import {
  applyMistakeTimePenalty,
  MISTAKE_TIME_PENALTY_MS,
  type ScoreEventKind,
} from './game/score'
import { gameMusic } from './game/music'
import { nono2000Sound, type SoundCue } from './game/sound'
import {
  BOARD_SIZES,
  PUZZLE_DIFFICULTIES,
  createMarkGrid,
  type BoardSize,
  type CellMark,
  type MarkGrid,
  type PaintMode,
  type Puzzle,
  type PuzzleDifficulty,
  type TimerMinutes,
} from './game/types'

type GameStatus = 'generating' | 'playing' | 'solved' | 'lost'

interface WorkerResponse {
  type: 'generated'
  requestId: number
  puzzle: Puzzle
}

export function App() {
  const [booted, setBooted] = useState(false)
  const [size, setSize] = useState<BoardSize>(10)
  const [difficulty, setDifficulty] = useState<PuzzleDifficulty>('standard')
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [marks, setMarks] = useState<MarkGrid>(() => createMarkGrid(10))
  const [paintMode, setPaintMode] = useState<PaintMode>('filled')
  const [status, setStatus] = useState<GameStatus>('generating')
  const [elapsed, setElapsed] = useState(0)
  const [timerKey, setTimerKey] = useState(0)
  const [showRules, setShowRules] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [soundOn, setSoundOn] = useState(true)
  const [musicOn, setMusicOn] = useState(true)
  const [timerMinutes, setTimerMinutes] = useState<TimerMinutes>(0)
  const [isPaused, setIsPaused] = useState(false)
  const [timePenaltyPulse, setTimePenaltyPulse] = useState(0)
  const [mistakes, setMistakes] = useState<Set<string>>(() => new Set())
  const worker = useRef<Worker | null>(null)
  const requestId = useRef(0)
  const startedAt = useRef(0)
  const pausedElapsed = useRef(0)
  const soundEnabled = useRef(true)
  const musicEnabled = useRef(true)
  const countdownOn = timerMinutes > 0

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

  const requestPuzzle = useCallback((
    nextSize: BoardSize,
    nextDifficulty: PuzzleDifficulty = difficulty,
  ) => {
    const nextRequestId = requestId.current + 1
    requestId.current = nextRequestId
    setSize(nextSize)
    setPuzzle(null)
    setMarks(createMarkGrid(nextSize))
    setPaintMode('filled')
    setElapsed(0)
    setIsPaused(false)
    pausedElapsed.current = 0
    setTimePenaltyPulse(0)
    setMistakes(new Set())
    setStatus('generating')
    worker.current?.postMessage({
      type: 'generate',
      requestId: nextRequestId,
      size: nextSize,
      difficulty: nextDifficulty,
    })
  }, [difficulty])

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
    if (isPuzzleComplete(marks, puzzle.solution)) {
      setStatus('solved')
      playSound('solve')
      return
    }
    if (hasCountdownExpired(elapsed, timerMinutes)) {
      setStatus('lost')
      playSound('lose')
    }
  }, [elapsed, isPaused, marks, playSound, puzzle, status, timerMinutes])

  const paint = (row: number, column: number, mark: CellMark) => {
    if (status !== 'playing' || !puzzle) return
    setMarks((current) => applyPlayerMark(current, puzzle.solution, row, column, mark))
  }

  const recordScore = (row: number, column: number, kind: ScoreEventKind) => {
    if (status !== 'playing' || !puzzle) return

    if (kind !== 'mistake') return

    setMistakes((current) => {
      const next = new Set(current)
      next.add(`${row}:${column}`)
      return next
    })

    if (countdownOn) {
      const elapsedBeforePenalty = performance.now() - startedAt.current
      startedAt.current -= MISTAKE_TIME_PENALTY_MS
      setElapsed(applyMistakeTimePenalty(elapsedBeforePenalty))
      setTimePenaltyPulse((current) => current + 1)
    }
  }

  const reset = () => {
    if (!puzzle) return
    setMarks(createMarkGrid(puzzle.size))
    setStatus('playing')
    setTimePenaltyPulse(0)
    setMistakes(new Set())
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

  const cycleTimerMode = () => {
    setTimerMinutes((current) => cycleTimerMinutes(current))
    setIsPaused(false)
    pausedElapsed.current = 0
    setTimePenaltyPulse(0)
    if (booted) restartTimer()
  }

  const togglePause = () => {
    if (!countdownOn || status !== 'playing') return

    if (isPaused) {
      resumeTimer()
      return
    }

    const frozenElapsed = performance.now() - startedAt.current
    pausedElapsed.current = frozenElapsed
    setElapsed(frozenElapsed)
    setIsPaused(true)
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

  const startSession = () => {
    clickThen(() => {
      setShowSetup(false)
      setBooted(true)
      requestPuzzle(size)
    })
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
    })
  }

  const chooseSize = (nextSize: BoardSize) => {
    clickThen(() => {
      if (booted) requestPuzzle(nextSize)
      else setSize(nextSize)
    })
  }

  const chooseDifficulty = (nextDifficulty: PuzzleDifficulty) => {
    clickThen(() => {
      setDifficulty(nextDifficulty)
      if (booted) requestPuzzle(size, nextDifficulty)
    })
  }

  const timerValue = getTimerValue(elapsed, timerMinutes)
  const timerLabel = isPaused ? 'Paused' : countdownOn ? 'Time left' : 'Time'
  const timerUrgent = countdownOn && !isPaused && status === 'playing' && timerValue <= 30_000

  const systemPanel = (
    <aside className="system-panel" aria-label="Game system panel">
      <header className="terminal-header">
        <div className="terminal-title">
          <strong>NONO2000</strong>
        </div>
        <button className="menu-trigger" onClick={() => clickThen(() => setShowMenu(true))}>
          Menu
        </button>
      </header>

      <div className="game-topline">
        <p>{difficulty} · {size}×{size} grid</p>
        <div className="quick-size-switcher" aria-label="Grid size">
          {BOARD_SIZES.map((boardSize) => (
            <button
              aria-pressed={size === boardSize}
              key={boardSize}
              onClick={() => chooseSize(boardSize)}
            >
              {boardSize}×{boardSize}
            </button>
          ))}
        </div>
        <div className="quick-difficulty-switcher" aria-label="Difficulty">
          {PUZZLE_DIFFICULTIES.map((level) => (
            <button
              aria-pressed={difficulty === level}
              key={level}
              onClick={() => chooseDifficulty(level)}
            >
              {level}
            </button>
          ))}
        </div>
        <div className="panel-game-actions" aria-label="Grid actions">
          <button onClick={() => clickThen(reset)}>Reset</button>
          <button className="is-primary" onClick={() => clickThen(() => requestPuzzle(size))}>
            New
          </button>
          <button
            aria-label={`Timer mode, ${timerModeLabel(timerMinutes)}`}
            className={`timer-mode-toggle ${countdownOn ? 'is-timed' : 'is-relaxed'}`}
            onClick={() => clickThen(cycleTimerMode)}
          >
            {countdownOn ? `${timerMinutes} min timer` : 'Relaxed'}
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
          ) : null}
        </div>
      </div>
    </aside>
  )

  const sharedOverlays = (
    <>
      {showMenu ? (
        <CommandMenu
          difficulty={difficulty}
          inSession={booted}
          onClose={() => clickThen(() => setShowMenu(false))}
          onDisconnect={disconnect}
          onNewPuzzle={() => clickThen(() => requestPuzzle(size))}
          onReset={() => clickThen(reset)}
          onRules={() => clickThen(() => {
            setShowMenu(false)
            setShowRules(true)
          })}
          onSelectDifficulty={chooseDifficulty}
          onSelectSize={chooseSize}
          onCycleTimer={() => clickThen(cycleTimerMode)}
          onToggleMusic={() => clickThen(toggleMusic)}
          onToggleSound={toggleSound}
          musicOn={musicOn}
          size={size}
          soundOn={soundOn}
          timerMinutes={timerMinutes}
        />
      ) : null}
      {showRules ? <HowToPlay onClose={() => clickThen(() => setShowRules(false))} /> : null}
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
            difficulty={difficulty}
            onBack={() => clickThen(() => setShowSetup(false))}
            onCycleTimer={() => clickThen(cycleTimerMode)}
            onSelectDifficulty={chooseDifficulty}
            onSelectSize={chooseSize}
            onStart={startSession}
            size={size}
            timerMinutes={timerMinutes}
          />
        ) : (
          <BootScreen
            onConfigure={() => clickThen(() => setShowMenu(true))}
            onRules={() => clickThen(() => setShowRules(true))}
            onStart={() => clickThen(() => setShowSetup(true))}
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
              elapsed={elapsed}
              mistakeCells={mistakes}
              onNewPuzzle={() => clickThen(() => requestPuzzle(size))}
              onReplay={() => clickThen(reset)}
              onSelectSize={chooseSize}
              puzzle={puzzle}
              showTime={countdownOn}
            />
          ) : status === 'lost' ? (
            <LostPuzzle
              onNewPuzzle={() => clickThen(() => requestPuzzle(size))}
              onRetry={() => clickThen(reset)}
            />
          ) : (
            <>
              <PuzzleBoard
                cornerContent={systemPanel}
                key={`${puzzle.seed}:${timerKey}`}
                marks={marks}
                mode={paintMode}
                onFeedback={playSound}
                onInteraction={resumeOnBoardInteraction}
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
