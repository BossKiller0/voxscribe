import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    alias: {
      '@main': resolve(__dirname, './src/main'),
      '@shared': resolve(__dirname, './src/shared')
    }
  },
  resolve: {
    alias: {
      '@main': resolve(__dirname, './src/main'),
      '@shared': resolve(__dirname, './src/shared')
    }
  }
})
