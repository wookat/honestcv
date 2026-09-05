import path from 'node:path'
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss(), cloudflare()],
  build: {
    // One stylesheet, referenced only from the HTML shells (which inline it in
    // scripts/prerender.mjs) — keeps lazy route chunks from re-fetching it.
    cssCodeSplit: false,
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(import.meta.dirname, './src') },
      // react-router >=7.13 points every package-exports condition at its
      // development build (remix-run/react-router#14753), so production
      // bundles ship dev-warning code. Pin builds to the production dist;
      // the dev server keeps the development build and its warnings.
      ...(command === 'build'
        ? [
            {
              find: /^react-router$/,
              replacement: path.resolve(
                import.meta.dirname,
                'node_modules/react-router/dist/production/index.mjs',
              ),
            },
            {
              find: /^react-router\/dom$/,
              replacement: path.resolve(
                import.meta.dirname,
                'node_modules/react-router/dist/production/dom-export.mjs',
              ),
            },
          ]
        : []),
    ],
  },
}))
