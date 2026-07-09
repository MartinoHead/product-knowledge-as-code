import { defineConfig } from '@playwright/test';

const liveUrl = process.env.BASE_URL;

export default defineConfig({
  testDir: './tests/playwright',
  retries: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  webServer: liveUrl
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000/v1/health',
        reuseExistingServer: false,
        timeout: 120 * 1000,
      },
  use: {
    baseURL: liveUrl || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
});
