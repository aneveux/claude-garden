#!/usr/bin/env node
// Trellis Context Monitor - PostToolUse hook
//
// Reads context metrics from the statusline bridge file and injects
// trellis-specific warnings when context usage is high.
//
// Depends on: a statusline hook writing /tmp/claude-ctx-{session_id}.json
// (e.g. gsd-statusline.js or safety-net's statusline). If no bridge file
// exists, exits silently — context monitoring is inactive until configured.
//
// To enable: install a statusline plugin that writes context metrics to
// /tmp/claude-ctx-{session_id}.json with fields:
//   { remaining_percentage: <number>, used_pct: <number>, timestamp: <unix_epoch> }
// Then add the statusline hook to your settings (see /safety-net:set-statusline
// or /gsd:settings for built-in options).
//
// Thresholds:
//   WARNING  (remaining <= 35%): Wrap up current task
//   CRITICAL (remaining <= 25%): Stop and save state
//
// Debounce: 5 tool uses between warnings to avoid spam

const fs = require('fs');
const os = require('os');
const path = require('path');

const WARNING_THRESHOLD = 35;
const CRITICAL_THRESHOLD = 25;
const STALE_SECONDS = 60;
const DEBOUNCE_CALLS = 5;

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);
    const sessionId = data.session_id;
    if (!sessionId) process.exit(0);

    const cwd = data.cwd || process.cwd();

    // Only activate when trellis is initialized in this project
    if (!fs.existsSync(path.join(cwd, '.trellis', 'STATE.md'))) {
      process.exit(0);
    }

    const tmpDir = os.tmpdir();
    const metricsPath = path.join(tmpDir, `claude-ctx-${sessionId}.json`);

    // No bridge file = no statusline hook or subagent session
    if (!fs.existsSync(metricsPath)) {
      process.exit(0);
    }

    const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
    const now = Math.floor(Date.now() / 1000);

    if (metrics.timestamp && (now - metrics.timestamp) > STALE_SECONDS) {
      process.exit(0);
    }

    const remaining = metrics.remaining_percentage;
    const usedPct = metrics.used_pct;

    if (remaining > WARNING_THRESHOLD) {
      process.exit(0);
    }

    // Debounce
    const warnPath = path.join(tmpDir, `trellis-ctx-${sessionId}-warned.json`);
    let warnData = { callsSinceWarn: 0, lastLevel: null };
    let firstWarn = true;

    if (fs.existsSync(warnPath)) {
      try {
        warnData = JSON.parse(fs.readFileSync(warnPath, 'utf8'));
        firstWarn = false;
      } catch (e) { /* reset on corruption */ }
    }

    warnData.callsSinceWarn = (warnData.callsSinceWarn || 0) + 1;

    const isCritical = remaining <= CRITICAL_THRESHOLD;
    const currentLevel = isCritical ? 'critical' : 'warning';
    const severityEscalated = currentLevel === 'critical' && warnData.lastLevel === 'warning';

    if (!firstWarn && warnData.callsSinceWarn < DEBOUNCE_CALLS && !severityEscalated) {
      fs.writeFileSync(warnPath, JSON.stringify(warnData));
      process.exit(0);
    }

    warnData.callsSinceWarn = 0;
    warnData.lastLevel = currentLevel;
    fs.writeFileSync(warnPath, JSON.stringify(warnData));

    let message;
    if (isCritical) {
      message =
        `TRELLIS CONTEXT CRITICAL: Usage at ${usedPct}%. Remaining: ${remaining}%. ` +
        'Context is nearly exhausted. Finish the current commit if possible, then inform ' +
        'the user that context is low. Progress is tracked in .trellis/STATE.md — ' +
        'they can run /trellis:status in a fresh session to continue.';
    } else {
      message =
        `TRELLIS CONTEXT WARNING: Usage at ${usedPct}%. Remaining: ${remaining}%. ` +
        'Context is getting limited. Avoid starting new complex work. Wrap up the ' +
        'current task and commit. Progress is saved in .trellis/STATE.md.';
    }

    const output = {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: message
      }
    };

    process.stdout.write(JSON.stringify(output));
  } catch (e) {
    // Silent fail — never block tool execution
    process.exit(0);
  }
});
