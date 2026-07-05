import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { lightning } from './lightningState'

// Autonomous lightning strobe (NOT scroll-tied): fires at irregular 4–9s
// intervals. Each strike is a burst of 2–4 sub-flashes with a sharp attack and
// exponential flicker decay — real lightning isn't a linear blink. Drives a
// cool-white DirectionalLight and writes lightning.flash / .spike. NO shadow map
// (dropped for the >=30fps target — grounding comes from the ContactShadow).
export function Lightning() {
  const lightRef = useRef<THREE.DirectionalLight>(null)
  const strikeAt = useRef(-999)
  const sub = useRef<{ at: number; peak: number }[]>([])
  const nextIn = useRef(1.5)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime

    nextIn.current -= delta
    if (nextIn.current <= 0) {
      strikeAt.current = t
      const n = 2 + Math.floor(Math.random() * 3)
      const arr: { at: number; peak: number }[] = []
      let at = 0
      for (let i = 0; i < n; i++) {
        arr.push({ at, peak: 0.55 + Math.random() * 0.7 })
        at += 0.02 + Math.random() * 0.06
      }
      sub.current = arr
      nextIn.current = 4 + Math.random() * 5
      window.dispatchEvent(new CustomEvent('storm:strike'))
    }

    const dt = t - strikeAt.current
    let v = 0
    if (dt >= 0 && dt < 0.5) {
      for (const f of sub.current) {
        const x = dt - f.at
        if (x >= 0) v += f.peak * Math.exp(-x / 0.028)
      }
    }
    v = Math.min(1.5, v)

    lightning.flash = v
    const decay = Math.pow(0.86, delta * 60)
    lightning.spike = Math.max(lightning.spike * decay, v > 0.5 ? Math.min(1, v) : 0)

    if (lightRef.current) lightRef.current.intensity = v * 7
  })

  return <directionalLight ref={lightRef} position={[6, 14, -8]} color="#cfe0ff" intensity={0} />
}
