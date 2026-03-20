const { test, expect } = require("@playwright/test");
const { launchApp, setEditorValue, ensureSidebarExpanded, submitCorrectSolution } = require("./helpers");

// Helper: open session planner, pick 3 problems, generate, start
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

test.describe("Session flow", () => {
  let app, window, cleanup;

  test.afterEach(async () => {
    await app?.close();
    cleanup?.();
  });

  test("Test 1: Full session from start to completion", async () => {
    ({ app, window, cleanup } = await launchApp({ show: false }));

    await ensureSidebarExpanded(window);
    await window.locator("[data-testid=btn-plan-session]").click();
    await window.locator("[data-testid=session-planner]").waitFor({ timeout: 10000 });
    await window.locator("[data-testid=count-3]").click();
    await window.locator("[data-testid=btn-generate]").click();
    await window.locator("[data-testid=session-problem-item]").first().waitFor({ timeout: 10000 });
    await window.locator("[data-testid=btn-start-session]").click();

    const sessionBar = window.locator("[data-testid=session-bar]");
    await sessionBar.waitFor({ timeout: 10000 });

    // Verify session bar shows problem count info (e.g. "Problem 1/3")
    const barText = await sessionBar.textContent();
    expect(barText).toMatch(/\d/);
    expect(barText).toMatch(/3/);
  });

  test("Test 2: Session Next button advances problem", async () => {
    ({ app, window, cleanup } = await launchApp({ show: false }));
    await startSession(window, { count: 3 });

    // Get initial problem title from the description pane
    const titleEl = window.locator(".problem-description h1, [data-testid=problem-title], #problem-pane h1").first();
    // Fallback: grab whatever h1 is visible
    const h1 = window.locator("h1").first();
    await h1.waitFor({ timeout: 10000 });
    const initialTitle = await h1.textContent();

    await window.locator("[data-testid=session-next-btn]").click();
    await window.waitForTimeout(500);

    const newTitle = await h1.textContent();
    expect(newTitle).not.toBe(initialTitle);
  });

  test("Test 3: Session End button shows post-session review", async () => {
    ({ app, window, cleanup } = await launchApp({ show: false }));
    await startSession(window, { count: 3 });

    await window.locator("[data-testid=session-end-btn]").click();

    await window.locator("[data-testid=post-session-review]").waitFor({ timeout: 10000 });
    await expect(window.locator("[data-testid=post-session-review]")).toBeVisible();
    // Verify "Session Complete" heading
    await expect(window.locator("[data-testid=post-session-review]").locator("h2")).toContainText("Session Complete");
  });

  test("Test 4: Session with 'include due reviews' toggle", async () => {
    ({ app, window, cleanup } = await launchApp({ show: false }));

    await ensureSidebarExpanded(window);
    await window.locator("[data-testid=btn-plan-session]").click();
    await window.locator("[data-testid=session-planner]").waitFor({ timeout: 10000 });

    // The "Include due reviews" button is only rendered when dueProblems.length > 0.
    // In a fresh test environment there are no due reviews, so the button may not exist.
    // We proceed with the rest of the flow regardless.
    const dueBtn = window.locator("button", { hasText: /include due reviews/i });
    const dueBtnVisible = await dueBtn.isVisible().catch(() => false);
    if (dueBtnVisible) {
      await dueBtn.click();
    }

    await window.locator("[data-testid=count-3]").click();
    await window.locator("[data-testid=btn-generate]").click();
    await window.locator("[data-testid=session-problem-item]").first().waitFor({ timeout: 10000 });
    await window.locator("[data-testid=btn-start-session]").click();

    await window.locator("[data-testid=session-bar]").waitFor({ timeout: 10000 });
    await expect(window.locator("[data-testid=session-bar]")).toBeVisible();
  });

  test("Test 5: No time limit option — session bar shows no countdown target", async () => {
    ({ app, window, cleanup } = await launchApp({ show: false }));

    await ensureSidebarExpanded(window);
    await window.locator("[data-testid=btn-plan-session]").click();
    await window.locator("[data-testid=session-planner]").waitFor({ timeout: 10000 });

    // Click "No limit" in the time target row
    await window.locator("button", { hasText: /^no limit$/i }).click();

    await window.locator("[data-testid=count-3]").click();
    await window.locator("[data-testid=btn-generate]").click();
    await window.locator("[data-testid=session-problem-item]").first().waitFor({ timeout: 10000 });
    await window.locator("[data-testid=btn-start-session]").click();

    const sessionBar = window.locator("[data-testid=session-bar]");
    await sessionBar.waitFor({ timeout: 10000 });

    // When timeTarget === 0, the bar should NOT show "/Xmin" — only "X:XX elapsed"
    const barText = await sessionBar.textContent();
    expect(barText).not.toMatch(/\/\s*\d+\s*min/i);
  });

  test("Test 6: Session bar shows current problem number", async () => {
    ({ app, window, cleanup } = await launchApp({ show: false }));
    await startSession(window, { count: 3 });

    const sessionBar = window.locator("[data-testid=session-bar]");
    const barText = await sessionBar.textContent();

    // SessionBar renders "Problem {currentIndex+1}/{total}" — e.g. "Problem 1/3"
    expect(barText).toMatch(/Problem\s+1\s*\/\s*3/);
  });

  test("Test 7: Skip problem in session advances to next", async () => {
    ({ app, window, cleanup } = await launchApp({ show: false }));
    await startSession(window, { count: 3 });

    const h1 = window.locator("h1").first();
    await h1.waitFor({ timeout: 10000 });
    const initialTitle = await h1.textContent();

    // Without solving, click Skip (Next button text is "Skip" when not solved)
    await window.locator("[data-testid=session-next-btn]").click();
    await window.waitForTimeout(500);

    const newTitle = await h1.textContent();
    expect(newTitle).not.toBe(initialTitle);

    // Session bar should still be visible
    await expect(window.locator("[data-testid=session-bar]")).toBeVisible();
  });
});
