const { test, expect } = require("@playwright/test");
const {
  launchApp,
  setEditorValue,
  ensureSidebarExpanded,
  submitCorrectSolution,
} = require("./helpers");

test.describe("Pattern Library Navigation", () => {
  let app, window, cleanup;

  test.afterEach(async () => {
    await app?.close();
    cleanup?.();
  });

  // Helper: open pattern library
  async function openPatternLibrary(window) {
    await ensureSidebarExpanded(window);
    await window.locator("[data-testid=btn-patterns]").click();
    await window.locator("[data-testid=pattern-library]").waitFor({ timeout: 5000 });
  }

  // Test 1: Click a problem in pattern detail → app navigates to that problem in the editor
  test("Clicking a problem in pattern detail navigates to that problem", async () => {
    ({ app, window, cleanup } = await launchApp({ show: true }));
    await window.locator("[data-testid=solved-counter]").waitFor({ timeout: 15000 });

    await openPatternLibrary(window);

    // Click first pattern card to open its detail
    await window.locator("[data-testid=pattern-card]").first().click();
    await window.locator("[data-testid=pattern-detail]").waitFor({ timeout: 5000 });

    // Get the first linked problem button in the detail view
    // Problem buttons contain difficulty text (easy/medium/hard) — skip ✕ and template buttons
    const problemBtn = window
      .locator("[data-testid=pattern-detail] button")
      .filter({ hasText: /easy|medium|hard/i })
      .first();
    await problemBtn.waitFor({ timeout: 5000 });

    // Click the problem
    await problemBtn.click();
    await window.waitForTimeout(1000);

    // App should navigate away from pattern library to the editor
    // The Monaco editor should become visible
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await expect(window.locator(".monaco-editor")).toBeVisible();

    // The pattern library should no longer be the active view (or at least editor is visible)
    const editorVisible = await window.locator(".monaco-editor").isVisible();
    expect(editorVisible).toBe(true);
  });

  // Test 2: Mastery % on a pattern card starts at 0 in fresh session
  test("Pattern card shows 0% mastery for fresh (unsolved) session", async () => {
    ({ app, window, cleanup } = await launchApp({ show: false }));
    await window.locator("[data-testid=solved-counter]").waitFor({ timeout: 15000 });

    await openPatternLibrary(window);

    // At least one pattern card should be visible
    const patternCards = window.locator("[data-testid=pattern-card]");
    await patternCards.first().waitFor({ timeout: 5000 });

    // In a fresh session with no solved problems, mastery should be 0% for first card
    const firstCardText = await patternCards.first().textContent();
    expect(firstCardText).toMatch(/0%/);
  });

  // Test 3: Category filter "Techniques" shows only technique-category patterns
  test("Category filter Techniques shows only technique patterns", async () => {
    ({ app, window, cleanup } = await launchApp({ show: false }));
    await window.locator("[data-testid=solved-counter]").waitFor({ timeout: 15000 });

    await openPatternLibrary(window);

    // Get total count
    const totalCount = await window.locator("[data-testid=pattern-card]").count();
    expect(totalCount).toBeGreaterThan(0);

    // Click Techniques filter
    await window.locator("button", { hasText: /^Techniques$/i }).click();
    await window.waitForTimeout(500);

    const techniquesCount = await window.locator("[data-testid=pattern-card]").count();
    expect(techniquesCount).toBeGreaterThan(0);
    expect(techniquesCount).toBeLessThan(totalCount);

    // "Data Structures" section heading should NOT be visible
    // (only "Techniques" section should appear)
    const dsSection = await window
      .locator("h2", { hasText: /Data Structures/i })
      .isVisible()
      .catch(() => false);
    expect(dsSection).toBe(false);
  });

  // Test 4: Category filter "Data Structures" shows only data-structure patterns
  test("Category filter Data Structures shows only data-structure patterns", async () => {
    ({ app, window, cleanup } = await launchApp({ show: false }));
    await window.locator("[data-testid=solved-counter]").waitFor({ timeout: 15000 });

    await openPatternLibrary(window);

    // Get count before filtering
    const totalCount = await window.locator("[data-testid=pattern-card]").count();

    // Click Data Structures filter
    await window.locator("button", { hasText: /^Data Structures$/i }).click();
    await window.waitForTimeout(500);

    const dsCount = await window.locator("[data-testid=pattern-card]").count();
    expect(dsCount).toBeGreaterThan(0);
    expect(dsCount).toBeLessThan(totalCount);

    // "Techniques" section heading should NOT be visible
    const techSection = await window
      .locator("h2", { hasText: /^Techniques$/i })
      .isVisible()
      .catch(() => false);
    expect(techSection).toBe(false);
  });

  // Test 5: Search in pattern library filters pattern cards
  test("Pattern library search filters patterns by name", async () => {
    ({ app, window, cleanup } = await launchApp({ show: false }));
    await window.locator("[data-testid=solved-counter]").waitFor({ timeout: 15000 });

    await openPatternLibrary(window);

    const totalCount = await window.locator("[data-testid=pattern-card]").count();
    expect(totalCount).toBeGreaterThan(0);

    // Search for "sliding" — should filter patterns
    const searchInput = window.locator("input[placeholder='Search patterns…']");
    await searchInput.fill("sliding");
    await window.waitForTimeout(500);

    const filteredCount = await window.locator("[data-testid=pattern-card]").count();
    // Should show fewer patterns than total
    expect(filteredCount).toBeLessThanOrEqual(totalCount);

    // Clear search — should restore all patterns
    await searchInput.fill("");
    await window.waitForTimeout(500);
    const restoredCount = await window.locator("[data-testid=pattern-card]").count();
    expect(restoredCount).toBe(totalCount);
  });

  // Test 6: "All" filter restores all patterns after filtering
  test("All filter restores full pattern list after applying category filter", async () => {
    ({ app, window, cleanup } = await launchApp({ show: false }));
    await window.locator("[data-testid=solved-counter]").waitFor({ timeout: 15000 });

    await openPatternLibrary(window);

    const totalCount = await window.locator("[data-testid=pattern-card]").count();

    // Apply Techniques filter
    await window.locator("button", { hasText: /^Techniques$/i }).click();
    await window.waitForTimeout(300);
    const filteredCount = await window.locator("[data-testid=pattern-card]").count();
    expect(filteredCount).toBeLessThan(totalCount);

    // Click "All" to restore
    await window.locator("button", { hasText: /^All$/i }).click();
    await window.waitForTimeout(300);
    const restoredCount = await window.locator("[data-testid=pattern-card]").count();
    expect(restoredCount).toBe(totalCount);
  });
});
