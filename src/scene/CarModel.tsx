import { useGLTF } from '@react-three/drei'
import { useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { CONFIG } from '../config/scene.config'

interface Props {
  url: string
  /** normalise the model's longest axis to this length, in metres */
  targetLength: number
}

/**
 * Loads a compressed GLB, normalises its scale via Box3 (glTF exports vary by
 * orders of magnitude), re-centres it on X/Z and drops it onto the ground plane
 * (bottom of bbox → y = GROUND_OFFSET_Y). No shadow flags — grounding is done by
 * the cheap radial ContactShadow, not real-time shadow maps. Rotation is applied
 * by the parent CarRig group, so this component only measures + places the mesh.
 */
export function CarModel({ url, targetLength }: Props) {
  const { scene } = useGLTF(url)
  // clone so transforms never mutate the shared useGLTF cache
  const model = useMemo(() => scene.clone(true), [scene])

  useLayoutEffect(() => {
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const longest = Math.max(size.x, size.y, size.z)
    const s = longest > 0 ? targetLength / longest : 1

    model.scale.setScalar(s)
    // recenter on X/Z, sit wheels on y = GROUND_OFFSET_Y
    model.position.set(-center.x * s, -box.min.y * s + CONFIG.GROUND_OFFSET_Y, -center.z * s)

    model.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (mesh.isMesh) mesh.frustumCulled = true
    })
  }, [model, targetLength])

  return <primitive object={model} />
}
