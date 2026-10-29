import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['out/**', 'release/**', 'node_modules/**'] },
  js.configs.recommended,
  tseslint.configs.strict,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  // Processus main / preload / configs : environnement Node.
  {
    files: ['src/main/**', 'src/preload/**', '*.config.*'],
    languageOptions: { globals: globals.node },
  },
  // Renderer : environnement navigateur.
  {
    files: ['src/renderer/**'],
    languageOptions: { globals: globals.browser },
  },
  // Désactive les règles de style qui entrent en conflit avec Prettier (toujours en dernier).
  prettier,
);
