import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: { __BUILD__: JSON.stringify(new Date().toISOString().slice(0, 10)) },
  build: { target: 'es2020', sourcemap: false, reportCompressedSize: false },
  server: { port: 5173, proxy: { '/api': 'http://localhost:3000' } },
});
