// Headless WebGL screenshot + console-error capture.
// Usage: node scripts/shot.mjs <url> <outPng> [waitMs] [scrollFrac]
import { chromium } from 'playwright'

const [url, out, waitMs = '3500', scrollFrac = ''] = process.argv.slice(2)

const browser = await chromium.launch({
  headless: true,
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--ignore-gpu-blocklist',
    '--enable-unsafe-swiftshader',
    '--enable-webgl',
  ],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
if (process.env.REDUCED) await page.emulateMedia({ reducedMotion: 'reduce' })

const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })

// Optionally drive the page scroll to a fraction of total height (to reach a
// chapter). Step through so pinned ScrollTriggers fire their onToggle at each
// boundary (an instant jump can skip chapter activation).
if (scrollFrac) {
  await page.waitForTimeout(1800) // let Lenis/ScrollTrigger initialise
  const target = parseFloat(scrollFrac)
  const STEPS = 30
  for (let s = 1; s <= STEPS; s++) {
    await page.evaluate((f) => {
      const max = document.body.scrollHeight - window.innerHeight
      const y = max * f
      const lenis = window.__lenis
      if (lenis && lenis.scrollTo) lenis.scrollTo(y, { immediate: true, force: true })
      else window.scrollTo(0, y)
    }, (target * s) / STEPS)
    await page.waitForTimeout(60)
  }
}

await page.waitForTimeout(parseInt(waitMs, 10))
const active = await page.evaluate(() => window.__store?.getState?.().activeChapter)
console.log('ACTIVE_CHAPTER:', active)
await page.screenshot({ path: out, timeout: 120000, animations: 'disabled' })

// Report the live WebGL renderer so we know SwiftShader vs hardware.
const gl = await page.evaluate(() => {
  const c = document.querySelector('canvas')
  if (!c) return 'NO CANVAS'
  const ctx = c.getContext('webgl2') || c.getContext('webgl')
  if (!ctx) return 'NO WEBGL CONTEXT'
  const dbg = ctx.getExtension('WEBGL_debug_renderer_info')
  return dbg ? ctx.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'renderer hidden'
})

console.log('RENDERER:', gl)
console.log('CONSOLE_ERRORS:', errors.length)
for (const e of errors.slice(0, 15)) console.log('  •', e)
await browser.close()
