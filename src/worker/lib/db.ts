import type { Exercise, Phase } from '../../shared/types'

interface ExerciseRow {
  id: string
  phase: Phase
  name: string
  tag: string
  base_dur: number
  tempo_json: string
  how_json: string
  mistake: string | null
  quiet: string | null
  equipment: NonNullable<Exercise['equipment']>
  sort_order: number
}

export async function getExerciseLibrary(db: D1Database): Promise<Record<Phase, Exercise[]>> {
  const { results } = await db
    .prepare('SELECT * FROM exercises ORDER BY phase, sort_order')
    .all<ExerciseRow>()

  const library: Record<Phase, Exercise[]> = { warmup: [], circuit: [], cooldown: [] }
  for (const row of results) {
    library[row.phase].push({
      id: row.id,
      name: row.name,
      tag: row.tag,
      phase: row.phase,
      dur: row.base_dur,
      tempo: JSON.parse(row.tempo_json),
      how: JSON.parse(row.how_json),
      mistake: row.mistake ?? undefined,
      quiet: row.quiet ?? undefined,
      equipment: row.equipment,
    })
  }
  return library
}
