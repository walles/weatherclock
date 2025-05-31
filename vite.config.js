import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/weatherclock/',
  plugins: [react()],
  build: {
    outDir: 'build',
  },
});
