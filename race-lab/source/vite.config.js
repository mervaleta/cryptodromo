import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      external: ['three'],
      output: {
        paths: { three: 'https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js' },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: ['terminal.local'],
  },
});
