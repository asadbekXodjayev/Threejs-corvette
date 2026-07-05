import { useEffect } from 'react'
import { getGPUTier } from 'detect-gpu'
import { useStore } from '../state/useStore'

/**
 * One-shot capability probe: GPU tier (detect-gpu), touch, and reduced-motion
 * preference → the store. Downstream, low tier / touch drops post-processing,
 * the reflector floor and particle counts (brief §8), and reduced-motion swaps
 * the scrubbed camera for static crossfades (brief §9).
 */
export function useCapability() {
  const setCapability = useStore((s) => s.setCapability)
  const setReducedMotion = useStore((s) => s.setReducedMotion)

  useEffect(() => {
    let cancelled = false

    const isTouch = window.matchMedia('(pointer: coarse)').matches
    getGPUTier()
      .then((t) => {
        if (!cancelled) setCapability({ gpuTier: t.tier ?? 2, isTouch })
      })
      .catch(() => {
        if (!cancelled) setCapability({ gpuTier: 2, isTouch })
      })

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReducedMotion(mq.matches)
    apply()
    mq.addEventListener('change', apply)

    return () => {
      cancelled = true
      mq.removeEventListener('change', apply)
    }
  }, [setCapability, setReducedMotion])
}
