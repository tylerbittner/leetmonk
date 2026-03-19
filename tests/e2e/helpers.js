const { _electron: electron } = require("@playwright/test");
const path = require("path");

const projectRoot = path.join(__dirname, "../..");

async function launchApp() {
  const app = await electron.launch({
    args: [path.join(projectRoot, "out/main/index.js")],
    env: {
      ...process.env,
      NODE_ENV: "test",
      ELECTRON_RENDERER_URL:
        "file://" + path.join(projectRoot, "out/renderer/index.html"),
      // Tell the app where project root is so data/ resolves correctly
      LEETMONK_DATA_DIR: path.join(projectRoot, "data"),
    },
    timeout: 30000,
  });
  const window = await app.firstWindow();
  await window.waitForLoadState("load");
  await window.waitForTimeout(2000);
  return { app, window };
}

module.exports = { launchApp };
