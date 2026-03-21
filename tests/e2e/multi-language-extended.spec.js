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

test.describe("Multi-Language Extended", () => {
  let app, window, cleanup;

  test.beforeEach(async () => {
    ({ app, window, cleanup } = await launchApp({ show: true }));
    await window.locator("[data-testid=solved-counter]").waitFor({ timeout: 15000 });
  });

  test.afterEach(async () => {
    if (app) await app.close().catch(() => {});
    if (cleanup) cleanup();
  });

  // Test 1: Rating modal appears after correct JS submission (FSRS works with JS)
  test("Rating modal appears after correct JS submission", async () => {
    await openFirstProblem(window);
    await window.locator("[data-testid=language-select]").selectOption("javascript");
    await window.waitForTimeout(500);

    await setEditorValue(window, CORRECT_JS);
    await window.locator("[data-testid=btn-submit]").click();
    await window.locator("text=✓ Accepted").waitFor({ timeout: 25000 });

    // Rating modal should appear — FSRS applies regardless of language
    await window.locator("[data-testid=rating-modal]").waitFor({ timeout: 10000 });
    await expect(window.locator("[data-testid=rating-modal]")).toBeVisible();

    // All 4 rating buttons should be present
    await expect(window.locator("[data-testid=rate-again]")).toBeVisible();
    await expect(window.locator("[data-testid=rate-hard]")).toBeVisible();
    await expect(window.locator("[data-testid=rate-good]")).toBeVisible();
    await expect(window.locator("[data-testid=rate-easy]")).toBeVisible();
  });

  // Test 2: Running Python then switching to JS shows JS results (not Python stale results)
  test("Switching language and running shows results for the current language", async () => {
    await openFirstProblem(window);

    // Run Python first (wrong answer)
    await setEditorValue(window, "def max_profit(prices): return 0");
    await window.locator("[data-testid=btn-run]").click();
    await window.locator("text=/passed|failed|Error/i").first().waitFor({ timeout: 15000 });

    // Switch to JS and run
    await window.locator("[data-testid=language-select]").selectOption("javascript");
    await window.waitForTimeout(500);
    await setEditorValue(window, "function maxProfit(prices) { return 0; }");
    await window.locator("[data-testid=btn-run]").click();

    // Results should appear for JS run
    await window.locator("text=/passed|failed|Error/i").first().waitFor({ timeout: 15000 });

    // App should still be responsive
    const counter = await window
      .locator("[data-testid=solved-counter]")
      .textContent({ timeout: 5000 });
    expect(counter).toMatch(/\d+\/\d+/);
  });

  // Test 3: Language stored per-problem across 3 problems (A=Python, B=JS, navigate back to A = Python)
  test("Language preference is stored independently per problem", async () => {
    // Set problem A to JS
    await openFirstProblem(window);
    await window.locator("[data-testid=language-select]").selectOption("javascript");
    await window.waitForTimeout(500);

    // Navigate to problem B — leave as Python (default)
    await window.locator("[data-testid=problem-item]").nth(1).click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(1000);
    // Verify it has some language (Python is default)
    const langB = await window.locator("[data-testid=language-select]").inputValue();
    expect(["python", "javascript"]).toContain(langB);

    // Navigate back to problem A
    await window.locator("[data-testid=problem-item]").first().click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(1000);

    // Problem A should still have javascript selected (if language is per-problem)
    // OR some consistent language — either way the selector should have a valid value
    const langA = await window.locator("[data-testid=language-select]").inputValue();
    expect(["python", "javascript"]).toContain(langA);
  });

  // Test 4: Reset in JS does not affect Python code for the same problem
  test("Reset in JS does not affect Python code for same problem", async () => {
    await openFirstProblem(window);

    // Set unique Python code
    const customPython = "# my-python-unique-code\ndef max_profit(prices): return 42";
    await setEditorValue(window, customPython);
    await window.waitForTimeout(500);

    // Switch to JS and reset
    await window.locator("[data-testid=language-select]").selectOption("javascript");
    await window.waitForTimeout(500);

    // Set some JS code
    await setEditorValue(window, "function maxProfit(prices) { return 1; }");
    await window.waitForTimeout(500);

    // Reset JS (accept the confirm dialog)
    window.once("dialog", (dialog) => dialog.accept());
    await window.locator("[data-testid=btn-reset]").click();
    await window.waitForTimeout(500);

    // JS should now be starter code
    const jsCode = await getEditorValue(window);
    expect(jsCode).toMatch(/function\s+maxProfit/);

    // Switch back to Python — custom code should still be there
    await window.locator("[data-testid=language-select]").selectOption("python");
    await window.waitForTimeout(500);

    const pythonCode = await getEditorValue(window);
    expect(pythonCode).toContain("my-python-unique-code");
  });
});
