import { getState, setState } from '../state/store'
import { tempoAt, orbScale, cycleLen } from '../engine/tempo'
import { ensureAudio, countBeep, goBeep, restBeep, repTick, finishBeep } from '../engine/audio'

function fmt(s: number): string {
  s = Math.max(0, Math.ceil(s))
  const m = Math.floor(s / 60), ss = s % 60
  return `${m}:${ss < 10 ? '0' : ''}${ss}`
}

function cssv(v: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(v).trim()
}

const R = 46
const CIRCUM = 2 * Math.PI * R

let ticker: ReturnType<typeof setInterval> | null = null
let _startFn: (() => void) | null = null
let endAt = 0
let lastBeep = -1
let lastRep = -1
let wakeLock: WakeLockSentinel | null = null

async function lockScreen(): Promise<void> {
  try {
    if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen')
  } catch { /* ignore */ }
}

function releaseLock(): void {
  try { wakeLock?.release(); wakeLock = null } catch { /* ignore */ }
}

export function initRunScreen(onFinish: (totalSec: number) => void, onQuit: () => void): void {
  const runSection = document.getElementById('runScreen')!
  const ring = document.getElementById('ring') as unknown as SVGCircleElement
  const breath = document.getElementById('breath')!
  const clock = document.getElementById('clock')!
  const kindLbl = document.getElementById('kindLbl')!
  const exName = document.getElementById('exName')!
  const pacerPhase = document.getElementById('pacerPhase')!
  const pacerMeta = document.getElementById('pacerMeta')!
  const cueRun = document.getElementById('cueRun')!
  const nextUp = document.getElementById('nextUp')!
  const roundRow = document.getElementById('roundRow')!
  const playBtn = document.getElementById('playBtn')!
  const phaseTag = document.getElementById('phaseTag')!

  ring.style.strokeDasharray = String(CIRCUM)

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && getState().run.running) lockScreen()
  })

  document.getElementById('playBtn')!.addEventListener('click', () => togglePlay())
  document.getElementById('nextBtn')!.addEventListener('click', () => advance(false))
  document.getElementById('prevBtn')!.addEventListener('click', () => back())
  document.getElementById('quitBtn')!.addEventListener('click', () => {
    stopTick(); releaseLock()
    setState((s) => { s.run.running = false })
    onQuit()
  })

  document.addEventListener('keydown', (e) => {
    if (!runSection.classList.contains('show')) return
    if (e.code === 'Space') { e.preventDefault(); togglePlay() }
    if (e.code === 'ArrowRight') advance(false)
    if (e.code === 'ArrowLeft') back()
  })

  function togglePlay(): void {
    ensureAudio()
    const running = !getState().run.running
    setState((s) => { s.run.running = running })
    setPlayUI(running)
    if (running) { lockScreen(); startTick() } else stopTick()
  }

  function setPlayUI(running: boolean): void {
    playBtn.classList.toggle('paused', !running)
    playBtn.innerHTML = running
      ? `<svg viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1"></rect><rect x="14" y="5" width="4" height="14" rx="1"></rect></svg>`
      : `<svg viewBox="0 0 24 24"><polygon points="7 4 20 12 7 20 7 4"></polygon></svg>`
  }

  function startTick(): void {
    const { run } = getState()
    endAt = performance.now() + run.remaining * 1000
    if (ticker) clearInterval(ticker)
    ticker = setInterval(loop, 80)
  }

  function stopTick(): void {
    if (ticker) { clearInterval(ticker); ticker = null }
    clock.classList.remove('pulse')
  }

  function loop(): void {
    if (!getState().run.running) return
    const remaining = (endAt - performance.now()) / 1000
    setState((s) => { s.run.remaining = remaining })
    const whole = Math.ceil(remaining)
    if (whole <= 3 && whole >= 1 && whole !== lastBeep) { lastBeep = whole; countBeep() }
    if (remaining <= 0) { advance(true); return }
    paint()
  }

  function advance(auto: boolean): void {
    const { run } = getState()
    if (run.idx >= run.plan.length - 1) { finish(); return }
    const nextIdx = run.idx + 1
    lastBeep = -1; lastRep = -1
    setState((s) => { s.run.idx = nextIdx; s.run.remaining = s.run.plan[nextIdx].dur })
    render()
    if (auto) {
      const seg = getState().run.plan[nextIdx]
      if (seg.type === 'rest') restBeep(); else goBeep()
    }
    if (getState().run.running) startTick()
  }

  function back(): void {
    const { run } = getState()
    const seg = run.plan[run.idx]
    if (run.remaining < seg.dur - 1.2) {
      setState((s) => { s.run.remaining = s.run.plan[s.run.idx].dur })
    } else if (run.idx > 0) {
      setState((s) => { s.run.idx--; s.run.remaining = s.run.plan[s.run.idx].dur })
    }
    lastBeep = -1; lastRep = -1
    render()
    if (getState().run.running) startTick()
  }

  function finish(): void {
    stopTick(); releaseLock()
    setState((s) => { s.run.running = false })
    finishBeep()
    const total = getState().run.plan.reduce((a, s) => a + s.dur, 0)
    onFinish(total)
  }

  function renderPips(): void {
    roundRow.innerHTML = ''
    const rounds = getState().build.rounds
    for (let r = 0; r < rounds; r++) {
      const d = document.createElement('div')
      d.className = 'pip'; d.innerHTML = '<i></i>'
      roundRow.appendChild(d)
    }
  }

  function roundProgress(r: number): number {
    const { run, build } = getState()
    const circuitLen = run.plan.filter((s) => s.type === 'work' && s.phase === 'circuit').length / build.rounds
    let done = 0
    for (let i = 0; i <= run.idx; i++) {
      if (run.plan[i].round === r && run.plan[i].type === 'work') done++
    }
    return circuitLen ? Math.min(100, Math.round(done / circuitLen * 100)) : 0
  }

  function updatePips(): void {
    const { run } = getState()
    const seg = run.plan[run.idx]
    const cr = seg?.round ?? (seg?.phase === 'cooldown' ? getState().build.rounds + 1 : 0)
    roundRow.querySelectorAll<HTMLDivElement>('.pip').forEach((pip, i) => {
      const rn = i + 1
      const fill = pip.querySelector('i') as HTMLElement
      if (rn < cr) fill.style.width = '100%'
      else if (rn === cr) fill.style.width = `${roundProgress(rn)}%`
      else fill.style.width = '0%'
    })
  }

  function render(): void {
    const { run, build } = getState()
    const seg = run.plan[run.idx]
    const col = seg.type === 'rest' ? cssv('--sage') : (seg.phase === 'circuit' ? cssv('--terra') : cssv('--brass'))
    ring.style.stroke = col
    kindLbl.textContent = seg.kind
    exName.textContent = seg.name
    const r = seg.round
    phaseTag.textContent = seg.phase === 'warmup' ? 'Warming up'
      : seg.phase === 'cooldown' ? 'Cooling down'
      : r ? `Round ${r} of ${build.rounds}` : 'Circuit'
    const nx = run.plan[run.idx + 1]
    nextUp.innerHTML = `<div class="l">Up next</div><div class="n">${nx ? nx.name : 'Finish'}</div>`
    cueRun.textContent = seg.cue || ''
    const pm = pacerMeta
    if (seg.type === 'work' && seg.tempo) {
      const t = seg.tempo; const cyc = cycleLen(t)
      if (t.kind === 'reps' || t.kind === 'alt') {
        const reps = Math.max(1, Math.round(seg.dur / cyc))
        const unit = t.per === 'tap' ? `${reps} taps`
          : t.per === 'side' ? `${reps} reps · alternating`
          : `~${reps} reps`
        pm.innerHTML = `<span><b>${unit}</b></span><span><b>${cyc}s</b>/rep</span>`
      } else if (t.kind === 'hold') {
        pm.innerHTML = `<span><b>Hold</b> ${fmt(seg.dur)}</span>`
      } else {
        pm.innerHTML = '<span><b>Keep moving</b></span>'
      }
    } else { pm.innerHTML = '' }
    updatePips()
    paint()
  }

  function paint(): void {
    const { run } = getState()
    const seg = run.plan[run.idx]
    clock.textContent = fmt(run.remaining)
    ring.style.strokeDashoffset = String(CIRCUM * (1 - (seg.dur > 0 ? run.remaining / seg.dur : 0)))
    if (run.remaining <= 3 && run.remaining > 0 && run.running) clock.classList.add('pulse')
    else clock.classList.remove('pulse')
    paintPacer()
  }

  function paintPacer(): void {
    const { run, build } = getState()
    const seg = run.plan[run.idx]
    if (seg.type !== 'work' || !seg.tempo) {
      pacerPhase.textContent = seg.type === 'rest' ? 'Rest' : ''
      pacerPhase.style.color = `var(--muted)`
      breath.style.transform = 'scale(0.5)'; breath.style.opacity = '.45'
      breath.classList.remove('ease')
      return
    }
    breath.style.opacity = '1'
    const elapsed = Math.max(0, seg.dur - run.remaining)
    const st = tempoAt(seg.tempo, elapsed)
    const o = orbScale(seg.tempo, elapsed)
    pacerPhase.textContent = st.label
    pacerPhase.style.color = o.ease ? cssv('--sage') : cssv('--ink')
    breath.classList.toggle('ease', o.ease)
    breath.style.transform = `scale(${o.scale.toFixed(3)})`
    if ((seg.tempo.kind === 'reps' || seg.tempo.kind === 'alt') && st.repIndex !== lastRep) {
      lastRep = st.repIndex
      if (run.running && elapsed > 0.1) repTick(build.metro)
    }
  }

  _startFn = start

  function start(): void {
    lastBeep = -1; lastRep = -1
    renderPips(); render(); ensureAudio(); goBeep()
    setState((s) => { s.run.running = true })
    setPlayUI(true); lockScreen(); startTick()
  }
}

export function startRun(): void {
  document.getElementById('buildScreen')!.style.display = 'none'
  document.getElementById('doneScreen')!.classList.remove('show')
  document.getElementById('runScreen')!.classList.add('show')
  _startFn?.()
}
