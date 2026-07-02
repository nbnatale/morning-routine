import { Hono } from 'hono'
import type { Env } from '../types'
import type { Intensity, WorkoutConfig } from '../../shared/types'

const SLUG_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'
const SLUG_RE = /^[a-z0-9]{8}$/
const MAX_IDS = 30
const MAX_ID_LEN = 40
const INTENSITIES: Intensity[] = ['easy', 'steady', 'strong']

function genSlug(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes, (b) => SLUG_ALPHABET[b % SLUG_ALPHABET.length]).join('')
}

function sanitizeIds(v: unknown): string[] | null {
  if (!Array.isArray(v) || v.length > MAX_IDS) return null
  const out: string[] = []
  for (const id of v) {
    if (typeof id !== 'string' || !id || id.length > MAX_ID_LEN) return null
    out.push(id)
  }
  return out
}

// Accepts only the fields a share needs; anything malformed rejects the whole config.
function sanitizeConfig(raw: unknown): WorkoutConfig | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const rounds = r['rounds']
  if (typeof rounds !== 'number' || !Number.isInteger(rounds) || rounds < 1 || rounds > 6) return null
  if (!INTENSITIES.includes(r['intensity'] as Intensity)) return null
  if (typeof r['metro'] !== 'boolean') return null
  const presetId = r['presetId']
  if (presetId !== null && (typeof presetId !== 'string' || presetId.length > MAX_ID_LEN)) return null
  const warmup = sanitizeIds(r['warmup'])
  const circuit = sanitizeIds(r['circuit'])
  const cooldown = sanitizeIds(r['cooldown'])
  if (!warmup || !circuit || !cooldown || circuit.length === 0) return null
  return {
    presetId: presetId as string | null,
    rounds,
    intensity: r['intensity'] as Intensity,
    metro: r['metro'],
    warmup, circuit, cooldown,
  }
}

export const sharesRoute = new Hono<{ Bindings: Env }>()

sharesRoute.post('/', async (c) => {
  if (!c.env.DB) return c.json({ error: 'shares backend not configured yet' }, 503)

  let body: unknown
  try { body = await c.req.json() } catch { return c.json({ error: 'invalid json' }, 400) }
  const config = sanitizeConfig((body as Record<string, unknown> | null)?.['config'])
  if (!config) return c.json({ error: 'invalid config' }, 400)

  const json = JSON.stringify(config)
  if (json.length > 4096) return c.json({ error: 'config too large' }, 400)

  // retry a couple of times on the (unlikely) slug collision
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = genSlug()
    try {
      await c.env.DB.prepare(
        'INSERT INTO shares (slug, config_json, created_by, is_featured, plays, created_at) VALUES (?, ?, NULL, 0, 0, ?)',
      ).bind(slug, json, Date.now()).run()
      return c.json({ slug }, 201)
    } catch (err) {
      if (attempt === 2) throw err
    }
  }
  return c.json({ error: 'could not create share' }, 500)
})

sharesRoute.get('/:slug', async (c) => {
  if (!c.env.DB) return c.json({ error: 'shares backend not configured yet' }, 503)

  const slug = c.req.param('slug').toLowerCase()
  if (!SLUG_RE.test(slug)) return c.json({ error: 'not found' }, 404)

  const row = await c.env.DB.prepare('SELECT config_json FROM shares WHERE slug = ?')
    .bind(slug).first<{ config_json: string }>()
  if (!row) return c.json({ error: 'not found' }, 404)

  c.executionCtx.waitUntil(
    c.env.DB.prepare('UPDATE shares SET plays = plays + 1 WHERE slug = ?').bind(slug).run().then(() => {}, () => {}),
  )

  let config: WorkoutConfig
  try { config = JSON.parse(row.config_json) as WorkoutConfig } catch { return c.json({ error: 'corrupt share' }, 500) }
  return c.json({ slug, config })
})
