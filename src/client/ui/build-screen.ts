import { LIBRARY, PRESETS, ROTATION, type Preset } from '../data/exercises'
import { tempoSummary } from '../engine/tempo'
import { buildPlan } from '../engine/plan'
import { getState, setState } from '../state/store'
import { computeStats, getLastSession } from '../storage/local'
import type { Phase, WorkoutConfig } from '../../shared/types'

interface BuildHints {
  suggestedId: string
  doneToday: boolean
  todayFocus: string | null
}

async function loadBuildHints(): Promise<BuildHints> {
  const last = await getLastSession()
  const doneToday = !!last && new Date(last.completedAt).toDateString() === new Date().toDateString()
  if (!last?.focus || !ROTATION.includes(last.focus)) {
    return { suggestedId: ROTATION[0]!, doneToday, todayFocus: last?.focus ?? null }
  }
  const idx = ROTATION.indexOf(last.focus)
  return { suggestedId: ROTATION[(idx + 1) % ROTATION.length]!, doneToday, todayFocus: last.focus }
}

function fmt(s: number): string {
  s = Math.max(0, Math.ceil(s))
  const m = Math.floor(s / 60), ss = s % 60
  return `${m}:${ss < 10 ? '0' : ''}${ss}`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function initBuildScreen(onBegin: () => void, shared?: WorkoutConfig | null): void {
  const buildSection = document.getElementById('buildScreen')!
  const focusRow = document.getElementById('focusRow')!
  const roundSeg = document.getElementById('roundSeg')!
  const intSeg = document.getElementById('intSeg')!
  const metroRow = document.getElementById('metroRow')!
  const metroSwitch = document.getElementById('metroSwitch')!
  const beginBtn = document.getElementById('beginBtn') as HTMLButtonElement
  const sTime = document.getElementById('sTime')!
  const sMoves = document.getElementById('sMoves')!
  const sRounds = document.getElementById('sRounds')!

  // initialise selected map from library defaults
  const { build } = getState()
  const phases: Phase[] = ['warmup', 'circuit', 'cooldown']
  phases.forEach((ph) => LIBRARY[ph].forEach((ex) => {
    if (!(ex.id in build.selected)) build.selected[ex.id] = ex.id === ex.id
  }))

  // apply default preset synchronously, then override async with rotation suggestion
  // (a shared config from a /s/:slug link wins over both)
  if (shared) applyConfig(shared)
  else applyPreset(PRESETS.find((p) => p.id === build.activePreset) ?? PRESETS[0])

  buildFocusPills()
  buildExerciseRows()
  syncFocusPills()
  syncSegs()
  refreshSummary()

  const focusSubLabel = buildSection.querySelector<HTMLSpanElement>('.opt-label span')
  const restBanner = document.getElementById('restBanner')
  const restBannerText = document.getElementById('restBannerText')

  loadBuildHints().then(({ suggestedId, doneToday, todayFocus }) => {
    const next = PRESETS.find((pr) => pr.id === suggestedId)
    if (next && !shared) { applyPreset(next); syncSegs(); syncFocusPills(); refreshSummary() }
    focusRow.querySelectorAll<HTMLButtonElement>('.fpill').forEach((b) => {
      b.classList.toggle('suggested', b.dataset['id'] === suggestedId)
    })
    if (focusSubLabel && next && !shared) focusSubLabel.textContent = `${next.name} up next · or pick another`

    if (doneToday && restBanner && restBannerText) {
      const todayPreset = todayFocus ? PRESETS.find((pr) => pr.id === todayFocus) : undefined
      restBannerText.innerHTML = `${todayPreset?.name ?? 'Today\'s session'} complete<small>${next?.name ?? 'Next session'} is up next</small>`
      restBanner.removeAttribute('hidden')
    }
  }).catch(() => {})

  // round segment
  roundSeg.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null
    if (!b) return
    setState((s) => { s.build.rounds = +b.dataset['r']!; s.build.activePreset = null })
    syncSegs(); syncFocusPills(); refreshSummary()
  })

  // intensity segment
  intSeg.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null
    if (!b) return
    setState((s) => { s.build.intensity = b.dataset['p'] as 'easy' | 'steady' | 'strong'; s.build.activePreset = null })
    syncSegs(); syncFocusPills(); refreshSummary()
  })

  // metro toggle
  metroRow.addEventListener('click', () => {
    setState((s) => { s.build.metro = !s.build.metro })
    metroSwitch.classList.toggle('on', getState().build.metro)
  })

  beginBtn.addEventListener('click', () => {
    const { build } = getState()
    const plan = buildPlan(
      build.intensity, build.rounds,
      selectedIds('warmup'), selectedIds('circuit'), selectedIds('cooldown'),
    )
    if (!plan.length) return
    setState((s) => { s.run.plan = plan; s.run.idx = 0; s.run.remaining = plan[0].dur })
    onBegin()
  })

  function buildFocusPills(): void {
    PRESETS.forEach((p) => {
      const btn = document.createElement('button')
      btn.className = 'fpill'
      btn.textContent = p.name
      btn.dataset['id'] = p.id
      btn.addEventListener('click', () => { applyPreset(p); syncSegs(); syncFocusPills(); refreshSummary() })
      focusRow.appendChild(btn)
    })
  }

  function syncFocusPills(): void {
    focusRow.querySelectorAll<HTMLButtonElement>('.fpill').forEach((b) => {
      b.classList.toggle('on', b.dataset['id'] === getState().build.activePreset)
    })
  }

  function syncSegs(): void {
    const { build } = getState()
    roundSeg.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
      b.classList.toggle('on', +b.dataset['r']! === build.rounds)
    })
    intSeg.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
      b.classList.toggle('on', b.dataset['p'] === build.intensity)
    })
    metroSwitch.classList.toggle('on', build.metro)
  }

  function applyPreset(p: Preset): void {
    const phases: Phase[] = ['warmup', 'circuit', 'cooldown']
    phases.forEach((ph) => LIBRARY[ph].forEach((ex) => {
      setState((s) => { s.build.selected[ex.id] = p.on[ph].includes(ex.id) })
    }))
    setState((s) => { s.build.rounds = p.rounds; s.build.intensity = p.intensity; s.build.activePreset = p.id })
    document.querySelectorAll<HTMLDivElement>('.exrow').forEach((row) => {
      const id = row.dataset['id']!
      row.classList.toggle('on', !!getState().build.selected[id])
      row.classList.remove('open')
    })
    const descEl = document.getElementById('presetDesc')
    if (descEl) descEl.textContent = p.desc
  }

  function applyConfig(cfg: WorkoutConfig): void {
    const phases: Phase[] = ['warmup', 'circuit', 'cooldown']
    phases.forEach((ph) => LIBRARY[ph].forEach((ex) => {
      setState((s) => { s.build.selected[ex.id] = cfg[ph].includes(ex.id) })
    }))
    const presetId = PRESETS.some((p) => p.id === cfg.presetId) ? cfg.presetId : null
    setState((s) => {
      s.build.rounds = Math.min(5, Math.max(2, cfg.rounds))
      s.build.intensity = cfg.intensity
      s.build.metro = cfg.metro
      s.build.activePreset = presetId
    })
    document.querySelectorAll<HTMLDivElement>('.exrow').forEach((row) => {
      const id = row.dataset['id']!
      row.classList.toggle('on', !!getState().build.selected[id])
      row.classList.remove('open')
    })
    const descEl = document.getElementById('presetDesc')
    if (descEl) descEl.textContent = 'Shared workout · loaded from link'
  }

  function selectedIds(phase: Phase): string[] {
    return LIBRARY[phase].filter((e) => getState().build.selected[e.id]).map((e) => e.id)
  }

  function estimate(): { total: number; moves: number } {
    const { build } = getState()
    const plan = buildPlan(build.intensity, build.rounds, selectedIds('warmup'), selectedIds('circuit'), selectedIds('cooldown'))
    return {
      total: plan.reduce((a, s) => a + s.dur, 0),
      moves: plan.filter((s) => s.type === 'work').length,
    }
  }

  function refreshSummary(): void {
    const { build } = getState()
    const e = estimate()
    sTime.textContent = fmt(e.total)
    sMoves.textContent = String(e.moves)
    sRounds.textContent = String(build.rounds)

    const phases: Phase[] = ['warmup', 'circuit', 'cooldown']
    phases.forEach((ph) => {
      const el = document.getElementById(`cnt-${ph}`)
      if (el) el.textContent = `${selectedIds(ph).length} selected`
    })

    const ok = selectedIds('circuit').length > 0
    beginBtn.disabled = !ok
    beginBtn.textContent = ok ? 'Begin' : 'Pick at least one circuit move'
  }

  function buildExerciseRows(): void {
    const phases: Phase[] = ['warmup', 'circuit', 'cooldown']
    phases.forEach((phase) => {
      const holder = document.getElementById(`grp-${phase}`)!
      LIBRARY[phase].forEach((ex) => {
        const row = document.createElement('div')
        row.className = `exrow${getState().build.selected[ex.id] ? ' on' : ''}`
        row.dataset['id'] = ex.id

        const howHtml = ex.how.map((s, i) => `<li><span class="num">${i + 1}</span>${escapeHtml(s)}</li>`).join('')
        const mistakeHtml = ex.mistake
          ? `<div class="note"><span class="ic">!</span><span><b>Common slip:</b> ${escapeHtml(ex.mistake)}</span></div>` : ''
        const quietHtml = ex.quiet
          ? `<div class="note"><span class="ic">~</span><span><b>Quiet note:</b> ${escapeHtml(ex.quiet)}</span></div>` : ''
        const summary = tempoSummary(ex.tempo)

        row.innerHTML = `
          <div class="exrow-top">
            <button class="tog" aria-label="Include">
              <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
            <div class="exmain">
              <div class="exname">${escapeHtml(ex.name)}</div>
              <div class="exmeta">${escapeHtml(ex.tag)} · ${summary}</div>
            </div>
            <div class="chev">
              <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
          <div class="exdetail">
            <div class="exdetail-in">
              <ul class="how">${howHtml}</ul>
              ${mistakeHtml}${quietHtml}
              <div class="tempo-chip">Tempo&nbsp;<b>${summary}</b></div>
            </div>
          </div>`

        row.querySelector('.tog')!.addEventListener('click', (e) => {
          e.stopPropagation()
          setState((s) => { s.build.selected[ex.id] = !s.build.selected[ex.id]; s.build.activePreset = null })
          row.classList.toggle('on', !!getState().build.selected[ex.id])
          syncFocusPills(); refreshSummary()
        })

        const toggleOpen = (): void => { row.classList.toggle('open') }
        row.querySelector('.exmain')!.addEventListener('click', toggleOpen)
        row.querySelector('.chev')!.addEventListener('click', toggleOpen)

        holder.appendChild(row)
      })
    })
  }

  // expose show/hide
  buildSection.style.display = 'flex'
  loadBuildStreak()
}

function loadBuildStreak(): void {
  const el = document.getElementById('buildStreak')
  if (!el) return
  computeStats().then((stats) => {
    if (stats.streakCurrent > 0) {
      el.innerHTML = `<b>${stats.streakCurrent}</b> day streak &mdash; ${stats.totalSessions} sessions total`
    }
  }).catch(() => { /* best-effort */ })
}

export function showBuildScreen(): void {
  document.getElementById('buildScreen')!.style.display = 'flex'
  document.getElementById('runScreen')!.classList.remove('show')
  document.getElementById('doneScreen')!.classList.remove('show')
  document.getElementById('historyScreen')!.classList.remove('show')
  document.getElementById('phaseTag')!.textContent = 'Build'
  loadBuildStreak()
}
