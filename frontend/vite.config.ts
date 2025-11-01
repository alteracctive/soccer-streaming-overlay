import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        // Control Panel
        main: resolve(__dirname, 'index.html'),
        
        // Overlay
        overlay: resolve(__dirname, 'overlay/index.html'), 
      },
    },
  },
});