import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import spaFallbackPlugin from './scripts/spa-fallback-plugin'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    // GitHub Pages 딥링크 복구 — dist/404.html 을 만듭니다 (handoff-step5 §4-8)
    spaFallbackPlugin(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})
