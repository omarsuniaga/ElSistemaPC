// filepath: vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  optimizeDeps: {
    exclude: [
      'firebase',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
    ],
  },

  build: {
    // Add these options to ensure proper build output
    sourcemap: true,
    minify: 'terser',
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      external: ['@rollup/rollup-linux-x64-gnu', '@rollup/rollup-linux-x64-musl'],
      output: {
        manualChunks: undefined,
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
  },
  server: {
    host: 'localhost',
    port: 5173,
    open: true,
    hmr: {
      host: 'localhost',
      port: 5173,
    },
  },
});
