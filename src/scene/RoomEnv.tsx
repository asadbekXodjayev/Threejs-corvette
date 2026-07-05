import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/**
 * Image-based reflections for the car paint. Bakes a neutral RoomEnvironment
 * once through the PMREMGenerator and sets it as scene.environment, dimmed via
 * environmentIntensity for the stormy mood. Disposed on unmount.
 *
 * NOTE: in three r0.180 `RoomEnvironment()` takes NO renderer argument.
 */
export function RoomEnv({ intensity = 0.55 }: { intensity?: number }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const rt = pmrem.fromScene(room, 0.04) // slight blur

    scene.environment = rt.texture
    scene.environmentIntensity = intensity

    return () => {
      scene.environment = null
      rt.dispose()
      pmrem.dispose()
      room.dispose()
    }
  }, [gl, scene, intensity])

  return null
}
