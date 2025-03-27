import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    host: true, // Needed for proper network access
    strictPort: true,
    // Enhanced CORS configuration
    cors: true, // Enable CORS for all requests
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization'
    },
    proxy: {
      // Proxy Sentry requests to avoid CORS issues
      '/sentry-api': {
        target: 'https://lucid.thereadme.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sentry-api/, '/api/39/envelope')
      }
    }
  }
})