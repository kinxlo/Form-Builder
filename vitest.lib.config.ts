import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      all: true,
      // Only gate coverage for the form-builder layer inside app/lib
      include: ['app/lib/form-builder/**/*.ts'],
      exclude: [
        '**/*.d.ts',
        // Type-only re-export; not meaningful to gate with runtime coverage.
        'app/lib/form-builder/types.ts',
      ],
      thresholds: {
        lines: 75,
        branches: 75,
        functions: 75,
        statements: 75,
      },
    },
  },
})
