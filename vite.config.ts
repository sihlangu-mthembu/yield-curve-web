import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// `base` is the GitHub Pages sub-path: https://sihlangu-mthembu.github.io/yield-curve-web/
export default defineConfig({
  plugins: [react()],
  base: '/yield-curve-web/',
})
