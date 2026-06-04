#!/usr/bin/env node
// Trellis Command Compressor - PreToolUse hook (Bash matcher)
//
// Rewrites high-output Bash commands to use RTK before they execute,
// so the tool output that enters the model context is already compact.
//
// Requires: rtk (Rust Token Killer) installed and on PATH.
// Install: see https://github.com/aneveux/rtk or project toolchain docs.
//
// How it works:
//   PreToolUse fires before the Bash tool executes. This hook inspects
//   the command and, when it matches a high-output pattern, prepends
//   the appropriate rtk subcommand. The rewritten command runs in place
//   of the original — the model sees compact output directly.
//
// This is the correct approach for Claude Code's hook model. PostToolUse
// can only inject additionalContext (appended messages); it cannot suppress
// or replace the raw tool output. PreToolUse command rewriting achieves
// true compression because the output never enters context at full size.
//
// Coverage: test runners, build tools, git log/diff, grep, ls-heavy
// Exclusions: simple reads, writes, edits (already compact)
// Savings estimate: 30-60% on covered commands (rtk global avg: 42%)

const { execSync } = require('child_process');

// Check if rtk is available (cached per process)
let rtkAvailable = null;
function hasRtk() {
  if (rtkAvailable === null) {
    try {
      execSync('which rtk', { stdio: 'ignore' });
      rtkAvailable = true;
    } catch {
      rtkAvailable = false;
    }
  }
  return rtkAvailable;
}

// Map command prefixes/patterns to rtk subcommands.
// Order matters — first match wins.
const REWRITE_RULES = [
  // Test runners — show only failures
  { pattern: /^(npm (run )?test|yarn test|pnpm test|jest|vitest|pytest|cargo test|go test)\b/, rtk: 'test' },
  // TypeScript compiler
  { pattern: /^(npx )?tsc(\s|$)/, rtk: 'tsc' },
  // Linters
  { pattern: /^(npx )?eslint\b/, rtk: 'lint' },
  { pattern: /^(npx )?ruff\b/, rtk: 'ruff' },
  // Build commands with verbose output
  { pattern: /^npm run build\b/, rtk: 'npm' },
  { pattern: /^(npx )?next build\b/, rtk: 'next' },
  // Git — compact log and diff (not status/commit — those are already short)
  { pattern: /^git log\b/, rtk: 'git' },
  { pattern: /^git diff\b/, rtk: 'diff' },
  // Directory listings (recursive / verbose)
  { pattern: /^ls -[a-zA-Z]*R[a-zA-Z]*\b/, rtk: 'ls' },
  { pattern: /^find\s+\S+\s+.*-name\b/, rtk: 'find' },
  // Grep — compact multi-match output
  { pattern: /^grep\b/, rtk: 'grep' },
  // GitHub CLI — API and list commands produce large JSON/tables
  { pattern: /^gh (api|pr list|issue list|run list)\b/, rtk: 'gh' },
  // Curl — auto-JSON detection
  { pattern: /^curl\b/, rtk: 'curl' },
];

// Commands to never rewrite — they're already short or semantically
// important to preserve verbatim (commits, edits, targeted reads).
const EXCLUDE_PATTERNS = [
  /^git (status|commit|checkout|merge|rebase|add|reset|stash|tag|push|pull|fetch|rev-parse|diff --name-only)\b/,
  /^cat\b/,
  /^echo\b/,
  /^mkdir\b/,
  /^touch\b/,
  /^mv\b/,
  /^cp\b/,
  /^rm\b/,
];

function rewriteCommand(cmd) {
  const trimmed = cmd.trim();

  for (const exc of EXCLUDE_PATTERNS) {
    if (exc.test(trimmed)) return null;
  }

  for (const rule of REWRITE_RULES) {
    if (rule.pattern.test(trimmed)) {
      return `rtk ${rule.rtk} ${trimmed}`;
    }
  }

  return null;
}

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => (input += chunk));
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);

    // Only act on Bash tool calls with a command field
    if (data.tool_name !== 'Bash' || !data.tool_input?.command) {
      process.exit(0);
    }

    // Only activate when trellis is initialized in this project
    const fs = require('fs');
    const path = require('path');
    const cwd = data.cwd || process.cwd();
    if (!fs.existsSync(path.join(cwd, '.trellis', 'STATE.md'))) {
      process.exit(0);
    }

    if (!hasRtk()) {
      process.exit(0);
    }

    const rewritten = rewriteCommand(data.tool_input.command);
    if (!rewritten) {
      process.exit(0);
    }

    // Return the rewritten command via hookSpecificOutput
    const output = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
        updatedInput: {
          command: rewritten,
        },
      },
    };

    process.stdout.write(JSON.stringify(output));
  } catch {
    // Silent fail — never block tool execution
    process.exit(0);
  }
});
