import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  retries: 0,
  timeout: 30000,
  use: {
    baseURL: 'https://shanmugappriya-procap.github.io/haus-store/',
    video: 'on',
    trace: 'on',
    screenshot: 'on',
    headless: true,
  },
});
