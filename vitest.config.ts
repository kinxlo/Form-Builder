import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Keep it simple: unit tests in Node (no browser APIs).
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Focus coverage on the form-builder logic layer (fast, stable tests).
      include: [
        'app/lib/form-builder/**/*.ts',
        'app/lib/schema-parser.ts',
        'app/lib/parse-form-schema-input.ts',
      ],
      exclude: ['**/*.d.ts'],
    },
  },
})
