import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/test-config.ts'],
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/performance/**/*.test.ts'], // Skip performance tests for local development
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@streamflix/shared-broker': resolve(
        __dirname,
        './apps/shared-broker/src',
      ),
    },
  },
})
