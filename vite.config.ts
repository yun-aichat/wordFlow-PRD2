import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 为GitHub Pages添加base配置，使用相对路径而非绝对路径
  // 这样可以避免资源路径问题
  base: './',
  server: {
    port: 3000,
    open: true,
    // 移除对后端服务的代理配置，因为GitHub Pages不支持后端服务
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
    // 确保Electron可以正确加载资源
    emptyOutDir: true,
    assetsDir: 'assets',
  },
  optimizeDeps: {
    include: ['lodash.mergewith'],
    esbuildOptions: {
      mainFields: ['module', 'main']
    }
  }
})