import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.e2e' });

export default defineConfig({
  testDir: 'src/tests/e2e',
  testMatch: '**/*.e2e.ts',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx ng serve --port 4200',
    url: 'http://localhost:4200',
    reuseExistingServer: false,
    timeout: 120000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: '**/e2e.setup.e2e.ts',
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'e2e.storage.json' },
      dependencies: ['setup'],
    },
  ],
});
