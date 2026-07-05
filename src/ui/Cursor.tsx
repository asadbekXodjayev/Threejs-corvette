import { useEffect, useRef } from 'react'

// Subtle custom cursor that eases toward the pointer and expands over
// interactive elements. Fine-pointer devices only (brief §7).
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    document.body.classList.add('custom-cursor')

    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let cx = x
    let cy = y
    let scale = 1

    const move = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
    }
    const over = (e: PointerEvent) => {
      const t = e.target as HTMLElement
      scale = t.closest('button, a, [data-hover]') ? 2.4 : 1
    }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerover', over, { passive: true })

    let raf = 0
    let s = 1
    const tick = () => {
      cx += (x - cx) * 0.2
      cy += (y - cy) * 0.2
      s += (scale - s) * 0.2
      if (dot.current) {
        dot.current.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%) scale(${s})`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerover', over)
      cancelAnimationFrame(raf)
      document.body.classList.remove('custom-cursor')
    }
  }, [])

  return (
    <div
      ref={dot}
      aria-hidden
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        border: '1px solid var(--accent)',
        pointerEvents: 'none',
        zIndex: 60,
        mixBlendMode: 'difference',
        willChange: 'transform',
      }}
    />
  )
}
