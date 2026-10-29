import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

// Vitest ne teste que la logique pure (géométrie, historique, hit-test…), sans Electron ni DOM.
export default defineConfig({
  resolve: { alias: { '@shared': resolve(import.meta.dirname, 'src/shared') } },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
