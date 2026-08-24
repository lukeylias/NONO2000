/// <reference lib="webworker" />

import { randomSeed, validatePuzzleCandidate } from './generator'
import type { BoardSize, PuzzleDifficulty } from './types'

interface GenerateRequest {
  type: 'generate'
  requestId: number
  size: BoardSize
  difficulty: PuzzleDifficulty
}

const context = self as DedicatedWorkerGlobalScope
let activeRequestId = 0
const recentSmallSignatures: string[] = []
const recentSmallSignatureSet = new Set<string>()

function rememberSmallPuzzle(signature: string) {
  recentSmallSignatures.push(signature)
  recentSmallSignatureSet.add(signature)

  if (recentSmallSignatures.length > 256) {
    const oldest = recentSmallSignatures.shift()
    if (oldest) recentSmallSignatureSet.delete(oldest)
  }
}

async function generate({ requestId, size, difficulty }: GenerateRequest) {
  while (true) {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      if (requestId !== activeRequestId) return
      const seed = randomSeed()
      const puzzle = validatePuzzleCandidate(size, seed, difficulty)
      if (puzzle) {
        if (size <= 10) {
          const signature = puzzle.solution.flat().join('')
          if (recentSmallSignatureSet.has(signature)) continue
          rememberSmallPuzzle(signature)
        }
        context.postMessage({ type: 'generated', requestId, puzzle })
        return
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}

context.addEventListener('message', (event: MessageEvent<GenerateRequest>) => {
  if (event.data.type === 'generate') {
    activeRequestId = event.data.requestId
    void generate(event.data)
  }
})

export {}
