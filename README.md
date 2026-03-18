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

### Core Practice

- **86 curated problems** spanning 11 categories — arrays, binary search, dynamic programming, sliding window, two pointers, trees, graphs, backtracking, and more
- **Python & JavaScript** — write solutions in either language and switch freely per problem
- **Monaco editor** — the same engine as VS Code, with syntax highlighting, autocompletion, and optional **vim keybindings**
- **Local code execution** — test cases run on your machine via Python 3 or Node.js. No server, no network.
- **Hints and solutions** — revealed progressively when you need them, invisible when you don't

### Pattern Library

- **22 algorithm patterns** organized by technique and data structure — sliding window, two pointers, binary search on answer, topological sort, and more
- Each pattern includes a description, "when to use" guide, code template, and complexity analysis
- Problems are tagged with their underlying patterns — learn the *technique*, not just the problem
- Mastery indicators show your coverage per pattern

### Spaced Repetition (FSRS)

- Built-in **FSRS-6 algorithm** — the state of the art in memory scheduling
- After solving a problem, rate yourself (Again / Hard / Good / Easy) and FSRS computes the optimal review date
- Due problems surface automatically in the session planner and review queue
- Retrievability percentages show how likely you are to remember each problem
- No account, no cloud sync — your review state stays local

### Solution Diff View

- Compare your code side-by-side with reference solutions using Monaco's built-in diff editor
- Available after viewing the Solutions tab — learn by comparing approaches
- Solution selector when multiple approaches exist (brute force vs. optimal)
- Line count and complexity comparison at a glance

### Focus & Flow

- **Focus mode** — strip away UI chrome when concentration matters most
- **Session planner** — batch problems by pattern, difficulty, or due reviews before you sit down
- **Timer** — honest feedback on how long problems actually take
- **Lotus celebration** — a calm, earned moment when you solve a problem (falling petals + meditation bell). Not gamification — acknowledgment. Configurable: switch to classic confetti or disable entirely.
- **Keyboard-driven** — `Cmd+Enter` to run, `Cmd+Shift+Enter` to submit, `Cmd+[/]` to navigate

### Settings & Customization

- Celebration style (lotus petals / confetti / none)
- Sound on solve (on/off)
- Vim keybindings toggle
- Editor font size
- Focus mode intensity (standard / minimal)
- Timer visibility

### Bug Reporting

- Built-in 🐛 button pre-fills a GitHub issue with your problem context, app version, and OS — making it easy to help improve LeetMonk

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

### Project Structure

```
leetmonk/
├── src/
│   ├── main/index.js              # Electron main process + IPC handlers
│   ├── preload/index.js           # Secure renderer-to-main bridge
│   ├── executor/
│   │   ├── runner.js              # Python subprocess executor
│   │   ├── runner-js.js           # JavaScript subprocess executor
│   │   └── harness_template.py    # Python test harness
│   └── renderer/src/
│       ├── App.jsx                # Root React component
│       ├── fsrs.js                # FSRS-6 spaced repetition algorithm
│       ├── data/patterns.js       # Pattern library definitions
│       └── components/
│           ├── PatternLibrary.jsx  # Pattern grid + detail view
│           ├── RatingModal.jsx     # Post-solve FSRS rating
│           ├── DiffView.jsx        # Monaco diff editor
│           ├── SettingsPanel.jsx   # App settings
│           ├── LotusEffect.jsx     # Celebration animation
│           ├── BugReportModal.jsx  # GitHub issue reporter
│           └── ...                 # Problem list, editor, timer, etc.
├── data/
│   └── problems/                  # 86 problem JSON files
└── tests/                         # Jest test suites (incl. FSRS)
```

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
