import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

// dev-only: expose the live three scene/camera/renderer to window for the
// headless diagnostic harness.
export function DevExpose() {
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    if (import.meta.env.DEV) (window as unknown as { __three?: unknown }).__three = { scene, camera, gl }
  }, [scene, camera, gl])
  return null
}
