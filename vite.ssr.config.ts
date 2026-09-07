import { readFileSync } from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Minimal SSR build used only by scripts/prerender.mjs to render the
// landing route into dist/client/index.html at build time.
// Keep in sync with vite.config.ts: the prerendered hero copy must match
// what the client hydrates with.
const freeMode = /"FREE_MODE":\s*"true"/.test(
  readFileSync(path.resolve(import.meta.dirname, 'wrangler.jsonc'), 'utf8'),
)

export default defineConfig({
  plugins: [react()],
  define: {
    __FREE_MODE__: JSON.stringify(freeMode),
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    ssr: 'src/entry-server.tsx',
    outDir: 'dist/prerender',
    emptyOutDir: true,
  },
})
