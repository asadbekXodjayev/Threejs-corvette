// Diagnostic: scroll to a chapter and dump canvas coverage, scene background,
// camera position, visible car, and a center-pixel readback.
import { chromium } from 'playwright'
const [url, frac = '0.48'] = process.argv.slice(2)
const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('pageerror', (e) => console.log('PAGEERROR', e.message))
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1800)
const target = parseFloat(frac)
for (let s = 1; s <= 30; s++) {
  await page.evaluate((f) => {
    const max = document.body.scrollHeight - window.innerHeight
    window.__lenis?.scrollTo(max * f, { immediate: true, force: true })
  }, (target * s) / 30)
  await page.waitForTimeout(50)
}
await page.waitForTimeout(2500)

const info = await page.evaluate(() => {
  const t = window.__three
  const store = window.__store?.getState?.()
  const canvas = document.querySelector('canvas')
  const r = canvas?.getBoundingClientRect()
  const coverRight = document.elementFromPoint(1150, 450)?.tagName
  const coverMid = document.elementFromPoint(720, 300)?.tagName
  let bg = null,
    cam = null,
    fog = null,
    visibleCars = []
  if (t) {
    bg = t.scene.background?.getHexString?.() ?? String(t.scene.background)
    fog = t.scene.fog?.constructor?.name
    cam = t.camera.position.toArray().map((n) => +n.toFixed(2))
    t.scene.traverse((o) => {
      if (o.type === 'Group' && o.visible === false) visibleCars.push('hiddenGroup')
    })
  }
  return {
    activeChapter: store?.activeChapter,
    canvasSize: r ? [Math.round(r.width), Math.round(r.height)] : null,
    coverRight,
    coverMid,
    bg,
    fog,
    cam,
  }
})
console.log(JSON.stringify(info, null, 2))
await browser.close()
