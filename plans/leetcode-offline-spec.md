# LeetMonk — Offline LeetCode Practice App

## Product Spec v1.0

### Overview

A desktop Electron app that replicates the core LeetCode problem-solving experience for fully offline use. Users can browse, filter, and solve algorithm problems with real code execution, test case validation, a timer, and solution explanations — all without internet access.

**Target user:** Software engineer preparing for technical interviews, specifically needing offline practice during travel/camping.

**Tech stack:** Electron + React frontend, Node.js backend process for code execution. All problem data stored locally as JSON.

---

### Priority Tiers

| Tier | Features | Notes |
|------|----------|-------|
| **P0 — Must have** | Code execution with test results, Solutions tab, Problem filtering | Core weekend functionality |
| **P1 — Should have** | Timer + session tracking | Important but not blocking |
| **P2 — Include conditionally** | Progress tracking, stats dashboard | Include if 50+ high-quality problems are generated; skip otherwise |

---

### Problem Data

#### Content Generation

Since LeetCode problems are copyrighted, **generate equivalent problems with original descriptions** that test the same concepts. Each problem should have:

- A unique, thematic framing (e.g., "sensor network" instead of "array continuous")
- The same algorithmic core as the LC equivalent
- Clear constraints section
- 3+ example cases with explanations

#### Problem Schema

Each problem is a JSON file in `data/problems/`. Example:

```json
{
  "id": "two-sum",
  "title": "Two Sum",
  "difficulty": "easy",
  "tags": ["arrays", "hash-map"],
  "description": "Markdown string with full problem statement, constraints, and examples",
  "examples": [
    {
      "input": "nums = [2, 7, 11, 15], target = 9",
      "output": "[0, 1]",
      "explanation": "nums[0] + nums[1] = 2 + 7 = 9"
    }
  ],
  "exampleCases": [
    {
      "input": { "nums": [2, 7, 11, 15], "target": 9 },
      "expected": [0, 1],
      "explanation": "nums[0] + nums[1] = 2 + 7 = 9"
    },
    {
      "input": { "nums": [3, 2, 4], "target": 6 },
      "expected": [1, 2],
      "explanation": "nums[1] + nums[2] = 2 + 4 = 6"
    },
    {
      "input": { "nums": [3, 3], "target": 6 },
      "expected": [0, 1],
      "explanation": "Duplicate values — both 3s sum to 6"
    }
  ],
  "hiddenCases": [
    { "input": { "nums": [1], "target": 2 }, "expected": null },
    { "input": { "nums": [-1, -2, -3, -4], "target": -6 }, "expected": [1, 3] },
    { "input": { "nums": [0, 0], "target": 0 }, "expected": [0, 1] },
    { "input": { "nums": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "target": 19 }, "expected": [8, 9] },
    { "input": { "nums": [100, 200], "target": 300 }, "expected": [0, 1] },
    { "input": { "nums": [1, 5, 5, 5, 5, 5, 11], "target": 12 }, "expected": [0, 6] },
    { "input": { "nums": [-1000000, 1000000], "target": 0 }, "expected": [0, 1] },
    { "input": { "nums": [2, 7, 11, 15, 20, 25, 30], "target": 9 }, "expected": [0, 1] },
    { "input": { "nums": [1, 2, 3, 4, 5], "target": 9 }, "expected": [3, 4] },
    { "input": { "nums": [0, 1, 2, 0], "target": 0 }, "expected": [0, 3] }
  ],
  "starterCode": {
    "python": "def two_sum(nums: List[int], target: int) -> List[int]:\n    pass"
  },
  "solutions": [
    {
      "label": "Brute Force — O(n²)",
      "approach": "obvious",
      "language": "python",
      "code": "def two_sum(nums, target):\n    for i in range(len(nums)):\n        for j in range(i+1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]",
      "timeComplexity": "O(n²)",
      "spaceComplexity": "O(1)",
      "explanation": "Markdown explanation of the brute force approach, when you'd use it, and why it's suboptimal."
    },
    {
      "label": "Hash Map — O(n)",
      "approach": "optimal",
      "language": "python",
      "code": "def two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i",
      "timeComplexity": "O(n)",
      "spaceComplexity": "O(n)",
      "explanation": "Markdown explanation of the optimal approach, the key insight, and the time/space tradeoff."
    }
  ],
  "hints": [
    "Can you reduce the lookup time for the complement?",
    "What data structure gives O(1) lookup?"
  ],
  "lcEquivalent": "1. Two Sum"
}
```

