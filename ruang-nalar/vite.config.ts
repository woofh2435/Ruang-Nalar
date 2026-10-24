import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { pluginCsp } from './scripts/csp'

// base './' = semua alamat aset relatif, jadi hasil build jalan di mana saja:
// GitHub Pages (https://nama.github.io/nama-repo/), domain sendiri, atau folder biasa.
export default defineConfig({
  base: './',
  plugins: [react(), pluginCsp()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 800,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
