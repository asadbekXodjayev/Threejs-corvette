import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { CONFIG } from '../config/scene.config'

// The ground the car stands on. A dark asphalt disc that picks up a faint sheen
// from the RoomEnvironment (a hint of wet road) and dissolves into the near-black
// background at its rim via a radial alpha map — so there's no hard horizon edge.
// Static (does not rotate with the car), which is what reads as "on a road".
export function Road() {
  const alphaMap = useMemo(() => {
    const s = 256
    const c = document.createElement('canvas')
    c.width = c.height = s
    const ctx = c.getContext('2d')!
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
    // white = opaque (visible road), black = transparent (fades to background)
    g.addColorStop(0.0, '#ffffff')
    g.addColorStop(0.45, '#ffffff')
    g.addColorStop(1.0, '#000000')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, s, s)
    const t = new THREE.CanvasTexture(c)
    return t
  }, [])

  useEffect(() => () => alphaMap.dispose(), [alphaMap])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, CONFIG.GROUND_OFFSET_Y, 0]} receiveShadow={false}>
      <circleGeometry args={[CONFIG.ROAD_RADIUS, 96]} />
      <meshStandardMaterial
        color="#0c0d11"
        roughness={0.5}
        metalness={0.18}
        envMapIntensity={0.5}
        alphaMap={alphaMap}
        transparent
        polygonOffset
        polygonOffsetFactor={1}
        polygonOffsetUnits={1}
      />
    </mesh>
  )
}