#### Problem Set — Initial Seed

Generate **Easy and Medium** problems equivalent to the LeetCode 150 list (aka "Neetcode 150" or "Blind 75 expanded"). Prioritize the following topics for the initial build, and include the rest as time allows.

**Priority topics (must include for this weekend):**

- **Arrays (intermediate):** Two Sum, Best Time to Buy/Sell Stock, Product of Array Except Self, Maximum Subarray, Contains Duplicate, Minimum in Rotated Sorted Array, 3Sum, Container With Most Water, Trapping Rain Water
- **Matrix traversal:** Spiral Matrix, Rotate Image, Set Matrix Zeroes, Word Search, Valid Sudoku
- **Binary search:** Binary Search, Search in Rotated Sorted Array, Find Minimum in Rotated Sorted Array, Search a 2D Matrix, Koko Eating Bananas, Median of Two Sorted Arrays
- **Sliding window:** Longest Substring Without Repeating Characters, Minimum Window Substring, Sliding Window Maximum, Minimum Operations to Make Array Continuous

**Secondary topics (include if time permits):**

- Two pointers
- Stack
- Linked list
- Hash map
- Strings
- Heap / Priority Queue
- Trees / Graphs
- Dynamic programming
- Backtracking
- Greedy

#### Adding New Problems

Users can add problems by:

1. Dropping a new `.json` file into `data/problems/` following the schema above
2. Restarting the app (or hitting a "Refresh Problems" button in the UI)

The app should validate the JSON schema on load and surface clear errors for malformed problem files.

---

### UI Layout

Mirror the LeetCode interface as closely as possible. The app is a single-window, two-panel layout.

#### Left Panel — Problem Description

- **Header:** Problem title, difficulty badge (Easy = green, Medium = yellow), tags as chips
- **Tabs:**
  - **Description** — Full problem statement rendered as markdown. Includes constraints, examples with input/output/explanation.
  - **Solutions** — Lists all solution approaches. Each shows: label, time/space complexity, full code with syntax highlighting, and a markdown explanation. Show the "obvious" (brute force) solution first, then optimal.
  - **Hints** — Collapsible hint cards, revealed one at a time on click.

#### Right Panel — Code Editor + Results

- **Code editor:**
  - Use Monaco Editor (same as VS Code) or CodeMirror
  - Python syntax highlighting and basic autocomplete
  - Starter code pre-loaded from the problem definition
  - Editor state persisted per-problem (survives tab switches and app restarts)
  - Python is the only required language for v1

- **Action buttons (above editor):**
  - **Run** — Execute code against example test cases only (the ones shown in the Description tab)
  - **Submit** — Execute code against ALL test cases (including hidden ones not shown in examples)
  - **Reset** — Restore starter code (with confirmation dialog)

- **Results panel (below editor):**
  - Shows test case results in a tabbed or accordion layout
  - For each test case: input, expected output, actual output, pass/fail indicator
  - For failures: show diff between expected and actual
  - Show stdout/print output captured during execution
  - Show runtime errors with traceback
  - Overall summary: "X/Y test cases passed" with green (all pass) or red (failures) indicator
  - On full submit pass: show a success celebration (confetti optional but encouraged)

#### Top Bar

- **Problem navigator:** Dropdown or sidebar to switch between problems
- **Filter controls:** Filter by difficulty (Easy/Medium), tags/topics, and solved/unsolved status
- **Timer:** Displays elapsed time for the current problem session (see Timer section below)

