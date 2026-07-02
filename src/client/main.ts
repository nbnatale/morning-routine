import './styles.css'
import { hydrateLibraryFromApi, fetchShare } from './api/client'
import { initBuildScreen, showBuildScreen } from './ui/build-screen'
import { initRunScreen, startRun } from './ui/run-screen'
import { initDoneScreen, showDoneScreen } from './ui/done-screen'
import { initHistoryScreen, showHistoryScreen, hideHistoryScreen } from './ui/history-screen'
import type { WorkoutConfig } from '../shared/types'

// /s/:slug → load the shared config, then clean the URL so the SPA is at /
async function loadSharedConfig(): Promise<WorkoutConfig | null> {
  const m = location.pathname.match(/^\/s\/([a-z0-9]{8})$/i)
  if (!m) return null
  const config = await fetchShare(m[1]!.toLowerCase())
  history.replaceState(null, '', '/')
  return config
}

async function bootstrap(): Promise<void> {
  const [shared] = await Promise.all([loadSharedConfig(), hydrateLibraryFromApi()])

  initBuildScreen(() => startRun(), shared)

  initRunScreen(
    (totalSec) => showDoneScreen(totalSec),
    () => showBuildScreen(),
  )

  initDoneScreen(() => showBuildScreen())

  initHistoryScreen(() => { hideHistoryScreen(); showBuildScreen() })

  document.getElementById('histBtn')!.addEventListener('click', () => showHistoryScreen())
}

bootstrap()
