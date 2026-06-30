import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ──────────────────────────────────────────────────────────────────────
// GitHub Pages necesita el `base` correcto si es Project Page.
// Detectamos automáticamente según variable de entorno o repo config.
//
// Si tu web se sirve en:
//   • https://USER.github.io/                  → base = '/' (User Page)
//   • https://USER.github.io/shine-web/        → base = '/shine-web/' (Project Page)
//
// Puedes forzar el tipo con la variable VITE_BASE_PATH:
//   VITE_BASE_PATH=/shine-web/ npm run build
// ──────────────────────────────────────────────────────────────────────
const repoName = 'shine-web'
const isGHPagesProject = process.env.GITHUB_ACTIONS === 'true' ||
                        process.env.VITE_BASE_PATH !== undefined

// Si VITE_BASE_PATH está definido úsalo; si no, detecta por GITHUB_ACTIONS
const base = process.env.VITE_BASE_PATH ||
             (isGHPagesProject ? `/${repoName}/` : '/')

export default defineConfig({
  plugins: [react()],
  base,
  server: {
    port: 5173,
    open: true,
  },
  preview: {
    port: 4173,
    cors: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  appType: 'spa',
})
