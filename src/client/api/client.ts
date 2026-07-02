import type { Exercise, Phase, WorkoutConfig } from '../../shared/types'
import { hydrateLibrary } from '../data/exercises'

// Best-effort: on any failure (offline, API not provisioned yet, bad
// response) this silently keeps the bundled library — never throws.
export async function hydrateLibraryFromApi(): Promise<void> {
  try {
    const res = await fetch('/api/exercises')
    if (!res.ok) return
    const data = (await res.json()) as Record<Phase, Exercise[]>
    hydrateLibrary(data)
  } catch {
    // offline or API not configured — bundled copy stays in place
  }
}

// Creates a share and returns its slug, or null on any failure (offline, 4xx/5xx).
export async function createShare(config: WorkoutConfig): Promise<string | null> {
  try {
    const res = await fetch('/api/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { slug?: string }
    return data.slug ?? null
  } catch {
    return null
  }
}

export async function fetchShare(slug: string): Promise<WorkoutConfig | null> {
  try {
    const res = await fetch(`/api/shares/${encodeURIComponent(slug)}`)
    if (!res.ok) return null
    const data = (await res.json()) as { config?: WorkoutConfig }
    return data.config ?? null
  } catch {
    return null
  }
}
