import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@plugin-ts': resolve(__dirname, './src'),
      '@umlts/engine': resolve(__dirname, '../engine/src/index.ts'),
      '@engine': resolve(__dirname, '../engine/src'),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['dist', 'node_modules'],
    environment: 'node',
  },
})
