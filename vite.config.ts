import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/supabase': {
        target: process.env.VITE_SUPABASE_URL || 'https://ezybifdvihklonpntabw.supabase.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/supabase/, ''),
        secure: true
      }
    }
  }
})
