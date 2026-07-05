import { useEffect, useRef } from 'react'
import { useStore } from '../state/useStore'

// Optional ambient sound design, fully procedural (WebAudio, no asset files):
// a delayed thunder rumble after each lightning strike (light outruns sound) and
// a low engine-rev swell on chapter transitions. Defaults muted; the
// AudioContext is created on the first toggle (a user gesture), so nothing ever
// autoplays with sound (brief §6, §7).
export function Ambient() {
  const audioOn = useStore((s) => s.audioOn)
  const activeChapter = useStore((s) => s.activeChapter)
  const ctxRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)

  useEffect(() => {
    if (!audioOn) {
      const ctx = ctxRef.current
      if (ctx && masterRef.current) masterRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.2)
      return
    }
    if (!ctxRef.current) {
      const ctx = new AudioContext()
      const master = ctx.createGain()
      master.gain.value = 0
      master.connect(ctx.destination)
      ctxRef.current = ctx
      masterRef.current = master
    }
    const ctx = ctxRef.current
    void ctx.resume()
    masterRef.current!.gain.setTargetAtTime(0.5, ctx.currentTime, 0.4)
  }, [audioOn])

  // delayed thunder on each lightning strike
  useEffect(() => {
    const onStrike = () => {
      const ctx = ctxRef.current
      const master = masterRef.current
      if (!ctx || !master || !audioOn) return
      const delay = 0.25 + Math.random() * 0.28
      const dur = 1.7
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
      const src = ctx.createBufferSource()
      src.buffer = buffer
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 240
      const g = ctx.createGain()
      const t0 = ctx.currentTime + delay
      g.gain.setValueAtTime(0, t0)
      g.gain.linearRampToValueAtTime(0.55, t0 + 0.09)
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
      src.connect(lp).connect(g).connect(master)
      src.start(t0)
      src.stop(t0 + dur)
    }
    window.addEventListener('storm:strike', onStrike)
    return () => window.removeEventListener('storm:strike', onStrike)
  }, [audioOn])

  // engine-rev swell on chapter transition
  useEffect(() => {
    const ctx = ctxRef.current
    const master = masterRef.current
    if (!ctx || !master || !audioOn || activeChapter < 0) return
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 620
    const g = ctx.createGain()
    const t0 = ctx.currentTime
    osc.frequency.setValueAtTime(58, t0)
    osc.frequency.exponentialRampToValueAtTime(165, t0 + 0.5)
    osc.frequency.exponentialRampToValueAtTime(82, t0 + 1.4)
    g.gain.setValueAtTime(0, t0)
    g.gain.linearRampToValueAtTime(0.1, t0 + 0.15)
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 1.6)
    osc.connect(lp).connect(g).connect(master)
    osc.start(t0)
    osc.stop(t0 + 1.7)
  }, [activeChapter, audioOn])

  return null
}
