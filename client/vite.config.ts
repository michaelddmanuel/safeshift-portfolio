import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// API target is configurable so SafeShift can avoid port clashes with other
// local projects. Defaults to 4100 (the API's default PORT in server/.env).
const apiTarget = process.env.VITE_API_TARGET ?? 'http://localhost:4100';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': apiTarget,
    },
  },
});
