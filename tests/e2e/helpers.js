const { _electron: electron } = require("@playwright/test");
const path = require("path");
const fs = require("fs");
const os = require("os");

const projectRoot = path.join(__dirname, "../..");

// show:true for tests that need visible window (Monaco API, keyboard focus, etc.)
// show:false (default) for tests that just check UI state — won't pop up on your screen
async function launchApp({ show = false } = {}) {
  // Create isolated temp data dir so tests don't share state
  const tempDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "leetmonk-test-"));

  // Copy problem files (read-only data) but NOT settings/progress/sr-state
  const srcProblems = path.join(projectRoot, "data/problems");
  const destProblems = path.join(tempDataDir, "problems");
  fs.mkdirSync(destProblems, { recursive: true });

  for (const f of fs.readdirSync(srcProblems)) {
    if (f.endsWith(".json")) {
      fs.copyFileSync(path.join(srcProblems, f), path.join(destProblems, f));
    }
  }

  const app = await electron.launch({
    args: [path.join(projectRoot, "out/main/index.js")],
    env: {
      ...process.env,
      NODE_ENV: "test",
      LEETMONK_SHOW_WINDOW: show ? "1" : "0",
      ELECTRON_RENDERER_URL:
        "file://" + path.join(projectRoot, "out/renderer/index.html"),
      LEETMONK_DATA_DIR: tempDataDir,
    },
    timeout: 30000,
  });
  const window = await app.firstWindow();
  await window.waitForLoadState("load");
  await window.waitForTimeout(2000);

  const cleanup = () => {
    try {
      fs.rmSync(tempDataDir, { recursive: true, force: true });
    } catch {}
  };

  return { app, window, cleanup };
}

async function setEditorValue(window, code) {
  // Retry up to 5 times until __testSetCode is registered and activeProblem is set
  for (let i = 0; i < 5; i++) {
    const success = await window.evaluate((c) => {
      if (typeof window.__testSetCode === "function") {
        window.__testSetCode(c);
        return true;
      }
      return false;
    }, code);
    if (success) break;
    await window.waitForTimeout(500);
  }
  // Wait for Monaco to reflect the new value
  await window.waitForTimeout(500);
}

async function ensureSidebarExpanded(window) {
  const isVisible = await window
    .locator("[data-testid=problem-item]")
    .first()
    .isVisible()
    .catch(() => false);
  if (!isVisible) {
    const toggle = window
      .locator("[data-testid=top-bar] button")
      .filter({ hasText: /[▣◧]/ });
    await toggle.click();
    await window.waitForTimeout(400);
  }
}

module.exports = { launchApp, setEditorValue, ensureSidebarExpanded };
