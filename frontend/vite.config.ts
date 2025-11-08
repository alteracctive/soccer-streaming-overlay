import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './', // <-- THIS LINE IS THE FIX
  build: {
    rollupOptions: {
      input: {
        // Your main entry point (the control panel)
        main: resolve(__dirname, 'index.html'),
        
        // Your new entry point (the overlay)
        overlay: resolve(__dirname, 'overlay/index.html'),
      },
    },
  },
});