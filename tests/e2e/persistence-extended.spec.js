const { test, expect } = require("@playwright/test");
const {
  launchAppWithPersistence,
  setEditorValue,
  ensureSidebarExpanded,
  submitCorrectSolution,
} = require("./helpers");

test.describe("Data Persistence — Extended", () => {
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

  // Test 1: 2 flagged problems persist — verify count AND queue items visible
  test("Two flagged problems: count and items persist after restart", async () => {
    // Flag first problem
    await window.locator("[data-testid=problem-item]").first().click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(1000);
    await window.locator("[data-testid=review-flag]").waitFor({ timeout: 5000 });
    await window.locator("[data-testid=review-flag]").click();
    await window.waitForTimeout(800);

    // Flag second problem
    await window.locator("[data-testid=problem-item]").nth(1).click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(1000);
    await window.locator("[data-testid=review-flag]").waitFor({ timeout: 5000 });
    await window.locator("[data-testid=review-flag]").click();
    await window.waitForTimeout(800);

    const countBefore = await window.locator("[data-testid=review-queue-item]").count();
    expect(countBefore).toBeGreaterThanOrEqual(2);

    await doRelaunch();

    // Verify count persists
    const reviewItems = window.locator("[data-testid=review-queue-item]");
    await reviewItems.first().waitFor({ timeout: 10000 });
    const countAfter = await reviewItems.count();
    expect(countAfter).toBe(countBefore);

    // Verify items are visible (not empty)
    const firstItemText = await reviewItems.first().textContent();
    const secondItemText = await reviewItems.nth(1).textContent();
    expect(firstItemText.length).toBeGreaterThan(0);
    expect(secondItemText.length).toBeGreaterThan(0);
  });

  // Test 2: Multiple problems' editor code persists — 3 problems, all saved and re-loadable
  test("Editor code for 3 different problems persists independently", async () => {
    const markers = [
      `marker-problem-0-${Date.now()}`,
      `marker-problem-1-${Date.now()}`,
      `marker-problem-2-${Date.now()}`,
    ];

    // Write unique code to first 3 problems
    for (let i = 0; i < 3; i++) {
      await window.locator("[data-testid=problem-item]").nth(i).click();
      await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
      await window.waitForTimeout(2000);
      await setEditorValue(window, `# ${markers[i]}\ndef solution_${i}(): pass`);
      await window.waitForTimeout(800);
    }

    await doRelaunch();

    // Verify each problem's code persisted
    for (let i = 0; i < 3; i++) {
      await window.locator("[data-testid=problem-item]").nth(i).click();
      await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
      await window.waitForTimeout(2000);

      const code = await window.evaluate(() => {
        if (typeof window.__testGetCode === "function") return window.__testGetCode();
        return null;
      });
      expect(code).toBeTruthy();
      expect(code).toContain(markers[i]);
    }
  });

  // Test 3: Editor code for problem A persists after: write A, navigate to B, restart, navigate back to A
  test("Editor code for problem A persists after navigation to B and restart", async () => {
    const codeA = `# problem-A-marker-${Date.now()}\ndef solution(): return "A"`;
    const codeB = `# problem-B-marker-${Date.now()}\ndef solution(): return "B"`;

    // Write code in problem A (first problem)
    await window.locator("[data-testid=problem-item]").first().click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(2000);
    await setEditorValue(window, codeA);
    await window.waitForTimeout(1000);

    // Navigate to problem B (second problem) and write code
    await window.locator("[data-testid=problem-item]").nth(1).click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(2000);
    await setEditorValue(window, codeB);
    await window.waitForTimeout(1000);

    await doRelaunch();

    // Navigate back to problem A
    await window.locator("[data-testid=problem-item]").first().click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(2000);

    const codeAfter = await window.evaluate(() => {
      if (typeof window.__testGetCode === "function") return window.__testGetCode();
      return null;
    });
    expect(codeAfter).toBeTruthy();
    expect(codeAfter).toContain("problem-A-marker-");
  });

  // Test 4: Editor code for problem B also persists independently
  test("Editor code for problems A and B stored independently and both persist", async () => {
    const markerA = `persist-A-${Date.now()}`;
    const markerB = `persist-B-${Date.now()}`;

    // Write code in problem A
    await window.locator("[data-testid=problem-item]").first().click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(2000);
    await setEditorValue(window, `# ${markerA}\ndef f(): pass`);
    await window.waitForTimeout(1000);

    // Write code in problem B
    await window.locator("[data-testid=problem-item]").nth(1).click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(2000);
    await setEditorValue(window, `# ${markerB}\ndef g(): pass`);
    await window.waitForTimeout(1000);

    await doRelaunch();

    // Check problem B code persisted
    await window.locator("[data-testid=problem-item]").nth(1).click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(2000);

    const codeBAfter = await window.evaluate(() => {
      if (typeof window.__testGetCode === "function") return window.__testGetCode();
      return null;
    });
    expect(codeBAfter).toBeTruthy();
    expect(codeBAfter).toContain(markerB);

    // Check problem A code also persisted
    await window.locator("[data-testid=problem-item]").first().click();
    await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
    await window.waitForTimeout(2000);

    const codeAAfter = await window.evaluate(() => {
      if (typeof window.__testGetCode === "function") return window.__testGetCode();
      return null;
    });
    expect(codeAAfter).toBeTruthy();
    expect(codeAAfter).toContain(markerA);
  });
});
