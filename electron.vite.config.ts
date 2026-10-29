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
      // Trois pages : le canvas plein écran, la barre d'outils et les paramètres.
      rolldownOptions: {
        input: {
          overlay: resolve(__dirname, 'src/renderer/overlay/index.html'),
          toolbar: resolve(__dirname, 'src/renderer/toolbar/index.html'),
          settings: resolve(__dirname, 'src/renderer/settings/index.html'),
        },
      },
    },
  },
});
