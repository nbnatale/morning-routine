import './styles.css'
import { initBuildScreen, showBuildScreen } from './ui/build-screen'
import { initRunScreen, startRun } from './ui/run-screen'
import { initDoneScreen, showDoneScreen } from './ui/done-screen'

initBuildScreen(() => startRun())

initRunScreen(
  (totalSec) => showDoneScreen(totalSec),
  () => showBuildScreen(),
)

initDoneScreen(() => showBuildScreen())
