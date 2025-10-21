import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        // Your original entry point (the overlay)
        main: resolve(__dirname, 'index.html'),
        
        // Your new entry point (the control panel)
        // Update this path to point inside the control_panel folder
        controlPanel: resolve(__dirname, 'control_panel/index.html'), 
      },
    },
  },
});