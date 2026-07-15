/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // En produccion se eliminan console.log/info/debug/warn del bundle
  // (console.error se conserva para diagnostico). El logger propio no se ve afectado.
  esbuild: {
    pure: ['console.log', 'console.info', 'console.debug', 'console.warn'],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Libs pesadas de import dinamico (OCR/PDF): quedan FUERA de los
            // chunks manuales para que Rollup las deje en chunks lazy propios
            // que solo se descargan al usarlas (antes iban al vendor de 1,5MB).
            if (id.includes('tesseract') || id.includes('pdfjs-dist') || id.includes('jspdf') || id.includes('html2canvas')) {
              return; // chunk automatico (lazy)
            }
            // React core y router juntos
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // Charts separados (son grandes)
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-charts';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            // Resto de vendors juntos: mantiene el orden de inicializacion
            // probado en produccion (sin esto hay ReferenceError TDZ en runtime).
            return 'vendor';
          }
          // Dejar que Vite maneje los chunks de src/ automáticamente con lazy()
        }
      }
    }
  },
  server: {
    host: true
  },
  base: '/',
  // Test configuration
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/test/']
    }
  }
})