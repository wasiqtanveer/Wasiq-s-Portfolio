import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // three.js is ~500kB of the bundle and it never changes between
          // deploys, while Scene3D itself does. Splitting them means editing
          // the scene ships a few kB instead of re-invalidating half a
          // megabyte in every returning visitor's cache. Both stay lazy —
          // nothing here loads until Background decides the browser is idle.
          three: ['three'],
        },
      },
    },
  },
})
