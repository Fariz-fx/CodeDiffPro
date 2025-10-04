import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  use: {
    headless: true,
    baseURL: 'http://localhost:3000', // adjust to your local dev URL
  },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
});
