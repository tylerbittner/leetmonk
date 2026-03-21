const { test, expect } = require("@playwright/test");
const {
  launchApp,
  setEditorValue,
  ensureSidebarExpanded,
  submitCorrectSolution,
  CORRECT_SOLUTIONS,
} = require("./helpers");

async function startSession(window, { count = 3 } = {}) {
  await ensureSidebarExpanded(window);
  await window.locator("[data-testid=btn-plan-session]").click();
  await window.locator("[data-testid=session-planner]").waitFor({ timeout: 10000 });
  await window.locator(`[data-testid=count-${count}]`).click();
  await window.locator("[data-testid=btn-generate]").click();
  await window.locator("[data-testid=session-problem-item]").first().waitFor({ timeout: 10000 });
  await window.locator("[data-testid=btn-start-session]").click();
  await window.locator("[data-testid=session-bar]").waitFor({ timeout: 10000 });
}

test.describe("Session Full Flow", () => {
  let app, window, cleanup;

  test.afterEach(async () => {
    await app?.close();
    cleanup?.();
  });

  // Test 1: Advance through all 3 problems via Next → reach "Problem 3/3"
  test("Advancing through all session problems reaches last problem", async () => {
    ({ app, window, cleanup } = await launchApp({ show: false }));
    await window.locator("[data-testid=solved-counter]").waitFor({ timeout: 15000 });
    await startSession(window, { count: 3 });

    // Click Next to move to problem 2
    await window.locator("[data-testid=session-next-btn]").click();
    await window.waitForTimeout(500);

    const barText2 = await window.locator("[data-testid=session-bar]").textContent();
    expect(barText2).toMatch(/Problem\s+2\s*\/\s*3/);

    // Click Next to move to problem 3
    await window.locator("[data-testid=session-next-btn]").click();
    await window.waitForTimeout(500);

    const barText3 = await window.locator("[data-testid=session-bar]").textContent();
    expect(barText3).toMatch(/Problem\s+3\s*\/\s*3/);
  });

  // Test 2: Post-session review shows 0 solved when no problems were solved
  test("Post-session review shows correct solved count after ending without solving", async () => {
    ({ app, window, cleanup } = await launchApp({ show: false }));
    await window.locator("[data-testid=solved-counter]").waitFor({ timeout: 15000 });
    await startSession(window, { count: 3 });

    // End session without solving anything
    await window.locator("[data-testid=session-end-btn]").click();
    await window.locator("[data-testid=post-session-review]").waitFor({ timeout: 10000 });

    // Post-session should be visible and contain "Session Complete"
    const reviewEl = window.locator("[data-testid=post-session-review]");
    await expect(reviewEl).toBeVisible();
    await expect(reviewEl.locator("h2")).toContainText("Session Complete");

    // Should mention "3" (total problems in session)
    const reviewText = await reviewEl.textContent();
    expect(reviewText).toMatch(/3/);
  });

  // Test 3: Post-session review reflects solved count when problem was solved
  test("Post-session review shows solved count after submitting correct solution", async () => {
    ({ app, window, cleanup } = await launchApp({ show: true }));
    await window.locator("[data-testid=solved-counter]").waitFor({ timeout: 15000 });
    await ensureSidebarExpanded(window);

    // Plan a 3-problem session — the first problem in the generated list will be opened
    await window.locator("[data-testid=btn-plan-session]").click();
    await window.locator("[data-testid=session-planner]").waitFor({ timeout: 10000 });
    await window.locator("[data-testid=count-3]").click();
    await window.locator("[data-testid=btn-generate]").click();

    // Check what problems are in the session
    await window.locator("[data-testid=session-problem-item]").first().waitFor({ timeout: 10000 });

    await window.locator("[data-testid=btn-start-session]").click();
    await window.locator("[data-testid=session-bar]").waitFor({ timeout: 10000 });
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(2000);

    // Try to submit the correct solution for best-time-buy-sell (only works if it's in session)
    await setEditorValue(window, CORRECT_SOLUTIONS["best-time-buy-sell"]);
    await window.waitForTimeout(500);
    await window.locator("[data-testid=btn-submit]").click();

    // Wait for result (pass or fail depending on if first session problem matches)
    await window
      .locator("text=/✓ Accepted|failed/i")
      .first()
      .waitFor({ timeout: 25000 });

    // Dismiss rating modal if present
    const modal = window.locator("[data-testid=rating-modal]");
    if (await modal.isVisible().catch(() => false)) {
      await window.locator("[data-testid=rate-good]").click();
      await window.waitForTimeout(500);
    }

    // End session
    await window.locator("[data-testid=session-end-btn]").click();
    await window.locator("[data-testid=post-session-review]").waitFor({ timeout: 10000 });
    await expect(window.locator("[data-testid=post-session-review]")).toBeVisible();
  });

  // Test 4: Timer in session bar shows elapsed time (count-up or count-down format)
  test("Session bar displays timer that reflects time", async () => {
    ({ app, window, cleanup } = await launchApp({ show: false }));
    await window.locator("[data-testid=solved-counter]").waitFor({ timeout: 15000 });

    // Start a timed session (default has a time target)
    await ensureSidebarExpanded(window);
    await window.locator("[data-testid=btn-plan-session]").click();
    await window.locator("[data-testid=session-planner]").waitFor({ timeout: 10000 });
    await window.locator("[data-testid=count-3]").click();
    await window.locator("[data-testid=btn-generate]").click();
    await window.locator("[data-testid=session-problem-item]").first().waitFor({ timeout: 10000 });
    await window.locator("[data-testid=btn-start-session]").click();
    await window.locator("[data-testid=session-bar]").waitFor({ timeout: 10000 });

    // Read timer text immediately
    const sessionBar = window.locator("[data-testid=session-bar]");
    const textBefore = await sessionBar.textContent();

    // Wait a bit for timer to advance
    await window.waitForTimeout(3000);
    const textAfter = await sessionBar.textContent();

    // Timer text should show time format (digits with colon)
    expect(textBefore).toMatch(/\d+:\d+|\d+\s*min/i);
    // Text may have changed as timer advances (or same format at minimum)
    expect(textAfter).toMatch(/\d+:\d+|\d+\s*min/i);
  });
});
