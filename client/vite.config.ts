import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// API target is configurable so SafeShift can avoid port clashes with other
// local projects. Defaults to 4100 (the API's default PORT in server/.env).
const apiTarget = process.env.VITE_API_TARGET ?? 'http://localhost:4100';

// Dev server port is configurable too (e.g. VITE_PORT=2000). When explicitly
// set we bind strictly so it fails loudly instead of silently falling back.
const port = Number(process.env.VITE_PORT) || 5173;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port,
    strictPort: Boolean(process.env.VITE_PORT),
    proxy: {
      '/api': apiTarget,
    },
  },
});
