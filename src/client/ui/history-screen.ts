import { getSessions, computeStats, type Stats } from '../storage/local'
import { PRESETS } from '../data/exercises'

function fmtDate(ms: number): string {
  const d = new Date(ms)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'Today'
  const yest = new Date(now.getTime() - 86400000)
  if (d.toDateString() === yest.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function renderHeatmap(heatmap: Stats['heatmap']): string {
  const cells = heatmap.map(({ count, date }) => {
    const lv = count === 0 ? 0 : count === 1 ? 1 : 2
    return `<div class="hm-cell lv${lv}" aria-label="${date}: ${count}"></div>`
  }).join('')
  return `<div class="heatmap" role="img" aria-label="12-week workout history">${cells}</div>`
}

export function initHistoryScreen(onBack: () => void): void {
  document.getElementById('histBackBtn')!.addEventListener('click', onBack)
}

export function showHistoryScreen(): void {
  document.getElementById('buildScreen')!.style.display = 'none'
  document.getElementById('historyScreen')!.classList.add('show')
  document.getElementById('phaseTag')!.textContent = 'History'

  const list = document.getElementById('histList')!
  list.innerHTML = '<p class="hist-empty">Loading…</p>'

  Promise.all([getSessions(), computeStats()])
    .then(([sessions, stats]) => {
      if (sessions.length === 0) {
        list.innerHTML = '<p class="hist-empty">No sessions yet. Complete a workout to see your history.</p>'
      } else {
        const rev = [...sessions].reverse()
        list.innerHTML = rev.map((s) => {
          const preset = s.focus ? PRESETS.find((p) => p.id === s.focus) : undefined
          const label = preset?.name ?? 'Custom'
          const mins = Math.round(s.durationSec / 60)
          return `<div class="hist-row">
            <div class="hist-date">${fmtDate(s.completedAt)}</div>
            <div class="hist-focus">${label}</div>
            <div class="hist-meta">${s.rounds}r · ${mins}m</div>
          </div>`
        }).join('')
      }

      document.getElementById('histStats')!.innerHTML = `
        <div class="hist-stat-row">
          <div class="done-stat"><div class="v">${stats.streakCurrent}</div><div class="k">Streak</div></div>
          <div class="done-stat"><div class="v">${stats.totalSessions}</div><div class="k">Sessions</div></div>
          <div class="done-stat"><div class="v">${stats.totalMinutes}</div><div class="k">Minutes</div></div>
        </div>
        ${renderHeatmap(stats.heatmap)}
      `
    })
    .catch(() => {
      list.innerHTML = '<p class="hist-empty">Could not load history.</p>'
    })
}

export function hideHistoryScreen(): void {
  document.getElementById('historyScreen')!.classList.remove('show')
}
