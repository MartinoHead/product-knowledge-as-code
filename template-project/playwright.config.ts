import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/playwright',
  retries: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
});
