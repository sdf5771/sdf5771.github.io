import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ViteFaviconsPlugin } from "vite-plugin-favicon";

// https://vite.dev/config/
export default defineConfig({
  base: '/sdf5771.github.io/',
  plugins: [
    react(),
    ViteFaviconsPlugin({
      logo: './src/assets/images/memoji.png',
      favicons: {
        path: '/sdf5771.github.io/',
        appName: 'Seobisback Github Blog',
        appDescription: '공부하는 기술, 경험에 대한 이야기를 정리해요.',
        background: '#fff',
        theme_color: '#333',
        scope: '/sdf5771.github.io/',
        start_url: '/sdf5771.github.io/?homescreen=1',
        icons: {
          android: true,
          appleIcon: true,
          appleStartup: false,
          coast: false,
          favicons: true,
          firefox: false,
          windows: false,
          yandex: false,
        }
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})
