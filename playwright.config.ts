import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  retries: 0,
  timeout: 30000,
  use: {
    baseURL: 'https://shanmugappriya-procap.github.io/haus-store/',
    storageState: 'playwright/.auth/user.json',
    video: 'on',
    trace: 'on',
    screenshot: 'on',
    headless: true,
  },
});
