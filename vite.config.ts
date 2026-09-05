import path from 'node:path'
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  build: {
    // One stylesheet, referenced only from the HTML shells (which inline it in
    // scripts/prerender.mjs) — keeps lazy route chunks from re-fetching it.
    cssCodeSplit: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
