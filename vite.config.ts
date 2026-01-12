import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunk: React core
          if (id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-router')) {
            return 'vendor';
          }
          // Charts chunk: Recharts
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
            return 'charts';
          }
          // Finance module chunk
          if (id.includes('/src/finance/')) {
            return 'finance';
          }
          // Admin pages chunk
          if (id.includes('/src/pages/Admin') || id.includes('/src/components/AdminLayout')) {
            return 'admin';
          }
        }
      }
    }
  },
  server: {
    host: true
  },
  base: '/'
})