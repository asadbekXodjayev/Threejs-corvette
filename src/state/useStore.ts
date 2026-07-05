import { create } from 'zustand'

// Discrete UI/app state that changes rarely — safe to drive React re-renders.
// The 120 Hz scroll hot-path lives in scroll/progress.ts, NOT here.
export interface AppState {
  // ── loading ──
  loadProgress: number // 0..100 (real byte progress)
  loaded: boolean
  loadError: string | null
  // ── navigation ──
  started: boolean // user has left the hero
  activeChapter: number // 0..2 (-1 = hero, 3 = finale)
  // ── settings / capability ──
  audioOn: boolean
  reducedMotion: boolean
  gpuTier: number // 0 (lowest) .. 3 (highest) from detect-gpu
  isTouch: boolean

  setLoadProgress: (p: number) => void
  setLoaded: (v: boolean) => void
  setLoadError: (e: string | null) => void
  setStarted: (v: boolean) => void
  setActiveChapter: (i: number) => void
  toggleAudio: () => void
  setReducedMotion: (v: boolean) => void
  setCapability: (opts: { gpuTier: number; isTouch: boolean }) => void
}

export const useStore = create<AppState>((set) => ({
  loadProgress: 0,
  loaded: false,
  loadError: null,
  started: false,
  activeChapter: -1,
  audioOn: false,
  reducedMotion: false,
  gpuTier: 3,
  isTouch: false,

  setLoadProgress: (p) => set({ loadProgress: p }),
  setLoaded: (v) => set({ loaded: v }),
  setLoadError: (e) => set({ loadError: e }),
  setStarted: (v) => set({ started: v }),
  setActiveChapter: (i) => set((s) => (s.activeChapter === i ? s : { activeChapter: i })),
  toggleAudio: () => set((s) => ({ audioOn: !s.audioOn })),
  setReducedMotion: (v) => set({ reducedMotion: v }),
  setCapability: ({ gpuTier, isTouch }) => set({ gpuTier, isTouch }),
}))

/** True when post-processing/reflector/volumetrics should be dropped. */
export const isLowTier = (s: AppState) => s.gpuTier <= 1 || s.isTouch
