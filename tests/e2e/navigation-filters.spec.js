const { test, expect } = require("@playwright/test");
const { launchApp } = require("./helpers");

test.describe("Navigation, Filtering, and Pattern Library", () => {
  let app, window;

  test.beforeEach(async () => {
    ({ app, window } = await launchApp());
    await window.locator("[data-testid=solved-counter]").waitFor({ timeout: 15000 });
  });

  test.afterEach(async () => {
    if (app) await app.close().catch(() => {});
  });

  test("problem list shows 86 problems", async () => {
    const count = await window.locator("[data-testid=problem-item]").count();
    expect(count).toBe(86);
  });

  test("filter by Easy shows only easy problems", async () => {
    const diffSelect = window.locator("[data-testid=sidebar] select").first();
    await diffSelect.selectOption("easy");
    await window.waitForTimeout(500);
    const count = await window.locator("[data-testid=problem-item]").count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(86);
  });

  test("filter by Hard shows fewer problems", async () => {
    const diffSelect = window.locator("[data-testid=sidebar] select").first();
    await diffSelect.selectOption("hard");
    await window.waitForTimeout(500);
    const count = await window.locator("[data-testid=problem-item]").count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(86);
  });

  test("search filters by problem title", async () => {
    const searchInput = window.locator("input[placeholder='Search problems']");
    await searchInput.fill("Two Sum");
    await window.waitForTimeout(500);
    const count = await window.locator("[data-testid=problem-item]").count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(3);
  });

  test("clearing search restores all problems", async () => {
    const searchInput = window.locator("input[placeholder='Search problems']");
    await searchInput.fill("Two Sum");
    await window.waitForTimeout(500);
    await searchInput.fill("");
    await window.waitForTimeout(500);
    const count = await window.locator("[data-testid=problem-item]").count();
    expect(count).toBe(86);
  });

  test("sidebar collapse hides problem list", async () => {
    const collapseBtn = window.locator("[data-testid=sidebar] button", { hasText: "‹" });
    await collapseBtn.click();
    await window.waitForTimeout(300);
    const sidebar = window.locator("[data-testid=sidebar]");
    const box = await sidebar.boundingBox();
    const isHidden = !box || box.width < 10;
    const itemsVisible = await window.locator("[data-testid=problem-item]").first().isVisible().catch(() => false);
    expect(isHidden || !itemsVisible).toBe(true);
  });

  test("sidebar expand shows problem list", async () => {
    const collapseBtn = window.locator("[data-testid=sidebar] button", { hasText: "‹" });
    await collapseBtn.click();
    await window.waitForTimeout(300);
    const expandBtn = window.locator("button", { hasText: "›" });
    await expandBtn.click();
    await window.waitForTimeout(300);
    const firstItem = window.locator("[data-testid=problem-item]").first();
    await expect(firstItem).toBeVisible({ timeout: 5000 });
  });

  test("Cmd+[ navigates to previous problem", async () => {
    const items = window.locator("[data-testid=problem-item]");
    await items.nth(1).click();
    await window.waitForTimeout(300);
    const descBefore = await window.locator("[data-testid=tab-description]").textContent().catch(() => "");
    await window.keyboard.press("Meta+[");
    await window.waitForTimeout(500);
    const descAfter = await window.locator("[data-testid=tab-description]").textContent().catch(() => "");
    // Either description text changed or first item is now active
    const firstActive = await items.first().evaluate((el) =>
      el.classList.contains("active") || el.getAttribute("aria-selected") === "true" ||
      el.style.fontWeight === "bold" || el.className.includes("selected") || el.className.includes("active")
    ).catch(() => false);
    expect(descBefore !== descAfter || firstActive).toBe(true);
  });

  test("Cmd+] navigates to next problem", async () => {
    const items = window.locator("[data-testid=problem-item]");
    await items.first().click();
    await window.waitForTimeout(300);
    const descBefore = await window.locator("[data-testid=tab-description]").textContent().catch(() => "");
    await window.keyboard.press("Meta+]");
    await window.waitForTimeout(500);
    const descAfter = await window.locator("[data-testid=tab-description]").textContent().catch(() => "");
    const secondActive = await items.nth(1).evaluate((el) =>
      el.classList.contains("active") || el.getAttribute("aria-selected") === "true" ||
      el.className.includes("selected") || el.className.includes("active")
    ).catch(() => false);
    expect(descBefore !== descAfter || secondActive).toBe(true);
  });

  test("pattern library shows 22+ patterns", async () => {
    await window.locator("[data-testid=btn-patterns]").click();
    await window.locator("[data-testid=pattern-library]").waitFor({ timeout: 5000 });
    const count = await window.locator("[data-testid=pattern-card]").count();
    expect(count).toBeGreaterThanOrEqual(22);
  });

  test("clicking pattern card shows detail", async () => {
    await window.locator("[data-testid=btn-patterns]").click();
    await window.locator("[data-testid=pattern-library]").waitFor({ timeout: 5000 });
    await window.locator("[data-testid=pattern-card]").first().click();
    await window.waitForTimeout(500);
    const detail = window.locator("text=/When to use|template|complexity|example/i").first();
    await expect(detail).toBeVisible({ timeout: 5000 });
  });

  test("diff view opens after viewing solutions", async () => {
    await window.locator("[data-testid=problem-item]").first().click();
    await window.locator("[data-testid=tab-solutions]").click();
    await window.locator("text=/Brute|Optimal|O\\(/i").first().waitFor({ timeout: 8000 });
    await window.locator("[data-testid=btn-diff]").click();
    await expect(window.locator("[data-testid=diff-view]")).toBeVisible({ timeout: 5000 });
  });

  test("diff view close button works", async () => {
    await window.locator("[data-testid=problem-item]").first().click();
    await window.locator("[data-testid=tab-solutions]").click();
    await window.locator("text=/Brute|Optimal|O\\(/i").first().waitFor({ timeout: 8000 });
    await window.locator("[data-testid=btn-diff]").click();
    await window.locator("[data-testid=diff-view]").waitFor({ timeout: 5000 });
    await window.locator("[data-testid=btn-close-diff]").click();
    await window.waitForTimeout(300);
    await expect(window.locator("[data-testid=diff-view]")).not.toBeVisible();
    await expect(window.locator(".monaco-editor")).toBeVisible({ timeout: 5000 });
  });

  test("solution selector appears when multiple solutions exist", async () => {
    await window.locator("[data-testid=problem-item]").first().click();
    await window.locator("[data-testid=tab-solutions]").click();
    await window.locator("text=/Brute|Optimal|O\\(/i").first().waitFor({ timeout: 8000 });
    await window.locator("[data-testid=btn-diff]").click();
    await window.locator("[data-testid=diff-view]").waitFor({ timeout: 5000 });
    const selector = window.locator("[data-testid=diff-view] select, [data-testid=solution-select]");
    const count = await selector.count();
    expect(count).toBeGreaterThan(0);
  });

  test("hints tab shows hints", async () => {
    await window.locator("[data-testid=problem-item]").first().click();
    await window.locator("[data-testid=tab-hints]").click();
    await window.waitForTimeout(500);
    const hintContent = window.locator("text=/hint|Hint|tip|Tip|\\d+\\./i").first();
    await expect(hintContent).toBeVisible({ timeout: 5000 });
  });
});
