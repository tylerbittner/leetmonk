const { test, expect } = require("@playwright/test");
const {
  launchAppWithPersistence,
  setEditorValue,
  ensureSidebarExpanded,
  submitCorrectSolution,
} = require("./helpers");

test.describe("FSRS spaced repetition loop", () => {
  let app, window, cleanup, relaunch;

  test.beforeEach(async () => {
    ({ app, window, relaunch, cleanup } = await launchAppWithPersistence({ show: true }));
    await window.locator("[data-testid=solved-counter]").waitFor({ timeout: 15000 });
    await ensureSidebarExpanded(window);
  });

  test.afterEach(async () => {
    if (app) await app.close().catch(() => {});
    if (cleanup) cleanup();
  });

  test("Test 1: Problem appears in review queue after rating Good", async () => {
    await submitCorrectSolution(window);
    await window.locator("[data-testid=rating-modal]").waitFor({ timeout: 10000 });
    await window.locator("[data-testid=rate-good]").click();
    await window.waitForTimeout(2000);

    const reviewItems = window.locator("[data-testid=review-queue-item]");
    await reviewItems.first().waitFor({ timeout: 10000 });
    const count = await reviewItems.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("Test 2: Review queue item shows retrievability percentage", async () => {
    await window.locator("[data-testid=problem-item]").first().click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(1000);

    const flag = window.locator("[data-testid=review-flag]");
    await flag.waitFor({ timeout: 5000 });
    await flag.click();
    await window.waitForTimeout(800);

    const reviewItems = window.locator("[data-testid=review-queue-item]");
    await reviewItems.first().waitFor({ timeout: 10000 });

    const firstItem = reviewItems.first();
    const itemText = await firstItem.textContent();
    expect(itemText).toMatch(/\d+%/);
  });

  test("Test 3: Again rating creates short interval — problem appears due today", async () => {
    await submitCorrectSolution(window);
    await window.locator("[data-testid=rating-modal]").waitFor({ timeout: 10000 });

    // Verify Again preview shows a very short interval
    const againBtn = window.locator("[data-testid=rate-again]");
    const againText = await againBtn.textContent();
    // Again should show "today" or "in 1 day" (very short interval)
    expect(againText).toMatch(/today|in \d+ day/i);

    await againBtn.click();
    await window.waitForTimeout(1500);

    // After Again rating, problem should appear in review queue as due today/overdue
    const reviewItems = window.locator("[data-testid=review-queue-item]");
    await reviewItems.first().waitFor({ timeout: 10000 });
    const count = await reviewItems.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // The first item should be due today (short interval from Again rating)
    const firstItem = reviewItems.first();
    const itemText = await firstItem.textContent();
    // Should show "today", "overdue", or a very short interval
    expect(itemText).toMatch(/today|overdue|due|\d+%/i);
  });

  test("Test 4: Easy rating preview shows a long multi-day interval", async () => {
    await submitCorrectSolution(window);
    await window.locator("[data-testid=rating-modal]").waitFor({ timeout: 10000 });

    const easyBtn = window.locator("[data-testid=rate-easy]");
    await easyBtn.waitFor({ timeout: 5000 });
    const easyText = await easyBtn.textContent();

    // Easy should show "in X days" where X >= 10
    expect(easyText).toMatch(/in \d+ days/i);

    const match = easyText.match(/in (\d+) days/i);
    expect(match).not.toBeNull();
    const days = parseInt(match[1], 10);
    expect(days).toBeGreaterThanOrEqual(10);
  });

  test("Test 5: Rating modal shows previews for all 4 rating buttons", async () => {
    await submitCorrectSolution(window);
    await window.locator("[data-testid=rating-modal]").waitFor({ timeout: 10000 });

    const againBtn = window.locator("[data-testid=rate-again]");
    const hardBtn = window.locator("[data-testid=rate-hard]");
    const goodBtn = window.locator("[data-testid=rate-good]");
    const easyBtn = window.locator("[data-testid=rate-easy]");

    await expect(againBtn).toBeVisible({ timeout: 5000 });
    await expect(hardBtn).toBeVisible({ timeout: 5000 });
    await expect(goodBtn).toBeVisible({ timeout: 5000 });
    await expect(easyBtn).toBeVisible({ timeout: 5000 });

    // Each button should contain a date/interval preview
    const againText = await againBtn.textContent();
    const hardText = await hardBtn.textContent();
    const goodText = await goodBtn.textContent();
    const easyText = await easyBtn.textContent();

    const previewPattern = /today|in \d+ day/i;
    expect(againText).toMatch(previewPattern);
    expect(hardText).toMatch(previewPattern);
    expect(goodText).toMatch(previewPattern);
    expect(easyText).toMatch(previewPattern);
  });

  test("Test 6: SR state persists across app relaunch after rating Good", async () => {
    await submitCorrectSolution(window);
    await window.locator("[data-testid=rating-modal]").waitFor({ timeout: 10000 });
    await window.locator("[data-testid=rate-good]").click();
    await window.waitForTimeout(2000);

    // Close app and relaunch with same data dir
    await app.close().catch(() => {});
    app = null;

    const relaunched = await relaunch();
    app = relaunched.app;
    window = relaunched.window;

    await window.locator("[data-testid=solved-counter]").waitFor({ timeout: 15000 });
    await ensureSidebarExpanded(window);

    // Problem should still appear in review queue after relaunch
    const reviewItems = window.locator("[data-testid=review-queue-item]");
    await reviewItems.first().waitFor({ timeout: 10000 });
    const count = await reviewItems.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // After rating Good, the item should NOT be overdue immediately — it should show future interval
    const firstItem = reviewItems.first();
    const itemText = await firstItem.textContent();
    // Should show "in X days" or a high retrievability (not "overdue")
    expect(itemText).not.toMatch(/overdue/i);
    expect(itemText).toMatch(/in \d+ day|100%|\d+%/i);
  });
});
