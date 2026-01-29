import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Whole-project TS coverage report (no thresholds enforced here).
      // Note: Vue SFCs are intentionally excluded.
      all: true,
      include: ['app/**/*.ts', 'server/**/*.ts', 'tests/**/*.ts'],
      exclude: ['**/*.d.ts', 'app/**/*.vue'],
    },
  },
})
