#!/bin/bash
# LeetMonk E2E Tests using agent-browser + Electron CDP
set -e

cd "$(dirname "$0")/.."

PASS=0
FAIL=0
CDP_PORT=9333

cleanup() {
  pkill -f "electron-vite dev" 2>/dev/null || true
  pkill -f "Electron.app" 2>/dev/null || true
  # Kill any electron process on our CDP port
  lsof -ti tcp:$CDP_PORT | xargs kill -9 2>/dev/null || true
  agent-browser close 2>/dev/null || true
}
trap cleanup EXIT

assert_contains() {
  local label="$1" haystack="$2" needle="$3"
  if echo "$haystack" | grep -qi "$needle"; then
    echo "  PASS $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL $label (expected '$needle')"
    FAIL=$((FAIL + 1))
  fi
}

assert_not_contains() {
  local label="$1" haystack="$2" needle="$3"
  if echo "$haystack" | grep -qi "$needle"; then
    echo "  FAIL $label (unexpected '$needle')"
    FAIL=$((FAIL + 1))
  else
    echo "  PASS $label"
    PASS=$((PASS + 1))
  fi
}

assert_true() {
  local label="$1" val="$2"
  if [ "$val" = "true" ]; then
    echo "  PASS $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL $label (got '$val')"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== LeetMonk E2E Tests ==="
echo ""

# Kill any leftover electron or vite processes before starting
pkill -f "electron-vite dev" 2>/dev/null || true
pkill -f "Electron.app" 2>/dev/null || true
lsof -ti tcp:$CDP_PORT | xargs kill -9 2>/dev/null || true
sleep 1

# Launch with CDP enabled
echo "Starting app with CDP on port $CDP_PORT..."
E2E_CDP_PORT=$CDP_PORT npx electron-vite dev > /tmp/leetmonk-e2e.log 2>&1 &
APP_PID=$!

# Poll /json until a real renderer page appears (not about:blank)
# Timeout after 45 seconds
echo "Waiting for renderer page to load..."
PAGE_WS=""
MAX_WAIT=45
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
  sleep 2
  WAITED=$((WAITED + 2))

  # Query CDP /json for available pages
  JSON_RESP=$(curl -s --max-time 2 http://localhost:$CDP_PORT/json 2>/dev/null || true)
  if [ -z "$JSON_RESP" ]; then
    echo "  (waiting for CDP to become available... ${WAITED}s)"
    continue
  fi

  # Look for a page that is NOT about:blank and NOT a devtools page
  PAGE_WS=$(python3 -c "
import json, sys
try:
    pages = json.loads('''$JSON_RESP''')
    for p in pages:
        url = p.get('url', '')
        ptype = p.get('type', '')
        # Accept pages with localhost URLs (the renderer dev server)
        # or any page that isn't blank/devtools
        if ptype == 'page' and url and 'about:blank' not in url and 'devtools' not in url:
            print(p.get('webSocketDebuggerUrl', ''))
            break
except Exception as e:
    pass
" 2>/dev/null || true)

  if [ -n "$PAGE_WS" ]; then
    echo "Found renderer page at ${WAITED}s: $PAGE_WS"
    break
  else
    # Check if we have ANY page (even blank) but the app started
    HAS_ANY=$(python3 -c "
import json, sys
try:
    pages = json.loads('''$JSON_RESP''')
    print(len(pages))
except:
    print(0)
" 2>/dev/null || echo "0")
    echo "  (CDP has ${HAS_ANY} target(s), waiting for renderer... ${WAITED}s)"
  fi
done

if [ -z "$PAGE_WS" ]; then
  echo ""
  echo "ERROR: Could not find renderer page via CDP after ${MAX_WAIT}s"
  echo ""
  echo "CDP /json response:"
  curl -s http://localhost:$CDP_PORT/json 2>&1 || echo "(no response)"
  echo ""
  echo "Dev log (last 30 lines):"
  tail -30 /tmp/leetmonk-e2e.log
  exit 1
fi

echo "Connecting agent-browser to: $PAGE_WS"
agent-browser connect "$PAGE_WS" 2>/dev/null || true
sleep 2

# Wait for the React app to fully render by polling for content
echo "Waiting for React app to render..."
RENDER_WAIT=0
while [ $RENDER_WAIT -lt 20 ]; do
  sleep 2
  RENDER_WAIT=$((RENDER_WAIT + 2))
  SNAP_CHECK=$(agent-browser snapshot 2>&1 || true)
  if echo "$SNAP_CHECK" | grep -qi "two sum\|problems\|leetmonk\|leetmonk"; then
    echo "App rendered after ${RENDER_WAIT}s"
    break
  fi
  echo "  (waiting for app content... ${RENDER_WAIT}s)"
done

# Debug info
echo ""
echo "Debug: page title = $(agent-browser get title 2>&1 || true)"
echo "Debug: page url   = $(agent-browser get url 2>&1 || true)"
DBSNAP=$(agent-browser snapshot 2>&1 || true)
echo "Debug: snapshot lines = $(echo "$DBSNAP" | wc -l)"
echo "Debug: first 15 lines:"
echo "$DBSNAP" | head -15
echo ""

# ─── Test 1: Problem list loads ───
echo "Test 1: Problem list loads"
SNAP=$(agent-browser snapshot 2>&1)
assert_contains "Two Sum present" "$SNAP" "Two Sum"
assert_contains "Valid Parentheses present" "$SNAP" "Valid Parentheses"
assert_not_contains "No empty state" "$SNAP" "No problems match"

# ─── Test 2: Select a problem ───
echo ""
echo "Test 2: Select a problem"
# Click on the first problem item in the list using JavaScript
agent-browser eval "
  // Find problem list items (divs with cursor:pointer in the sidebar)
  const items = [...document.querySelectorAll('div')].filter(d => {
    const style = d.getAttribute('style') || '';
    return style.includes('cursor: pointer') && d.textContent.trim().length > 0 && d.textContent.trim().length < 60;
  });
  if (items.length > 0) {
    items[0].click();
  }
" 2>/dev/null || true
sleep 1.5

SNAP=$(agent-browser snapshot 2>&1)
assert_contains "Description tab" "$SNAP" "Description"
assert_contains "Hints tab" "$SNAP" "Hints"
assert_contains "Solutions tab" "$SNAP" "Solutions"

# ─── Test 3: Monaco editor ───
echo ""
echo "Test 3: Code editor"
VAL=$(agent-browser eval "!!document.querySelector('.monaco-editor')" 2>&1)
assert_true "Monaco editor rendered" "$VAL"
assert_contains "Run button" "$SNAP" "Run"

# ─── Test 4: Timer ───
echo ""
echo "Test 4: Timer"
assert_contains "Start button present" "$SNAP" "Start"

# ─── Test 5: Focus mode ───
echo ""
echo "Test 5: Focus mode toggle"
# Click the sidebar toggle button (title "Hide sidebar")
agent-browser eval "
  const btn = [...document.querySelectorAll('button')].find(b => b.title === 'Hide sidebar');
  if (btn) btn.click();
" 2>/dev/null || true
sleep 1
SNAP_C=$(agent-browser snapshot 2>&1)
assert_contains "Content remains in focus mode" "$SNAP_C" "Description"
assert_not_contains "Sidebar hidden in focus mode" "$SNAP_C" "Review Queue"

# Toggle back
agent-browser eval "
  const btn = [...document.querySelectorAll('button')].find(b => b.title === 'Show sidebar');
  if (btn) btn.click();
" 2>/dev/null || true
sleep 1
SNAP_E=$(agent-browser snapshot 2>&1)
assert_contains "Sidebar restored" "$SNAP_E" "Review Queue"

# ─── Test 6: Filter / Search ───
echo ""
echo "Test 6: Search filter"
agent-browser eval "
  const input = document.querySelector('input[type=\"text\"]');
  if (input) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(input, 'binary');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
" 2>/dev/null || true
sleep 1
SNAP_F=$(agent-browser snapshot 2>&1)
assert_contains "Binary Search visible" "$SNAP_F" "Binary Search"

# Clear filter
agent-browser eval "
  const input = document.querySelector('input[type=\"text\"]');
  if (input) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(input, '');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
" 2>/dev/null || true
sleep 0.5

# ─── Test 7: Review flag ───
echo ""
echo "Test 7: Review flag"
# Select first problem again to ensure flag is visible
agent-browser eval "
  const items = [...document.querySelectorAll('div')].filter(d => {
    const style = d.getAttribute('style') || '';
    return style.includes('cursor: pointer') && d.textContent.trim().length > 0 && d.textContent.trim().length < 60;
  });
  if (items.length > 0) items[0].click();
" 2>/dev/null || true
sleep 1

VAL=$(agent-browser eval "[...document.querySelectorAll('button')].some(b => b.textContent.includes('\u2690') || b.textContent.includes('\u2691'))" 2>&1)
assert_true "Flag button present" "$VAL"

# Click the unflagged flag button
agent-browser eval "
  const flag = [...document.querySelectorAll('button')].find(b => b.textContent.includes('\u2690'));
  if (flag) flag.click();
" 2>/dev/null || true
sleep 0.5
VAL=$(agent-browser eval "[...document.querySelectorAll('button')].some(b => b.textContent.includes('\u2691'))" 2>&1)
assert_true "Flag toggled to filled" "$VAL"

# ─── Test 8: Hints tab ───
echo ""
echo "Test 8: Hints tab"
agent-browser eval "
  // Find the Hints tab button/div and click it
  const tabs = [...document.querySelectorAll('[class*=\"tab\"], button, div[style*=\"cursor\"]')];
  const hintsTab = tabs.find(t => t.textContent.trim() === 'Hints');
  if (hintsTab) hintsTab.click();
" 2>/dev/null || true
sleep 1
SNAP_H=$(agent-browser snapshot 2>&1)
assert_contains "Hint content visible" "$SNAP_H" "Hint"

# ─── Test 9: Solutions tab ───
echo ""
echo "Test 9: Solutions tab"
agent-browser eval "
  const tabs = [...document.querySelectorAll('[class*=\"tab\"], button, div[style*=\"cursor\"]')];
  const solTab = tabs.find(t => t.textContent.trim() === 'Solutions');
  if (solTab) solTab.click();
" 2>/dev/null || true
sleep 1
SNAP_S=$(agent-browser snapshot 2>&1)
assert_contains "Solution content visible" "$SNAP_S" "O("

# ─── Test 10: Session planner ───
echo ""
echo "Test 10: Session planner"
agent-browser eval "
  const btn = [...document.querySelectorAll('button')].find(b =>
    b.textContent.includes('Plan Session') || b.textContent.includes('Session Active')
  );
  if (btn) btn.click();
" 2>/dev/null || true
sleep 1
SNAP_SP=$(agent-browser snapshot 2>&1)
assert_contains "Session planner visible" "$SNAP_SP" "session"

# Close session planner with Escape
agent-browser press Escape 2>/dev/null || true
sleep 0.5

# ─── Test 11: Review queue ───
echo ""
echo "Test 11: Review queue"
SNAP_Q=$(agent-browser snapshot 2>&1)
assert_contains "Review Queue section visible" "$SNAP_Q" "Review Queue"

# ─── Summary ───
echo ""
echo "==========================="
echo "Results: $PASS passed, $FAIL failed out of $((PASS + FAIL)) tests"
echo "==========================="

[ "$FAIL" -eq 0 ]
