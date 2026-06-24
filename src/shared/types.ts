// Shared DTOs used by both client and worker — keeps the API contract in sync.

export type Intensity = 'easy' | 'steady' | 'strong'
export type Phase = 'warmup' | 'circuit' | 'cooldown'
export type TimerStructure = 'circuit' | 'tabata' | 'emom' | 'amrap' | 'ladder'

export interface WorkoutConfig {
  presetId: string | null
  rounds: number
  intensity: Intensity
  metro: boolean
  warmup: string[]
  circuit: string[]
  cooldown: string[]
  voice?: boolean
  haptics?: boolean
  theme?: string
  structure?: TimerStructure
}

export interface TempoPhase {
  l: string
  d: number
  ease?: boolean
}

export interface Tempo {
  kind: 'reps' | 'alt' | 'hold' | 'flow'
  per?: string
  phases: TempoPhase[]
}

export interface Exercise {
  id: string
  name: string
  tag: string
  phase: Phase
  dur: number
  tempo: Tempo
  how: string[]
  mistake?: string
  quiet?: string
  equipment?: 'none' | 'bar' | 'chair' | 'wall'
}

export interface User {
  id: string
  email: string | null
  displayName: string | null
  createdAt: number
}

export interface SessionStats {
  streakCurrent: number
  streakBest: number
  totalSessions: number
  totalMinutes: number
  byFocus: Record<string, number>
  heatmap: Array<{ date: string; count: number }>
}
