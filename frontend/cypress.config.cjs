// cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // Adjust baseUrl to match your dev server
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.spec.{js,jsx,ts,tsx}',
    supportFile: false,
    viewportWidth: 1280,
    viewportHeight: 720,
    // Screenshots and videos are useful for CI debugging
    screenshotOnRunFailure: true,
    video: true,
    // Slow test threshold for debugging UI interactions
    defaultCommandTimeout: 8000,
    execTimeout: 60000,
    taskTimeout: 60000,
    pageLoadTimeout: 60000,
  },
});
