import { StrictMode } from 'react'
import { prerenderToNodeStream } from 'react-dom/static'
import { StaticRouter } from 'react-router'
import App from './App'

/**
 * Build-time prerender: returns the HTML for a route (used for "/").
 * The static prerender API waits for lazy route chunks to resolve, so the
 * homepage HTML contains the real Landing markup rather than the Suspense
 * fallback skeleton.
 */
export async function render(url: string): Promise<string> {
  const { prelude } = await prerenderToNodeStream(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>
  )
  const chunks: Buffer[] = []
  for await (const chunk of prelude) {
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString('utf8')
}
