const { test, expect } = require("@playwright/test");
const { launchApp, setEditorValue } = require("./helpers");

async function openFirstProblem(window) {
  await window.locator("[data-testid=problem-item]").first().click();
  await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
  await window.waitForTimeout(2000);
}

test.describe("JS Execution Edge Cases", () => {
  let app, window, cleanup;

  test.beforeEach(async () => {
    ({ app, window, cleanup } = await launchApp({ show: true }));
    await window.locator("[data-testid=solved-counter]").waitFor({ timeout: 15000 });
  });

  test.afterEach(async () => {
    if (app) await app.close().catch(() => {});
    if (cleanup) cleanup();
  });

  // Test 1: JS solution with console.log → results still appear, not broken
  test("JS solution with console.log does not break test results", async () => {
    await openFirstProblem(window);
    await window.locator("[data-testid=language-select]").selectOption("javascript");
    await window.waitForTimeout(500);

    // Solution with console.log statements mixed in
    const jsWithLogs = [
      "function maxProfit(prices) {",
      "    console.log('prices:', prices);",
      "    let minPrice = Infinity;",
      "    let maxP = 0;",
      "    for (const price of prices) {",
      "        console.log('checking price:', price);",
      "        if (price < minPrice) minPrice = price;",
      "        else if (price - minPrice > maxP) maxP = price - minPrice;",
      "    }",
      "    console.log('result:', maxP);",
      "    return maxP;",
      "}",
    ].join("\n");

    await setEditorValue(window, jsWithLogs);
    await window.locator("[data-testid=btn-run]").click();

    // Results should still appear (pass/fail) — console.log should not break parsing
    await window
      .locator("text=/passed|failed|Error|error/i")
      .first()
      .waitFor({ timeout: 15000 });

    // App should still be responsive
    const counter = await window
      .locator("[data-testid=solved-counter]")
      .textContent({ timeout: 5000 });
    expect(counter).toMatch(/\d+\/\d+/);
  });

  // Test 2: JS solution using modern syntax (const, let, for...of, destructuring in body)
  test("JS solution with modern const/let/for-of syntax executes correctly", async () => {
    await openFirstProblem(window);
    await window.locator("[data-testid=language-select]").selectOption("javascript");
    await window.waitForTimeout(500);

    // Regular function declaration (required by harness) with modern body syntax
    const modernJS = [
      "function maxProfit(prices) {",
      "    const n = prices.length;",
      "    let minPrice = Infinity;",
      "    let maxP = 0;",
      "    for (const price of prices) {",
      "        const profit = price - minPrice;",
      "        maxP = Math.max(maxP, profit);",
      "        minPrice = Math.min(minPrice, price);",
      "    }",
      "    return maxP;",
      "}",
    ].join("\n");

    await setEditorValue(window, modernJS);
    await window.locator("[data-testid=btn-submit]").click();

    // Should pass — modern JS inside function body is supported
    await window.locator("text=✓ Accepted").waitFor({ timeout: 25000 });
    const passedCount = await window.locator("text=/passed/i").count();
    expect(passedCount).toBeGreaterThan(0);
  });

  // Test 3: JS runtime error (not syntax error) → error message appears, app stays responsive
  test("JS runtime error shows error message and app stays responsive", async () => {
    await openFirstProblem(window);
    await window.locator("[data-testid=language-select]").selectOption("javascript");
    await window.waitForTimeout(500);

    // Valid syntax but throws at runtime
    const runtimeError = [
      "function maxProfit(prices) {",
      "    const obj = null;",
      "    return obj.property; // TypeError: Cannot read property of null",
      "}",
    ].join("\n");

    await setEditorValue(window, runtimeError);
    await window.locator("[data-testid=btn-run]").click();

    // Should show an error (TypeError or Error or similar)
    await window
      .locator("text=/Error|error|TypeError/i")
      .first()
      .waitFor({ timeout: 15000 });

    // App should still be responsive
    const counter = await window
      .locator("[data-testid=solved-counter]")
      .textContent({ timeout: 5000 });
    expect(counter).toMatch(/\d+\/\d+/);

    // Run button should be clickable again
    await expect(window.locator("[data-testid=btn-run]")).toBeEnabled({ timeout: 5000 });
  });

  // Test 4: Run button re-enables after JS execution completes (even on wrong answer)
  test("Run button re-enables after JS execution with wrong answer", async () => {
    await openFirstProblem(window);
    await window.locator("[data-testid=language-select]").selectOption("javascript");
    await window.waitForTimeout(500);

    // Wrong answer JS
    const wrongJS = "function maxProfit(prices) { return -999; }";
    await setEditorValue(window, wrongJS);

    // Run — button should be disabled during execution
    await window.locator("[data-testid=btn-run]").click();

    // Wait for result to appear
    await window
      .locator("text=/passed|failed|Error|error/i")
      .first()
      .waitFor({ timeout: 15000 });

    // Button should re-enable after completion
    await expect(window.locator("[data-testid=btn-run]")).toBeEnabled({ timeout: 5000 });
    await expect(window.locator("[data-testid=btn-submit]")).toBeEnabled({ timeout: 5000 });
  });
});
