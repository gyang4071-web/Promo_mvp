import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Built into ../smartic so the static host serves it at /smartic/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../smartic',
    emptyOutDir: true,
    assetsInlineLimit: 2048,
    chunkSizeWarningLimit: 1200,
  },
});
