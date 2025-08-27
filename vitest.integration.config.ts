import dotenv from 'dotenv'
import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

// Load test environment variables
dotenv.config({ path: '.env.test' })

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup/test-setup.ts'],
    globalSetup: ['./tests/setup/global-setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
  },
  resolve: {
    alias: {
      '@order-service': resolve(__dirname, './apps/order-service/src'),
      '@invoice-service': resolve(__dirname, './apps/invoice-service/src'),
      '@shared-broker': resolve(__dirname, './apps/shared-broker/src'),
      '@streamflix/shared-broker': resolve(
        __dirname,
        './apps/shared-broker/src',
      ),
      '@tests': resolve(__dirname, './tests'),
    },
  },
})
