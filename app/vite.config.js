import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 🚨 CHANGE THIS to match your exact GitHub repository name! 
  // Example: if your repo is called 'bsceee', make it '/bsceee/'
  base: '/YOUR_REPO_NAME/', 
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  css: {
    postcss: './postcss.config.js',
  },
})