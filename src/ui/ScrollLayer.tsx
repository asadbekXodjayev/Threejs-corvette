import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CONFIG } from '../config/scene.config'
import { scroll } from '../scroll/progress'
import { SceneOverlay } from './SceneOverlay'

gsap.registerPlugin(useGSAP, ScrollTrigger)

// DOM scroll layer above the fixed canvas. A single tall spacer supplies the
// scroll length; one root ScrollTrigger writes the 0→1 page progress into the
// non-reactive hot-path (read each frame by the car rig + backdrop + overlay).
// No pinned sections → no pin-spacers, far fewer reflows.
export function ScrollLayer() {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const trigger = ScrollTrigger.create({
        trigger: root.current!,
        start: 'top top',
        end: 'bottom bottom',
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          scroll.global = self.progress
        },
      })
      // pins/measurements settle after fonts load
      document.fonts?.ready?.then(() => ScrollTrigger.refresh())
      return () => trigger.kill()
    },
    { scope: root },
  )

  return (
    <div className="scroll-root" ref={root}>
      <div className="scroll-space" style={{ height: `${CONFIG.SCROLL_HEIGHT_VH}vh` }} />
      <SceneOverlay />
    </div>
  )
}
