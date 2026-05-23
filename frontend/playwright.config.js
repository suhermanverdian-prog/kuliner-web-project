// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * KEN Enterprise - Visual Regression Configuration
 * Memastikan tidak ada cacat kontras (Zero-Invisibility) pada Light & Dark Mode.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium-light',
      use: { 
        ...devices['Desktop Chrome'],
        colorScheme: 'light',
      },
    },
    {
      name: 'chromium-dark',
      use: { 
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
      },
    },
    {
      name: 'mobile-chrome-light',
      use: { 
        ...devices['Pixel 5'],
        colorScheme: 'light',
      },
    },
    {
      name: 'mobile-chrome-dark',
      use: { 
        ...devices['Pixel 5'],
        colorScheme: 'dark',
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
