import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 为GitHub Pages添加base配置，使用仓库名作为基础路径
  // 如果仓库名为username.github.io，则base可以设为'/'，否则应该设为'/仓库名/'
  base: process.env.NODE_ENV === 'production' ? '/wordFlow-PRD2/' : '/',
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