import './styles.css'
import { hydrateLibraryFromApi } from './api/client'
import { initBuildScreen, showBuildScreen } from './ui/build-screen'
import { initRunScreen, startRun } from './ui/run-screen'
import { initDoneScreen, showDoneScreen } from './ui/done-screen'

async function bootstrap(): Promise<void> {
  await hydrateLibraryFromApi()

  initBuildScreen(() => startRun())

  initRunScreen(
    (totalSec) => showDoneScreen(totalSec),
    () => showBuildScreen(),
  )

  initDoneScreen(() => showBuildScreen())
}

bootstrap()
