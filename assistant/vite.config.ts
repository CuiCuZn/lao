import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({mode})=>{
  const env = loadEnv(mode, process.cwd());
  return {
    base: env.VITE_BASIC_URL,
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    build: {
      outDir: 'assistant',
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === 'EVAL') return
          warn(warning)
        }
      }
    },
    server: {
      host: '0.0.0.0',
      port: 5863,
      open: false,
      proxy: {
        '/api-rtc': {
          target: 'http://192.168.2.101:8080',
          changeOrigin: true
        },
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
  }
})
