import type { Tempo } from '../../shared/types'

export function cycleLen(t: Tempo): number {
  return t.phases.reduce((a: number, p) => a + p.d, 0)
}

export function easeIO(x: number): number {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
}

export interface TempoState {
  label: string
  ease: boolean
  prog: number
  repIndex: number
}

export function tempoAt(t: Tempo, elapsed: number): TempoState {
  const cyc = cycleLen(t)
  const inCycle = elapsed % cyc
  let acc = 0
  let phase = t.phases[0]
  let pStart = 0
  for (let i = 0; i < t.phases.length; i++) {
    const p = t.phases[i]
    if (inCycle < acc + p.d) { phase = p; pStart = acc; break }
    acc += p.d
  }
  return {
    label: phase.l,
    ease: !!phase.ease,
    prog: (inCycle - pStart) / phase.d,
    repIndex: Math.floor(elapsed / cyc),
  }
}

const ORB_MIN = 0.4
const ORB_MAX = 1.0

export function orbScale(t: Tempo, elapsed: number): { scale: number; ease: boolean } {
  const cyc = cycleLen(t)
  if (t.phases.length === 1) {
    const ph = t.phases[0]
    const x = (elapsed % ph.d) / ph.d
    return { scale: ORB_MIN + (ORB_MAX - ORB_MIN) * (0.5 - 0.5 * Math.cos(2 * Math.PI * x)), ease: x > 0.5 }
  }
  const ends = t.phases.map((p: { ease?: boolean }) => (p.ease ? ORB_MIN : ORB_MAX))
  const inCycle = elapsed % cyc
  let acc = 0; let ci = 0; let pStart = 0
  for (let i = 0; i < t.phases.length; i++) {
    if (inCycle < acc + t.phases[i].d) { ci = i; pStart = acc; break }
    acc += t.phases[i].d
  }
  const prog = (inCycle - pStart) / t.phases[ci].d
  const startScale = ci === 0 ? ends[ends.length - 1] : ends[ci - 1]
  return { scale: startScale + (ends[ci] - startScale) * easeIO(prog), ease: !!t.phases[ci].ease }
}

export function tempoSummary(t: Tempo): string {
  if (t.kind === 'hold') return 'Hold steady · breathe'
  if (t.kind === 'flow') return 'Continuous · smooth'
  return `~${cycleLen(t)}s per rep`
}
