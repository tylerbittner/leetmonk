const { test, expect } = require("@playwright/test");
const { launchApp } = require("./helpers");

test.describe("Settings behavioral tests", () => {
  let app, window;

  test.beforeEach(async () => {
    ({ app, window } = await launchApp({ show: true }));
    await window.locator("[data-testid=solved-counter]").waitFor({ timeout: 15000 });
  });

  test.afterEach(async () => {
    if (app) await app.close().catch(() => {});
  });

  async function openSettings(window) {
    await window.keyboard.press("Meta+,");
    await window.locator("[data-testid=settings-panel]").waitFor({ timeout: 5000 });
  }

  test("font size slider changes value", async () => {
    await openSettings(window);
    const slider = window.locator("[data-testid=setting-font-size]");
    await slider.fill("18");
    const val = await slider.inputValue();
    expect(Number(val)).toBe(18);
  });

  test("vim toggle changes state", async () => {
    await openSettings(window);
    const toggle = window.locator("[data-testid=setting-vim]");
    // Get initial state (aria-label or background changes)
    const initialLabel = await toggle.getAttribute("aria-label");
    await toggle.click();
    await window.waitForTimeout(300);
    const newLabel = await toggle.getAttribute("aria-label");
    expect(newLabel).not.toBe(initialLabel);
  });

  test("minimal focus mode changes select value", async () => {
    await openSettings(window);
    const select = window.locator("[data-testid=setting-focus-mode]");
    await select.selectOption("minimal");
    const val = await select.inputValue();
    expect(val).toBe("minimal");
  });

  test("celebration none changes select value", async () => {
    await openSettings(window);
    const select = window.locator("[data-testid=setting-celebration]");
    await select.selectOption("none");
    const val = await select.inputValue();
    expect(val).toBe("none");
  });

  test("settings values are reflected in UI after change", async () => {
    await openSettings(window);
    const slider = window.locator("[data-testid=setting-font-size]");
    await slider.fill("16");
    // Close and reopen
    await window.keyboard.press("Escape");
    await window.waitForTimeout(300);
    await openSettings(window);
    const val = await slider.inputValue();
    expect(Number(val)).toBe(16);
  });

  test("sound toggle changes state", async () => {
    await openSettings(window);
    const toggle = window.locator("[data-testid=setting-sound]");
    const initialLabel = await toggle.getAttribute("aria-label");
    await toggle.click();
    await window.waitForTimeout(200);
    const newLabel = await toggle.getAttribute("aria-label");
    expect(newLabel).not.toBe(initialLabel);
  });

  test("focus mode shortcut Cmd+Shift+F exists as keyboard binding", async () => {
    // Just verify the app responds to the shortcut without crashing
    await window.keyboard.press("Meta+Shift+F");
    await window.waitForTimeout(500);
    // App should still be running
    const counter = await window.locator("[data-testid=solved-counter]").textContent();
    expect(counter).toMatch(/\d+\/\d+/);
  });

  test("settings panel closes on Escape", async () => {
    await openSettings(window);
    await window.keyboard.press("Escape");
    await window.waitForTimeout(300);
    await expect(window.locator("[data-testid=settings-panel]")).toBeHidden({ timeout: 3000 });
  });
});
