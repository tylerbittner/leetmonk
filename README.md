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

- **86 curated problems** in Python & JavaScript — arrays, dynamic programming, binary search, graphs, trees, sliding window, two pointers, and more
- **Pattern Library** — 22 algorithm patterns with code templates, "when to use" guides, and mastery tracking. Learn the *technique*, not just the problem.
- **Spaced repetition ([FSRS-6](https://github.com/open-spaced-repetition/ts-fsrs))** — rate yourself after each solve and the app computes optimal review intervals. Due problems surface automatically so you revisit them before you forget.
- **Solution diff view** — compare your code side-by-side with reference solutions using the built-in diff editor
- **Session planner** — batch problems by pattern, difficulty, or due reviews before you sit down, so the session itself is uninterrupted
- **[Monaco code editor](https://microsoft.github.io/monaco-editor/)** (the engine behind VS Code) with optional vim keybindings, focus mode, and configurable font size
- **Hints and solutions** — revealed progressively when you need them, invisible when you don't
- **Fully local** — code executes on your machine, progress stays on your machine, nothing phones home

## Quick Start

### Download (macOS)

Grab the `.dmg` from the [latest release](https://github.com/tylerbittner/leetmonk/releases/latest), open it, and drag LeetMonk to Applications.

> **Note:** The app is unsigned. On first launch, macOS will block it — click **Done**, then go to **System Settings → Privacy & Security** and click **"Open Anyway"**.

**Requires** [Python 3.9+](https://python.org) installed (used to run your code locally).

### Build from source (all platforms)

```bash
git clone https://github.com/tylerbittner/leetmonk.git
cd leetmonk
npm install
npm run dev       # launch in dev mode
```

To build a distributable app:

```bash
npm run dist      # builds .app + .dmg (macOS)
```

**Requires** [Node.js 18+](https://nodejs.org) and [Python 3.9+](https://python.org).

Works on macOS, Windows, and Linux.

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
| Spaced repetition | [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) |
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
