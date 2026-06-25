import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import type { Env } from './types'
import { exercisesRoute } from './routes/exercises'

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

app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
