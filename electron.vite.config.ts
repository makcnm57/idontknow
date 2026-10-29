import { resolve } from 'node:path';
import { defineConfig } from 'electron-vite';

// Alias commun : `@shared/*` pointe vers le code partagé main / preload / renderer.
const alias = { '@shared': resolve(__dirname, 'src/shared') };

export default defineConfig({
  main: {
    resolve: { alias },
  },
  preload: {
    resolve: { alias },
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    resolve: { alias },
    build: {
      // Deux pages distinctes : le canvas plein écran et la barre d'outils.
      rolldownOptions: {
        input: {
          overlay: resolve(__dirname, 'src/renderer/overlay/index.html'),
          toolbar: resolve(__dirname, 'src/renderer/toolbar/index.html'),
        },
      },
    },
  },
});
