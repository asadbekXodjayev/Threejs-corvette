import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { CONFIG } from '../config/scene.config'

// Cheap grounding blob: a radial-gradient (dark centre → transparent edge) on a
// flat plane just under the car. Replaces real-time shadow maps entirely — this
// is what makes the car read as "on the road", not floating, at near-zero cost.
export function ContactShadow() {
  const texture = useMemo(() => {
    const s = 256
    const c = document.createElement('canvas')
    c.width = c.height = s
    const ctx = c.getContext('2d')!
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
    g.addColorStop(0.0, 'rgba(0,0,0,0.55)')
    g.addColorStop(0.5, 'rgba(0,0,0,0.22)')
    g.addColorStop(1.0, 'rgba(0,0,0,0.0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, s, s)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])

  useEffect(() => () => texture.dispose(), [texture])

  const size = CONFIG.CAR_TARGET_LENGTH * 1.6

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, CONFIG.GROUND_OFFSET_Y + 0.004, 0]}
      renderOrder={2}
    >
      {/* slightly rectangular to hug the car's footprint (tune the 0.62) */}
      <planeGeometry args={[size, size * 0.62]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        toneMapped={false}
        opacity={0.9}
      />
    </mesh>
  )
}
