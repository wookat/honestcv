import path from 'node:path'
import { defineConfig } from 'vitest/config'

// Standalone so the test runner does not load the Cloudflare / React / Tailwind
// plugins from vite.config.ts; only the `@/` alias is shared.
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
