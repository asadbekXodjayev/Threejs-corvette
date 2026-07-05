// Print the scene node tree (name, world-ish translation, mesh) of a GLB to
// understand multi-object scenes. Reads the UNCOMPRESSED source (no meshopt dep).
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'

const file = process.argv[2] ?? 'corvette_c6_zr1.glb'
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const doc = await io.read(file)
const scene = doc.getRoot().listScenes()[0]

let depthLimit = 3
function walk(node, depth = 0) {
  const t = node.getTranslation().map((n) => n.toFixed(2)).join(',')
  const mesh = node.getMesh()
  const prims = mesh ? mesh.listPrimitives().length : 0
  const indent = '  '.repeat(depth)
  console.log(`${indent}• ${node.getName() || '(unnamed)'}  t=[${t}]  ${mesh ? `mesh(${prims})` : ''}`)
  if (depth < depthLimit) node.listChildren().forEach((c) => walk(c, depth + 1))
  else if (node.listChildren().length) console.log(`${indent}  … ${node.listChildren().length} children`)
}
console.log(`SCENE children: ${scene.listChildren().length}`)
scene.listChildren().forEach((n) => walk(n))
