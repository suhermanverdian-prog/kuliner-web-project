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
    // Turunkan limit warning agar terdeteksi lebih cepat ke depannya
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        /**
         * Strategi Manual Chunks — KEN Enterprise
         * ──────────────────────────────────────────
         * Pemisahan berdasarkan kelompok fungsional agar browser
         * dapat men-cache setiap chunk secara independen.
         * Chunk vendor yang jarang berubah akan tetap di-cache
         * meskipun kode aplikasi diupdate.
         */
        manualChunks: (id) => {
          // 1. React core — paling jarang berubah, cache paling lama
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'react-core';
          }

          // 2. State management & data fetching
          if (id.includes('node_modules/@tanstack/') ||
              id.includes('node_modules/zustand/')) {
            return 'state-query';
          }

          // 3. Supabase client — relatif besar, dipisahkan sendiri
          if (id.includes('node_modules/@supabase/')) {
            return 'supabase';
          }

          // 4. Animasi & utilitas UI
          if (id.includes('node_modules/framer-motion/') ||
              id.includes('node_modules/clsx/') ||
              id.includes('node_modules/tailwind-merge/') ||
              id.includes('node_modules/sonner/')) {
            return 'ui-vendor';
          }

          // 5. Ikon Lucide — besar, dipisahkan agar tree-shaking efektif
          if (id.includes('node_modules/lucide-react/')) {
            return 'lucide-vendor';
          }

          // 6. Database lokal (Dexie / IndexedDB)
          if (id.includes('node_modules/dexie/')) {
            return 'db-vendor';
          }

          // 7. Monitoring (Sentry) — hanya dimuat jika dibutuhkan
          if (id.includes('node_modules/@sentry/')) {
            return 'sentry-vendor';
          }

          // 8. PDF generation — dimuat on-demand saat klik Download PDF
          if (id.includes('node_modules/html2canvas/') ||
              id.includes('node_modules/jspdf/')) {
            return 'pdf-vendor';
          }
        }
      }
    }
  },
  server: {
    host: 'localhost',
    port: 5176,
    strictPort: true,
  }
});
