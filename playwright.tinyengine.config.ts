import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120_000,
  expect: {
    timeout: 15_000
  },
  use: {
    baseURL: 'http://127.0.0.1:8090',
    trace: 'on-first-retry'
  },
  webServer: [
    {
      command: 'npm run dev -- --port 5180 --strictPort',
      url: 'http://127.0.0.1:5180/poc-three.html',
      reuseExistingServer: true,
      timeout: 60_000
    },
    {
      command: 'npm --prefix poc/tinyengine-host run dev',
      url: 'http://127.0.0.1:8090/',
      reuseExistingServer: true,
      timeout: 120_000
    }
  ],
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
})
