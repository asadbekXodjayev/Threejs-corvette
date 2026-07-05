// ─────────────────────────────────────────────────────────────────────────────
// Hot-path scroll progress. Written by the single root ScrollTrigger `onUpdate`
// and read every frame by the camera rig, car stage, captions + callouts.
// Deliberately NOT in zustand/React — writing this ~120×/s must never trigger a
// re-render.
//
// `global`  — raw 0..1 page progress straight from ScrollTrigger.
// `damped`  — a spring-smoothed follow of `global`, advanced once per frame by
//             the SceneDriver. EVERYTHING scroll-driven reads `damped`, not
//             `global`, so the whole scene eases/settles as one instead of
//             snapping 1:1 with the wheel. This is the "smoother" knob.
// ─────────────────────────────────────────────────────────────────────────────

export interface ScrollProgress {
  /** raw global page progress 0..1 (top → bottom of the scroll space) */
  global: number
  /** spring-smoothed follow of `global` — the value the scene actually renders */
  damped: number
}

export const scroll: ScrollProgress = {
  global: 0,
  damped: 0,
}

/**
 * Advance `damped` toward `global` with frame-rate-independent smoothing.
 * `responsiveness` ≈ how fast it catches up (higher = snappier, lower = floatier).
 * Called once per frame by the SceneDriver so every consumer shares one value.
 */
export function stepDampedScroll(delta: number, responsiveness: number): void {
  // exponential approach: a = 1 - e^(-Δt·k). Stable across 30–144 Hz.
  const a = 1 - Math.exp(-delta * responsiveness)
  scroll.damped += (scroll.global - scroll.damped) * a
}
