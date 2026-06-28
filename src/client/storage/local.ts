import { openDB, type IDBPDatabase } from 'idb'
import type { WorkoutConfig } from '../../shared/types'

interface LocalSession {
  id: string
  completedAt: number   // epoch ms, local-timezone date for streak math
  durationSec: number
  rounds: number
  focus: string | null  // presetId
  config: WorkoutConfig
  effort?: 'easy' | 'good' | 'hard'
}

interface LocalBuild {
  id: string
  name: string
  config: WorkoutConfig
  createdAt: number
  updatedAt: number
}

interface RoutineDB {
  sessions: {
    key: string
    value: LocalSession
    indexes: { by_date: number }
  }
  builds: {
    key: string
    value: LocalBuild
  }
}

let _db: IDBPDatabase<RoutineDB> | null = null

async function getDB(): Promise<IDBPDatabase<RoutineDB>> {
  if (_db) return _db
  _db = await openDB<RoutineDB>('morning-routine', 1, {
    upgrade(db) {
      const sessions = db.createObjectStore('sessions', { keyPath: 'id' })
      sessions.createIndex('by_date', 'completedAt')
      db.createObjectStore('builds', { keyPath: 'id' })
    },
  })
  return _db
}

export async function logSession(data: Omit<LocalSession, 'id'>): Promise<string> {
  const db = await getDB()
  const id = crypto.randomUUID()
  await db.add('sessions', { id, ...data })
  return id
}

export async function updateSessionEffort(id: string, effort: 'easy' | 'good' | 'hard'): Promise<void> {
  const db = await getDB()
  const session = await db.get('sessions', id)
  if (session) await db.put('sessions', { ...session, effort })
}

export async function getSessions(): Promise<LocalSession[]> {
  const db = await getDB()
  return db.getAllFromIndex('sessions', 'by_date')
}

export async function getLastSession(): Promise<LocalSession | undefined> {
  const sessions = await getSessions()
  return sessions[sessions.length - 1]
}

export async function saveBuilder(name: string, config: WorkoutConfig): Promise<string> {
  const db = await getDB()
  const id = crypto.randomUUID()
  const now = Date.now()
  await db.put('builds', { id, name, config, createdAt: now, updatedAt: now })
  return id
}

export async function getBuilds(): Promise<LocalBuild[]> {
  const db = await getDB()
  return db.getAll('builds')
}

export interface Stats {
  streakCurrent: number
  streakBest: number
  totalSessions: number
  totalMinutes: number
  heatmap: Array<{ date: string; count: number }>  // 84 days, oldest first
}

function localDateStr(ms: number): string {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Use new Date(y, m, d) to get local midnight, avoiding ISO-string UTC parse issues.
function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  const da = new Date(ay!, am! - 1, ad!)
  const db = new Date(by!, bm! - 1, bd!)
  return Math.round((db.getTime() - da.getTime()) / 86400000)
}

function buildHeatmap(dateCount: Map<string, number>): Stats['heatmap'] {
  const heatmap: Stats['heatmap'] = []
  const now = new Date()
  for (let i = 83; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const ds = localDateStr(d.getTime())
    heatmap.push({ date: ds, count: dateCount.get(ds) ?? 0 })
  }
  return heatmap
}

export async function computeStats(): Promise<Stats> {
  const sessions = await getSessions()
  const totalSessions = sessions.length
  const totalMinutes = Math.round(sessions.reduce((a, s) => a + s.durationSec, 0) / 60)

  if (sessions.length === 0) {
    return { streakCurrent: 0, streakBest: 0, totalSessions: 0, totalMinutes: 0, heatmap: buildHeatmap(new Map()) }
  }

  const dateCount = new Map<string, number>()
  for (const s of sessions) {
    const ds = localDateStr(s.completedAt)
    dateCount.set(ds, (dateCount.get(ds) ?? 0) + 1)
  }

  const sortedDates = Array.from(dateCount.keys()).sort()

  // Best streak across all dates
  let best = 1, run = 1
  for (let i = 1; i < sortedDates.length; i++) {
    run = daysBetween(sortedDates[i - 1]!, sortedDates[i]!) === 1 ? run + 1 : 1
    if (run > best) best = run
  }

  // Current streak: only active if the most recent session date is today or yesterday
  const today = localDateStr(Date.now())
  const yesterday = localDateStr(Date.now() - 86400000)
  const latest = sortedDates[sortedDates.length - 1]!
  let current = 0
  if (latest === today || latest === yesterday) {
    current = 1
    for (let i = sortedDates.length - 1; i > 0; i--) {
      if (daysBetween(sortedDates[i - 1]!, sortedDates[i]!) === 1) current++
      else break
    }
  }

  return {
    streakCurrent: current,
    streakBest: Math.max(best, current),
    totalSessions,
    totalMinutes,
    heatmap: buildHeatmap(dateCount),
  }
}
