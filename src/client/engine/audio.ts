let actx: AudioContext | null = null

export function ensureAudio(): void {
  if (!actx) {
    try { actx = new AudioContext() } catch { return }
  }
  if (actx.state === 'suspended') actx.resume()
}

function tone(freq: number, dur: number, vol: number, type: OscillatorType = 'sine'): void {
  if (!actx) return
  try {
    const o = actx.createOscillator()
    const g = actx.createGain()
    o.type = type
    o.frequency.value = freq
    g.gain.setValueAtTime(0, actx.currentTime)
    g.gain.linearRampToValueAtTime(vol, actx.currentTime + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur)
    o.connect(g)
    g.connect(actx.destination)
    o.start()
    o.stop(actx.currentTime + dur + 0.02)
  } catch { /* ignore */ }
}

export function countBeep(): void { tone(620, 0.12, 0.16) }
export function goBeep(): void {
  tone(880, 0.3, 0.22)
  setTimeout(() => tone(1175, 0.18, 0.18), 90)
}
export function restBeep(): void { tone(440, 0.28, 0.18) }
export function repTick(enabled: boolean): void {
  if (enabled) tone(150, 0.06, 0.12, 'triangle')
}
export function finishBeep(): void {
  const freqs = [660, 880, 990, 1320]
  const delays = [0, 140, 280, 480]
  delays.forEach((ms, i) => setTimeout(() => tone(freqs[i], 0.3, 0.2), ms))
}
