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
        icons: {
          android: true,
          appleIcon: true,
          appleStartup: true,
          coast: true,
          favicons: true,
          firefox: true,
          windows: true,
          yandex: true,
        }
      }
    })
  ],
})
