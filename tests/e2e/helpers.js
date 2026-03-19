const { _electron: electron } = require("@playwright/test");
const path = require("path");

async function launchApp() {
  const app = await electron.launch({
    args: [path.join(__dirname, "../../out/main/index.js")],
    env: { ...process.env, NODE_ENV: "test" },
  });
  const window = await app.firstWindow();
  await window.waitForLoadState("domcontentloaded");
  return { app, window };
}

module.exports = { launchApp };
