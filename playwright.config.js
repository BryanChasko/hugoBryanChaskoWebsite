// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright configuration for WebGL visual regression and performance testing
 * Targets 2020 mid-tier hardware (Intel UHD 620, 8GB RAM)
 */
module.exports = defineConfig({
  testDir: './tests',
  
  // Test timeout for WebGL initialization and screenshot capture
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  
  // Fail the build on CI if any test fails
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration - use separate folders to avoid conflicts
  reporter: [
    ['html', { outputFolder: 'test-report', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for Hugo dev server
    baseURL: 'http://localhost:1313',
    
    // Collect trace on first retry for debugging
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
  },

  // Run your local dev server before starting the tests
  webServer: {
    command: 'hugo server -p 1313',
    port: 1313,
    reuseExistingServer: true,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  
  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Emulate 2020 mid-tier GPU
        launchOptions: {
          args: [
            '--disable-gpu-vsync', // Allow FPS measurement
            '--enable-webgl',
            '--ignore-gpu-blacklist',
          ]
        }
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'webgl.force-enabled': true,
            'webgl.disabled': false,
          }
        }
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
      },
    },
  ],
  
  // Run Hugo dev server before tests
  webServer: {
    command: 'hugo server --port 1313 --buildDrafts=false',
    port: 1313,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});
