const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 60000,        // 60s per test — each launches fresh Electron
  globalTimeout: 1200000, // 20 min total for the whole suite
  retries: 1,            // one retry on flaky failures
  workers: 1,            // run serially — Electron can't run parallel instances cleanly
  use: {
    trace: "on-first-retry",
    actionTimeout: 15000,
  },
});
