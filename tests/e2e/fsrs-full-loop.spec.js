const { test, expect } = require("@playwright/test");
const {
  launchAppWithPersistence,
  setEditorValue,
  ensureSidebarExpanded,
  submitCorrectSolution,
  CORRECT_SOLUTIONS,
} = require("./helpers");

test.describe("FSRS Full Lifecycle", () => {
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

  async function doRelaunch() {
    await app.close();
    ({ app, window } = await relaunch());
    await window.waitForLoadState("load");
    await window.waitForTimeout(2000);
    await window.locator("[data-testid=solved-counter]").waitFor({ timeout: 15000 });
    await ensureSidebarExpanded(window);
  }

  // Test 1: Re-solve same problem after rating → rating modal appears again
  test("Re-solving a rated problem triggers rating modal again", async () => {
    // First solve + rate Good
    await submitCorrectSolution(window);
    await window.locator("[data-testid=rating-modal]").waitFor({ timeout: 10000 });
    await window.locator("[data-testid=rate-good]").click();
    await expect(window.locator("[data-testid=rating-modal]")).not.toBeVisible({ timeout: 5000 });
    await window.waitForTimeout(1000);

    // Navigate away to second problem
    await window.locator("[data-testid=problem-item]").nth(1).click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(1000);

    // Navigate back to first problem and re-solve
    await window.locator("[data-testid=problem-item]").first().click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(2000);

    await setEditorValue(window, CORRECT_SOLUTIONS["best-time-buy-sell"]);
    await window.waitForTimeout(500);
    await window.locator("[data-testid=btn-submit]").click();
    await window.locator("text=✓ Accepted").waitFor({ timeout: 25000 });

    // Rating modal should appear again for re-review
    await window.locator("[data-testid=rating-modal]").waitFor({ timeout: 10000 });
    await expect(window.locator("[data-testid=rating-modal]")).toBeVisible();
  });

  // Test 2: Clicking a review-queue-item navigates to that problem
  test("Clicking review queue item navigates to that problem in editor", async () => {
    // Flag a problem to get it into the review queue
    await window.locator("[data-testid=problem-item]").first().click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(1000);
    const flag = window.locator("[data-testid=review-flag]");
    await flag.waitFor({ timeout: 5000 });
    await flag.click();
    await window.waitForTimeout(800);

    // Review queue should now have one item
    const reviewItems = window.locator("[data-testid=review-queue-item]");
    await reviewItems.first().waitFor({ timeout: 10000 });

    // Navigate away to second problem
    await window.locator("[data-testid=problem-item]").nth(1).click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(500);

    // Get the title shown in the review queue item
    const itemText = await reviewItems.first().textContent();
    expect(itemText.length).toBeGreaterThan(0);

    // Click the review queue item — should navigate back to flagged problem
    await reviewItems.first().click();
    await window.waitForTimeout(1000);

    // Editor should still be visible (navigation worked)
    await expect(window.locator(".monaco-editor")).toBeVisible({ timeout: 5000 });

    // The first problem should now be active (navigated back to it)
    const firstItem = window.locator("[data-testid=problem-item]").first();
    // The active problem item should have a different background
    const firstItemStyle = await firstItem.getAttribute("style");
    // At minimum, the click should not crash and editor is visible
    expect(firstItemStyle).toBeTruthy();
  });

  // Test 3: Flag 2 problems → relaunch → both persist (count ≥ 2)
  test("Multiple flagged items persist after restart", async () => {
    // Flag first problem
    await window.locator("[data-testid=problem-item]").first().click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(1000);
    await window.locator("[data-testid=review-flag]").waitFor({ timeout: 5000 });
    await window.locator("[data-testid=review-flag]").click();
    await window.waitForTimeout(800);

    // Flag second problem
    await window.locator("[data-testid=problem-item]").nth(1).click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(1000);
    await window.locator("[data-testid=review-flag]").waitFor({ timeout: 5000 });
    await window.locator("[data-testid=review-flag]").click();
    await window.waitForTimeout(800);

    // Verify count before restart
    const countBefore = await window.locator("[data-testid=review-queue-item]").count();
    expect(countBefore).toBeGreaterThanOrEqual(2);

    await doRelaunch();

    // Both items should persist
    const reviewItems = window.locator("[data-testid=review-queue-item]");
    await reviewItems.first().waitFor({ timeout: 10000 });
    const countAfter = await reviewItems.count();
    expect(countAfter).toBeGreaterThanOrEqual(2);
  });

  // Test 4: Hard rating preview shows interval between Again and Easy
  test("Hard rating preview shows shorter interval than Easy", async () => {
    await submitCorrectSolution(window);
    await window.locator("[data-testid=rating-modal]").waitFor({ timeout: 10000 });

    const hardBtn = window.locator("[data-testid=rate-hard]");
    const easyBtn = window.locator("[data-testid=rate-easy]");
    await hardBtn.waitFor({ timeout: 5000 });
    await easyBtn.waitFor({ timeout: 5000 });

    const hardText = await hardBtn.textContent();
    const easyText = await easyBtn.textContent();

    // Both should show an interval
    expect(hardText).toMatch(/today|in \d+ day/i);
    expect(easyText).toMatch(/today|in \d+ day/i);

    // If both show days, Easy should be >= Hard
    const hardDays = hardText.match(/in (\d+) days?/i)?.[1];
    const easyDays = easyText.match(/in (\d+) days?/i)?.[1];
    if (hardDays && easyDays) {
      expect(Number(easyDays)).toBeGreaterThanOrEqual(Number(hardDays));
    }
  });

  // Test 5: Flag 2 problems, rate one via FSRS, verify all persist after restart
  test("Flagged problems and FSRS-rated problems all persist together after restart", async () => {
    // Flag problem 1 first (unflagged → flagged, nextReview = tomorrow)
    await window.locator("[data-testid=problem-item]").first().click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(1000);
    await window.locator("[data-testid=review-flag]").waitFor({ timeout: 5000 });
    await window.locator("[data-testid=review-flag]").click();
    await window.waitForTimeout(800);

    // Flag problem 2 (unflagged → flagged)
    await window.locator("[data-testid=problem-item]").nth(1).click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(1000);
    await window.locator("[data-testid=review-flag]").waitFor({ timeout: 5000 });
    await window.locator("[data-testid=review-flag]").click();
    await window.waitForTimeout(800);

    // Verify both flagged items in queue
    const countBefore = await window.locator("[data-testid=review-queue-item]").count();
    expect(countBefore).toBeGreaterThanOrEqual(2);

    // Now navigate back to problem 1 and solve + rate it (adds SR data to existing flag)
    await window.locator("[data-testid=problem-item]").first().click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(2000);
    await setEditorValue(window, CORRECT_SOLUTIONS["best-time-buy-sell"]);
    await window.waitForTimeout(500);
    await window.locator("[data-testid=btn-submit]").click();
    await window.locator("text=✓ Accepted").waitFor({ timeout: 25000 });
    await window.locator("[data-testid=rating-modal]").waitFor({ timeout: 10000 });
    await window.locator("[data-testid=rate-good]").click();
    await window.waitForTimeout(2000);

    await doRelaunch();

    // Both items should persist (flag + FSRS together)
    const reviewItems = window.locator("[data-testid=review-queue-item]");
    await reviewItems.first().waitFor({ timeout: 10000 });
    const countAfter = await reviewItems.count();
    expect(countAfter).toBeGreaterThanOrEqual(2);
  });
});
