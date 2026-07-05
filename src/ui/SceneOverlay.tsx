import { useEffect, useRef } from 'react'
import { scroll } from '../scroll/progress'
import { useStore } from '../state/useStore'
import { BEATS } from '../config/cars.config'
import { TIMELINE } from '../config/scene.config'

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const smoothstep = (p: number) => p * p * (3 - 2 * p)

// Trapezoid: 0 before a, ramp a→b, hold b→c, ramp down c→d, 0 after.
function fade(p: number, a: number, b: number, c: number, d: number) {
  if (p <= a || p >= d) return 0
  if (p < b) return smoothstep(clamp01((p - a) / (b - a)))
  if (p > c) return smoothstep(clamp01((d - p) / (d - c)))
  return 1
}

/**
 * All scroll-driven DOM: the sequence of story beats + the white flash that hides
 * the Z06→ZR1 swap. One rAF reads the shared scroll.damped and writes inline
 * opacity/transform on refs — never per-frame React state. Windows never overlap,
 * so exactly one 'story' caption shows at a time, always in the same lower-left
 * column; 'title' cards bookend each car.
 */
export function SceneOverlay() {
  const beatRefs = useRef<(HTMLDivElement | null)[]>([])
  const flash = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const g = scroll.damped
      const reduced = useStore.getState().reducedMotion

      for (let i = 0; i < BEATS.length; i++) {
        const el = beatRefs.current[i]
        if (!el) continue
        const w = BEATS[i]
        const o = reduced ? (g > w.a && g < w.d ? 1 : 0) : fade(g, w.a, w.b, w.c, w.d)
        el.style.opacity = String(o)
        // subtle rise on the story column; titles hold still
        el.style.transform = reduced || w.slot === 'title' ? 'none' : `translateY(${(1 - o) * 14}px)`
        el.style.visibility = o < 0.01 ? 'hidden' : 'visible'
      }

      if (flash.current) {
        // peak the flash across whichever swap band we're inside
        let f = 0
        for (const band of TIMELINE.flashes) {
          if (g > band.start && g < band.end) {
            const mid = (band.start + band.end) / 2
            f = g < mid
              ? clamp01((g - band.start) / (mid - band.start))
              : clamp01((band.end - g) / (band.end - mid))
            break
          }
        }
        flash.current.style.opacity = String(reduced ? 0 : smoothstep(f) * 0.92)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <>
      {/* fixed left scrim keeps story copy legible over a bright car */}
      <div className="story-scrim" aria-hidden="true" />
      <div className="scene-overlay">
        {BEATS.map((w, i) => (
          <div
            key={`${w.slot}-${w.a}`}
            ref={(el) => { beatRefs.current[i] = el }}
            className={w.slot === 'title' ? 'beat beat-title' : 'beat beat-story'}
            style={{ opacity: 0 }}
          >
            {w.eyebrow && <p className="eyebrow">{w.eyebrow}</p>}
            {w.slot === 'title' ? (
              <h1 className="headline">{w.text}</h1>
            ) : (
              <p className="beat-lead">{w.text}</p>
            )}
            {w.sub && <p className="beat-sub">{w.sub}</p>}
          </div>
        ))}
      </div>
      <div ref={flash} className="swap-flash" aria-hidden="true" />
    </>
  )
}
