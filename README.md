# NONO2000

NONO2000 is a responsive nonogram game with a light early-2000s look, generated puzzles, sound effects, and looping background music. It runs entirely in the browser with no backend, account, or network dependency during play.

Every generated puzzle has exactly one solution and must pass the logic solver before it reaches the board.

## Play locally

You need a current version of Node.js and npm.

```bash
npm install
npm run dev
```

Open the address printed by Vite. NONO2000 does not store progress, so reloading returns to the title screen and starts a new session.

## Game modes

- Grid sizes: 5x5, 10x10, and 15x15.
- The 10x10 grid has Beginner, Standard, and Hard generation profiles.
- Relaxed mode has no timer.
- Timed modes provide 1, 2, or 5 minutes.
- Every wrong Fill or Cross removes 15 seconds in timed mode.

## Controls

- Left-click or drag to fill cells.
- Right-click to cross cells.
- A wrong mark stops the current drag.
- Marked cells stay locked for the current attempt.
- Completing a row or column crosses its remaining empty cells.
- The pause button stops the countdown. Interacting with the board resumes it.

## Audio

Sounds and music have separate controls. Music starts enabled at a fixed low background volume. The bundled loop lives at `public/audio/nostalgic-liquid-jungle-loop.mp3`.

Confirm the track's licence and attribution requirements before publishing the public site.

## Check the project

```bash
npm test
npm run build
npm run preview
```

The longer generator check validates 100 accepted puzzles per supported size:

```bash
npm run test:soak
```

## Publish with GitHub Pages

The workflow at `.github/workflows/deploy-nono2000-pages.yml` builds and publishes the site whenever `main` is updated.

After creating the GitHub repository and pushing `main`:

1. Open the repository on GitHub.
2. Go to **Settings**, then **Pages**.
3. Set **Source** to **GitHub Actions**.
4. Open **Actions** to watch the deployment.

Vite reads the repository name from GitHub Actions. Both project sites such as `username.github.io/NONO2000/` and root sites such as `username.github.io/` resolve their assets correctly.
