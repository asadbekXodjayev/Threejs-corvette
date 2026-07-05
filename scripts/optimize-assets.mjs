// Reproducible asset pipeline (npm run assets:optimize).
// Geometry: meshopt (decoder bundled by drei/useGLTF — no public decoder files).
// Textures: WebP @ 2048 max (browser-native via EXT_texture_webp — no transcoder).
// simplify/palette disabled to keep body geometry + per-material identity pristine.
//
// The ZR1 source is a Sketchfab showroom scene with TWO cars (red race + blue
// street); we first isolate the blue "Blue Devil" car (scripts/split-zr1.mjs)
// before compressing. That single step is what turns a 49.5 MB two-car scene
// into a ~4 MB single-car GLB.
import { execFileSync } from 'node:child_process'
import { statSync, mkdirSync, rmSync, existsSync } from 'node:fs'

mkdirSync('public/models', { recursive: true })
const mb = (p) => (statSync(p).size / 1048576).toFixed(2)
const gltf = (args) =>
  execFileSync('npx', ['--no-install', 'gltf-transform', ...args], { stdio: 'inherit', shell: true })

// Isolate the blue ZR1 first (uncompressed temp).
const zr1Blue = 'public/models/_zr1-blue.glb'
execFileSync('node', ['scripts/split-zr1.mjs', '1', zr1Blue, '30'], { stdio: 'inherit' })

const JOBS = [
  ['chevrolet_corvette_c5_black.glb', 'public/models/01-c5-black.glb'],
  ['2011_corvette_z06_carbon_limited_edition_nfs.glb', 'public/models/02-z06-carbon-2011.glb'],
  [zr1Blue, 'public/models/03-zr1-c6.glb'],
]

let total = 0
for (const [src, out] of JOBS) {
  const before = mb(src)
  gltf(['optimize', src, out,
    '--compress', 'meshopt',
    '--texture-compress', 'webp',
    '--texture-size', '2048',
    '--simplify', 'false',
    '--palette', 'false'])
  const after = +mb(out)
  total += after
  console.log(`\nOK ${out}  ${before} MB -> ${after} MB`)
}

// clean the uncompressed split temp
if (existsSync(zr1Blue)) rmSync(zr1Blue)
console.log(`\n=== combined compressed: ${total.toFixed(2)} MB ===`)
