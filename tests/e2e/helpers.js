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

// Launch, perform actions, close, relaunch with SAME data dir — for persistence tests
async function launchAppWithPersistence({ show = false } = {}) {
  const tempDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "leetmonk-persist-test-"));
  const srcProblems = path.join(projectRoot, "data/problems");
  const destProblems = path.join(tempDataDir, "problems");
  fs.mkdirSync(destProblems, { recursive: true });
  for (const f of fs.readdirSync(srcProblems)) {
    if (f.endsWith(".json")) {
      fs.copyFileSync(path.join(srcProblems, f), path.join(destProblems, f));
    }
  }

  const launch = async () => {
    const app = await electron.launch({
      args: [path.join(projectRoot, "out/main/index.js")],
      env: {
        ...process.env,
        NODE_ENV: "test",
        LEETMONK_SHOW_WINDOW: show ? "1" : "0",
        ELECTRON_RENDERER_URL: "file://" + path.join(projectRoot, "out/renderer/index.html"),
        LEETMONK_DATA_DIR: tempDataDir,
      },
      timeout: 30000,
    });
    const window = await app.firstWindow();
    await window.waitForLoadState("load");
    await window.waitForTimeout(2000);
    return { app, window };
  };

  const cleanup = () => {
    try { fs.rmSync(tempDataDir, { recursive: true, force: true }); } catch {}
  };

  const { app, window } = await launch();
  return { app, window, relaunch: launch, cleanup, dataDir: tempDataDir };
}

// Submit the correct Two Sum solution and wait for accepted
const CORRECT_SOLUTIONS = {
  'best-time-buy-sell': `from typing import List\ndef max_profit(prices: List[int]) -> int:\n    min_price = float("inf")\n    max_p = 0\n    for price in prices:\n        if price < min_price:\n            min_price = price\n        elif price - min_price > max_p:\n            max_p = price - min_price\n    return max_p`,
};

async function submitCorrectSolution(window, problemId = null) {
  await window.locator("[data-testid=problem-item]").first().click();
  await window.locator(".monaco-editor").waitFor({ timeout: 10000 });
  await window.waitForTimeout(2000);
  const code = CORRECT_SOLUTIONS['best-time-buy-sell'];
  await setEditorValue(window, code);
  await window.waitForTimeout(500);
  await window.locator("[data-testid=btn-submit]").click();
  await window.locator("text=✓ Accepted").waitFor({ timeout: 25000 });
}

module.exports = { launchApp, launchAppWithPersistence, setEditorValue, ensureSidebarExpanded, submitCorrectSolution, CORRECT_SOLUTIONS };
