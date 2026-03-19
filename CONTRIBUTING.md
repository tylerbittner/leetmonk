# Contributing to LeetMonk

## Feature Agent Contract

When building a new feature (whether via AI coding agent or manually), every PR must include:

### Before merging:
1. **Unit tests** for any new logic (algorithms, data transformations, IPC handlers)
2. **E2E test** in `tests/e2e/` that verifies the feature works end-to-end by:
   - Launching the app
   - Performing the user action
   - Asserting the expected outcome
3. **All existing tests pass** — `npm test` and `npm run test:e2e`
4. **Build succeeds** — `npm run build`

### For AI coding agents specifically:
- DO NOT just verify compilation. Verify the feature WORKS.
- Write the E2E test FIRST, then implement the feature.
- After implementing, run the E2E test and include the passing output in your commit message.
- If the feature touches Settings, verify persistence (save → quit → relaunch → check).
- If the feature touches the editor, verify with both Python and JavaScript.

## Smoke Test Checklist

Run after every merge to main. Automated via `npm run test:e2e`, but also useful as a manual reference.

### Core
- [ ] App launches without errors
- [ ] Problem list loads (86 problems visible)
- [ ] Selecting a problem shows description + editor
- [ ] Writing code and clicking Run shows test results
- [ ] Submitting correct solution shows all tests passing + celebration

### Languages
- [ ] Python execution works
- [ ] JavaScript execution works
- [ ] Switching language preserves code per-language
- [ ] Language selection persists per problem

### Settings (⌘,)
- [ ] Settings panel opens via menu bar
- [ ] Font size slider changes editor font in real-time
- [ ] Vim keybindings toggle activates/deactivates vim mode
- [ ] Minimal focus mode hides sidebar and chrome
- [ ] Celebration effect switches between lotus/confetti/none
- [ ] Sound toggle enables/disables bell
- [ ] Timer visibility toggle works
- [ ] ALL settings persist across app restart

### Features
- [ ] Pattern Library renders with mastery indicators
- [ ] Clicking a pattern expands to show template + details
- [ ] Session Planner opens, generates problems, starts session
- [ ] Session bar shows progress, Next/End buttons work
- [ ] Solution Diff opens after viewing Solutions tab
- [ ] Review Flag popup renders without clipping
- [ ] Rating Modal appears after successful submit
- [ ] Due problems show in Review Queue with correct status colors
- [ ] Bug Report modal pre-fills context

### Navigation
- [ ] Keyboard shortcuts work (Cmd+Enter, Cmd+Shift+Enter, Cmd+[, Cmd+])
- [ ] Sidebar collapse/expand is smooth
- [ ] Window drags from title bar like native macOS

## Integration Testing

After merging multiple feature branches:
1. Run `npm test` (unit + FSRS + settings tests)
2. Run `npm run test:e2e` (full Playwright suite)
3. Manually verify 2-3 items from the Smoke Checklist that involve visual/audio output
