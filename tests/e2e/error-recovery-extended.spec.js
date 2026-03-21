const { test, expect } = require("@playwright/test");
const { launchApp, setEditorValue } = require("./helpers");

async function openFirstProblem(window) {
  await window.locator("[data-testid=problem-item]").first().click();
  await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
  await window.waitForTimeout(2000);
}

test.describe("Error Recovery Extended", () => {
  let app, window, cleanup;

  test.beforeEach(async () => {
    ({ app, window, cleanup } = await launchApp({ show: true }));
    await window.locator("[data-testid=solved-counter]").waitFor({ timeout: 15000 });
  });

  test.afterEach(async () => {
    if (app) await app.close().catch(() => {});
    if (cleanup) cleanup();
  });

  // Test 1: JS infinite loop → timeout → error message shown → app stays responsive
  test("JS infinite loop times out and app stays responsive", async () => {
    await openFirstProblem(window);
    await window.locator("[data-testid=language-select]").selectOption("javascript");
    await window.waitForTimeout(500);

    const jsInfiniteLoop = [
      "function maxProfit(prices) {",
      "    while (true) {}",
      "    return 0;",
      "}",
    ].join("\n");

    await setEditorValue(window, jsInfiniteLoop);
    await window.locator("[data-testid=btn-run]").click();

    // Wait for timeout/error message — JS has 10s timeout same as Python
    await window
      .locator("text=/Error|error|timeout|Timeout|timed out|killed/i")
      .first()
      .waitFor({ timeout: 20000 });

    // App should still be responsive — counter still readable
    const counter = await window
      .locator("[data-testid=solved-counter]")
      .textContent({ timeout: 5000 });
    expect(counter).toMatch(/\d+\/\d+/);

    // Run button should be re-enabled
    await expect(window.locator("[data-testid=btn-run]")).toBeEnabled({ timeout: 5000 });
  });

  // Test 2: Multiple consecutive Python errors — app stays responsive after each
  test("App stays responsive after 3 consecutive Python errors", async () => {
    await openFirstProblem(window);

    const badPython = "def max_profit(prices):\n    raise ValueError('intentional error')";

    // Run bad code 3 times in a row
    for (let i = 0; i < 3; i++) {
      await setEditorValue(window, badPython);
      await window.locator("[data-testid=btn-run]").click();

      await window
        .locator("text=/Error|error|ValueError|failed/i")
        .first()
        .waitFor({ timeout: 15000 });

      // After each error, app should be responsive
      const counter = await window
        .locator("[data-testid=solved-counter]")
        .textContent({ timeout: 5000 });
      expect(counter).toMatch(/\d+\/\d+/);

      // Run button should be enabled for next attempt
      await expect(window.locator("[data-testid=btn-run]")).toBeEnabled({ timeout: 5000 });
    }
  });

  // Test 3: Run button re-enables after execution completes (even on error)
  test("Run button re-enables after Python execution error", async () => {
    await openFirstProblem(window);

    const badPython = [
      "def max_profit(prices:",
      "    return broken syntax",
    ].join("\n");

    await setEditorValue(window, badPython);

    // Click run and immediately check button state
    await window.locator("[data-testid=btn-run]").click();

    // Wait for result
    await window
      .locator("text=/Error|error|SyntaxError/i")
      .first()
      .waitFor({ timeout: 15000 });

    // Button should be re-enabled
    await expect(window.locator("[data-testid=btn-run]")).toBeEnabled({ timeout: 5000 });
    await expect(window.locator("[data-testid=btn-submit]")).toBeEnabled({ timeout: 5000 });

    // Should be able to run again without issues
    await window.locator("[data-testid=btn-run]").click();
    await window
      .locator("text=/Error|error|SyntaxError/i")
      .first()
      .waitFor({ timeout: 15000 });
  });

  // Test 4: Submit correct code after an error → submission succeeds (recover from error state)
  test("Correct submission succeeds after prior error", async () => {
    await openFirstProblem(window);

    // First run bad code
    await setEditorValue(window, "def max_profit(prices):\n    return -999");
    await window.locator("[data-testid=btn-submit]").click();
    await window.locator("text=/failed/i").first().waitFor({ timeout: 15000 });

    // Now submit correct code
    const correctPython = [
      "from typing import List",
      'def max_profit(prices: List[int]) -> int:',
      '    min_price = float("inf")',
      "    max_p = 0",
      "    for price in prices:",
      "        if price < min_price:",
      "            min_price = price",
      "        elif price - min_price > max_p:",
      "            max_p = price - min_price",
      "    return max_p",
    ].join("\n");

    await setEditorValue(window, correctPython);
    await window.locator("[data-testid=btn-submit]").click();

    // Should be accepted despite prior error
    await window.locator("text=✓ Accepted").waitFor({ timeout: 25000 });
    const accepted = await window.locator("text=✓ Accepted").count();
    expect(accepted).toBeGreaterThan(0);
  });

  // Test 5: Empty JS code shows error or graceful handling (no crash)
  test("Empty JS code handles gracefully without crashing", async () => {
    await openFirstProblem(window);
    await window.locator("[data-testid=language-select]").selectOption("javascript");
    await window.waitForTimeout(500);

    await setEditorValue(window, "");
    await window.locator("[data-testid=btn-run]").click();

    // Any result is acceptable — just not a crash
    await window
      .locator("text=/passed|failed|Error|error/i")
      .first()
      .waitFor({ timeout: 15000 });

    // App should be responsive
    const counter = await window
      .locator("[data-testid=solved-counter]")
      .textContent({ timeout: 5000 });
    expect(counter).toMatch(/\d+\/\d+/);
  });
});
