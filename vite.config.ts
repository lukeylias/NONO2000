import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

function getDeploymentBase() {
  const repository = process.env.GITHUB_REPOSITORY?.split('/')[1]
  if (!repository || repository.endsWith('.github.io')) return '/'
  return `/${repository}/`
}

export default defineConfig({
  base: getDeploymentBase(),
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
})
