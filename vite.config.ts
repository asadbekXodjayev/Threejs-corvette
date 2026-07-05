import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GLB/HDR are served from /public as static assets, so no special asset plugin
// is needed. We bump the chunk-size warning limit because three + drei are large
// by nature and code-splitting them further hurts more than it helps here.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1800,
    rollupOptions: {
      output: {
        // split the heavy, rarely-changing 3D/animation vendors for caching
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei', '@react-three/postprocessing', 'postprocessing'],
          motion: ['gsap', '@gsap/react', 'lenis'],
        },
      },
    },
  },
  // three's examples decoders (draco/basis) are copied into /public and loaded
  // at runtime from absolute paths — keep them out of the dependency optimizer.
  optimizeDeps: {
    exclude: ['@react-three/postprocessing'],
  },
})
