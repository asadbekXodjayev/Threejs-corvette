import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { useStore } from '../state/useStore'

// Original crossed-flag-INSPIRED mark (abstract chevron pennants — deliberately
// NOT the Corvette/GM trademark, per brief §4).
function Mark() {
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" fill="none" aria-hidden>
      <g transform="translate(38 40)">
        {[-1, 1].map((dir) => (
          <g key={dir} transform={`rotate(${dir * 22})`}>
            <rect x={dir === 1 ? 0 : -22} y="-26" width="22" height="15" fill="var(--accent)" opacity="0.9" />
            <rect x={dir === 1 ? 0 : -22} y="-26" width="11" height="7.5" fill="#0a0a0a" opacity="0.55" />
            <rect x={dir === 1 ? 11 : -11} y="-18.5" width="11" height="7.5" fill="#0a0a0a" opacity="0.55" />
            <rect x={dir === 1 ? -0.7 : -0.7} y="-27" width="1.4" height="40" fill="var(--fg)" opacity="0.85" />
          </g>
        ))}
      </g>
    </svg>
  )
}

export function Loader() {
  const { progress, active, errors } = useProgress()
  const [complete, setComplete] = useState(false)
  const [gone, setGone] = useState(false)
  const reduced = useStore((s) => s.reducedMotion)

  useEffect(() => {
    useStore.getState().setLoadProgress(progress)
  }, [progress])

  useEffect(() => {
    if (progress >= 100 && !active && errors.length === 0) {
      useStore.getState().setLoaded(true)
      setComplete(true)
      const t = setTimeout(() => setGone(true), reduced ? 250 : 780)
      return () => clearTimeout(t)
    }
  }, [progress, active, errors.length, reduced])

  if (gone) return null
  const hasError = errors.length > 0

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2.2rem',
        background: '#0a0a0a',
        opacity: complete ? 0 : 1,
        transform: complete && !reduced ? 'scale(1.04)' : 'scale(1)',
        transition: `opacity 0.7s var(--ease-out), transform 0.7s var(--ease-out)`,
        pointerEvents: complete ? 'none' : 'auto',
      }}
      role="status"
      aria-live="polite"
    >
      <Mark />
      {hasError ? (
        <div style={{ textAlign: 'center', maxWidth: '32ch' }}>
          <p className="eyebrow" style={{ color: 'var(--accent)', marginBottom: '0.6rem' }}>
            Load error
          </p>
          <p className="tagline">
            A model or decoder failed to load. Check that /models/*.glb are present and the
            console for details.
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              width: 'min(320px, 60vw)',
              height: '1px',
              background: 'rgba(255,255,255,0.14)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'var(--accent)',
                transition: 'width 0.2s linear',
              }}
            />
          </div>
          <p className="eyebrow" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {Math.round(progress)}%
          </p>
        </>
      )}
    </div>
  )
}
