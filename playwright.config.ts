import { defineConfig, devices } from '@playwright/test';
import type { ReporterDescription } from '@playwright/test';

const reporter: ReporterDescription[] = [['html']];

if (process.env.JIRA_ENABLED === 'true') {
  reporter.push(['./tests/utils/JiraReporter.ts']);
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
  ['html', { outputFolder: 'playwright-report' }],
  ...(process.env.JIRA_ENABLED === 'true'
    ? [['./tests/utils/JiraReporter.ts'] as const]
    : []),   // ✅ your custom Jira reporter
  ],
use: {
  baseURL:    process.env.BASE_URL || 'https://shanmugappriya-procap.github.io/haus-store/',
  trace:      'on-first-retry',   // ✅ captures trace.zip
  screenshot: "on",  // ✅ captures screenshot on fail
},
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});