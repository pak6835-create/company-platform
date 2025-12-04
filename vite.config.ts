import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { writeFileSync, copyFileSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-404',
      closeBundle() {
        // 빌드 후 index.html을 404.html로 복사 (GitHub Pages SPA 지원)
        copyFileSync(
          resolve(__dirname, 'dist/index.html'),
          resolve(__dirname, 'dist/404.html')
        )
      }
    }
  ],
  base: '/company-platform/',
  server: {
    port: 3000,
    proxy: {
      '/api/gemini': {
        target: 'https://generativelanguage.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gemini/, '')
      }
    }
  }
})

