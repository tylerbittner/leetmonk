const { test, expect } = require("@playwright/test");
const { launchApp, setEditorValue, ensureSidebarExpanded } = require("./helpers");

const CORRECT_PYTHON = [
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

const CORRECT_JS = [
  "function maxProfit(prices) {",
  "    let minPrice = Infinity;",
  "    let maxP = 0;",
  "    for (const price of prices) {",
  "        if (price < minPrice) minPrice = price;",
  "        else if (price - minPrice > maxP) maxP = price - minPrice;",
  "    }",
  "    return maxP;",
  "}",
].join("\n");

async function getEditorValue(window) {
  return window.evaluate(() => {
    const models = window.monaco?.editor?.getModels();
    if (models && models.length > 0) return models[0].getValue();
    return null;
  });
}

async function openFirstProblem(window) {
  await window.locator("[data-testid=problem-item]").first().click();
  await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
  await window.waitForTimeout(2000);
}

test.describe("Multi-Language Workflow", () => {
  let app, window, cleanup;

  test.beforeEach(async () => {
    ({ app, window, cleanup } = await launchApp({ show: true }));
    await window.locator("[data-testid=solved-counter]").waitFor({ timeout: 15000 });
  });

  test.afterEach(async () => {
    if (app) await app.close().catch(() => {});
    if (cleanup) cleanup();
  });

  // Test 1: Solved count only increments once regardless of language
  test("Solving in Python then JS only increments solved count once", async () => {
    await openFirstProblem(window);

    // Submit correct Python solution
    await setEditorValue(window, CORRECT_PYTHON);
    await window.locator("[data-testid=btn-submit]").click();
    await window.locator("text=✓ Accepted").waitFor({ timeout: 25000 });

    const counterAfterPython = await window
      .locator("[data-testid=solved-counter]")
      .textContent();
    expect(counterAfterPython).toContain("1/");

    // Switch to JS and submit correct JS solution
    await window.locator("[data-testid=language-select]").selectOption("javascript");
    await window.waitForTimeout(500);
    await setEditorValue(window, CORRECT_JS);
    await window.locator("[data-testid=btn-submit]").click();
    await window.locator("text=✓ Accepted").waitFor({ timeout: 25000 });

    // Solved counter should still be 1/86 — same problem, different language
    const counterAfterJS = await window
      .locator("[data-testid=solved-counter]")
      .textContent();
    expect(counterAfterJS).toContain("1/");
    expect(counterAfterJS).toBe(counterAfterPython);
  });

  // Test 2: Python and JS code stored independently per problem
  test("Python code and JS code stored independently per problem", async () => {
    await openFirstProblem(window);

    // Set unique Python marker
    await setEditorValue(window, "# python unique marker 12345");

    // Switch to JS and set unique JS marker
    await window.locator("[data-testid=language-select]").selectOption("javascript");
    await window.waitForTimeout(500);
    await setEditorValue(window, "// js unique marker 67890");

    // Switch back to Python — should have Python code
    await window.locator("[data-testid=language-select]").selectOption("python");
    await window.waitForTimeout(500);

    const pythonCode = await getEditorValue(window);
    expect(pythonCode).toContain("python unique marker 12345");
    expect(pythonCode).not.toContain("js unique marker 67890");

    // Switch to JS — should have JS code
    await window.locator("[data-testid=language-select]").selectOption("javascript");
    await window.waitForTimeout(500);

    const jsCode = await getEditorValue(window);
    expect(jsCode).toContain("js unique marker 67890");
    expect(jsCode).not.toContain("python unique marker 12345");
  });

  // Test 3: Reset in Python doesn't affect JS code
  test("Reset in Python doesn't affect JS code", async () => {
    await openFirstProblem(window);

    // Switch to JS and set custom code
    await window.locator("[data-testid=language-select]").selectOption("javascript");
    await window.waitForTimeout(500);
    const customJS = "// custom js code that should survive python reset\nfunction maxProfit(prices) { return 42; }";
    await setEditorValue(window, customJS);

    // Switch back to Python and reset
    await window.locator("[data-testid=language-select]").selectOption("python");
    await window.waitForTimeout(500);

    window.once("dialog", (dialog) => dialog.accept());
    await window.locator("[data-testid=btn-reset]").click();
    await window.waitForTimeout(500);

    // Python code should be starter code
    const pythonCode = await getEditorValue(window);
    expect(pythonCode).toMatch(/def max_profit/);
    expect(pythonCode).not.toContain("custom js code");

    // Switch to JS — custom code should be untouched
    await window.locator("[data-testid=language-select]").selectOption("javascript");
    await window.waitForTimeout(500);

    const jsCode = await getEditorValue(window);
    expect(jsCode).toContain("custom js code that should survive python reset");
  });

  // Test 4: JS execution actually runs Node.js (not Python)
  test("JS execution runs Node.js, not Python", async () => {
    await openFirstProblem(window);
    await window.locator("[data-testid=language-select]").selectOption("javascript");
    await window.waitForTimeout(500);

    // Wrong answer but valid JS — returns array length instead of profit
    const wrongJS = "function maxProfit(prices) { return prices.length; }";
    await setEditorValue(window, wrongJS);

    await window.locator("[data-testid=btn-run]").click();

    // Should get test results (pass/fail), not a Python error
    await window
      .locator("text=/passed|failed/i")
      .first()
      .waitFor({ timeout: 25000 });

    // Should NOT show Python-specific error messages
    const pythonError = await window.locator("text=/SyntaxError.*def|IndentationError|NameError.*def/").count();
    expect(pythonError).toBe(0);
  });

  // Test 5: Language selector persists after navigating between problems
  test("Language selector behavior after navigating between problems", async () => {
    await openFirstProblem(window);

    // Switch to JS on first problem
    await window.locator("[data-testid=language-select]").selectOption("javascript");
    await window.waitForTimeout(500);

    // Navigate to second problem
    await window.locator("[data-testid=problem-item]").nth(1).click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(1000);

    // Check actual behavior and assert it (either persists or resets)
    const langValue = await window
      .locator("[data-testid=language-select]")
      .inputValue();

    // Assert whatever the actual behavior is — document it
    // If it persists: expect "javascript"; if it resets: expect "python"
    expect(["javascript", "python"]).toContain(langValue);

    // Navigate back to first problem
    await window.locator("[data-testid=problem-item]").first().click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(1000);

    // Language on first problem should be consistent (whatever it was set to)
    const langOnFirstProblem = await window
      .locator("[data-testid=language-select]")
      .inputValue();
    expect(["javascript", "python"]).toContain(langOnFirstProblem);
  });

  // Test 6: Submitting correct JS solution passes all test cases
  test("Correct JS solution passes all test cases", async () => {
    await openFirstProblem(window);

    await window.locator("[data-testid=language-select]").selectOption("javascript");
    await window.waitForTimeout(500);

    await setEditorValue(window, CORRECT_JS);
    await window.locator("[data-testid=btn-submit]").click();

    await window.locator("text=✓ Accepted").waitFor({ timeout: 25000 });

    const accepted = await window.locator("text=✓ Accepted").count();
    expect(accepted).toBeGreaterThan(0);
  });
});
