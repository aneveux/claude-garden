# Learnings-Capture Hook — Design Study

Status: **design only, not implemented.** This documents how a hook could enforce the
§2 Learning Protocol so that workers reliably capture learnings instead of relying on
the spawn-prompt instruction alone.

## Problem

The §2 Learning Protocol asks every implement/review/fix/audit worker to append a line
to `.trellis/STATE.md` Learnings before finishing. It is a prompt instruction, so
compliance is soft — a worker that runs out of steam, or an orchestrator that forgets to
inject §2, silently drops the learning. Trellis's whole "institutional memory" premise
leaks. A hook can turn the soft ask into a checked invariant.

## Candidate events

### Preferred — `SubagentStop`

Fires when a spawned subagent finishes, before its output returns to the orchestrator.
This is the precise moment to check per-worker learning capture. Confirm the installed
Claude Code version exposes `SubagentStop` and passes enough context (the subagent's
`agent_type`/name and `cwd`) before relying on it — if not, fall back to `Stop`.

### Fallback — `Stop`

Fires when the top-level session ends. Already proven in this plugin: `session-save.js`
is a `Stop` hook. Cannot attribute a missing learning to a specific worker, but can catch
"work happened this session, no learning was logged" at the session boundary.

## Detection logic (Stop variant)

Signals available without parsing model text:

1. **Work happened** — read `.trellis/journal.jsonl`, count `worker_complete` events for
   roles `implement | review | fix` (test_writer is exempt: TDD §16 already routes its
   learnings; audit runs via the `/trellis:audit` command and does not emit
   `worker_complete`, so it is out of scope here). The journal is append-only (§15), so
   it is a reliable ledger.
2. **Learning logged** — read `.trellis/STATE.md` Learnings section, count lines whose
   `YYYY-MM-DD` date stamp is today.
3. **Gap** — if (1) > 0 and (2) == 0 → the protocol was skipped this session.

Both files are already part of the trellis contract, so the hook needs no new state.

## Enforcement spectrum

- **Soft nudge (recommended default).** On a detected gap, emit a non-blocking
  `systemMessage` / `additionalContext`: "N workers completed but no learning was logged
  today — consider appending one to STATE.md Learnings (§2)." No loop risk, no teardown
  interference. Matches the tone of the existing `audit-nudge.js`.
- **Block-once (aggressive).** Return `{"decision": "block", "reason": "..."}` to force
  one more turn that writes the learning. Requires a guard so it fires at most once per
  session (e.g. a `.trellis/.learning-nudged` marker keyed to the session id), otherwise
  a worker with genuinely nothing to record loops forever. Only adopt if soft nudges
  prove insufficient in practice.

## Failure modes to respect

- **No trellis project** — if `.trellis/` is absent, exit 0 silently (mirror
  `session-save.js`). This hook is trellis-scoped.
- **Legitimately nothing to learn** — not every session yields a learning. A soft nudge
  tolerates this; a hard block does not. This is the core argument for the soft default.
- **Session teardown safety** — wrap all IO in try/catch and `process.exit(0)` on error,
  with a stdin timeout, exactly as the existing hooks do. Never let a learnings check
  break session close.

## Cross-plugin scope

bark and graft agents also follow §2 (they log to STATE.md when run under trellis). A
single trellis-hosted `Stop` hook covers them whenever trellis is present in the session —
no per-plugin hook needed. If a plugin is used standalone without trellis, there is no
`journal.jsonl` to check and the hook no-ops, which is the correct behavior.

## Wiring (when implemented)

Add a `learnings-capture.js` under `plugins/trellis/hooks/` and register it in
`hooks.json` under `Stop` (or `SubagentStop` if adopted) alongside `session-save.js`.
Model it on `session-save.js` (stdin JSON parse, `data.cwd`, timeout, silent-fail).
