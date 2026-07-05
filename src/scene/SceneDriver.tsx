import { useFrame } from '@react-three/fiber'
import { CONFIG } from '../config/scene.config'
import { scroll, stepDampedScroll } from '../scroll/progress'

// dev/tuning: ?snap hard-syncs damped=global (no spring) so the headless
// screenshot harness can reach true scroll states — the software renderer is too
// slow to let the spring converge inside a short wait.
const SNAP =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('snap')

/**
 * Advances the single spring-smoothed scroll value once per frame, BEFORE any
 * other useFrame reads it. Must be the first child mounted inside <Canvas> so its
 * frame callback registers first (R3F runs default-priority callbacks in mount
 * order). Renders nothing.
 */
export function SceneDriver() {
  useFrame((_, delta) => {
    if (SNAP) {
      scroll.damped = scroll.global
      return
    }
    // clamp delta so a tabbed-away frigid frame can't teleport the scene
    stepDampedScroll(Math.min(delta, 0.05), CONFIG.SCROLL_RESPONSIVENESS)
  })
  return null
}
