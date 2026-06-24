import type { Exercise, Tempo, Phase } from '../../shared/types'
import { LIBRARY, PACE } from '../data/exercises'

export interface Segment {
  type: 'work' | 'rest'
  name: string
  kind: string
  dur: number
  phase: Phase
  round?: number
  tempo?: Tempo
  cue: string
  ex?: Exercise
}

function dd(sec: number, mult: number): number {
  return Math.max(8, Math.round(sec * mult))
}

function makeSeg(ex: Exercise, kind: string, dur: number): Segment {
  return {
    type: 'work', name: ex.name, kind, dur, phase: ex.phase, tempo: ex.tempo,
    cue: ex.mistake ?? ex.quiet ?? '',
    ex,
  }
}

function restSeg(name: string, kind: string, dur: number, phase: Phase, cue = ''): Segment {
  return { type: 'rest', name, kind, dur, phase, cue }
}

export function buildPlan(
  intensity: 'easy' | 'steady' | 'strong',
  rounds: number,
  warmupIds: string[],
  circuitIds: string[],
  cooldownIds: string[],
): Segment[] {
  const mult = PACE[intensity]
  const seq: Segment[] = []

  const warmup = warmupIds.map((id) => LIBRARY.warmup.find((e) => e.id === id)).filter(Boolean) as Exercise[]
  const circuit = circuitIds.map((id) => LIBRARY.circuit.find((e) => e.id === id)).filter(Boolean) as Exercise[]
  const cooldown = cooldownIds.map((id) => LIBRARY.cooldown.find((e) => e.id === id)).filter(Boolean) as Exercise[]

  warmup.forEach((ex, i) => {
    seq.push(makeSeg(ex, 'Warm-up', dd(ex.dur, mult)))
    if (i < warmup.length - 1) seq.push(restSeg('Easy', 'Reset', 6, 'warmup', 'Shake it loose.'))
  })

  for (let r = 1; r <= rounds; r++) {
    circuit.forEach((ex, i) => {
      const seg = makeSeg(ex, `Round ${r} / ${rounds}`, dd(ex.dur, mult))
      seg.round = r
      seq.push(seg)
      if (i < circuit.length - 1) {
        const t = restSeg(`Next: ${circuit[i + 1].name}`, 'Transition', 10, 'circuit', 'Set up, breathe.')
        t.round = r
        seq.push(t)
      }
    })
    if (r < rounds) {
      const rest = restSeg('Round rest', 'Recover', 45, 'circuit', 'Water. Loosen the shoulders.')
      rest.round = r
      seq.push(rest)
    }
  }

  if (cooldown.length) {
    seq.push(restSeg('Cool down', 'Cool-down', 8, 'cooldown', 'Slow the breathing down.'))
    cooldown.forEach((ex, i) => {
      seq.push(makeSeg(ex, 'Cool-down', dd(ex.dur, mult)))
      if (i < cooldown.length - 1) seq.push(restSeg('Ease', 'Cool-down', 5, 'cooldown', 'Move to the next gently.'))
    })
  }

  return seq
}
