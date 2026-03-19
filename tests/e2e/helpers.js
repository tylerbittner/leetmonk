const { _electron: electron } = require("@playwright/test");
const path = require("path");

const projectRoot = path.join(__dirname, "../..");

// show:true for tests that need visible window (Monaco API, keyboard focus, etc.)
// show:false (default) for tests that just check UI state — won't pop up on your screen
async function launchApp({ show = false } = {}) {
  const app = await electron.launch({
    args: [path.join(projectRoot, "out/main/index.js")],
    env: {
      ...process.env,
      NODE_ENV: "test",
      LEETMONK_SHOW_WINDOW: show ? "1" : "0",
      ELECTRON_RENDERER_URL:
        "file://" + path.join(projectRoot, "out/renderer/index.html"),
      LEETMONK_DATA_DIR: path.join(projectRoot, "data"),
    },
    timeout: 30000,
  });
  const window = await app.firstWindow();
  await window.waitForLoadState("load");
  await window.waitForTimeout(2000);
  return { app, window };
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

module.exports = { launchApp, setEditorValue };
