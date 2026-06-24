import { getState } from '../state/store'
import { LIBRARY } from '../data/exercises'
import { logSession, computeStats, type Stats } from '../storage/local'
import type { WorkoutConfig } from '../../shared/types'

function fmt(s: number): string {
  s = Math.max(0, Math.ceil(s))
  const m = Math.floor(s / 60), ss = s % 60
  return `${m}:${ss < 10 ? '0' : ''}${ss}`
}

function buildConfig(): WorkoutConfig {
  const { build } = getState()
  return {
    presetId: build.activePreset,
    rounds: build.rounds,
    intensity: build.intensity,
    metro: build.metro,
    warmup:   LIBRARY.warmup.filter(e => build.selected[e.id]).map(e => e.id),
    circuit:  LIBRARY.circuit.filter(e => build.selected[e.id]).map(e => e.id),
    cooldown: LIBRARY.cooldown.filter(e => build.selected[e.id]).map(e => e.id),
  }
}

function renderHeatmap(heatmap: Stats['heatmap']): string {
  const cells = heatmap.map(({ count, date }) => {
    const level = count === 0 ? 0 : count === 1 ? 1 : 2
    return `<div class="hm-cell lv${level}" aria-label="${date}: ${count} session${count !== 1 ? 's' : ''}"></div>`
  }).join('')
  return `<div class="heatmap" role="img" aria-label="12-week workout history">${cells}</div>`
}

function renderStats(stats: Stats): void {
  const el = document.getElementById('doneStats')
  if (!el) return
  const streakLabel = stats.streakCurrent === 1 ? 'day streak' : 'day streak'
  el.innerHTML = `
    <div class="done-stat-row">
      <div class="done-stat"><div class="v">${stats.streakCurrent}</div><div class="k">${streakLabel}</div></div>
      <div class="done-stat"><div class="v">${stats.totalSessions}</div><div class="k">Sessions</div></div>
      <div class="done-stat"><div class="v">${stats.totalMinutes}</div><div class="k">Minutes</div></div>
    </div>
    ${renderHeatmap(stats.heatmap)}
  `
}

export function initDoneScreen(onAgain: () => void): void {
  document.getElementById('againBtn')!.addEventListener('click', onAgain)
}

export function showDoneScreen(totalSec: number): void {
  const { build } = getState()
  document.getElementById('buildScreen')!.style.display = 'none'
  document.getElementById('runScreen')!.classList.remove('show')
  document.getElementById('doneScreen')!.classList.add('show')
  document.getElementById('phaseTag')!.textContent = 'Done'
  document.getElementById('doneStat')!.textContent =
    `${fmt(totalSec)} of movement · ${build.rounds} rounds. Same time tomorrow.`

  logSession({
    completedAt: Date.now(),
    durationSec: Math.round(totalSec),
    rounds: build.rounds,
    focus: build.activePreset,
    config: buildConfig(),
  })
    .then(() => computeStats())
    .then((stats) => renderStats(stats))
    .catch(() => { /* stats are best-effort; silently skip on IDB errors */ })
}
