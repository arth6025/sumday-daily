import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the API runs on :8787; Vite proxies /api and /media to it.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8787',
      '/media': 'http://localhost:8787',
    },
  },
});
