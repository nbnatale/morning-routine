import type { Exercise, Phase } from '../../shared/types'
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
