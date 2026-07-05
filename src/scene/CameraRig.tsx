import { useFrame, useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import { ZR1_CAM, ZR1_CAM_START, HERO_CAM, REDUCED_CAM } from '../config/scene.config'
import { scroll } from '../scroll/progress'
import { useStore } from '../state/useStore'

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const smoothstep = (p: number) => p * p * (3 - 2 * p)

/**
 * Drives the camera as a pure function of scroll.damped:
 *   • rotating acts (scroll < ZR1_CAM_START) → hold the static hero shot; only
 *     the car turns, which is the look the piece opened with.
 *   • ZR1 act (scroll ≥ ZR1_CAM_START) → sample a Catmull-Rom spline through the
 *     ZR1_CAM poses. A spline gives continuous velocity, so the fly-through has
 *     no jerky corners at keyframe joins (the old piecewise path did).
 *
 * prefers-reduced-motion → hold a wide establishing shot, no motion.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera)

  // Build the position + look-at curves once. `centripetal` avoids the loops/
  // overshoot Catmull-Rom can produce around sharp control points.
  const curves = useMemo(() => {
    const pos = new THREE.CatmullRomCurve3(
      ZR1_CAM.map((k) => new THREE.Vector3(...k.pos)),
      false,
      'centripetal',
    )
    const look = new THREE.CatmullRomCurve3(
      ZR1_CAM.map((k) => new THREE.Vector3(...k.look)),
      false,
      'centripetal',
    )
    return { pos, look }
  }, [])

  const v = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3() }), [])

  useFrame(() => {
    if (useStore.getState().reducedMotion) {
      camera.position.set(...REDUCED_CAM.pos)
      camera.lookAt(v.look.set(...REDUCED_CAM.look))
      return
    }

    const p = scroll.damped

    if (p < ZR1_CAM_START) {
      // rotating acts — static hero shot
      camera.position.set(...HERO_CAM.pos)
      camera.lookAt(v.look.set(...HERO_CAM.look))
      return
    }

    // ZR1 act — map [ZR1_CAM_START, 1] → spline u, eased for a soft start/stop
    const u = smoothstep(clamp01((p - ZR1_CAM_START) / (1 - ZR1_CAM_START)))
    curves.pos.getPoint(u, v.pos)
    curves.look.getPoint(u, v.look)
    camera.position.copy(v.pos)
    camera.lookAt(v.look)
  })

  return null
}
