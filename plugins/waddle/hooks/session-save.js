#!/usr/bin/env node
// Waddle Session Save - Stop hook
//
// Updates .waddle/STATE.md "Last:" timestamp when a session ends.
// Keeps STATE.md accurate for session continuity — the next session
// can see when work last happened via /waddle:status.
//
// Design: intentionally minimal. Just update the timestamp line.
// Complex state saving is handled by the waddle commands themselves.

const fs = require('fs');
const path = require('path');

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);
    const cwd = data.cwd || process.cwd();
    const statePath = path.join(cwd, '.waddle', 'STATE.md');

    if (!fs.existsSync(statePath)) {
      process.exit(0);
    }

    const content = fs.readFileSync(statePath, 'utf8');
    const now = new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');

    // Line-by-line replacement — robust regardless of blank lines or section ordering.
    // STATE.md has exactly one "Last:" line, always in the ## Current section.
    const lines = content.split('\n');
    const idx = lines.findIndex(l => l.startsWith('Last: '));
    if (idx === -1) {
      process.exit(0);
    }
    lines[idx] = `Last: ${now}`;
    const updated = lines.join('\n');

    if (updated !== content) {
      fs.writeFileSync(statePath, updated);
    }
  } catch (e) {
    // Silent fail — don't interfere with session teardown
    process.exit(0);
  }
});
