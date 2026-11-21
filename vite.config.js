import { defineConfig } from 'vite';

// Root base for the custom domain syntaxtutor.jram.me.
export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    rollupOptions: {
      input: { main: 'index.html', privacidad: 'privacidad.html' },
    },
  },
});
