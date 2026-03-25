import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8152', // Backend URL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '') // Optional: if backend doesn't expect /api prefix
      },
      // Proxy auth endpoints directly if they are at root
      '/auth': {
        target: 'http://localhost:8152',
        changeOrigin: true
      },
      '/users': {
        target: 'http://localhost:8152',
        changeOrigin: true
      },
      '/items': {
        target: 'http://localhost:8152',
        changeOrigin: true
      },
      '/bookings': {
        target: 'http://localhost:8152',
        changeOrigin: true
      }
    }
  }
})
