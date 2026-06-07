import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';

const dirname = typeof __dirname !== 'undefined'
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'lucide-vendor': ['lucide-react'],
          'ui-vendor': ['framer-motion', 'clsx', 'tailwind-merge', 'dexie']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    host: 'localhost',
    port: 5177,
    strictPort: true,
  }
});
