import { defineConfig } from '@playwright/test';

const liveUrl = process.env.BASE_API_URL;

export default defineConfig({
  testDir: './tests/api',
  retries: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report-api' }]],
  // Skip local webServer when BASE_API_URL points to a live service
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
  },
});
