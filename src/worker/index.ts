import { Hono } from 'hono'
import type { Env } from './types'
import { exercisesRoute } from './routes/exercises'

const app = new Hono<{ Bindings: Env }>()

app.get('/api/health', (c) => c.json({ ok: true }))
app.route('/api/exercises', exercisesRoute)

export default app
