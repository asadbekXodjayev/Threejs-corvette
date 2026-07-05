import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { CONFIG, SWAP_MIDS, ROTATE_WINDOWS, XRAY_OPEN, XRAY_CLOSE } from '../config/scene.config'
import { CARS } from '../config/cars.config'
import { scroll } from '../scroll/progress'
import { useStore } from '../state/useStore'
import { CarModel } from './CarModel'

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const win = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))
const smoothstep = (p: number) => p * p * (3 - 2 * p)
const { degToRad, lerp } = THREE.MathUtils

// A ZR1 mesh whose shell we fade for the x-ray reveal (body/roof/glass only).
const isShell = (name: string) => {
  const n = name.toLowerCase()
  return n.includes('body') || n.includes('roof') || n.includes('glass')
}

interface XrayMat {
  mat: THREE.Material & { opacity: number; transparent: boolean }
  base: number
}

// which CARS index is on screen for a given scroll (hard cut at each flash mid)
function activeIndex(p: number): number {
  for (let i = 0; i < SWAP_MIDS.length; i++) if (p < SWAP_MIDS[i]) return i
  return CARS.length - 1
}

/**
 * Mounts all three cars on the shared road and choreographs the film:
 *   • rotating acts (C5, Z06) spin their car with scroll — pure function →
 *     reversible — while the camera holds the hero shot.
 *   • flash cuts hard-swap the visible car at each flash midpoint (the white
 *     overlay covers the cut, so no fade-through ghosting).
 *   • the ZR1 is held at a fixed yaw while the CameraRig flies it, and its
 *     body/roof/glass x-ray down to expose the engine bay, then restore for the
 *     solid rear-3/4 finale.
 */
export function CarStage() {
  const groups = useRef<(THREE.Group | null)[]>([])
  const xray = useRef<XrayMat[] | null>(null)

  // Collect + clone the ZR1 shell materials once, so the opacity mutation is
  // reversible and never corrupts the useGLTF cache.
  const collectXray = (g: THREE.Group) => {
    if (xray.current) return
    const found: XrayMat[] = []
    g.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh || !isShell(mesh.name)) return
      const src = mesh.material as THREE.Material
      const cloned = (Array.isArray(src) ? src[0] : src).clone() as XrayMat['mat']
      cloned.transparent = true
      cloned.depthWrite = false // x-ray: the ghost shell no longer occludes the bay
      mesh.material = cloned
      mesh.renderOrder = 3
      found.push({ mat: cloned, base: cloned.opacity })
    })
    if (found.length) xray.current = found
  }

  useFrame(() => {
    const reduced = useStore.getState().reducedMotion
    const p = scroll.damped
    const active = activeIndex(p)

    for (let i = 0; i < CARS.length; i++) {
      const g = groups.current[i]
      if (!g) continue
      const on = i === active
      g.visible = on
      if (!on) continue

      const car = CARS[i]
      if (car.reveal) {
        // fixed presentation yaw + x-ray reveal (camera does the moving)
        g.rotation.y = degToRad(car.presentYaw ?? 0)
        collectXray(g)
        if (xray.current) {
          const open = win(p, XRAY_OPEN[0], XRAY_OPEN[1]) // solid → dissolves for the engine
          const close = win(p, XRAY_CLOSE[0], XRAY_CLOSE[1]) // shell returns for the finale
          const t = clamp01(open - close)
          for (const x of xray.current) {
            x.mat.opacity = lerp(x.base, CONFIG.XRAY_MIN_OPACITY, reduced ? t * 0.9 : smoothstep(t))
          }
        }
      } else {
        // rotating turntable act
        const w = ROTATE_WINDOWS[i]
        const hp = w ? clamp01((p - w.start) / (w.end - w.start)) : 0
        const eased = reduced ? hp : smoothstep(hp)
        g.rotation.y = degToRad((car.startYaw ?? 0) + eased * (car.sweepDeg ?? 0))
      }
    }
  })

  return (
    <>
      {CARS.map((car, i) => (
        <group key={car.id} ref={(el) => { groups.current[i] = el }} visible={i === 0}>
          <CarModel
            url={car.modelUrl}
            targetLength={car.reveal ? CONFIG.REVEAL_TARGET_LENGTH : car.targetLength ?? CONFIG.CAR_TARGET_LENGTH}
          />
        </group>
      ))}
    </>
  )
}
