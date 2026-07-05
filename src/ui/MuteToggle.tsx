import { useStore } from '../state/useStore'

// Ambient-sound toggle. Defaults muted; never autoplays with sound (brief §7).
export function MuteToggle() {
  const audioOn = useStore((s) => s.audioOn)
  const toggle = useStore((s) => s.toggleAudio)

  return (
    <button
      className="focus-ring"
      data-hover
      onClick={toggle}
      aria-pressed={audioOn}
      aria-label={audioOn ? 'Mute ambient sound' : 'Enable ambient sound'}
      style={{
        position: 'fixed',
        bottom: 'clamp(0.9rem, 2vw, 1.6rem)',
        right: 'clamp(0.9rem, 2vw, 1.8rem)',
        zIndex: 30,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.55rem',
        padding: '0.55rem 0.8rem',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.16)',
        color: 'var(--fg-dim)',
        cursor: 'pointer',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.62rem',
        letterSpacing: '0.24em',
        textTransform: 'uppercase',
        backdropFilter: 'blur(6px)',
      }}
    >
      <span
        aria-hidden
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: audioOn ? 'var(--accent)' : 'transparent',
          border: '1px solid var(--accent)',
        }}
      />
      {audioOn ? 'Sound on' : 'Sound off'}
    </button>
  )
}
