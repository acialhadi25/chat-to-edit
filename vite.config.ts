import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: process.env.TEMPO === 'true' ? '0.0.0.0' : '::',
    // @ts-expect-error - allowedHosts type mismatch in Vite config
    allowedHosts: process.env.TEMPO === 'true' ? true : undefined,
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === 'development' && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-scroll-area'],
          'fortune-sheet': ['@fortune-sheet/react'],
          'xlsx-vendor': ['xlsx', 'xlsx-js-style'],
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}));
