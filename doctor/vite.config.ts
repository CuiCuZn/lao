/*
 * @version: 
 * @Author: Cuidezhen
 * @Date: 2026-04-03 10:51:25
 * @LastEditors: Cuidezhen
 * @LastEditTime: 2026-07-02 17:46:17
 * @company: 医视界
 * @FilePath: \lao\doctor\vite.config.ts
 * @Descripttion: 
 * @Edit Record: 
 */
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({mode})=>{
  const env = loadEnv(mode, process.cwd());
  return {
    build: {
      outDir: 'doctor',
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === 'EVAL') return
          warn(warning)
        }
      }
    },
    base: env.VITE_BASIC_URL,
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
          // target: 'https://lwyczl.mvwchina.com/lao-api/',
          changeOrigin: true,
          rewrite: (requestPath) => requestPath.replace(/^\/lao-api/, '')
        },
        '/resource': {
          target: 'ws://192.168.2.101:8087',
          changeOrigin: true,
          ws: true
        }
      }
    }
  }
})
