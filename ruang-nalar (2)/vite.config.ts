import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// base './' = semua alamat aset relatif, jadi hasil build jalan di mana saja:
// GitHub Pages (https://nama.github.io/nama-repo/), domain sendiri, atau folder biasa.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 800,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