#### Bottom Status Bar

- Current problem ID
- Language indicator (Python)
- P2: Session stats (problems solved today, avg time)

---

### Code Execution

**Runtime:** Execute user Python code in a child process using the system Python installation. The Electron app's Node.js backend spawns a Python subprocess for each run/submit.

**Execution flow:**

1. User clicks Run or Submit
2. Backend writes the user's code + test harness to a temp `.py` file
3. The test harness:
   - Imports the user's function
   - Iterates over test cases, calling the function with each input
   - Captures stdout per test case
   - Compares actual output to expected output
   - Returns structured JSON results
4. Backend spawns `python3 <tempfile>` with a **10-second timeout**
5. Results JSON is parsed and displayed in the Results panel
6. Temp file is cleaned up

**Test harness template:**

```python
import json, sys, io, traceback, time

# User code is inserted here
{user_code}

test_cases = {test_cases_json}
results = []

for i, tc in enumerate(test_cases):
    captured = io.StringIO()
    old_stdout = sys.stdout
    sys.stdout = captured
    try:
        start = time.perf_counter()
        actual = {function_name}(**tc["input"])
        elapsed = time.perf_counter() - start
        sys.stdout = old_stdout
        passed = actual == tc["expected"]
        results.append({
            "index": i,
            "passed": passed,
            "input": tc["input"],
            "expected": tc["expected"],
            "actual": actual,
            "stdout": captured.getvalue(),
            "runtime_ms": round(elapsed * 1000, 2),
            "error": None
        })
    except Exception as e:
        sys.stdout = old_stdout
        results.append({
            "index": i,
            "passed": False,
            "input": tc["input"],
            "expected": tc["expected"],
            "actual": None,
            "stdout": captured.getvalue(),
            "runtime_ms": None,
            "error": traceback.format_exc()
        })

print(json.dumps({"results": results}))
```

**Edge cases to handle:**

- Infinite loops → 10s timeout kills the process, returns "Time Limit Exceeded"
- Syntax errors → Captured in stderr, shown to user
- Import errors → User code shouldn't need external packages; show error if attempted
- Large output → Truncate stdout capture at 10KB per test case

**Security note:** Since this is a local-only app running the user's own code, sandboxing is not a concern. No network access needed.

---

### Timer (P1)

- **Per-problem timer** that starts when the user first types in the editor or clicks "Start Timer"
- Displays `MM:SS` in the top bar
- Controls: Start, Pause, Reset
- Optionally configurable target time (e.g., 25 min, 45 min) with a visual indicator when exceeded
- Timer state persisted per problem — switching problems pauses the current timer and resumes the target problem's timer
- Timer value saved to problem progress data

---

### Progress Tracking (P2)

Lightweight local tracking stored in `data/progress.json`:

```json
{
  "two-sum": {
    "status": "solved",
    "attempts": 3,
    "solvedAt": "2026-02-28T14:30:00Z",
    "timeSpent": 1230,
    "lastCode": "def two_sum(nums, target):\n    ..."
  }
}
```

**Status values:** `unsolved`, `attempted`, `solved`

**Stats dashboard (P2):**

- Problems solved: X / total, broken down by difficulty
- Completion by topic (e.g., "Arrays: 8/12")
- Average solve time by difficulty
- Streak / session history

---

### Data Storage

All data lives on the filesystem — no database needed.

```
leetmonk/
├── package.json
├── main.js                    # Electron main process
├── src/
│   ├── renderer/              # React app
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── ProblemDescription.jsx
│   │   │   ├── CodeEditor.jsx
│   │   │   ├── TestResults.jsx
│   │   │   ├── SolutionsTab.jsx
│   │   │   ├── Timer.jsx
│   │   │   ├── ProblemList.jsx
│   │   │   └── FilterBar.jsx
│   │   └── styles/
│   └── executor/              # Python code execution logic
│       ├── runner.js           # Spawns Python subprocess
│       └── harness_template.py
├── data/
│   ├── problems/              # One JSON file per problem
│   │   ├── two-sum.json
│   │   ├── spiral-matrix.json
│   │   └── ...
│   └── progress.json          # User progress (P2)
└── dist/                      # Built Electron app
```

