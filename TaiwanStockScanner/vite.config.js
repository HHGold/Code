import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/twse': {
        target: 'https://openapi.twse.com.tw',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/twse/, '')
      },
      '/api/twse-web': {
        target: 'https://www.twse.com.tw',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/twse-web/, '')
      },
      '/api/tpex': {
        target: 'https://www.tpex.org.tw/openapi',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tpex/, '')
      },
      '/api/taifex': {
        target: 'https://www.taifex.com.tw',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/taifex/, '')
      },
      '/api/yahoo': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/yahoo/, '')
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  }
})
