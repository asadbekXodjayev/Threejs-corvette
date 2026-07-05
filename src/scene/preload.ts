import { useGLTF } from '@react-three/drei'
import { CARS } from '../config/cars.config'

// Kick off fetch + decode of all three cars in the film as early as possible so
// the mid-scroll flash swaps never stall. Imported for its side effect from
// main.tsx. (Meshopt+WebP → drei's bundled decoder, no network fetch needed.)
for (const car of CARS) useGLTF.preload(car.modelUrl)
