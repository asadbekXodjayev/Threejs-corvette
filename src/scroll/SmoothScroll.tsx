import { ReactLenis, useLenis, type LenisRef } from 'lenis/react'
import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Single-RAF wiring (verified 2026 canonical pattern): Lenis's own RAF is OFF
// (autoRaf:false); the ONE loop is gsap.ticker driving lenis.raf, with
// lagSmoothing(0), and ScrollTrigger.update bound to Lenis's scroll event. This
// is what removes the double-loop tearing the brief's scrollerProxy is prone to.
function TickerBind({ lenisRef }: { lenisRef: RefObject<LenisRef | null> }) {
  useEffect(() => {
    function raf(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000) // gsap seconds -> lenis ms
    }
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    ScrollTrigger.config({ ignoreMobileResize: true })
    return () => {
      gsap.ticker.remove(raf)
    }
  }, [lenisRef])

  const lenis = useLenis(() => ScrollTrigger.update())
  useEffect(() => {
    if (import.meta.env.DEV) (window as unknown as { __lenis?: unknown }).__lenis = lenis
  }, [lenis])
  return null
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<LenisRef | null>(null)
  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{
        autoRaf: false,
        lerp: 0.1,
        wheelMultiplier: 1,
        smoothWheel: true,
        // Smoothed touch is the top source of mobile jank — run native scroll on
        // touch and only smooth on pointer devices (verified note).
        syncTouch: false,
      }}
    >
      <TickerBind lenisRef={lenisRef} />
      {children}
    </ReactLenis>
  )
}
