// The ZR1 source GLB is a Sketchfab showroom scene containing TWO cars, split
// spatially: red race car at negative X, blue street car at positive X. This
// keeps only the car on the requested side by disposing every MESH-bearing node
// whose accumulated world-X is on the wrong side (structural ancestors survive),
// then prunes the orphaned meshes/materials/textures.
// Usage: node scripts/split-zr1.mjs <keepSign:+1|-1> <out.glb> [gap=30]
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { prune, dedup } from '@gltf-transform/functions'

const keepSign = Number(process.argv[2] ?? 1) >= 0 ? 1 : -1
const out = process.argv[3] ?? 'public/models/_zr1-split.glb'
const GAP = Number(process.argv[4] ?? 30)

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const doc = await io.read('corvette_c6_zr1.glb')
const scene = doc.getRoot().listScenes()[0]

const kill = []
function collect(node, accX) {
  const wx = accX + node.getTranslation()[0]
  // dispose a mesh node if it is NOT clearly on the keep side of the gap
  if (node.getMesh() && !(keepSign > 0 ? wx > GAP : wx < -GAP)) kill.push(node)
  node.listChildren().forEach((c) => collect(c, wx))
}
scene.listChildren().forEach((n) => collect(n, 0))
kill.forEach((n) => n.dispose())

await doc.transform(prune(), dedup())
await io.write(out, doc)
console.log(`kept ${keepSign > 0 ? '+X (blue)' : '-X (red)'}, disposed ${kill.length} mesh nodes -> ${out}`)
