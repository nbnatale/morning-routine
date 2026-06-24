import { getState } from '../state/store'

function fmt(s: number): string {
  s = Math.max(0, Math.ceil(s))
  const m = Math.floor(s / 60), ss = s % 60
  return `${m}:${ss < 10 ? '0' : ''}${ss}`
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
}
