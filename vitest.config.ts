import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov'],
      include: [
        'src/lib/**/*.ts',
        'src/utils/**/*.ts',
        'src/types/profile.ts',
        'src/adapters/**/*.ts',
        'src/services/**/*.ts',
        'src/hooks/**/*.ts',
        'src/components/budget-progress.tsx',
      ],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/types/database.ts',
        'src/utils/supabase/**',
      ],
    },
  },
})
