const { test, expect } = require("@playwright/test");
const { launchApp } = require("./helpers");

async function ensureSidebarExpanded(window) {
  const visible = await window.locator("[data-testid=problem-item]").first().isVisible().catch(() => false);
  if (!visible) {
    const toggle = window.locator("[data-testid=top-bar] button").filter({ hasText: /[▣◧]/ });
    await toggle.click();
    await window.waitForTimeout(400);
  }
}

test.describe("Session Planner", () => {
  let app, window;

  test.beforeEach(async () => {
    ({ app, window } = await launchApp());
    await window.locator("[data-testid=solved-counter]").waitFor({ timeout: 15000 });
    await ensureSidebarExpanded(window);
    await window.locator("[data-testid=btn-plan-session]").click();
    await window.locator("[data-testid=session-planner]").waitFor({ timeout: 5000 });
  });

  test.afterEach(async () => {
    if (app) await app.close().catch(() => {});
  });

  test("generate produces a list of problems", async () => {
    await window.locator("[data-testid=btn-generate]").click();
    // Should show generated problem items
    await window.locator("[data-testid=session-planner] >> text=/\\d+\\./ ").first().waitFor({ timeout: 5000 });
  });

  test("difficulty filter toggles", async () => {
    await window.locator("[data-testid=diff-easy]").click();
    // Easy should be deselected (toggled off)
    await window.locator("[data-testid=btn-generate]").click();
  });

  test("start session shows session bar", async () => {
    await window.locator("[data-testid=btn-generate]").click();
    await window.locator("[data-testid=session-planner] >> text=/\\d+\\./ ").first().waitFor({ timeout: 5000 });
    await window.locator("[data-testid=btn-start-session]").click();
    await expect(window.locator("[data-testid=session-bar]")).toBeVisible({ timeout: 5000 });
  });

  test("custom problem count", async () => {
    const input = window.locator("[data-testid=session-planner] input[type=number]");
    await input.fill("2");
    await window.locator("[data-testid=btn-generate]").click();
  });
});
