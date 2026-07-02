import { getState } from '../state/store'
import { LIBRARY, PRESETS, ROTATION } from '../data/exercises'
import { logSession, updateSessionEffort, computeStats, type Stats } from '../storage/local'
import { createShare } from '../api/client'
import type { WorkoutConfig } from '../../shared/types'

// slug of the share created for the current done screen; reset each time it shows
let shareSlug: string | null = null
let shareBusy = false

const MILESTONES: Record<number, string> = {
  7: 'Seven in a row.',
  14: 'Two weeks straight.',
  21: "Three weeks. It's a habit.",
  30: 'Thirty days. Thirty mornings.',
  60: 'Two months without missing.',
  100: 'One hundred mornings.',
}

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
  const milestone = MILESTONES[stats.streakCurrent] ?? ''
  el.innerHTML = `
    ${milestone ? `<div class="done-milestone">${milestone}</div>` : ''}
    <div class="done-stat-row">
      <div class="done-stat"><div class="v">${stats.streakCurrent}</div><div class="k">Day streak</div></div>
      <div class="done-stat"><div class="v">${stats.totalSessions}</div><div class="k">Sessions</div></div>
      <div class="done-stat"><div class="v">${stats.totalMinutes}</div><div class="k">Minutes</div></div>
    </div>
    ${renderHeatmap(stats.heatmap)}
  `
}

export function initDoneScreen(onAgain: () => void): void {
  document.getElementById('againBtn')!.addEventListener('click', onAgain)

  const shareBtn = document.getElementById('shareBtn') as HTMLButtonElement
  const shareLbl = document.getElementById('shareLbl')!
  shareBtn.addEventListener('click', async () => {
    if (shareBusy) return
    shareBusy = true
    shareBtn.disabled = true
    shareLbl.textContent = 'Creating link…'

    const slug = shareSlug ?? await createShare(buildConfig())
    if (!slug) {
      shareLbl.textContent = 'Could not create link'
      setTimeout(() => { shareLbl.textContent = 'Share this workout'; shareBtn.disabled = false; shareBusy = false }, 2200)
      return
    }
    shareSlug = slug
    const url = `${location.origin}/s/${slug}`

    let copied = false
    if (navigator.share) {
      try { await navigator.share({ title: 'Morning Routine workout', url }); copied = true } catch { /* user cancelled */ }
    }
    if (!copied) {
      try { await navigator.clipboard.writeText(url); copied = true } catch { /* clipboard unavailable */ }
    }

    shareBtn.classList.toggle('done', copied)
    shareLbl.textContent = copied ? 'Link copied ✓' : url
    shareBtn.disabled = false
    shareBusy = false
  })
}

export function showDoneScreen(totalSec: number): void {
  const { build } = getState()

  // fresh share state for this session's config
  shareSlug = null
  shareBusy = false
  const shareBtn = document.getElementById('shareBtn') as HTMLButtonElement | null
  const shareLbl = document.getElementById('shareLbl')
  if (shareBtn && shareLbl) { shareBtn.disabled = false; shareBtn.classList.remove('done'); shareLbl.textContent = 'Share this workout' }
  document.getElementById('buildScreen')!.style.display = 'none'
  document.getElementById('runScreen')!.classList.remove('show')
  document.getElementById('doneScreen')!.classList.add('show')
  document.getElementById('phaseTag')!.textContent = 'Done'

  const presetName = build.activePreset ? PRESETS.find((p) => p.id === build.activePreset)?.name : null
  const parts = [presetName, `${build.rounds} rounds`, fmt(totalSec)].filter(Boolean)
  document.getElementById('doneStat')!.textContent = parts.join(' · ')

  const nextEl = document.getElementById('doneNext')
  if (nextEl) {
    const rotIdx = build.activePreset ? ROTATION.indexOf(build.activePreset) : -1
    if (rotIdx >= 0) {
      const nextId = ROTATION[(rotIdx + 1) % ROTATION.length]!
      const nextName = PRESETS.find((p) => p.id === nextId)?.name ?? ''
      nextEl.textContent = nextName ? `${nextName} tomorrow` : ''
    } else {
      nextEl.textContent = ''
    }
  }

  logSession({
    completedAt: Date.now(),
    durationSec: Math.round(totalSec),
    rounds: build.rounds,
    focus: build.activePreset,
    config: buildConfig(),
  })
    .then((sessionId) => {
      document.querySelectorAll<HTMLButtonElement>('.effort-btn').forEach((btn) => {
        btn.disabled = false
        btn.addEventListener('click', () => {
          const effort = btn.dataset['effort'] as 'easy' | 'good' | 'hard'
          document.querySelectorAll<HTMLButtonElement>('.effort-btn').forEach((b) => b.classList.remove('on'))
          btn.classList.add('on')
          updateSessionEffort(sessionId, effort).catch(() => {})
        })
      })
      return computeStats()
    })
    .then((stats) => renderStats(stats))
    .catch(() => { /* stats are best-effort; silently skip on IDB errors */ })
}
