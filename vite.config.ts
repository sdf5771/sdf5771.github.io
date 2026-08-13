import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import spaFallbackPlugin from './scripts/spa-fallback-plugin'
import prerenderPlugin from './scripts/prerender/plugin'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    // GitHub Pages 딥링크 복구 — dist/404.html 을 만듭니다 (handoff-step5 §4-8)
    spaFallbackPlugin(),
    /*
     * 프리렌더 + per-URL 메타 + sitemap + robots (product.md §14).
     * 🔴 spa-fallback **뒤**여야 합니다. closeBundle 이 플러그인 순서대로 도는데,
     *    이 플러그인이 `dist/404.html` 에 noindex 가 남아 있는지까지 검사합니다(R-9).
     */
    prerenderPlugin(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})
