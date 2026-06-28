import type { Segment } from '../engine/plan'

export interface BuildState {
  rounds: number
  intensity: 'easy' | 'steady' | 'strong'
  metro: boolean
  activePreset: string | null
  // per-exercise on/off map (id → boolean)
  selected: Record<string, boolean>
}

export interface RunState {
  plan: Segment[]
  idx: number
  remaining: number
  running: boolean
}

export type Screen = 'build' | 'run' | 'done'

export interface AppState {
  screen: Screen
  build: BuildState
  run: RunState
}

type Listener = (state: AppState) => void

const state: AppState = {
  screen: 'build',
  build: {
    rounds: 3,
    intensity: 'steady',
    metro: true,
    activePreset: 'day-a',
    selected: {},
  },
  run: {
    plan: [],
    idx: 0,
    remaining: 0,
    running: false,
  },
}

const listeners = new Set<Listener>()

export function getState(): Readonly<AppState> { return state }

export function setState(updater: (s: AppState) => void): void {
  updater(state)
  listeners.forEach((fn) => fn(state))
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
