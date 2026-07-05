import { CARS, REVEAL_CAR } from './cars.config'

// ─────────────────────────────────────────────────────────────────────────────
// Tuning block for the three-generation scroll film. One damped 0..1 scroll:
//
//   ACT 1  C5        0.00 → 0.20   turntable rotation (static hero camera)
//   FLASH 0          0.20 → 0.27   white cut, C5 → Z06  (matched framing)
//   ACT 2  Z06       0.27 → 0.50   turntable rotation (static hero camera)
//   FLASH 1          0.50 → 0.57   white cut, Z06 → ZR1  (matched framing)
//   ACT 3  ZR1       0.57 → 1.00   camera dive: establish → engine x-ray → cabin
//                                  → rear-3/4 finale
//
// MATCH CUT: every swap happens at the SAME camera framing. The rotating acts all
// use HERO_CAM, and the ZR1 spline's first pose IS HERO_CAM — so the flash only
// changes the car underneath, never the camera. That's the seamless transition.
//
// The ZR1 path is a Catmull-Rom spline → continuous velocity, no jerky corners.
// Aim points use the MEASURED whole-car bounds: centre [0,0.77,0], 2.5w×1.35h×
// 4.6L, front = +Z (engine bay ≈ +1.2 Z), cabin ≈ -0.5 Z, driver side = +X.
// All values by-eye on top of that.
// ─────────────────────────────────────────────────────────────────────────────

type Vec3 = [number, number, number]

export const TIMELINE = {
  flashes: [
    { start: 0.2, end: 0.27 },
    { start: 0.5, end: 0.57 },
  ],
} as const

// Swap at each flash midpoint (screen whitest → cut invisible).
export const SWAP_MIDS = TIMELINE.flashes.map((f) => (f.start + f.end) / 2) // [0.235, 0.535]

// Rotation act windows for the non-reveal cars, keyed by CARS index.
export const ROTATE_WINDOWS: Record<number, { start: number; end: number }> = {
  0: { start: 0.0, end: TIMELINE.flashes[0].start }, // C5   0.00–0.20
  1: { start: TIMELINE.flashes[0].end, end: TIMELINE.flashes[1].start }, // Z06 0.27–0.50
}

// ZR1 camera window: from flash-1 midpoint (where the swap happens) to the end.
export const ZR1_CAM_START = SWAP_MIDS[1] // 0.535

// x-ray reveal timing (ZR1 body shell): stay solid through the establish, dissolve
// as the camera rises for the engine, hold through the cabin, restore for finale.
export const XRAY_OPEN: [number, number] = [0.63, 0.72]
export const XRAY_CLOSE: [number, number] = [0.9, 0.99]

export interface CamPose { pos: Vec3; look: Vec3 }

/** Hero shot — the framing every car swap is matched to. */
export const HERO_CAM: CamPose = { pos: [0, 1.4, 7.0], look: [0, 0.6, 0] }

// ZR1 spline poses. [0] IS the hero shot (match cut). Travel order; sampled
// smoothly by scroll. Distances kept generous so nothing is jammed/cropped.
export const ZR1_CAM: CamPose[] = [
  { pos: [0, 1.4, 7.0], look: [0, 0.6, 0] }, // 0 — hero (matches the Z06 cut)
  { pos: [3.4, 1.5, 4.9], look: [0, 0.72, 0] }, // 1 — ease into front three-quarter
  { pos: [1.1, 2.35, 4.0], look: [0.0, 0.55, 1.15] }, // 2 — rise over the front
  { pos: [0.55, 1.95, 3.05], look: [0.05, 0.5, 1.3] }, // 3 — frame the engine bay from above (x-ray)
  { pos: [2.7, 1.4, -0.2], look: [0.1, 0.92, -0.5] }, // 4 — arc to the driver window
  { pos: [1.05, 1.16, -0.35], look: [0.12, 0.9, -0.7] }, // 5 — lean into the cabin (wheel + gauges)
  { pos: [4.1, 1.6, -4.5], look: [0, 0.7, 0] }, // 6 — pull back to the rear-3/4 finale
]

/** Wide static shot when prefers-reduced-motion is on. */
export const REDUCED_CAM: CamPose = { pos: [4.4, 1.9, 5.6], look: [0, 0.7, 0] }

export const CONFIG = {
  // ── models ──
  MODEL_URL: CARS[0].modelUrl, // back-compat (preload default)
  CAR_TARGET_LENGTH: CARS[0].targetLength ?? 4.5,
  REVEAL_TARGET_LENGTH: REVEAL_CAR.targetLength ?? 4.6,
  GROUND_OFFSET_Y: CARS[0].groundOffsetY ?? 0.0,

  // ── camera ──
  CAMERA_FOV: 38,
  CAMERA_POS: HERO_CAM.pos,
  CAMERA_LOOK: HERO_CAM.look,

  // ── smoothing ──
  SCROLL_RESPONSIVENESS: 6,

  // ── x-ray reveal (ZR1 body shell) ──
  XRAY_MIN_OPACITY: 0.12,

  // ── scroll length + backdrop ──
  // long enough that each act has real dwell time to read the captions
  SCROLL_HEIGHT_VH: 1000,
  BG_COLOR: '#060608',
  ROAD_RADIUS: 16,

  LIGHTNING_ENABLED: false,
}
