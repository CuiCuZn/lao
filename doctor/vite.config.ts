import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5862,
    open: false,
    proxy: {
      '/lao-api': {
        target: 'http://192.168.2.101:8085/',
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/lao-api/, '')
      },
      '/resource': {
        target: 'ws://192.168.2.101:8085',
        changeOrigin: true,
        ws: true
      }
    }
  }
})
