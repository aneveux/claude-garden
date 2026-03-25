#!/usr/bin/env node
// Waddle Audit Nudge - PostToolUse hook
//
// Counts git commits and nudges (or auto-triggers) when audit thresholds
// are reached. Reads config from .waddle/waddle.yaml stewardship section.
//
// Behavior:
//   - Only activates on Bash tool calls that contain "git commit" (not --amend)
//   - Increments per-lens commit counters in .waddle/.audit-tracker.json
//   - When a lens counter hits its configured frequency:
//     - mode: "nudge" -> injects a reminder via additionalContext
//     - mode: "auto"  -> injects an auto-trigger directive
//   - Smart triggering: if committed files match a lens's trigger patterns
//     and the counter is above 50% of threshold, triggers early
//   - Debounces: one nudge per session to avoid spam

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Lens trigger patterns (security-relevant files trigger early)
const LENS_TRIGGERS = {
  security: /auth|secret|credential|token|\.env|session|security/i,
  architecture: /package\.json|go\.mod|pom\.xml|build\.gradle|Cargo\.toml/i
};

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

    // Only activate on Bash tool calls
    if (data.tool_name !== 'Bash') process.exit(0);

    // Only activate on git commit (not --amend)
    const cmd = (data.tool_input && data.tool_input.command) || '';
    if (!/git\s+commit\b/.test(cmd) || /--amend/.test(cmd)) process.exit(0);

    // Skip if the commit failed (don't inflate counters on errors)
    const result = String(data.tool_result || '');
    if (/^error:|nothing to commit|no changes added|aborting commit/im.test(result)) process.exit(0);

    // Check waddle is initialized
    const waddleDir = path.join(cwd, '.waddle');
    const yamlPath = path.join(waddleDir, 'waddle.yaml');
    if (!fs.existsSync(yamlPath)) process.exit(0);

    // Read waddle.yaml for stewardship config (simple YAML parse)
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    const audits = parseAuditsConfig(yamlContent);
    if (!audits) process.exit(0);

    // Read or create tracker
    const trackerPath = path.join(waddleDir, '.audit-tracker.json');
    let tracker = {
      commits: {
        consistency: 0, security: 0, architecture: 0,
        vision: 0, dx: 0, debt: 0
      },
      last_audit: {},
      last_nudge: null
    };

    if (fs.existsSync(trackerPath)) {
      try {
        tracker = JSON.parse(fs.readFileSync(trackerPath, 'utf8'));
      } catch (e) { /* use default on corruption */ }
    }

    // Increment all lens counters
    for (const lens of Object.keys(tracker.commits)) {
      tracker.commits[lens] = (tracker.commits[lens] || 0) + 1;
    }

    // Get changed files for smart triggering
    let changedFiles = '';
    try {
      changedFiles = execSync('git diff --name-only HEAD~1..HEAD 2>/dev/null', {
        cwd,
        encoding: 'utf8',
        timeout: 5000
      });
    } catch (e) { /* ignore */ }

    // Check each lens against thresholds
    const messages = [];
    for (const [lens, config] of Object.entries(audits)) {
      if (!config.frequency || config.frequency <= 0) continue;

      const count = tracker.commits[lens] || 0;
      const threshold = config.frequency;
      const mode = config.mode || 'nudge';

      // Smart triggering: early trigger if changed files match lens patterns
      const triggerPattern = LENS_TRIGGERS[lens];
      const earlyTrigger = triggerPattern && changedFiles &&
        triggerPattern.test(changedFiles) && count >= threshold * 0.5;

      if (count >= threshold || earlyTrigger) {
        if (mode === 'auto') {
          messages.push(
            `WADDLE AUDIT AUTO-TRIGGER: ${lens.charAt(0).toUpperCase() + lens.slice(1)} audit threshold reached ` +
            `(${count} commits since last ${lens} audit). Run /waddle:audit ${lens} ` +
            `before continuing with other work. ${lens.charAt(0).toUpperCase() + lens.slice(1)} audits are configured ` +
            `to run automatically at this threshold.`
          );
        } else {
          messages.push(
            `WADDLE AUDIT NUDGE: It's been ${count} commits since your last ${lens} audit. ` +
            `Consider running /waddle:audit ${lens} when you have a moment. ` +
            `(Configure thresholds in .waddle/waddle.yaml under stewardship.audits)`
          );
        }
      }
    }

    // Debounce: one nudge per session
    if (messages.length > 0) {
      const tmpDir = require('os').tmpdir();
      const nudgePath = path.join(tmpDir, `waddle-audit-${sessionId}-nudged`);

      if (fs.existsSync(nudgePath)) {
        // Already nudged this session — only re-nudge for auto-trigger
        const hasAuto = messages.some(m => m.includes('AUTO-TRIGGER'));
        if (!hasAuto) {
          fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2));
          process.exit(0);
        }
      }

      fs.writeFileSync(nudgePath, Date.now().toString());
    }

    // Save tracker
    fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2));

    // Output message if any
    if (messages.length > 0) {
      const output = {
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: messages.join('\n\n')
        }
      };
      process.stdout.write(JSON.stringify(output));
    }
  } catch (e) {
    // Silent fail — never block tool execution
    process.exit(0);
  }
});

/**
 * Minimal YAML parser for the stewardship.audits section.
 * Returns { lens: { frequency, mode } } or null.
 *
 * Assumes 2-space indent (matches waddle.yaml.template format).
 * Not a general-purpose parser — only handles the structure waddle creates.
 */
function parseAuditsConfig(yaml) {
  const lines = yaml.split('\n');
  const result = {};
  let inStewardship = false;
  let inAudits = false;
  let currentLens = null;

  for (const line of lines) {
    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;

    if (trimmed.startsWith('stewardship:')) {
      inStewardship = true;
      inAudits = false;
      continue;
    }

    if (inStewardship && indent === 0 && trimmed.length > 0 && !trimmed.startsWith('#')) {
      break; // left stewardship section
    }

    if (inStewardship && trimmed.startsWith('audits:')) {
      inAudits = true;
      continue;
    }

    if (inAudits) {
      // Left audits section (back to stewardship-level or top-level key)
      if (indent <= 2 && trimmed.length > 0 && !trimmed.startsWith('#') &&
          !trimmed.startsWith('audits')) {
        inAudits = false;
        currentLens = null;
        // Don't consume the line — let the outer loop re-check it
        break;
      }

      // Lens name at indent 4 (e.g., "    consistency:")
      const lensMatch = trimmed.match(/^(\w+):$/);
      if (lensMatch && !trimmed.startsWith('frequency') && !trimmed.startsWith('mode')) {
        currentLens = lensMatch[1];
        result[currentLens] = { frequency: 0, mode: 'nudge' };
        continue;
      }

      // Lens properties at indent 6 (e.g., "      frequency: 8")
      if (currentLens) {
        const freqMatch = trimmed.match(/^frequency:\s*(\d+)/);
        if (freqMatch) {
          result[currentLens].frequency = parseInt(freqMatch[1], 10);
          continue;
        }
        const modeMatch = trimmed.match(/^mode:\s*(\w+)/);
        if (modeMatch) {
          result[currentLens].mode = modeMatch[1];
          continue;
        }
      }
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}
