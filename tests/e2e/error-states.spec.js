const { test, expect, _electron: electron } = require("@playwright/test");
const { launchApp, setEditorValue } = require("./helpers");
const path = require("path");
const fs = require("fs");
const os = require("os");

const projectRoot = path.join(__dirname, "../..");

// Helper: open first problem and wait for editor + __testSetCode
async function openFirstProblem(window) {
  await window.locator("[data-testid=problem-item]").first().click();
  await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
  await window.waitForTimeout(2000);
}

// Test 1: App loads gracefully despite malformed problem file
test("app loads gracefully despite malformed problem file", async () => {
  const tempDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "leetmonk-error-test-"));
  const destProblems = path.join(tempDataDir, "problems");
  fs.mkdirSync(destProblems);

  // Copy all good problems
  for (const f of fs.readdirSync(path.join(projectRoot, "data/problems"))) {
    if (f.endsWith(".json")) {
      fs.copyFileSync(
        path.join(projectRoot, "data/problems", f),
        path.join(destProblems, f)
      );
    }
  }
  // Add a malformed file
  fs.writeFileSync(path.join(destProblems, "bad-problem.json"), "{ invalid json !!!");

  const app = await electron.launch({
    args: [path.join(projectRoot, "out/main/index.js")],
    env: {
      ...process.env,
      NODE_ENV: "test",
      LEETMONK_SHOW_WINDOW: "0",
      ELECTRON_RENDERER_URL: "file://" + path.join(projectRoot, "out/renderer/index.html"),
      LEETMONK_DATA_DIR: tempDataDir,
    },
    timeout: 30000,
  });
  const window = await app.firstWindow();
  await window.waitForLoadState("load");
  await window.waitForTimeout(2000);

  try {
    // App should still load the valid problems
    const counter = await window
      .locator("[data-testid=solved-counter]")
      .textContent({ timeout: 10000 });
    expect(counter).toMatch(/\d+\/\d+/);
    const match = counter.match(/(\d+)\/(\d+)/);
    expect(Number(match[2])).toBeGreaterThan(0);

    // Error banner should be visible
    await expect(
      window.locator("text=/Schema error|schema error/i")
    ).toBeVisible({ timeout: 5000 });
  } finally {
    await app.close().catch(() => {});
    fs.rmSync(tempDataDir, { recursive: true, force: true });
  }
});

// Tests 2–6: use standard launchApp
test.describe("Error States", () => {
  let app, window, cleanup;

  test.beforeEach(async () => {
    ({ app, window, cleanup } = await launchApp({ show: false }));
    await window.locator("[data-testid=solved-counter]").waitFor({ timeout: 15000 });
  });

  test.afterEach(async () => {
    if (app) await app.close().catch(() => {});
    if (cleanup) cleanup();
  });

  // Test 2: Infinite loop times out gracefully
  test("infinite loop times out and app stays responsive", async () => {
    await openFirstProblem(window);

    const infiniteLoop = [
      "from typing import List",
      "",
      "def max_profit(prices: List[int]) -> int:",
      "    while True:",
      "        pass",
    ].join("\n");

    await setEditorValue(window, infiniteLoop);
    await window.locator("[data-testid=btn-run]").click();

    // Wait up to 15s for any error/timeout indicator
    await window
      .locator("text=/Error|error|timeout|Timeout|timed out|killed/i")
      .first()
      .waitFor({ timeout: 15000 });

    // App should still be responsive — counter still readable
    const counter = await window
      .locator("[data-testid=solved-counter]")
      .textContent({ timeout: 5000 });
    expect(counter).toMatch(/\d+\/\d+/);
  });

  // Test 3: Empty solution still shows results (no crash)
  test("empty solution shows results without crashing", async () => {
    await openFirstProblem(window);

    await setEditorValue(window, "");
    await window.locator("[data-testid=btn-run]").click();

    // Any result is fine — error, failed, or pass — just not a crash
    await window
      .locator("text=/passed|failed|Error|error/i")
      .first()
      .waitFor({ timeout: 15000 });
  });

  // Test 4: Python syntax error shows clear error message
  test("Python syntax error shows error message and app stays functional", async () => {
    await openFirstProblem(window);

    const badPython = [
      "def max_profit(prices:",
      "    return 0",
    ].join("\n");

    await setEditorValue(window, badPython);
    await window.locator("[data-testid=btn-run]").click();

    await window
      .locator("text=/SyntaxError|Error|error/i")
      .first()
      .waitFor({ timeout: 15000 });

    const errorCount = await window
      .locator("text=/SyntaxError|Error|error/i")
      .count();
    expect(errorCount).toBeGreaterThan(0);

    // App remains functional — can still read counter
    const counter = await window
      .locator("[data-testid=solved-counter]")
      .textContent({ timeout: 5000 });
    expect(counter).toMatch(/\d+\/\d+/);
  });

  // Test 5: Solution with a leading comment still executes correctly
  test("correct solution with comment header runs without issue", async () => {
    await openFirstProblem(window);

    const codeWithComment = [
      "# My solution — handles edge cases",
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

    await setEditorValue(window, codeWithComment);
    await window.locator("[data-testid=btn-run]").click();

    // Should pass — comment shouldn't break execution
    await window
      .locator("text=/passed|failed|Error/i")
      .first()
      .waitFor({ timeout: 15000 });

    const passedCount = await window.locator("text=/passed/i").count();
    expect(passedCount).toBeGreaterThan(0);
  });

  // Test 6: App stays responsive after failed submission
  test("app stays responsive after failed submission", async () => {
    await openFirstProblem(window);

    const wrongCode = [
      "from typing import List",
      "",
      "def max_profit(prices: List[int]) -> int:",
      "    return -1",
    ].join("\n");

    // First submission — wrong answer
    await setEditorValue(window, wrongCode);
    await window.locator("[data-testid=btn-submit]").click();
    await window.locator("text=/failed/i").first().waitFor({ timeout: 15000 });

    // Run again immediately — app should not be locked
    await window.locator("[data-testid=btn-run]").click();
    await window
      .locator("text=/passed|failed|Error|error/i")
      .first()
      .waitFor({ timeout: 15000 });

    // Navigate to a different problem — app should still be navigable
    const items = window.locator("[data-testid=problem-item]");
    const count = await items.count();
    expect(count).toBeGreaterThan(1);

    await items.nth(1).click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });

    // Description area should reflect a new problem (editor is present = navigation worked)
    const editorVisible = await window.locator(".monaco-editor").isVisible();
    expect(editorVisible).toBe(true);
  });
});
