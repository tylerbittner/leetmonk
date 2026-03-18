<img src="build/icon.iconset/icon_128x128.png" alt="LeetMonk" width="96" />

# LeetMonk

[![GitHub Release](https://img.shields.io/github/v/release/tylerbittner/leetmonk)](https://github.com/tylerbittner/leetmonk/releases/latest)

**Deep practice in solitude. Master algorithms without the noise.**

> I was heading camping for the weekend with no cell service, just wildflowers and stars. I didn't want to break my algo streak so I built an app to practice offline! 🏕️ 🤓

## Why Offline?

Most practice tools fight against deep focus. Leaderboards invite comparison. Notifications fragment attention. The browser tab is a context-switching machine.

LeetMonk removes the mechanism. No account, no network, no pull toward shallow engagement — just you, a problem, and a blank editor. Offline isn't a limitation; it's the point. Your best thinking happens without WiFi.

<!-- Screenshots -->
<!-- ![Main editor view](docs/screenshots/editor.png) -->
<!-- ![Pattern Library](docs/screenshots/patterns.png) -->
<!-- ![Spaced repetition review](docs/screenshots/review.png) -->

## Features

- **86 curated problems** in Python & JavaScript — arrays, DP, binary search, graphs, trees, and more
- **Pattern Library** — 22 algorithm patterns with templates, "when to use" guides, and mastery tracking. Learn the *technique*, not just the problem.
- **Spaced repetition (FSRS-6)** — rate yourself after each solve; due problems surface automatically. The science of retention, built in.
- **Solution diff view** — compare your code side-by-side with reference solutions
- **Monaco editor** with vim keybindings, focus mode, session planner, and keyboard shortcuts (`Cmd+Enter` to run, `Cmd+Shift+Enter` to submit)
- **Fully local** — code runs on your machine, progress stays on your machine

## Quick Start

**Requirements:** [Node.js 18+](https://nodejs.org) and [Python 3.9+](https://python.org)

### macOS (packaged app)

```bash
git clone https://github.com/tylerbittner/leetmonk.git
cd leetmonk
npm install
npm run dist
```

Opens `dist/mac-arm64/LeetMonk.app` (Apple Silicon) or `dist/mac/LeetMonk.app` (Intel). Drag to `/Applications` to install.

> **Note:** The app is unsigned. On first launch macOS will block it — click **Done**, then go to **System Settings → Privacy & Security** and click **"Open Anyway"**. On older macOS, right-click the app → Open works instead.

### All platforms (run from source)

```bash
git clone https://github.com/tylerbittner/leetmonk.git
cd leetmonk
npm install
npm run dev
```

Works on macOS, Windows, and Linux. Electron, Python 3, and Node.js must be available.

## Contributing

### Adding Problems

Drop a `.json` file into `data/problems/` following the existing schema, then restart. Validate with:

```bash
npm run test:problems
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop shell | [Electron](https://www.electronjs.org/) |
| UI | [React 18](https://react.dev/) |
| Code editor | [Monaco Editor](https://microsoft.github.io/monaco-editor/) |
| Build tooling | [electron-vite](https://electron-vite.org/) |
| Code execution | Python 3 + Node.js (spawned subprocesses) |
| Spaced repetition | [FSRS-6](https://github.com/open-spaced-repetition/py-fsrs) (pure JS port) |
| Testing | [Jest](https://jestjs.io/) |

### Testing

```bash
npm test                 # all tests (problems, solutions, FSRS)
npm run test:problems    # validate problem JSON schemas
npm run test:solutions   # verify all solutions pass (Python + JS)
```

## Disclaimer

LeetMonk is an independent open-source project and is **not** affiliated with, endorsed by, or connected to LeetCode or its parent company. "LeetCode" is a trademark of LeetCode LLC. All problem content in LeetMonk is independently authored.

## License

[Apache License 2.0](./LICENSE) — Copyright © 2026 Tyler Bittner

---

*The skill is built in the quiet hours. Offline, focused, yours.*
