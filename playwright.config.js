import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:3001',
    headless: true,
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'npm run build && npm run start',
    port: 3001,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      NODE_ENV: 'test',
      CODEX_DASHBOARD_MODE: 'mock',
      CODEX_DASHBOARD_HOST: '127.0.0.1',
      CODEX_DASHBOARD_PORT: '3001'
    }
  }
});
