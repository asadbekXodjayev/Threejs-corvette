import { Html } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { CALLOUTS } from '../config/cars.config'
import { scroll } from '../scroll/progress'
import { useStore } from '../state/useStore'

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const smoothstep = (p: number) => p * p * (3 - 2 * p)

// Trapezoid fade: 0 before a, ramp a→b, hold b→c, ramp down c→d, 0 after.
function fade(p: number, a: number, b: number, c: number, d: number) {
  if (p <= a || p >= d) return 0
  if (p < b) return smoothstep(clamp01((p - a) / (b - a)))
  if (p > c) return smoothstep(clamp01((d - p) / (d - c)))
  return 1
}

/**
 * Technical labels pinned to points on the ZR1 (engine + cabin), each fading in
 * only during its scroll window. drei <Html> anchors DOM to a 3D position and
 * tracks it as the camera flies; we drive opacity via a ref each frame (no React
 * re-render). Non-interactive — matches the pointer-events:none canvas.
 */
// drei <Html distanceFactor> scales the label with camera distance. The reveal
// shots cluster three engine labels close together, so on a narrow phone they
// overlap and spill off-screen — shrink them as the viewport narrows.
const factorForWidth = (w: number) => (w < 640 ? 2 : w < 900 ? 2.5 : 3)

export function Callouts() {
  const refs = useRef<(HTMLDivElement | null)[]>([])
  const [distanceFactor, setDistanceFactor] = useState(() =>
    typeof window === 'undefined' ? 3 : factorForWidth(window.innerWidth),
  )

  useEffect(() => {
    const onResize = () => setDistanceFactor(factorForWidth(window.innerWidth))
    onResize()
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useFrame(() => {
    const reduced = useStore.getState().reducedMotion
    const p = scroll.damped
    for (let i = 0; i < CALLOUTS.length; i++) {
      const el = refs.current[i]
      if (!el) continue
      const c = CALLOUTS[i]
      const o = reduced ? (p > c.a && p < c.d ? 1 : 0) : fade(p, c.a, c.b, c.c, c.d)
      el.style.opacity = String(o)
      el.style.visibility = o < 0.01 ? 'hidden' : 'visible'
    }
  })

  return (
    <>
      {CALLOUTS.map((c, i) => (
        <Html
          key={c.label}
          position={c.at}
          center
          distanceFactor={distanceFactor}
          zIndexRange={[3, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div ref={(el) => { refs.current[i] = el }} className="callout" style={{ opacity: 0 }}>
            <span className="callout-dot" />
            <span className="callout-k">{c.label}</span>
            <span className="callout-v">{c.value}</span>
          </div>
        </Html>
      ))}
    </>
  )
}