---

### Non-Functional Requirements

- **Fully offline:** Zero network calls. All assets bundled. No CDN fonts, no analytics, no telemetry.
- **Startup time:** < 3 seconds to usable state
- **Code execution latency:** < 2 seconds for typical problems (excluding TLE cases)
- **Persistence:** Editor state, timer state, and progress survive app restart
- **Platform:** macOS (Apple Silicon). Build with `electron-builder` for `.dmg` distribution.
- **Python dependency:** Requires Python 3.9+ installed on the system. App should check for Python at startup and show a clear error if not found.

---

### UI/UX Reference

Match the LeetCode desktop experience:

- **Dark theme** as default (LeetCode dark mode). Include a light theme toggle if time permits.
- **Resizable split panes** between left (description) and right (editor) panels
- **Keyboard shortcuts:**
  - `Cmd+Enter` — Run code
  - `Cmd+Shift+Enter` — Submit code
  - `Cmd+R` — Reset code
  - `Cmd+[` / `Cmd+]` — Previous/next problem
- **Syntax highlighting** matching LeetCode's color scheme (or VS Code dark+ theme)
- **Markdown rendering** in description and solution explanations with code block syntax highlighting

---

### Out of Scope for v1

- Multiple language support (Python only)
- Contest/competition mode
- Collaborative features
- Cloud sync
- Problem difficulty ratings / voting
- Discussion / comments
- Video explanations
- Custom test case input (use only predefined test cases)
- AI-powered hints

---

### Build & Run Instructions

Include in the README:

```bash
# Prerequisites
# - Node.js 18+
# - Python 3.9+

# Install dependencies
npm install

# Run in development
npm run dev

# Build for macOS
npm run build

# The built app will be in dist/
```

---

### Implementation Notes for Claude Code

1. **Start with code execution working end-to-end.** Get a single hardcoded problem running with the Python harness before building out the full UI. This is the riskiest piece.

2. **Seed 5-8 problems manually first** for the priority topics (arrays, matrix, binary search, sliding window). Verify the full flow works. Then batch-generate the remaining problems.

3. **Use Monaco Editor** (`@monaco-editor/react`) for the code editor — it's battle-tested in Electron and gives you syntax highlighting, autocomplete, and keybindings for free.

4. **For problem generation:** Each problem needs original descriptions (not copied from LC), but should test the same algorithm. Include the `lcEquivalent` field so the user knows what LC problem it maps to.

5. **Test case design:** Each problem must include **10-20 test cases** that comprehensively cover edge cases expected in an interview setting. Use this checklist per problem:

   **Universal edge cases (include for every problem):**
   - Empty input (empty array, empty string, empty matrix)
   - Single element input
   - Two element input (minimum for pairwise logic)
   - All identical elements
   - Already-solved input (e.g., already sorted, already meets target)
   - Maximum constraint boundary (large n, large values)

   **Numeric array problems — also include:**
   - Negative numbers
   - Mix of negative and positive
   - Zeros
   - Duplicates throughout
   - Values at integer boundaries (0, 1, -1)
   - Sorted ascending, sorted descending
   - Single large outlier value

   **Matrix problems — also include:**
   - 1×1 matrix
   - Single row (1×n)
   - Single column (n×1)
   - Non-square rectangle (3×5, 5×3)
   - Square matrix
   - Large matrix (at least one case with n ≥ 50 for performance confidence)

   **Binary search problems — also include:**
   - Target is first element
   - Target is last element
   - Target is not present (return value depends on problem)
   - Target is smaller than all elements
   - Target is larger than all elements
   - Even-length and odd-length arrays
   - Array of length 1 where target matches/doesn't match

   **Sliding window problems — also include:**
   - Window size equals array length
   - Window size is 1
   - All elements are the same
   - Optimal window is at the very start
   - Optimal window is at the very end

   **String problems — also include:**
   - Empty string
   - Single character
   - All same character
   - Palindrome input
   - Unicode/special characters (if relevant)

   Split test cases into two groups in the JSON:
   - `"exampleCases"`: 3-4 cases shown in the Description tab (used by "Run")
   - `"hiddenCases"`: 8-15 additional edge cases only revealed on "Submit"
   
   This mirrors LeetCode's Run vs Submit behavior and trains the user to think about edge cases they can't see.

