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
          // Solo separar vendors de node_modules
          if (id.includes('node_modules')) {
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
            // OJO: sin catch-all. Un "return 'vendor'" generico fusiona las libs
            // de import dinamico (tesseract ~15MB, pdfjs ~2MB, jspdf, html2canvas)
            // en un chunk que carga al inicio. Sin catch-all, Rollup las deja en
            // chunks propios que solo se descargan al usarlas.
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