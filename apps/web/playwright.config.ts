import { defineConfig } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const apiDir = resolve(currentDir, '../api');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  globalSetup: './tests/global-setup.ts',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: `cd "${apiDir}" && pnpm start:dev`,
      url: 'http://localhost:3000/api',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'pnpm exec vite --host localhost --port 5173 --strictPort',
      url: 'http://localhost:5173/login',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
