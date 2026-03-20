const { test, expect } = require("@playwright/test");
const {
  launchAppWithPersistence,
  setEditorValue,
  ensureSidebarExpanded,
  submitCorrectSolution,
} = require("./helpers");

test.describe("Data persistence across restarts", () => {
  let app, window, relaunch, cleanup;

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

  test("solved count persists after restart", async () => {
    const counterText = await window.locator("[data-testid=solved-counter]").textContent();
    const beforeNum = parseInt(counterText.split("/")[0], 10);

    await submitCorrectSolution(window);

    // Dismiss rating modal if it appears
    const modal = window.locator("[data-testid=rating-modal]");
    const modalVisible = await modal.isVisible().catch(() => false);
    if (modalVisible) {
      await window.locator("[data-testid=rate-good]").click();
      await expect(modal).not.toBeVisible({ timeout: 5000 });
    }

    // Wait for counter to increment
    await window.waitForFunction(
      (before) => {
        const el = document.querySelector("[data-testid=solved-counter]");
        if (!el) return false;
        return parseInt(el.textContent.split("/")[0], 10) > before;
      },
      beforeNum,
      { timeout: 10000 }
    );

    const afterText = await window.locator("[data-testid=solved-counter]").textContent();
    const afterNum = parseInt(afterText.split("/")[0], 10);
    expect(afterNum).toBeGreaterThan(beforeNum);

    await doRelaunch();

    const persistedText = await window.locator("[data-testid=solved-counter]").textContent();
    const persistedNum = parseInt(persistedText.split("/")[0], 10);
    expect(persistedNum).toBe(afterNum);
  });

  test("editor code persists per problem", async () => {
    const uniqueCode = `# persistence-test-${Date.now()}\ndef solution(): pass`;

    await window.locator("[data-testid=problem-item]").first().click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(2000);
    await setEditorValue(window, uniqueCode);
    await window.waitForTimeout(1000); // let IPC write flush

    await doRelaunch();

    await window.locator("[data-testid=problem-item]").first().click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(2000);

    // __testGetCode reads editorState for the active problem
    const code = await window.evaluate(() => {
      if (typeof window.__testGetCode === "function") return window.__testGetCode();
      return null;
    });
    expect(code).toContain("persistence-test-");
  });

  test("settings persist across restart", async () => {
    await window.keyboard.press("Meta+,");
    await window.locator("[data-testid=settings-panel]").waitFor({ timeout: 5000 });

    const slider = window.locator("[data-testid=setting-font-size]");
    await slider.fill("17");
    await window.waitForTimeout(500); // let IPC save

    await window.keyboard.press("Escape");
    await window.waitForTimeout(300);

    await doRelaunch();

    await window.keyboard.press("Meta+,");
    await window.locator("[data-testid=settings-panel]").waitFor({ timeout: 5000 });

    const val = await window.locator("[data-testid=setting-font-size]").inputValue();
    expect(Number(val)).toBe(17);
  });

  test("progress status persists", async () => {
    await window.locator("[data-testid=problem-item]").first().click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(2000);

    // Typing code marks the problem as 'attempted'
    await setEditorValue(window, "def solution(): return 42");
    await window.waitForTimeout(500); // let IPC write flush

    await doRelaunch();

    // The first problem-item status dot should now show accent-yellow (attempted)
    const firstItem = window.locator("[data-testid=problem-item]").first();
    const dotStyle = await firstItem.locator("div").first().getAttribute("style");
    expect(dotStyle).toContain("accent-yellow");
  });

  test("review flag persists", async () => {
    await window.locator("[data-testid=problem-item]").first().click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(1000);

    const flag = window.locator("[data-testid=review-flag]");
    await flag.waitFor({ timeout: 5000 });
    await flag.click(); // flag the problem (unflagged → flagged)
    await window.waitForTimeout(800); // let IPC write flush

    await doRelaunch();

    // Review queue should still contain the flagged problem
    const reviewItems = window.locator("[data-testid=review-queue-item]");
    await expect(reviewItems.first()).toBeVisible({ timeout: 8000 });
  });

  test("SR state persists after rating", async () => {
    await submitCorrectSolution(window);

    // Rating modal should appear after a correct submission
    await window.locator("[data-testid=rating-modal]").waitFor({ timeout: 10000 });
    await window.locator("[data-testid=rate-good]").click();
    await expect(window.locator("[data-testid=rating-modal]")).not.toBeVisible({ timeout: 5000 });

    // Wait for confirmed state / auto-dismiss animation
    await window.waitForTimeout(2000);

    const counterBefore = await window.locator("[data-testid=solved-counter]").textContent();
    const solvedNum = parseInt(counterBefore.split("/")[0], 10);
    expect(solvedNum).toBeGreaterThan(0);

    await doRelaunch();

    // Confirm app loaded cleanly by opening settings
    await window.keyboard.press("Meta+,");
    await window.locator("[data-testid=settings-panel]").waitFor({ timeout: 5000 });
    await window.keyboard.press("Escape");

    // Solved counter must still reflect the rated problem
    const counterAfter = await window.locator("[data-testid=solved-counter]").textContent();
    const persistedSolved = parseInt(counterAfter.split("/")[0], 10);
    expect(persistedSolved).toBe(solvedNum);
  });
});
