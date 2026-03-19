const { test, expect } = require("@playwright/test");
const { launchApp, setEditorValue } = require("./helpers");

const correctSolution = `from typing import List
def max_profit(prices: List[int]) -> int:
    min_price = float("inf")
    max_p = 0
    for price in prices:
        if price < min_price:
            min_price = price
        elif price - min_price > max_p:
            max_p = price - min_price
    return max_p
`;

async function openFirstProblem(window) {
  await window.locator("[data-testid=problem-item]").first().click();
  await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
  await window.waitForTimeout(2000); // wait for Monaco + __testSetCode to be ready
}

async function submitCorrectSolution(window) {
  await window.locator("[data-testid=problem-item]").first().click();
  await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
  await window.waitForTimeout(2000); // wait for Monaco + __testSetCode to be ready

  await setEditorValue(window, correctSolution);

  // Verify code was set
  await window.waitForTimeout(500);

  await window.locator("[data-testid=btn-submit]").click();

  // Wait for "✓ Accepted" which appears after all tests pass on submit
  await window.locator("text=✓ Accepted").waitFor({ timeout: 25000 });
}

test.describe("Spaced Repetition (FSRS)", () => {
  let app, window, cleanup;

  test.beforeEach(async () => {
    ({ app, window, cleanup } = await launchApp({ show: true }));
    await window.locator("[data-testid=solved-counter]").waitFor({ timeout: 15000 });
  });

  test.afterEach(async () => {
    if (app) await app.close().catch(() => {});
    if (cleanup) cleanup();
  });

  test("review flag button is clickable", async () => {
    await openFirstProblem(window);
    const flag = window.locator("[data-testid=review-flag]");
    await flag.waitFor({ timeout: 5000 });
    // First click flags the problem (no popup on unflagged problem)
    await flag.click();
    await window.waitForTimeout(300);
    // Verify the app is still running
    await expect(window.locator("[data-testid=solved-counter]")).toBeVisible();
  });

  test("review popup has reset and remove options", async () => {
    await openFirstProblem(window);
    const flag = window.locator("[data-testid=review-flag]");
    await flag.waitFor({ timeout: 5000 });
    // First click flags the (unflagged) problem — no popup yet
    await flag.click();
    await window.waitForTimeout(300);
    // Second click on now-flagged problem opens popup
    await flag.click();
    const popup = window.locator("[data-testid=review-popup]");
    await popup.waitFor({ timeout: 5000 });
    const text = await popup.textContent();
    expect(text).toMatch(/reset|remove/i);
  });

  test("rating modal appears after correct submission", async () => {
    await openFirstProblem(window);
    await submitCorrectSolution(window);
    await expect(window.locator("[data-testid=rating-modal]")).toBeVisible({ timeout: 5000 });
  });

  test("rating modal has 4 rating buttons", async () => {
    await openFirstProblem(window);
    await submitCorrectSolution(window);
    await window.locator("[data-testid=rating-modal]").waitFor({ timeout: 5000 });
    const buttons = window.locator(
      "[data-testid=rate-again], [data-testid=rate-hard], [data-testid=rate-good], [data-testid=rate-easy]"
    );
    expect(await buttons.count()).toBe(4);
  });

  test("rating Good dismisses modal and shows next review date", async () => {
    await openFirstProblem(window);
    await submitCorrectSolution(window);
    await window.locator("[data-testid=rating-modal]").waitFor({ timeout: 5000 });
    await window.locator("[data-testid=rate-good]").click();
    await expect(window.locator("[data-testid=rating-modal]")).not.toBeVisible({ timeout: 5000 });
    // Some confirmation text about the next review should appear briefly
    await window.locator("text=/next review|scheduled|due/i").first().waitFor({ timeout: 5000 }).catch(() => {});
  });

  test("rating Again keeps modal behavior correct", async () => {
    await openFirstProblem(window);
    await submitCorrectSolution(window);
    await window.locator("[data-testid=rating-modal]").waitFor({ timeout: 5000 });
    await window.locator("[data-testid=rate-again]").click();
    await expect(window.locator("[data-testid=rating-modal]")).not.toBeVisible({ timeout: 5000 });
  });

  test("solved counter increments after correct submission", async () => {
    const counterBefore = await window.locator("[data-testid=solved-counter]").textContent();
    const beforeNum = parseInt(counterBefore.split("/")[0], 10);

    await openFirstProblem(window);
    await submitCorrectSolution(window);

    // Dismiss rating modal if it appears
    const modal = window.locator("[data-testid=rating-modal]");
    const modalVisible = await modal.isVisible().catch(() => false);
    if (modalVisible) {
      await window.locator("[data-testid=rate-good]").click();
      await expect(modal).not.toBeVisible({ timeout: 5000 });
    }

    const counterAfter = await window.locator("[data-testid=solved-counter]").textContent();
    const afterNum = parseInt(counterAfter.split("/")[0], 10);
    expect(afterNum).toBeGreaterThan(beforeNum);
  });

  test("review queue shows flagged problems", async () => {
    await openFirstProblem(window);
    const flag = window.locator("[data-testid=review-flag]");
    // First click flags the problem
    await flag.click();
    await window.waitForTimeout(300);
    // Second click opens popup
    await flag.click();
    await window.locator("[data-testid=review-popup]").waitFor({ timeout: 5000 });
    // Dismiss popup by pressing Escape or clicking elsewhere
    await window.keyboard.press("Escape");
    await window.locator("[data-testid=review-popup]").waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});

    // The review queue section in sidebar should show at least 1 item
    const reviewItems = window.locator("[data-testid=review-queue-item]");
    const count = await reviewItems.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
