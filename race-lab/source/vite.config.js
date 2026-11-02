import { defineConfig } from 'vite';

const threeBase='https://cdn.jsdelivr.net/npm/three@0.187.0';
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      external: ['three','three/addons/loaders/GLTFLoader.js','three/addons/utils/SkeletonUtils.js'],
      output: {
        paths: {
          three: threeBase+'/build/three.module.js',
          'three/addons/loaders/GLTFLoader.js': threeBase+'/examples/jsm/loaders/GLTFLoader.js',
          'three/addons/utils/SkeletonUtils.js': threeBase+'/examples/jsm/utils/SkeletonUtils.js'
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: ['terminal.local'],
  },
});
