import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
	base: '/kid-tasks/',
  plugins: [react()],
  build: {
    outDir: 'docs' // 添加这一行，告诉 Vite 把文件打包到 docs 文件夹
  }
})
