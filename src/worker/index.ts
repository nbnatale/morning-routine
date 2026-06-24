import { Hono } from 'hono'
import type { Env } from './types'
import { exercisesRoute } from './routes/exercises'

const app = new Hono<{ Bindings: Env }>()

app.get('/api/health', (c) => c.json({ ok: true }))
app.route('/api/exercises', exercisesRoute)

// Pass all non-API requests to the static asset binding.
// not_found_handling = "single-page-application" in wrangler.toml means
// the asset binding serves index.html for any path that isn't a real file.
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
