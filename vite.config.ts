import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
  ],
  server: {
    host: 'localhost',
    proxy: {
      '/supabase': {
        target: process.env.VITE_SUPABASE_URL || 'https://ezybifdvihklonpntabw.supabase.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/supabase/, '')
      }
    }
  }
})
