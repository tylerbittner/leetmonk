const { test, expect } = require("@playwright/test");
const { launchApp } = require("./helpers");

test.describe("Smoke tests", () => {
  let app, window;

  test.beforeEach(async () => {
    ({ app, window } = await launchApp());
  });

  test.afterEach(async () => {
    await app.close();
  });

  // 1. App launch
  test("window opens and problems load", async () => {
    const consoleErrors = [];
    window.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    // Problem list should have items
    await expect(window.locator('[data-testid="problem-list-item"]').first()).toBeVisible({ timeout: 10000 });
    // No fatal console errors
    expect(consoleErrors.filter(e => !e.includes("ResizeObserver"))).toHaveLength(0);
  });

  // 2. Problem selection
  test("clicking a problem shows description and editor", async () => {
    await window.locator('[data-testid="problem-list-item"]').first().click();
    await expect(window.locator(".monaco-editor")).toBeVisible({ timeout: 8000 });
    // Description panel should have some text content
    await expect(window.locator('[data-testid="problem-description"]')).toBeVisible({ timeout: 5000 });
  });

  // 3. Code execution (Python)
  test("run Python code shows test results", async () => {
    await window.locator('[data-testid="problem-list-item"]').first().click();
    await window.waitForSelector(".monaco-editor", { timeout: 8000 });
    // Click Run button (Cmd+Enter shortcut or Run button)
    await window.locator('[data-testid="run-button"]').click();
    await expect(window.locator('[data-testid="test-results"]')).toBeVisible({ timeout: 20000 });
  });

  // 4. Code execution (JavaScript)
  test("switch to JS and run code", async () => {
    await window.locator('[data-testid="problem-list-item"]').first().click();
    await window.waitForSelector(".monaco-editor", { timeout: 8000 });
    // Switch to JS language
    await window.locator('[data-testid="language-select"]').selectOption("javascript");
    await window.locator('[data-testid="run-button"]').click();
    await expect(window.locator('[data-testid="test-results"]')).toBeVisible({ timeout: 20000 });
  });

  // 5. Submit solution
  test("submit correct solution shows celebration", async () => {
    // Select Two Sum (first easy problem)
    const twoSum = window.locator('[data-testid="problem-list-item"]').filter({ hasText: "Two Sum" }).first();
    await twoSum.click();
    await window.waitForSelector(".monaco-editor", { timeout: 8000 });
    // Type in a correct solution via Monaco
    await window.locator(".monaco-editor textarea").focus();
    await window.keyboard.press("Control+A");
    await window.keyboard.type(
      "def twoSum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i"
    );
    await window.locator('[data-testid="submit-button"]').click();
    // Celebration or all-pass indicator
    await expect(
      window.locator('[data-testid="celebration"], [data-testid="all-passed"]')
    ).toBeVisible({ timeout: 20000 });
  });

  // 6. Settings persistence
  test("settings changes persist across open/close", async () => {
    await window.keyboard.press("Meta+,");
    await expect(window.locator('[data-testid="settings-panel"]')).toBeVisible({ timeout: 5000 });
    // Change font size
    const slider = window.locator('[data-testid="font-size-slider"]');
    await slider.fill("18");
    // Close settings
    await window.keyboard.press("Escape");
    // Reopen
    await window.keyboard.press("Meta+,");
    await expect(window.locator('[data-testid="font-size-slider"]')).toHaveValue("18");
  });

  // 7. Vim keybindings
  test("enable vim shows vim status bar", async () => {
    await window.keyboard.press("Meta+,");
    await expect(window.locator('[data-testid="settings-panel"]')).toBeVisible({ timeout: 5000 });
    const vimToggle = window.locator('[data-testid="vim-toggle"]');
    const isChecked = await vimToggle.isChecked();
    if (!isChecked) await vimToggle.click();
    await window.keyboard.press("Escape");
    // Click a problem so editor is visible
    await window.locator('[data-testid="problem-list-item"]').first().click();
    await window.waitForSelector(".monaco-editor", { timeout: 8000 });
    await expect(window.locator('[data-testid="vim-statusbar"]')).toBeVisible({ timeout: 5000 });
  });

  // 8. Minimal focus mode
  test("minimal focus mode hides sidebar", async () => {
    await window.keyboard.press("Meta+,");
    await expect(window.locator('[data-testid="settings-panel"]')).toBeVisible({ timeout: 5000 });
    const minimalToggle = window.locator('[data-testid="minimal-toggle"]');
    await minimalToggle.click();
    await window.keyboard.press("Escape");
    // Sidebar should be gone
    await expect(window.locator('[data-testid="sidebar"]')).toBeHidden({ timeout: 3000 });
  });

  // 9. Pattern Library
  test("Patterns button shows pattern cards", async () => {
    await window.locator('[data-testid="patterns-btn"]').click();
    await expect(window.locator('[data-testid="pattern-library"]')).toBeVisible({ timeout: 5000 });
    const cards = window.locator('[data-testid="pattern-card"]');
    await expect(cards.first()).toBeVisible();
    // Click a pattern to expand it
    await cards.first().click();
    await expect(window.locator('[data-testid="pattern-detail"]')).toBeVisible({ timeout: 3000 });
  });

  // 10. Session Planner
  test("Plan Session opens planner and starts session", async () => {
    await window.locator('[data-testid="plan-session-btn"]').click();
    await expect(window.locator('[data-testid="session-planner"]')).toBeVisible({ timeout: 5000 });
    // Generate problems
    await window.locator('[data-testid="generate-btn"]').click();
    await expect(window.locator('[data-testid="session-problem-item"]').first()).toBeVisible({ timeout: 5000 });
    // Start session
    await window.locator('[data-testid="start-session-btn"]').click();
    await expect(window.locator('[data-testid="session-bar"]')).toBeVisible({ timeout: 5000 });
  });

  // 11. Solution Diff
  test("Diff button opens diff editor", async () => {
    await window.locator('[data-testid="problem-list-item"]').first().click();
    // Navigate to Solutions tab
    await window.locator('[data-testid="solutions-tab"]').click();
    await expect(window.locator('[data-testid="diff-btn"]')).toBeVisible({ timeout: 5000 });
    await window.locator('[data-testid="diff-btn"]').click();
    await expect(window.locator('[data-testid="diff-view"]')).toBeVisible({ timeout: 5000 });
  });

  // 12. Review Flag
  test("review flag popup renders without clipping", async () => {
    await window.locator('[data-testid="problem-list-item"]').first().click();
    await window.locator('[data-testid="review-flag-btn"]').click();
    const popup = window.locator('[data-testid="review-flag-popup"]');
    await expect(popup).toBeVisible({ timeout: 3000 });
    // Check it's within viewport bounds
    const box = await popup.boundingBox();
    const viewportSize = window.viewportSize();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    if (viewportSize) {
      expect(box.x + box.width).toBeLessThanOrEqual(viewportSize.width + 1);
      expect(box.y + box.height).toBeLessThanOrEqual(viewportSize.height + 1);
    }
  });

  // 13. Spaced Repetition Rating modal
  test("rating modal appears with 4 buttons after solve", async () => {
    const twoSum = window.locator('[data-testid="problem-list-item"]').filter({ hasText: "Two Sum" }).first();
    await twoSum.click();
    await window.waitForSelector(".monaco-editor", { timeout: 8000 });
    await window.locator(".monaco-editor textarea").focus();
    await window.keyboard.press("Control+A");
    await window.keyboard.type(
      "def twoSum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i"
    );
    await window.locator('[data-testid="submit-button"]').click();
    await expect(window.locator('[data-testid="rating-modal"]')).toBeVisible({ timeout: 20000 });
    const ratingBtns = window.locator('[data-testid="rating-btn"]');
    await expect(ratingBtns).toHaveCount(4);
  });

  // 14. Language switching
  test("language switching keeps code separate per language", async () => {
    await window.locator('[data-testid="problem-list-item"]').first().click();
    await window.waitForSelector(".monaco-editor", { timeout: 8000 });
    // Type something in Python
    await window.locator(".monaco-editor textarea").focus();
    await window.keyboard.press("Control+End");
    await window.keyboard.type("\n# python comment");
    // Switch to JS
    await window.locator('[data-testid="language-select"]').selectOption("javascript");
    const jsContent = await window.locator(".monaco-editor").textContent();
    expect(jsContent).not.toContain("# python comment");
    // Switch back to Python
    await window.locator('[data-testid="language-select"]').selectOption("python");
    const pyContent = await window.locator(".monaco-editor").textContent();
    expect(pyContent).toContain("# python comment");
  });

  // 15. Timer
  test("timer appears and increments", async () => {
    await window.locator('[data-testid="problem-list-item"]').first().click();
    const timer = window.locator('[data-testid="timer"]');
    await expect(timer).toBeVisible({ timeout: 5000 });
    const initial = await timer.textContent();
    // Wait 2 seconds and check it incremented
    await window.waitForTimeout(2100);
    const updated = await timer.textContent();
    expect(updated).not.toEqual(initial);
  });

  // 16. Sound toggle
  test("disabling sound prevents audio on solve", async () => {
    await window.keyboard.press("Meta+,");
    await expect(window.locator('[data-testid="settings-panel"]')).toBeVisible({ timeout: 5000 });
    const soundToggle = window.locator('[data-testid="sound-toggle"]');
    if (await soundToggle.isChecked()) await soundToggle.click();
    await window.keyboard.press("Escape");
    // Track audio play calls
    await window.evaluate(() => {
      window.__audioPlayed = false;
      const orig = window.Audio;
      window.Audio = function(...args) {
        const a = new orig(...args);
        const origPlay = a.play.bind(a);
        a.play = (...pargs) => { window.__audioPlayed = true; return origPlay(...pargs); };
        return a;
      };
    });
    const twoSum = window.locator('[data-testid="problem-list-item"]').filter({ hasText: "Two Sum" }).first();
    await twoSum.click();
    await window.waitForSelector(".monaco-editor", { timeout: 8000 });
    await window.locator(".monaco-editor textarea").focus();
    await window.keyboard.press("Control+A");
    await window.keyboard.type(
      "def twoSum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i"
    );
    await window.locator('[data-testid="submit-button"]').click();
    await window.locator('[data-testid="rating-modal"]').waitFor({ timeout: 20000 });
    const played = await window.evaluate(() => window.__audioPlayed);
    expect(played).toBe(false);
  });

  // 17. Bug Report modal
  test("Bug Report modal opens with pre-filled context", async () => {
    await window.keyboard.press("Meta+,");
    await expect(window.locator('[data-testid="settings-panel"]')).toBeVisible({ timeout: 5000 });
    await window.locator('[data-testid="bug-report-btn"]').click();
    await expect(window.locator('[data-testid="bug-report-modal"]')).toBeVisible({ timeout: 5000 });
    // Should have some pre-filled text
    const content = await window.locator('[data-testid="bug-report-modal"]').textContent();
    expect(content.length).toBeGreaterThan(50);
  });
});
