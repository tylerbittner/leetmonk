const { test, expect } = require("@playwright/test");
const { launchApp, ensureSidebarExpanded } = require("./helpers");

test.describe("FilterBar Edge Cases", () => {
  let app, window, cleanup;

  test.beforeEach(async () => {
    ({ app, window, cleanup } = await launchApp({ show: false }));
    await window.locator("[data-testid=solved-counter]").waitFor({ timeout: 15000 });
    await ensureSidebarExpanded(window);
  });

  test.afterEach(async () => {
    if (app) await app.close().catch(() => {});
    if (cleanup) cleanup();
  });

  // Test 1: Filter by Medium difficulty + Unsolved status simultaneously
  test("Difficulty and status filters work simultaneously", async () => {
    const diffSelect = window.locator("[data-testid=sidebar] select").first();
    const statusSelect = window.locator("[data-testid=sidebar] select").nth(1);

    // Get count with only difficulty filter
    await diffSelect.selectOption("medium");
    await window.waitForTimeout(500);
    const mediumCount = await window.locator("[data-testid=problem-item]").count();
    expect(mediumCount).toBeGreaterThan(0);

    // Add status filter — unsolved (all are unsolved in fresh session)
    await statusSelect.selectOption("unsolved");
    await window.waitForTimeout(500);
    const mediumUnsolvedCount = await window.locator("[data-testid=problem-item]").count();
    // In a fresh session all problems are unsolved, so count should equal mediumCount
    expect(mediumUnsolvedCount).toBeLessThanOrEqual(mediumCount);

    // Switch status to "solved" — count should drop to 0 (nothing solved)
    await statusSelect.selectOption("solved");
    await window.waitForTimeout(500);
    const mediumSolvedCount = await window.locator("[data-testid=problem-item]").count();
    // In a fresh session, no problems are solved
    expect(mediumSolvedCount).toBe(0);
  });

  // Test 2: Filter persists after navigating to a problem and back
  test("Difficulty filter persists after clicking a problem item", async () => {
    const diffSelect = window.locator("[data-testid=sidebar] select").first();

    // Apply Easy filter
    await diffSelect.selectOption("easy");
    await window.waitForTimeout(500);
    const filteredCount = await window.locator("[data-testid=problem-item]").count();
    expect(filteredCount).toBeGreaterThan(0);

    // Click first visible problem item
    await window.locator("[data-testid=problem-item]").first().click();
    await window.waitForTimeout(500);

    // Filter should still be "easy"
    const currentValue = await diffSelect.inputValue();
    expect(currentValue).toBe("easy");

    // Problem count should remain filtered
    const countAfterNav = await window.locator("[data-testid=problem-item]").count();
    expect(countAfterNav).toBe(filteredCount);
  });

  // Test 3: Search + difficulty filter combined shows subset of each
  test("Search and difficulty filter combined narrows results", async () => {
    const searchInput = window.locator("input[placeholder='Search problems\u2026']");
    const diffSelect = window.locator("[data-testid=sidebar] select").first();

    // Get baseline counts
    const totalCount = await window.locator("[data-testid=problem-item]").count();

    // Apply search only
    await searchInput.fill("sum");
    await window.waitForTimeout(500);
    const searchOnlyCount = await window.locator("[data-testid=problem-item]").count();
    expect(searchOnlyCount).toBeGreaterThan(0);
    expect(searchOnlyCount).toBeLessThan(totalCount);

    // Apply difficulty filter on top of search
    await diffSelect.selectOption("easy");
    await window.waitForTimeout(500);
    const combinedCount = await window.locator("[data-testid=problem-item]").count();
    // Combined filter should be at most as many as search-only
    expect(combinedCount).toBeLessThanOrEqual(searchOnlyCount);
  });

  // Test 4: Clearing difficulty filter restores all problems (respecting search)
  test("Resetting difficulty to All restores full count", async () => {
    const diffSelect = window.locator("[data-testid=sidebar] select").first();

    const totalCount = await window.locator("[data-testid=problem-item]").count();

    // Apply filter
    await diffSelect.selectOption("hard");
    await window.waitForTimeout(500);
    const hardCount = await window.locator("[data-testid=problem-item]").count();
    expect(hardCount).toBeLessThan(totalCount);

    // Reset to all
    await diffSelect.selectOption("all");
    await window.waitForTimeout(500);
    const restoredCount = await window.locator("[data-testid=problem-item]").count();
    expect(restoredCount).toBe(totalCount);
  });

  // Test 5: Status filter "Unsolved" shows all problems in fresh session
  test("Status filter Unsolved shows all problems in fresh session", async () => {
    const statusSelect = window.locator("[data-testid=sidebar] select").nth(1);
    const totalCount = await window.locator("[data-testid=problem-item]").count();

    // Select "unsolved" — in a fresh session, all problems are unsolved
    await statusSelect.selectOption("unsolved");
    await window.waitForTimeout(500);
    const unsolvedCount = await window.locator("[data-testid=problem-item]").count();
    expect(unsolvedCount).toBe(totalCount);

    // Select "solved" — in a fresh session, no problems are solved
    await statusSelect.selectOption("solved");
    await window.waitForTimeout(500);
    const solvedCount = await window.locator("[data-testid=problem-item]").count();
    expect(solvedCount).toBe(0);

    // Reset to all — full count restored
    await statusSelect.selectOption("all");
    await window.waitForTimeout(500);
    const allCount = await window.locator("[data-testid=problem-item]").count();
    expect(allCount).toBe(totalCount);
  });

  // Test 6: Clearing search restores problems filtered by difficulty (not all problems)
  test("Clearing search respects active difficulty filter", async () => {
    const searchInput = window.locator("input[placeholder='Search problems\u2026']");
    const diffSelect = window.locator("[data-testid=sidebar] select").first();

    // Apply difficulty filter first
    await diffSelect.selectOption("easy");
    await window.waitForTimeout(500);
    const easyCount = await window.locator("[data-testid=problem-item]").count();
    expect(easyCount).toBeGreaterThan(0);

    // Add search to further narrow
    await searchInput.fill("xxx-no-match-yyy");
    await window.waitForTimeout(500);
    const noMatchCount = await window.locator("[data-testid=problem-item]").count();
    expect(noMatchCount).toBe(0);

    // Clear search — should restore "easy" filtered count (not all problems)
    await searchInput.fill("");
    await window.waitForTimeout(500);
    const afterClearCount = await window.locator("[data-testid=problem-item]").count();
    expect(afterClearCount).toBe(easyCount);
  });
});
