import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    exclude: ['node_modules', 'dist', '.git', '.cache', 'e2e']
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8152',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
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
      },
      '/wishlist': {
        target: 'http://localhost:8152',
        changeOrigin: true
      },
      '/reviews': {
        target: 'http://localhost:8152',
        changeOrigin: true
      },
      '/messages': {
        target: 'http://localhost:8152',
        changeOrigin: true
      },
      '/notifications': {
        target: 'http://localhost:8152',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@tanstack') || id.includes('axios')) {
              return 'vendor-query';
            }
            return 'vendor-libs';
          }
        }
      }
    }
  }
})
