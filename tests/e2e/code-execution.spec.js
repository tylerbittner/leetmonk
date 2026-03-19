const { test, expect } = require("@playwright/test");
const { launchApp, setEditorValue } = require("./helpers");

// Helper: get Monaco editor content
async function getEditorValue(window) {
  return window.evaluate(() => {
    const models = window.monaco?.editor?.getModels();
    if (models && models.length > 0) {
      return models[0].getValue();
    }
    return null;
  });
}

// Helper: click the first problem and wait for editor
async function openFirstProblem(window) {
  await window.locator("[data-testid=problem-item]").first().click();
  await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
  // Give Monaco and React state (including __testSetCode) time to fully initialize
  await window.waitForTimeout(2000);
}

test.describe("Code Execution", () => {
  let app, window;

  test.beforeEach(async () => {
    ({ app, window } = await launchApp({ show: true }));
    await window.locator("[data-testid=solved-counter]").waitFor({ timeout: 15000 });
  });

  test.afterEach(async () => {
    if (app) await app.close().catch(() => {});
  });

  // 1. Python starter code runs without crashing
  test("Python starter code runs without crashing", async () => {
    await openFirstProblem(window);
    await window.locator("[data-testid=btn-run]").click();
    // Result panel should appear — pass, fail, or error are all valid; a JS crash would never show any
    await window.locator("text=/passed|failed|Error|error/i").first().waitFor({ timeout: 15000 });
  });

  // 2. Correct Python solution passes all test cases
  test("Correct Python solution passes all test cases", async () => {
    await openFirstProblem(window);
    const correctPython = [
      "from typing import List",
      "",
      "def max_profit(prices: List[int]) -> int:",
      "    min_price = float('inf')",
      "    max_p = 0",
      "    for price in prices:",
      "        if price < min_price:",
      "            min_price = price",
      "        elif price - min_price > max_p:",
      "            max_p = price - min_price",
      "    return max_p",
    ].join("\n");

    await setEditorValue(window, correctPython);

    const counterBefore = await window.locator("[data-testid=solved-counter]").textContent();

    await window.locator("[data-testid=btn-submit]").click();
    // Wait for "passed" text or solved counter to increment
    await Promise.race([
      window.locator("text=/passed/i").first().waitFor({ timeout: 15000 }),
      window.waitForFunction(
        (before) => {
          const el = document.querySelector("[data-testid=solved-counter]");
          return el && el.textContent !== before;
        },
        counterBefore,
        { timeout: 15000 }
      ),
    ]);

    // Verify at least one "passed" result is shown
    const passedCount = await window.locator("text=/passed/i").count();
    expect(passedCount).toBeGreaterThan(0);
  });

  // 3. Wrong Python answer shows failed results
  test("Wrong Python answer shows failed results", async () => {
    await openFirstProblem(window);
    const wrongPython = [
      "from typing import List",
      "",
      "def max_profit(prices: List[int]) -> int:",
      "    return 0",
    ].join("\n");

    await setEditorValue(window, wrongPython);
    await window.locator("[data-testid=btn-submit]").click();

    await window.locator("text=/failed/i").first().waitFor({ timeout: 15000 });
    const failedCount = await window.locator("text=/failed/i").count();
    expect(failedCount).toBeGreaterThan(0);
  });

  // 4. JS starter code runs
  test("JS starter code runs without crashing", async () => {
    await openFirstProblem(window);
    await window.locator("[data-testid=language-select]").selectOption("javascript");
    await window.waitForTimeout(500);
    await window.locator("[data-testid=btn-run]").click();
    await window.locator("text=/passed|failed|Error|error/i").first().waitFor({ timeout: 15000 });
  });

  // 5. Correct JS solution passes
  test("Correct JS solution passes all test cases", async () => {
    await openFirstProblem(window);
    await window.locator("[data-testid=language-select]").selectOption("javascript");
    await window.waitForTimeout(500);

    const correctJS = [
      "function maxProfit(prices) {",
      "    let minPrice = Infinity;",
      "    let maxP = 0;",
      "    for (const price of prices) {",
      "        if (price < minPrice) {",
      "            minPrice = price;",
      "        } else if (price - minPrice > maxP) {",
      "            maxP = price - minPrice;",
      "        }",
      "    }",
      "    return maxP;",
      "}",
    ].join("\n");

    await setEditorValue(window, correctJS);
    await window.locator("[data-testid=btn-submit]").click();

    await window.locator("text=/passed/i").first().waitFor({ timeout: 15000 });
    const passedCount = await window.locator("text=/passed/i").count();
    expect(passedCount).toBeGreaterThan(0);
  });

  // 6. Python syntax error shows error message
  test("Python syntax error shows error message", async () => {
    await openFirstProblem(window);
    const badPython = [
      "def max_profit(prices:",
      "    syntax error here )",
      "    return broken",
    ].join("\n");

    await setEditorValue(window, badPython);
    await window.locator("[data-testid=btn-run]").click();

    await window.locator("text=/Error|SyntaxError|error/i").first().waitFor({ timeout: 15000 });
    const errorCount = await window.locator("text=/Error|SyntaxError|error/i").count();
    expect(errorCount).toBeGreaterThan(0);
  });

  // 7. JS syntax error shows error message
  test("JS syntax error shows error message", async () => {
    await openFirstProblem(window);
    await window.locator("[data-testid=language-select]").selectOption("javascript");
    await window.waitForTimeout(500);

    const badJS = [
      "function maxProfit(prices {{{",
      "    return ??? broken;",
      "}}}",
    ].join("\n");

    await setEditorValue(window, badJS);
    await window.locator("[data-testid=btn-run]").click();

    await window.locator("text=/Error|SyntaxError|error/i").first().waitFor({ timeout: 15000 });
    const errorCount = await window.locator("text=/Error|SyntaxError|error/i").count();
    expect(errorCount).toBeGreaterThan(0);
  });

  // 8. Switching language resets to JS starter code
  test("Switching language resets to JS starter code", async () => {
    await openFirstProblem(window);
    // Default is Python — switch to JS
    await window.locator("[data-testid=language-select]").selectOption("javascript");
    await window.waitForTimeout(500);

    const code = await getEditorValue(window);
    // JS starter should contain the function signature, not Python def
    expect(code).toBeTruthy();
    expect(code).toMatch(/function\s+maxProfit|\/\*\*/);
    expect(code).not.toMatch(/^def /m);
  });

  // 9. Python and JS code stored separately per-problem
  test("Python and JS code stored separately", async () => {
    await openFirstProblem(window);

    // Set unique Python code
    const uniquePython = [
      "from typing import List",
      "",
      "# UNIQUE_PYTHON_MARKER",
      "def max_profit(prices: List[int]) -> int:",
      "    return 42",
    ].join("\n");
    await setEditorValue(window, uniquePython);

    // Switch to JS and set unique JS code
    await window.locator("[data-testid=language-select]").selectOption("javascript");
    await window.waitForTimeout(500);

    const uniqueJS = [
      "// UNIQUE_JS_MARKER",
      "function maxProfit(prices) {",
      "    return 42;",
      "}",
    ].join("\n");
    await setEditorValue(window, uniqueJS);

    // Switch back to Python — should still have the Python code
    await window.locator("[data-testid=language-select]").selectOption("python");
    await window.waitForTimeout(500);

    const pythonCode = await getEditorValue(window);
    expect(pythonCode).toContain("UNIQUE_PYTHON_MARKER");
    expect(pythonCode).not.toContain("UNIQUE_JS_MARKER");
  });

  // 10. Reset button restores starter code
  test("Reset button restores starter code", async () => {
    await openFirstProblem(window);

    // Modify the code
    await setEditorValue(window, "# completely replaced code\ndef max_profit(prices): return 999");

    // Handle the confirm() dialog that Reset triggers
    window.once("dialog", (dialog) => dialog.accept());

    await window.locator("[data-testid=btn-reset]").click();
    await window.waitForTimeout(500);

    const code = await getEditorValue(window);
    expect(code).toBeTruthy();
    // Python starter begins with the function signature (def) or an import
    expect(code).toMatch(/^(from typing|def )/m);
    // Should NOT still have our replacement content
    expect(code).not.toContain("completely replaced code");
  });
});
