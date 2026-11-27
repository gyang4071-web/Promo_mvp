import { defineConfig } from 'vite';

// Built into ../smartic so the static host serves it at /smartic/
export default defineConfig({
  base: './',
  build: {
    outDir: '../smartic',
    emptyOutDir: true,
    assetsInlineLimit: 2048,
  },
});
