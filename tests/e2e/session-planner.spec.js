const { test, expect } = require("@playwright/test");
const { launchApp } = require("./helpers");

test.describe("Session Planner", () => {
  let app, window;

  test.beforeEach(async () => {
    ({ app, window } = await launchApp());
    // Open planner before each test
    await window.locator('[data-testid="plan-session-btn"]').click();
    await expect(window.locator('[data-testid="session-planner"]')).toBeVisible({ timeout: 5000 });
  });

  test.afterEach(async () => {
    await app.close();
  });

  // 1. Generate problems
  test("generate produces a list of problems", async () => {
    await window.locator('[data-testid="generate-btn"]').click();
    await expect(window.locator('[data-testid="session-problem-item"]').first()).toBeVisible({ timeout: 5000 });
    const count = await window.locator('[data-testid="session-problem-item"]').count();
    expect(count).toBeGreaterThan(0);
  });

  // 2. Filter by difficulty
  test("filter by hard shows only hard problems", async () => {
    // Deselect easy and medium, keep hard
    await window.locator('[data-testid="difficulty-easy"]').uncheck();
    await window.locator('[data-testid="difficulty-medium"]').uncheck();
    await window.locator('[data-testid="difficulty-hard"]').check();
    await window.locator('[data-testid="generate-btn"]').click();
    await expect(window.locator('[data-testid="session-problem-item"]').first()).toBeVisible({ timeout: 5000 });
    const items = window.locator('[data-testid="session-problem-item"]');
    const count = await items.count();
    for (let i = 0; i < count; i++) {
      await expect(items.nth(i).locator('[data-testid="difficulty-badge"]')).toHaveText("hard", { ignoreCase: true });
    }
  });

  // 3. Filter by topic
  test("filter by topic shows matching problems", async () => {
    const topicSelect = window.locator('[data-testid="topic-filter"]');
    await topicSelect.selectOption("dynamic-programming");
    await window.locator('[data-testid="generate-btn"]').click();
    await expect(window.locator('[data-testid="session-problem-item"]').first()).toBeVisible({ timeout: 5000 });
    const items = window.locator('[data-testid="session-problem-item"]');
    const count = await items.count();
    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).textContent();
      // DP problems should have relevant tags shown somewhere
      expect(text.toLowerCase()).toContain("dynamic");
    }
  });

  // 4. Swap problem
  test("swap replaces a problem in the list", async () => {
    await window.locator('[data-testid="generate-btn"]').click();
    await expect(window.locator('[data-testid="session-problem-item"]').first()).toBeVisible({ timeout: 5000 });
    const firstBefore = await window.locator('[data-testid="session-problem-item"]').first().textContent();
    await window.locator('[data-testid="swap-btn"]').first().click();
    await window.waitForTimeout(500);
    const firstAfter = await window.locator('[data-testid="session-problem-item"]').first().textContent();
    expect(firstAfter).not.toEqual(firstBefore);
  });

  // 5. Remove problem
  test("remove decreases problem count", async () => {
    await window.locator('[data-testid="generate-btn"]').click();
    await expect(window.locator('[data-testid="session-problem-item"]').first()).toBeVisible({ timeout: 5000 });
    const countBefore = await window.locator('[data-testid="session-problem-item"]').count();
    await window.locator('[data-testid="remove-problem-btn"]').first().click();
    const countAfter = await window.locator('[data-testid="session-problem-item"]').count();
    expect(countAfter).toBe(countBefore - 1);
  });

  // 6. Start session
  test("starting session shows session bar", async () => {
    await window.locator('[data-testid="generate-btn"]').click();
    await expect(window.locator('[data-testid="session-problem-item"]').first()).toBeVisible({ timeout: 5000 });
    await window.locator('[data-testid="start-session-btn"]').click();
    await expect(window.locator('[data-testid="session-bar"]')).toBeVisible({ timeout: 5000 });
  });

  // 7. Session navigation
  test("Next button advances to next problem", async () => {
    await window.locator('[data-testid="generate-btn"]').click();
    await expect(window.locator('[data-testid="session-problem-item"]').first()).toBeVisible({ timeout: 5000 });
    await window.locator('[data-testid="start-session-btn"]').click();
    await expect(window.locator('[data-testid="session-bar"]')).toBeVisible({ timeout: 5000 });
    const titleBefore = await window.locator('[data-testid="problem-title"]').textContent();
    await window.locator('[data-testid="session-next-btn"]').click();
    await window.waitForTimeout(300);
    const titleAfter = await window.locator('[data-testid="problem-title"]').textContent();
    expect(titleAfter).not.toEqual(titleBefore);
  });

  // 8. End session
  test("ending session shows post-session review", async () => {
    await window.locator('[data-testid="generate-btn"]').click();
    await expect(window.locator('[data-testid="session-problem-item"]').first()).toBeVisible({ timeout: 5000 });
    await window.locator('[data-testid="start-session-btn"]').click();
    await expect(window.locator('[data-testid="session-bar"]')).toBeVisible({ timeout: 5000 });
    await window.locator('[data-testid="session-end-btn"]').click();
    await expect(window.locator('[data-testid="post-session-review"]')).toBeVisible({ timeout: 5000 });
  });

  // 9. Custom count
  test("custom problem count generates correct number", async () => {
    const countInput = window.locator('[data-testid="problem-count-input"]');
    await countInput.fill("3");
    await window.locator('[data-testid="generate-btn"]').click();
    await expect(window.locator('[data-testid="session-problem-item"]').first()).toBeVisible({ timeout: 5000 });
    const count = await window.locator('[data-testid="session-problem-item"]').count();
    expect(count).toBe(3);
  });

  // 10. No time limit
  test("no time limit option starts session without countdown", async () => {
    const timeLimitSelect = window.locator('[data-testid="time-limit-select"]');
    await timeLimitSelect.selectOption("none");
    await window.locator('[data-testid="generate-btn"]').click();
    await expect(window.locator('[data-testid="session-problem-item"]').first()).toBeVisible({ timeout: 5000 });
    await window.locator('[data-testid="start-session-btn"]').click();
    await expect(window.locator('[data-testid="session-bar"]')).toBeVisible({ timeout: 5000 });
    // No countdown timer in session bar
    await expect(window.locator('[data-testid="session-countdown"]')).toBeHidden();
  });
});
