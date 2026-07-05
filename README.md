# Threejs-corvette

A scrollytelling 3D experience tracing three generations of the Chevrolet
Corvette — **C5 → C6 Z06 → C6 ZR1** — built with React Three Fiber.

Scroll drives one continuous, spring-damped timeline:

1. **C5** — the everyday icon, rotating on a turntable.
2. **C6 Z06 Carbon** — the naturally aspirated purist. A white flash-cut swaps
   the car under a matched camera framing (seamless transition).
3. **C6 ZR1 "Blue Devil"** — the supercharged king. The camera flies a smooth
   spline: establish → rise over the hood and **x-ray the body to expose the
   engine bay** → dive into the **modeled cabin** (steering wheel, gauges) →
   pull back to a rear-3/4 finale. Technical callouts and editorial captions
   fade in per beat.

## Tech

- **React 19 + Vite** · **@react-three/fiber** v9 + **drei**
- **GSAP ScrollTrigger** + **Lenis** smooth scroll (single-RAF wiring)
- Camera path = **Catmull-Rom spline**; scroll is spring-smoothed so the whole
  scene eases as one (`src/scroll/progress.ts`)
- Perf-first: no real-time shadows/reflector; `RoomEnvironment` reflections +
  a radial `ContactShadow`. Compressed meshopt + WebP GLBs, all preloaded.

## Develop

```bash
npm install
npm run dev        # dedicated port, e.g. npm run dev -- --port 5178 --strictPort
npm run build      # tsc + vite build
npm run typecheck
```

Dev query flags: `?perf` (FPS HUD), `?snap` (hard-sync scroll for screenshots).

Tuning lives in `src/config/` — `cars.config.ts` (cars, caption beats, callouts)
and `scene.config.ts` (timeline, flash swaps, camera keyframes).
