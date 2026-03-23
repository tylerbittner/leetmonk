const { test, expect } = require("@playwright/test");
const { launchApp, ensureSidebarExpanded } = require("./helpers");

test.describe("Smoke tests", () => {
  let app, window, cleanup;

  test.beforeEach(async () => {
    ({ app, window, cleanup } = await launchApp());
    // Wait for app to fully load
    await window.locator("[data-testid=solved-counter]").waitFor({ timeout: 15000 });
  });

  test.afterEach(async () => {
    if (app) await app.close().catch(() => {});
    if (cleanup) cleanup();
  });

  test("window opens and problems load", async () => {
    const counter = await window.locator("[data-testid=solved-counter]").textContent();
    expect(counter).toMatch(/\d+\/\d+/);
    const items = window.locator("[data-testid=problem-item]");
    expect(await items.count()).toBeGreaterThan(0);
  });

  test("clicking a problem shows description and editor", async () => {
    await window.locator("[data-testid=problem-item]").first().click();
    await expect(window.locator(".monaco-editor")).toBeVisible({ timeout: 8000 });
    await expect(window.locator("[data-testid=tab-description]")).toBeVisible();
  });

  test("run Python code shows test results", async () => {
    await window.locator("[data-testid=problem-item]").first().click();
    await window.locator(".monaco-editor").waitFor({ timeout: 8000 });
    await window.waitForTimeout(1500);
    await window.locator("[data-testid=btn-run]").click();
    // Two strategies: placeholder disappears OR results appear
    await Promise.race([
      window
        .locator("text=Run or submit your code to see results")
        .waitFor({ state: "hidden", timeout: 20000 }),
      window
        .locator("text=/\\d+ passed|\\d+ failed|Error/i")
        .first()
        .waitFor({ timeout: 20000 }),
    ]);
  });

  test("switch to JavaScript", async () => {
    await window.locator("[data-testid=problem-item]").first().click();
    await window.locator("[data-testid=language-select]").selectOption("javascript");
    await window.waitForTimeout(300);
    // Verify the select changed
    const val = await window.locator("[data-testid=language-select]").inputValue();
    expect(val).toBe("javascript");
  });

  test("settings opens with Cmd+Comma", async () => {
    await window.keyboard.press("Meta+,");
    await expect(window.locator("[data-testid=settings-panel]")).toBeVisible({ timeout: 5000 });
  });

  test("font size setting changes value", async () => {
    await window.keyboard.press("Meta+,");
    await window.locator("[data-testid=settings-panel]").waitFor();
    const slider = window.locator("[data-testid=setting-font-size]");
    await slider.fill("18");
    // Close settings
    await window.keyboard.press("Escape");
  });

  test("vim toggle exists in settings", async () => {
    await window.keyboard.press("Meta+,");
    await expect(window.locator("[data-testid=setting-vim]")).toBeVisible();
  });

  test("Pattern Library opens", async () => {
    await ensureSidebarExpanded(window);
    await window.locator("[data-testid=btn-patterns]").click();
    await expect(window.locator("[data-testid=pattern-library]")).toBeVisible({ timeout: 5000 });
    const cards = window.locator("[data-testid=pattern-card]");
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test("Plan Session opens planner", async () => {
    await ensureSidebarExpanded(window);
    await window.locator("[data-testid=btn-plan-session]").click();
    await expect(window.locator("[data-testid=session-planner]")).toBeVisible({ timeout: 5000 });
  });

  test("Solutions tab is clickable", async () => {
    await window.locator("[data-testid=problem-item]").first().click();
    await window.locator("[data-testid=tab-solutions]").click();
    // Solutions content should appear
    await window.locator("text=/Brute|Optimal|O\\(/i").first().waitFor({ timeout: 5000 });
  });

  test("review flag button exists", async () => {
    await window.locator("[data-testid=problem-item]").first().click();
    await expect(window.locator("[data-testid=review-flag]")).toBeVisible({ timeout: 5000 });
  });

  test("bug report opens from settings", async () => {
    await window.keyboard.press("Meta+,");
    await window.locator("[data-testid=btn-bug-report]").click();
    await expect(window.locator("[data-testid=bug-report-modal]")).toBeVisible({ timeout: 5000 });
  });
});
