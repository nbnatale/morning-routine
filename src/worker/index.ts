import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import type { Env } from './types'
import { exercisesRoute } from './routes/exercises'
import { sharesRoute } from './routes/shares'

const app = new Hono<{ Bindings: Env }>()

app.use('*', secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:'],
    connectSrc: ["'self'"],
  },
}))

app.get('/api/health', (c) => c.json({ ok: true }))
app.route('/api/exercises', exercisesRoute)
app.route('/api/shares', sharesRoute)

// Asset responses are immutable; re-wrap so secureHeaders can set headers.
async function serveAsset(assets: Fetcher, req: Request): Promise<Response> {
  const res = await assets.fetch(req)
  return new Response(res.body, res)
}

// /s/:slug is an SPA route — always serve the app shell (assets SPA fallback
// only kicks in for requests with Sec-Fetch-Mode: navigate)
app.get('/s/:slug', (c) => {
  const url = new URL(c.req.url)
  url.pathname = '/'
  return serveAsset(c.env.ASSETS, new Request(url, c.req.raw))
})

app.all('*', (c) => serveAsset(c.env.ASSETS, c.req.raw))

export default app
