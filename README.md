<img src="build/icon.iconset/icon_128x128.png" alt="LeetMonk" width="96" />

# LeetMonk

[![GitHub Release](https://img.shields.io/github/v/release/tylerbittner/leetmonk)](https://github.com/tylerbittner/leetmonk/releases/latest)

**Deep practice in solitude. Master algorithms without the noise.**

> I was heading camping for the weekend with no cell service, just wildflowers and stars. I didn't want to break my algo streak so I built an app to practice offline! 🏕️ 🤓

## Philosophy

Cal Newport calls it deep work: cognitively demanding practice performed in a state of distraction-free concentration. It's how real skill is built.

Most algorithm practice tools fight against this. Leaderboards invite comparison. Notifications fragment attention. Streaks gamify urgency. The browser tab is a context-switching machine.

LeetMonk was designed around the opposite idea. Offline by design, not by limitation. When there's no network, there's no pull toward shallow engagement — no discussion threads to skim, no solutions to peek at, no social feed to check. Just you, a problem, and a blank editor.

This is deliberate practice in solitude. The environment where craft deepens.

## Features

- **86 curated problems** across 11 categories — arrays, binary search, dynamic programming, sliding window, two pointers, stack, heap, backtracking, strings, matrix, and more
- **Monaco editor** — the same editor as VS Code, with Python syntax highlighting and autocompletion
- **Local code execution** — your code runs against test cases on your machine, via Python 3, with no server and no network call
- **Hints and solutions** revealed on demand — available when you need them, invisible when you don't
- **Timer** — measure how long problems actually take; honest feedback is part of deliberate practice
- **Focus mode** — eliminate visual noise when concentration matters most
- **Session planner** — batch your practice by pattern or difficulty before you sit down, so the session itself is uninterrupted
- **Review flagging** — mark problems to revisit; spaced repetition is how retention works
- **Keyboard shortcuts** — `Cmd+Enter` to run, `Cmd+Shift+Enter` to submit; your hands stay on the keyboard

> **Note:** Python 3 is the only supported language at this time.

## Why Offline?

Offline isn't a constraint — it's a feature.

Every time you switch context, your brain carries *attention residue* from the previous task. A quick glance at a hint forum, a Discord notification, a background browser tab — each one leaves a cognitive trace that degrades focus for minutes afterward.

An offline app removes the mechanism. There's nothing to check. The decision to stay in flow is made once, at launch, by closing the network. After that, the environment does the work.

The session planner exists for the same reason: decide what you'll practice *before* you sit down, so you're not making small decisions mid-session. Batch the planning; protect the practice.

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
│   └── problems/                # 86 problem JSON files
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

---

*The skill is built in the quiet hours. Offline, focused, yours.*
