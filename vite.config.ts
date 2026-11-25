import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// 게임은 index.html. 3D 화계사(3d.html)는 저장소에 없고, 로컬에 있을 때만 같이 빌드한다.
const threeD = resolve(__dirname, '3d.html');

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      input: { main: resolve(__dirname, 'index.html'), ...(existsSync(threeD) ? { three: threeD } : {}) },
    },
  },
});
