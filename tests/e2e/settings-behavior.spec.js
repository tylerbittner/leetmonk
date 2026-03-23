const { test, expect } = require("@playwright/test");
const { launchApp } = require("./helpers");

test.describe("Settings behavioral tests", () => {
  let app, window, cleanup;

  test.beforeEach(async () => {
    ({ app, window, cleanup } = await launchApp({ show: true }));
    await window.locator("[data-testid=solved-counter]").waitFor({ timeout: 15000 });
  });

  test.afterEach(async () => {
    if (app) await app.close().catch(() => {});
    if (cleanup) cleanup();
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


  test("settings panel closes on Escape", async () => {
    await openSettings(window);
    await window.keyboard.press("Escape");
    await window.waitForTimeout(300);
    await expect(window.locator("[data-testid=settings-panel]")).toBeHidden({ timeout: 3000 });
  });
});
