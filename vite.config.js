import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  preview: {
    port: 4173,
    // SPA fallback: cualquier ruta 404 devuelve index.html para que
    // React Router la maneje. Imprescindible al probar el build local.
    cors: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  // Resuelve rutas como /admin/payment-settings al hacer npm run preview
  appType: 'spa',
})
