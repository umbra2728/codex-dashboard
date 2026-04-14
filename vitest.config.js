import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
    include: ['test/**/*.test.{js,jsx}'],
    exclude: ['e2e/**', 'references/**', '**/node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['dist/**', 'src/test/**', 'e2e/**', '*.config.js']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(ROOT_DIR, 'src')
    }
  }
});
