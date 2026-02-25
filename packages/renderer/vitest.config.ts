import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@umlts/engine': resolve(__dirname, '../engine/src/index.ts'),
      '@engine': resolve(__dirname, '../engine/src'),
      '@renderer': resolve(__dirname, './src'),
    },
  },
  test: {
    exclude: ['**/node_modules/**', '**/dist/**'],
    include: ['src/**/*.test.ts'],
  },
})
