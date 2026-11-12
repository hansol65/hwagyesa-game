import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      // 게임(index.html)과 3D 화계사(3d.html) 두 페이지
      input: { main: resolve(__dirname, 'index.html'), three: resolve(__dirname, '3d.html') },
    },
  },
});
