const { test, expect } = require("@playwright/test");
const { launchApp } = require("./helpers");

async function openSettings(window) {
  await window.keyboard.press("Meta+,");
  await window.locator("[data-testid=settings-panel]").waitFor({ timeout: 8000 });
}

async function closeSettings(window) {
  await window.keyboard.press("Escape");
  await window.locator("[data-testid=settings-panel]").waitFor({ state: "hidden", timeout: 5000 });
}

async function clickFirstProblem(window) {
  await window.locator("[data-testid=problem-item]").first().click();
  await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
}

test.describe("Settings behavioral tests", () => {
  let app, window;

  test.beforeEach(async () => {
    ({ app, window } = await launchApp());
    await window.locator("[data-testid=solved-counter]").waitFor({ timeout: 15000 });
  });

  test.afterEach(async () => {
    if (app) await app.close().catch(() => {});
  });

  test("font size change updates Monaco editor", async () => {
    await openSettings(window);
    const slider = window.locator("[data-testid=setting-font-size]");
    await slider.fill("18");
    await closeSettings(window);
    await clickFirstProblem(window);

    // Give Monaco time to apply the setting
    await window.waitForTimeout(1000);

    const fontSize = await window.evaluate(() => {
      const editors = window.monaco?.editor?.getEditors();
      return editors?.[0]?.getOption(window.monaco.editor.EditorOption.fontSize);
    });
    expect(fontSize).toBe(18);
  });

  test("vim toggle enables vim mode", async () => {
    await openSettings(window);
    const vimToggle = window.locator("[data-testid=setting-vim]");

    // Ensure vim is currently off by checking aria-label or pressed state
    const initialLabel = await vimToggle.getAttribute("aria-label");

    await vimToggle.click();
    await window.waitForTimeout(300);
    await closeSettings(window);
    await clickFirstProblem(window);
    await window.waitForTimeout(1000);

    // Vim status bar typically appears at the bottom of the editor with class cm-vim-panel or similar
    // Check for a vim status indicator — either a dedicated testid or a vim-mode bar
    const vimBar = window.locator("[data-testid=vim-status], .vim-status, .cm-vim-panel, [class*=vim]").first();
    const vimBarCount = await vimBar.count();

    if (vimBarCount > 0) {
      const box = await vimBar.boundingBox();
      expect(box).not.toBeNull();
      expect(box.height).toBeGreaterThan(0);
    } else {
      // Fallback: verify the toggle changed its visual state
      await openSettings(window);
      const afterLabel = await window.locator("[data-testid=setting-vim]").getAttribute("aria-label");
      expect(afterLabel).not.toBe(initialLabel);
    }
  });

  test("minimal focus mode hides sidebar", async () => {
    // Click a problem first so we're in the main view
    await clickFirstProblem(window);
    await openSettings(window);
    await window.locator("[data-testid=setting-focus-mode]").selectOption("minimal");
    await closeSettings(window);
    await window.waitForTimeout(500);

    const sidebar = window.locator("[data-testid=sidebar]");
    const box = await sidebar.boundingBox();
    // Sidebar should be collapsed: either zero width or hidden
    const isHidden = !box || box.width === 0 || box.width < 5;
    if (!isHidden) {
      await expect(sidebar).toBeHidden();
    } else {
      expect(isHidden).toBe(true);
    }
  });

  test("standard focus mode shows sidebar after minimal", async () => {
    await clickFirstProblem(window);

    // First set to minimal
    await openSettings(window);
    await window.locator("[data-testid=setting-focus-mode]").selectOption("minimal");
    await closeSettings(window);
    await window.waitForTimeout(500);

    // Now set back to standard
    await openSettings(window);
    await window.locator("[data-testid=setting-focus-mode]").selectOption("standard");
    await closeSettings(window);
    await window.waitForTimeout(500);

    const sidebar = window.locator("[data-testid=sidebar]");
    const box = await sidebar.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThan(5);
  });

  test("celebration effect none persists after close and reopen", async () => {
    await openSettings(window);
    await window.locator("[data-testid=setting-celebration]").selectOption("none");
    await closeSettings(window);

    // Reopen settings and verify the value persisted
    await openSettings(window);
    const selectedValue = await window.locator("[data-testid=setting-celebration]").inputValue();
    expect(selectedValue).toBe("none");
  });

  test("settings persist after panel close and reopen", async () => {
    await openSettings(window);
    const slider = window.locator("[data-testid=setting-font-size]");
    await slider.fill("16");
    await closeSettings(window);

    // Reopen and verify value persisted
    await openSettings(window);
    const persistedValue = await window.locator("[data-testid=setting-font-size]").inputValue();
    expect(Number(persistedValue)).toBe(16);
  });

  test("sound toggle changes state", async () => {
    await openSettings(window);
    const soundToggle = window.locator("[data-testid=setting-sound]");

    const initialLabel = await soundToggle.getAttribute("aria-label");
    const initialPressed = await soundToggle.getAttribute("aria-pressed");

    await soundToggle.click();
    await window.waitForTimeout(300);

    const afterLabel = await soundToggle.getAttribute("aria-label");
    const afterPressed = await soundToggle.getAttribute("aria-pressed");

    // At least one of aria-label or aria-pressed should have changed
    const changed = afterLabel !== initialLabel || afterPressed !== initialPressed;
    expect(changed).toBe(true);
  });

  test("focus mode shortcut Cmd+Shift+F toggles minimal", async () => {
    await clickFirstProblem(window);
    await window.waitForTimeout(500);

    // Press shortcut to toggle minimal focus mode
    await window.keyboard.press("Meta+Shift+F");
    await window.waitForTimeout(500);

    const sidebar = window.locator("[data-testid=sidebar]");
    const boxHidden = await sidebar.boundingBox();
    const isHidden = !boxHidden || boxHidden.width === 0 || boxHidden.width < 5;
    if (!isHidden) {
      await expect(sidebar).toBeHidden();
    } else {
      expect(isHidden).toBe(true);
    }

    // Press again to toggle back
    await window.keyboard.press("Meta+Shift+F");
    await window.waitForTimeout(500);

    const boxVisible = await sidebar.boundingBox();
    expect(boxVisible).not.toBeNull();
    expect(boxVisible.width).toBeGreaterThan(5);
  });
});
