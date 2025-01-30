import { PlaywrightTestConfig } from '@playwright/test';
import path from 'path';

const config: PlaywrightTestConfig = {
  testDir: './tests',
  timeout: 60000,
  expect: {
    timeout: 10000
  },
  use: {
    baseURL: 'http://127.0.0.1:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry'
  },
  webServer: {
    command: 'npx http-server . -p 8080',
    url: 'http://127.0.0.1:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 5000
  },
  projects: [
    {
      name: 'Chrome',
      use: {
        browserName: 'chromium'
      }
    }
  ],
  reporter: [
    ['html'],
    ['list']
  ]
};

export default config; 