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
  await window.evaluate((c) => window.__testSetCode?.(c), code);
  await window.waitForTimeout(300);
}

module.exports = { launchApp, setEditorValue };
