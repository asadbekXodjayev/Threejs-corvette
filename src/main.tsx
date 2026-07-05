import { createRoot } from 'react-dom/client'
import '@fontsource-variable/oswald'
import '@fontsource-variable/jetbrains-mono'
import './styles/globals.css'
import './scene/preload' // start fetching all three GLBs immediately
import App from './App'
import { useStore } from './state/useStore'

// dev-only: expose the store + scroll state for the headless screenshot harness
if (import.meta.env.DEV) {
  const w = window as unknown as { __store?: unknown; __scroll?: unknown }
  w.__store = useStore
  import('./scroll/progress').then((m) => (w.__scroll = m.scroll))
}

// NOTE: intentionally no <StrictMode>. Its dev-only double-invoke of effects
// double-initialises Lenis / GSAP ScrollTrigger / the R3F loop, which fights the
// single-RAF scroll wiring. Cleanup is handled explicitly instead.
createRoot(document.getElementById('root')!).render(<App />)
