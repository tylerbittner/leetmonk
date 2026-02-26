# LeetMonk

**Offline LeetCode-style practice -- no account, no internet, no distractions.**

LeetMonk is an Electron desktop app for offline algorithm practice. It ships with 35 hand-curated problems across arrays, strings, binary search, sliding window, two pointers, stack, heap, dynamic programming, and backtracking. Write Python solutions in a Monaco editor, run them against test cases locally, and track your progress -- all without an internet connection.

## Disclaimer

LeetMonk is an independent open-source project and is **not** affiliated with, endorsed by, or connected to LeetCode or its parent company. "LeetCode" is a trademark of LeetCode LLC. All problem content in LeetMonk is independently authored.

## Features

- **35 curated problems** spanning 9 categories (easy / medium / hard)
- **Monaco editor** with Python syntax highlighting and autocompletion
- **Local code execution** via Python 3 subprocess -- no server, no network
- **Per-problem hints and solutions** revealed on demand
- **Timer** with per-problem tracking
- **Focus mode** -- collapse the sidebar to remove distractions
- **Review flagging** with spaced-repetition scheduling
- **Session planner** -- queue up a set of problems and work through them
- **Submission history** -- view past attempts per problem
- **Keyboard shortcuts** for fast workflow (`Cmd+Enter` to run, `Cmd+Shift+Enter` to submit)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop shell | [Electron](https://www.electronjs.org/) |
| UI | [React 18](https://react.dev/) |
| Code editor | [Monaco Editor](https://microsoft.github.io/monaco-editor/) |
| Build tooling | [electron-vite](https://electron-vite.org/) |
| Code execution | Python 3 (spawned subprocess) |
| Testing | [Jest](https://jestjs.io/), [Playwright](https://playwright.dev/) |

## Prerequisites

- **Node.js 18+** -- `brew install node` or [nodejs.org](https://nodejs.org)
- **Python 3.9+** -- `brew install python3` or [python.org](https://python.org)

## Install from Source

```bash
git clone https://github.com/tylerbittner/leetmonk.git
cd leetmonk
npm install
npm run dev        # run in dev mode
npm run build      # build
npm run dist       # package as .app / .exe / .deb
```

## Testing

```bash
npm test                # run all tests
npm run test:problems   # validate problem JSON schemas
npm run test:solutions  # verify all solutions pass all test cases
npm run test:e2e        # end-to-end tests via Playwright
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Enter` | Run against example cases |
| `Cmd+Shift+Enter` | Submit against all test cases |
| `Cmd+R` | Reset to starter code |
| `Cmd+[` | Previous problem |
| `Cmd+]` | Next problem |

## Project Structure

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
│   └── problems/                # 35 problem JSON files
├── tests/
│   ├── problems.test.js         # Schema validation
│   ├── solutions.test.js        # Solution correctness
│   └── executor.test.js         # Python runner integration
├── electron.vite.config.js
└── package.json
```

## Adding Problems

Drop a `.json` file into `data/problems/` following the existing schema (see any problem file for reference), then restart the app. Validate with:

```bash
npm run test:problems
```

## License

[Apache License 2.0](./LICENSE)
