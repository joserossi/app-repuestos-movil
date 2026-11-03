import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' => funciona en cualquier subruta (GitHub Pages: usuario.github.io/app-repuestos-movil/)
export default defineConfig({
  base: './',
  plugins: [react()],
})
