import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'
import { CONFIG } from '../config/scene.config'

const { degToRad, radToDeg } = THREE.MathUtils

// The camera poses (scene.config) were framed for a landscape viewport. A
// PerspectiveCamera holds its VERTICAL fov constant and derives the horizontal
// fov from aspect — so on a portrait phone the horizontal fov collapses and the
// car gets cropped hard on the left/right. The fix: below a reference aspect,
// widen the vertical fov so the HORIZONTAL fov stays constant. The car keeps its
// intended width on any device; a tall screen simply reveals more road/backdrop
// above and below instead of slicing the car's sides.
const ASPECT_REF = 1.5 // ≥ this (most laptops/desktops) → untouched framing
const MAX_FOV = 84 // clamp so extreme-narrow screens don't go full fisheye

// horizontal half-fov tangent at the design (landscape) framing — the invariant
// we hold as the viewport narrows.
const H_HALF_TAN = Math.tan(degToRad(CONFIG.CAMERA_FOV / 2)) * ASPECT_REF

/**
 * Keeps the car horizontally framed across aspect ratios. Runs on every canvas
 * resize (R3F updates `size` → aspect first, we override fov after). No per-frame
 * cost; CameraRig owns position/lookAt and never touches fov, so there's no fight.
 */
export function ResponsiveCamera() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const width = useThree((s) => s.size.width)
  const height = useThree((s) => s.size.height)

  useEffect(() => {
    if (!height) return
    const aspect = width / height
    const fov =
      aspect >= ASPECT_REF
        ? CONFIG.CAMERA_FOV
        : Math.min(MAX_FOV, radToDeg(2 * Math.atan(H_HALF_TAN / aspect)))

    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
  }, [camera, width, height])

  return null
}
