import { Canvas } from '@react-three/fiber'
import { Suspense, lazy } from 'react'
import * as THREE from 'three'
import { CONFIG } from '../config/scene.config'
import { StageLighting } from './StageLighting'
import { RoomEnv } from './RoomEnv'
import { SceneDriver } from './SceneDriver'
import { CameraRig } from './CameraRig'
import { CarStage } from './CarStage'
import { Callouts } from './Callouts'
import { Road } from './Road'
import { ContactShadow } from './ContactShadow'
import { Lightning } from './effects/Lightning'
import { DevExpose } from './DevExpose'
import { useStore } from '../state/useStore'

// ?perf mounts the r3f-perf HUD (a devDep) to read live FPS while tuning. Lazy
// so it never loads in a normal run.
const SHOW_PERF =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('perf')
const Perf = lazy(() => import('r3f-perf').then((m) => ({ default: m.Perf })))

// Stable camera prop (module const) so R3F applies it once and never re-runs the
// onCreated lookAt. Static camera — only the car rotates.
const CAMERA = { fov: CONFIG.CAMERA_FOV, near: 0.1, far: 100, position: CONFIG.CAMERA_POS }

// The single persistent <Canvas>. Clears to a near-black backdrop; the car sits
// on a 3D road (Road) that dissolves into that same colour, so it reads as
// standing on a road, not floating. R3F already defaults to ACESFilmic tone
// mapping + sRGB output + MSAA, so we keep those and only set exposure.
export function Experience() {
  const reduced = useStore((s) => s.reducedMotion)

  return (
    <Canvas
      className="canvas-root"
      // R3F injects inline position:relative that beats the CSS class — the fixed
      // full-viewport sizing + zIndex MUST be inline.
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100svh',
        zIndex: 1,
        pointerEvents: 'none',
      }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMappingExposure: 1,
      }}
      camera={CAMERA}
      onCreated={({ gl, camera }) => {
        gl.setClearColor(new THREE.Color(CONFIG.BG_COLOR), 1)
        camera.lookAt(new THREE.Vector3(...CONFIG.CAMERA_LOOK))
      }}
    >
      <Suspense fallback={null}>
        <SceneDriver />
        <DevExpose />
        <StageLighting />
        <RoomEnv intensity={0.55} />
        <Road />
        <CameraRig />
        <CarStage />
        <Callouts />
        <ContactShadow />
        {CONFIG.LIGHTNING_ENABLED && !reduced && <Lightning />}
        {SHOW_PERF && <Perf position="top-left" />}
      </Suspense>
    </Canvas>
  )
}
