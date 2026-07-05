// ─────────────────────────────────────────────────────────────────────────────
// Three-generation Corvette film. The scene mounts all three cars at once and
// cross-cuts between them under a white flash:
//   1. C5    — the everyday icon (rotating turntable)
//   2. C6 Z06 — the naturally aspirated track weapon (rotating turntable)
//   3. C6 ZR1 — the supercharged king; the camera dives its engine bay + cabin
// Only the ZR1 GLB ships with interior + engine-bay geometry, so it alone is the
// one the camera "opens". See scene.config.ts (TIMELINE / ZR1_CAM) for pacing.
// ─────────────────────────────────────────────────────────────────────────────

export interface CarEntry {
  id: string
  /** absolute path under /public */
  modelUrl: string
  targetLength?: number
  groundOffsetY?: number
  /** turntable start angle (deg) for a rotating act */
  startYaw?: number
  /** turntable sweep (deg) for a rotating act */
  sweepDeg?: number
  /** fixed presentation angle (deg) held while the CAMERA moves (ZR1) */
  presentYaw?: number
  /** true → the camera-driven reveal car (x-ray shell + cabin fly-in) */
  reveal?: boolean
}

// Order = film order. index 0 first, last is the reveal car.
export const CARS: CarEntry[] = [
  {
    id: 'c5',
    modelUrl: '/models/01-c5-black.glb',
    startYaw: 30,
    sweepDeg: -230,
  },
  {
    id: 'z06',
    modelUrl: '/models/02-z06-carbon-2011.glb',
    startYaw: 35,
    sweepDeg: -250,
  },
  {
    id: 'zr1',
    modelUrl: '/models/03-zr1-c6.glb',
    targetLength: 4.6,
    // held at 0 so local axes = world axes (front = +Z, driver = +X) and the
    // ZR1_CAM keyframes aim true; the camera provides the three-quarter angle.
    presentYaw: 0,
    reveal: true,
  },
]

export const REVEAL_CAR = CARS[CARS.length - 1]
/** Back-compat: components that size to "the car" (ContactShadow, Road). */
export const ACTIVE_CAR = CARS[0]

// ── Story beats ──────────────────────────────────────────────────────────────
// Timed to `scroll.damped` via a trapezoid window: fade IN a→b, hold b→c, fade
// OUT c→d. Windows never overlap → exactly one 'story' caption at a time.
//   slot 'title' — big headline cards (top-centre), one per car.
//   slot 'story' — descriptive captions, FIXED lower-left column, same place
//                  every act, so the reading position never jumps.
export interface Beat {
  a: number
  b: number
  c: number
  d: number
  eyebrow?: string
  text: string
  sub?: string
  slot: 'title' | 'story'
}

export const BEATS: Beat[] = [
  // ── Act 1 — C5 (0.00–0.20) ──
  { a: -0.05, b: 0.0, c: 0.055, d: 0.10, slot: 'title', eyebrow: 'Chevrolet Corvette · 1997–2004', text: 'C5', sub: 'Scroll to begin ↓' },
  { a: 0.055, b: 0.085, c: 0.115, d: 0.14, slot: 'story', text: 'The one that modernised the breed.', sub: 'LS1 5.7 V8 · 350 hp' },
  { a: 0.145, b: 0.17, c: 0.185, d: 0.198, slot: 'story', text: 'A rigid hydroformed frame, rear transaxle.', sub: 'Near 50/50 weight balance' },
  // — flash 0 : 0.20–0.27 —
  // ── Act 2 — C6 Z06 (0.27–0.50) ──
  { a: 0.275, b: 0.31, c: 0.34, d: 0.38, slot: 'title', eyebrow: 'C6 · naturally aspirated', text: '2011 Z06 Carbon', sub: 'The purist' },
  { a: 0.385, b: 0.415, c: 0.44, d: 0.465, slot: 'story', text: '505 horsepower from 7.0 litres. No boost.', sub: 'LS7 V8 · 470 lb-ft · 7,100 rpm redline' },
  { a: 0.47, b: 0.485, c: 0.492, d: 0.498, slot: 'story', text: 'Hand-built LS7 — titanium rods, dry sump.', sub: 'Carbon Limited Edition · 500 made' },
  // — flash 1 : 0.50–0.57 —
  // ── Act 3 — C6 ZR1 (0.57–1.00) ──
  { a: 0.575, b: 0.61, c: 0.645, d: 0.68, slot: 'title', eyebrow: 'And the bloodline crowned a king', text: 'C6 ZR1', sub: 'Codename: Blue Devil' },
  { a: 0.665, b: 0.695, c: 0.72, d: 0.735, slot: 'story', text: '638 horsepower — and this time, force-fed.', sub: '6.2L supercharged LS9' },
  { a: 0.74, b: 0.765, c: 0.79, d: 0.805, slot: 'story', text: 'A 2.3-litre blower crowns the V8.', sub: 'Eaton TVS · 604 lb-ft · 205 mph' },
  { a: 0.81, b: 0.84, c: 0.865, d: 0.885, slot: 'story', text: 'A cockpit built around the driver.', sub: 'Boost gauge · magnetic ride · heads-up' },
  { a: 0.90, b: 0.93, c: 1.05, d: 1.10, slot: 'story', text: '205 mph. The apex of a generation.', sub: 'Bowling Green · 2009–2013' },
]

// ── 3D callouts (drei Html labels pinned in world space on the ZR1) ──────────
export interface Callout {
  at: [number, number, number]
  label: string
  value: string
  a: number
  b: number
  c: number
  d: number
}

export const CALLOUTS: Callout[] = [
  // engine act (~0.665–0.79): over the exposed bay (front = +Z, Y≈0.6-0.85)
  { at: [-0.4, 0.78, 1.15], label: 'Supercharger', value: '2.3L Eaton TVS', a: 0.665, b: 0.70, c: 0.765, d: 0.79 },
  { at: [0.5, 0.72, 1.55], label: 'Output', value: '638 hp / 604 lb-ft', a: 0.69, b: 0.72, c: 0.765, d: 0.79 },
  { at: [0.05, 0.86, 0.8], label: 'Redline', value: '6,600 rpm', a: 0.71, b: 0.74, c: 0.765, d: 0.79 },
  // cabin act (~0.81–0.885): gauges + chassis (cabin ≈ centre, Z≈-0.5)
  { at: [0.3, 0.9, -0.55], label: 'Boost gauge', value: '0–15 psi', a: 0.81, b: 0.84, c: 0.865, d: 0.885 },
  { at: [-0.15, 0.6, -0.95], label: 'Chassis', value: 'Magnetic Ride', a: 0.825, b: 0.85, c: 0.865, d: 0.885 },
]