6. **Persist editor state** using Electron's `localStorage` or a simple JSON file. When the user switches problems and comes back, their code should be exactly as they left it.

7. **Problem quality gate:** Aim for 50+ high-quality problems before considering the build complete. If 50+ are generated successfully, include the P2 progress tracking and stats dashboard. If not, skip P2 and focus on problem quality.

---

### Test Suite

Include an automated test suite that validates the entire app works correctly. Tests should run via a single command (`npm test`) and cover:

#### Unit Tests

- **Problem loader:** Validates all problem JSON files against the schema. Every problem must have: id, title, difficulty, tags, description, at least 3 exampleCases, at least 8 hiddenCases (10-20 total), starter code, at least 2 solutions (brute force + optimal), and hints.
- **Test harness:** Verify the Python execution harness correctly runs code, captures stdout, handles errors, detects TLE, and returns structured JSON results.
- **Solution verification:** For every problem, run each provided solution against ALL of that problem's test cases (both exampleCases and hiddenCases). Every solution must pass every test case. This is the most critical test — it ensures the solutions, example cases, and hidden edge cases are all consistent and correct.
- **Edge case coverage:** Verify that every problem's hiddenCases includes at least one empty/minimal input case, one boundary value case, and one large input case (where applicable to the problem type).
- **Schema validation:** Validate every problem JSON file has all required fields, correct types, and valid difficulty/tag values.

#### Integration Tests

- **End-to-end execution:** Spawn the Python subprocess with a known problem's starter code (modified to be correct) and verify the results JSON is valid and all tests pass.
- **TLE handling:** Submit an infinite loop and verify the 10s timeout kills the process and returns an appropriate error.
- **Syntax error handling:** Submit code with a syntax error and verify the error message is captured and returned.
- **Runtime error handling:** Submit code that raises an exception and verify the traceback is captured.
- **Edge case inputs:** Verify test cases with empty arrays, single elements, negative numbers, and large inputs execute correctly.

#### Smoke Tests

- **App launch:** Electron app starts without errors.
- **Problem list loads:** All problems appear in the navigator with correct metadata.
- **Editor loads:** Monaco editor initializes with starter code for each problem.
- **Filter works:** Filtering by difficulty and topic returns correct subsets.

**Test command:**

```bash
# Run all tests
npm test

# Run only problem validation (useful after adding new problems)
npm run test:problems

# Run only solution verification
npm run test:solutions
```

---

### Quick Start

Include this as the top section of the project README:

```markdown
# LeetMonk — Offline LeetCode Practice

## Quick Start (macOS)

### Prerequisites
- Node.js 18+ (`brew install node` or [nodejs.org](https://nodejs.org))
- Python 3.9+ (likely already installed — check with `python3 --version`)

### Install & Run (3 commands)

\```bash
# 1. Install dependencies
npm install

# 2. Verify everything works
npm test

# 3. Launch the app
npm run dev
\```

The app opens automatically. Pick a problem and start coding.

### Build Standalone App (optional)

\```bash
npm run build
# → outputs LeetMonk.dmg in dist/
# Double-click to install, drag to Applications
\```

### Adding New Problems

Drop a `.json` file into `data/problems/` following the schema in
[PROBLEM_SCHEMA.md](./PROBLEM_SCHEMA.md), then restart the app or
click the refresh button.

Validate your new problem:
\```bash
npm run test:problems
\```
```
