<img src="build/icon.iconset/icon_128x128.png" alt="LeetMonk" width="96" />

# LeetMonk

[![GitHub Release](https://img.shields.io/github/v/release/tylerbittner/leetmonk)](https://github.com/tylerbittner/leetmonk/releases/latest)

**Offline algorithm practice — no account, no internet, no distractions.**

> I was heading camping for the weekend with no cell service, just wildflowers and stars. I didn't want to break my algo streak so I built an app to practice offline! 🏕️ 🤓

Curated problems covering arrays, dynamic programming, binary search, sliding window, two pointers, and many more. Write Python 3 solutions in a Monaco editor, run them against test cases locally, and track your progress.

## Features

- **39 curated problems** spanning 11 categories (easy / medium / hard)
- **Monaco editor** with Python syntax highlighting and autocompletion
- **Local code execution** via Python 3 — no server, no network
- **Hints and solutions** revealed on demand, per problem
- **Timer**, **focus mode**, **review flagging**, and **session planner**
- **Keyboard shortcuts** — `Cmd+Enter` to run, `Cmd+Shift+Enter` to submit

> **Note:** Python 3 is the only supported language at this time.

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

Works on macOS, Windows, and Linux. Electron and Python 3 must be available.

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
| Code execution | Python 3 (spawned subprocess) |
| Testing | [Jest](https://jestjs.io/) |

### Project Structure

```
leetmonk/
├── src/
│   ├── main/index.js            # Electron main process + IPC handlers
│   ├── preload/index.js         # Secure renderer-to-main bridge
│   ├── executor/
│   │   ├── runner.js            # Spawns Python subprocess
│   │   └── harness_template.py  # Test harness injected into user code
│   └── renderer/src/
│       ├── App.jsx              # Root React component
│       └── components/          # UI components
├── data/
│   └── problems/                # 39 problem JSON files
└── tests/                       # Jest test suites
```

### Testing

```bash
npm test                 # all tests
npm run test:problems    # validate problem JSON schemas
npm run test:solutions   # verify all solutions pass
```

## Disclaimer

LeetMonk is an independent open-source project and is **not** affiliated with, endorsed by, or connected to LeetCode or its parent company. "LeetCode" is a trademark of LeetCode LLC. All problem content in LeetMonk is independently authored.

## License

[Apache License 2.0](./LICENSE) — Copyright © 2026 Tyler Bittner
