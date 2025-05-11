import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ViteFaviconsPlugin } from "vite-plugin-favicon";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ViteFaviconsPlugin({
      logo: './src/assets/images/memoji.png',
      favicons: {
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
