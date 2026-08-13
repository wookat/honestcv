import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Minimal SSR build used only by scripts/prerender.mjs to render the
// landing route into dist/client/index.html at build time.
export default defineConfig({
  plugins: [react()],
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
