import type { Segment } from '../engine/plan'

const PREFS_KEY = 'mr:prefs'

interface Prefs { rounds: number; intensity: 'easy' | 'steady' | 'strong'; metro: boolean }

function loadPrefs(): Partial<Prefs> {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as Partial<Prefs> }
  catch { return {} }
}

function savePrefs(b: { rounds: number; intensity: string; metro: boolean }): void {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify({ rounds: b.rounds, intensity: b.intensity, metro: b.metro })) }
  catch { /* storage unavailable */ }
}

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

const _p = loadPrefs()
const state: AppState = {
  screen: 'build',
  build: {
    rounds: _p.rounds ?? 3,
    intensity: _p.intensity ?? 'steady',
    metro: _p.metro ?? true,
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
  savePrefs(state.build)
  listeners.forEach((fn) => fn(state))
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
