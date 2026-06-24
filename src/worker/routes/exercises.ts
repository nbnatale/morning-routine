import { Hono } from 'hono'
import type { Env } from '../types'
import { getExerciseLibrary } from '../lib/db'

const CACHE_KEY = 'cache:exercises:v1'
const CACHE_TTL_SECONDS = 60 * 60 * 6

export const exercisesRoute = new Hono<{ Bindings: Env }>()

exercisesRoute.get('/', async (c) => {
  if (!c.env.DB) {
    return c.json({ error: 'exercises backend not configured yet' }, 503)
  }

  try {
    if (c.env.SESSIONS) {
      const cached = await c.env.SESSIONS.get(CACHE_KEY)
      if (cached) return c.body(cached, 200, { 'Content-Type': 'application/json' })
    }

    const library = await getExerciseLibrary(c.env.DB)
    const json = JSON.stringify(library)

    if (c.env.SESSIONS) {
      await c.env.SESSIONS.put(CACHE_KEY, json, { expirationTtl: CACHE_TTL_SECONDS })
    }

    return c.body(json, 200, { 'Content-Type': 'application/json' })
  } catch {
    return c.json({ error: 'failed to load exercises' }, 500)
  }
})
