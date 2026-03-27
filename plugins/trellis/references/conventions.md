# Trellis Conventions

Protocols injected into worker spawn prompts by the trellis command.

## 1. Commit Protocol

```
COMMIT RULES:
- One logical change = one commit
- Check project CLAUDE.md for commit conventions (command overrides, message format, etc.)
- If CLAUDE.md has no commit conventions, use standard git commit with a clear message
- After committing, note the short hash for STATE.md progress tracking
```

## 2. Learning Protocol

```
LEARNING RULES:
- Before finishing ANY task, ask yourself: did I discover anything non-obvious
  about this codebase that would help future work?
- If yes, append ONE line to the Learnings section of .trellis/STATE.md:
  - YYYY-MM-DD | <concise discovery>
- Good learnings: conventions, gotchas, env requirements, patterns, tool quirks
- Bad learnings: obvious things, task-specific details that won't recur
- This is how trellis builds institutional memory — learnings from this session
  prevent repeated debugging in future sessions.
```

## 3. Review Protocol

```
REVIEW PROTOCOL - FOUR-PASS ESCALATING SCRUTINY:

PASS 1 - SPEC COMPLIANCE:
  Check every plan task against the implementation. Was each task completed
  as specified? Are the file paths correct? Any silent reinterpretations
  where the implementer changed scope without noting it?
  Question: "Does the implementation match what was planned?"

PASS 2 - FUNCTIONAL:
  Run tests. Check imports. Verify behavior against done_when criteria.
  Question: "Does it work as specified?"

PASS 3 - CHALLENGE:
  Question assumptions. Look for edge cases. Check error handling.
  Missing tests? Incomplete error paths? Race conditions?
  Question: "What did the implementer miss?"

PASS 4 - ADVERSARIAL:
  Security vulnerabilities? Performance under load? Memory leaks?
  Maintainability concerns? Would a senior reviewer reject this PR?
  Question: "What would break in production?"

OUTPUT FORMAT:
  ## Review: <plan title>

  <trellis:verdict>PASS</trellis:verdict>
  or
  <trellis:verdict>FIXME</trellis:verdict>

  The XML tag is the machine-readable verdict — the orchestrator parses it to decide
  the next step. It must appear on its own line. The markdown summary below is the
  human-readable version of the same verdict. Both are required: the tag for automation,
  the summary for the user reading the review.

  **Verdict: PASS | FIXME** (N issues)

  ### FIXME (blocking - must be fixed)
  1. `file:line` - Description. Suggested fix.

  ### NOTES (non-blocking observations)
  - Future improvement suggestions

  ### LEARNINGS (codebase discoveries)
  - Patterns or conventions found during review
```

## 4. Specialist Delegation Protocol

```
SPECIALIST DELEGATION:
- Before implementing, check .trellis/trellis.yaml for specialists config
- If a specialist is configured for this task's domain:
  1. Spawn the specialist agent with task description
  2. Include in prompt: "Implement [task]. Follow your conventions. Do NOT commit."
  3. Wait for specialist to finish
  4. Review the code against plan criteria yourself
  5. Commit with trellis commit protocol
  6. Log learnings
- If no specialist configured: implement directly
- The specialist handles code quality. You handle protocol (commits, learning, criteria).

Domain detection — match the task's primary files against specialist keys in trellis.yaml:
  Priority: explicit mention in task > 80%+ of files match > fallback to direct implementation
  - bash: .sh, .bash files, Makefile targets, or explicit "bash/shell" in task
  - java: .java, .kt files, pom.xml, build.gradle, or explicit "java/kotlin" in task
  - go: .go files, go.mod, or explicit "go/golang" in task
  - python: .py files, or explicit "python" in task
  - For any other specialist key: match file extensions or explicit mentions in task
  - Multiple domains or unclear: implement directly (specialists add value for domain
    clarity, not ambiguity)
```

## 5. Pending Decisions Protocol

```
PENDING DECISIONS:
- When you encounter a question that needs user input or a choice that could
  go either way, log it to .trellis/STATE.md under Pending Decisions:
  - Format: - <concise question or decision needed>
- Examples of pending decisions:
  - "Redis vs in-memory for rate limit store"
  - "Should validation errors return 400 or 422?"
  - "Test DB: SQLite for speed or Postgres for parity?"
- Remove a decision from the list after it's been resolved
- Make a reasonable default choice, implement it, and log the decision so the
  user can revisit. Blocking on decisions stalls the entire pipeline — a logged
  default that can be changed later is better than no progress.
```

## 6. State Update Protocol

```
STATE UPDATE:
- After completing tasks, update .trellis/STATE.md:
  - Progress: N/M tasks done (commits: hash1, hash2, ...)
  - Last: YYYY-MM-DD HH:MM
- After discovering learnings, append to Learnings section
- After all work is complete, set Focus to "idle" or describe what's next
```

## 7. Implementation Integrity

```
IMPLEMENTATION INTEGRITY:
The review worker catches shortcuts — but late catches waste a full fix/review
cycle. Watch for these patterns:

- Plan says Y but you think user meant X → implement Y, log ambiguity as pending decision
- "Too simple to test" → simple cases are where assumptions hide
- "I'll clean up later" → no later in a single-session agent. Ship clean or flag it.
- "This edge case won't happen" → if you can name it, handle it or document why it's out of scope
```

## 8. Verification Before Completion

```
VERIFICATION BEFORE COMPLETION:
Before declaring any task done, produce fresh evidence that it works:
1. Run tests (or relevant subset). Read output. Don't assume green.
2. Check each done_when criterion against actual state — run the command, read the file.
3. If a criterion can't be verified, note it as unverified rather than silently claiming it.
Self-verification saves a full fix/re-review cycle if something is broken.
```

## 9. Stewardship Protocol

Used during planning phase (do.md, path-standard, path-complex). Implementation
workers use §5 (Pending Decisions) to capture new technical choices instead.

```
STEWARDSHIP RULES:
- During planning, before drafting tasks, check if stewardship documents exist:
  - Read VISION.md (path from trellis.yaml stewardship.vision)
  - Read DECISIONS.md (path from trellis.yaml stewardship.decisions)
  - Read ARCHITECTURE.md (path from trellis.yaml stewardship.architecture) if configured
- If VISION.md exists:
  - Check the proposed work against principles: does this support at least one?
  - Check against non-goals: does this violate any?
  - If misalignment found: flag it in the plan with a NOTE, don't silently proceed
- If DECISIONS.md exists:
  - Check if the proposed approach conflicts with any accepted ADR
  - If conflict: flag it. Either the approach needs to change, or the ADR needs updating
- When making significant technical choices during implementation:
  - If the choice isn't covered by an existing ADR, note it as a Pending Decision
    so the user can add it to DECISIONS.md later
- After completing work that changes project structure:
  - Note if ARCHITECTURE.md needs updating (add to Pending Decisions)
```

## 10. Backlog Protocol

```
BACKLOG RULES:
- The backlog (.trellis/BACKLOG.md) is the unified inbox for actionable work items.
  Three sources feed it: user ideas, audit findings, and retro observations.
- After audit: append critical and warning findings to BACKLOG.md under their
  severity heading. Read the current backlog first — skip findings that duplicate
  existing open items from the same lens.
- After /trellis:do completion: check BACKLOG.md for items that were addressed.
  Mark them [x] and move to the Done section with a completion date.
- Severity mapping:
  - audit critical -> ### Critical
  - audit warning  -> ### Warning
  - user ideas     -> ### Normal (unless user specifies urgency)
- Entry format: - [ ] <description> — `<source>` <date>
  - source format: `audit:<lens>`, `user`, `retro`
  - Example: - [ ] 3 endpoints missing rate limiting — `audit:security` 2026-03-25
- Done format: - [x] <description> — `<source>` done <date>
- Stale items: open items older than 30 days should be flagged during retro
  for triage (archive, escalate, or keep).
- Pending Decisions in STATE.md is for genuine choices needing human judgment
  (e.g., "Redis vs in-memory?"). Actionable tasks go to the backlog instead.
```

## 11. Audit Protocol

```
AUDIT RULES (for AUDIT workers spawned by /trellis:audit):
- You are an observer. Do NOT modify any source code. Only create the audit report.
- Read the lens definition to understand what you're checking and where to look.
- Ground every finding in evidence:
  - Name the specific file(s) and line(s)
  - Quote the relevant code or pattern
  - Connect to a specific principle, decision, or convention that it violates
- Severity classification:
  - critical: Active risk -- security vulnerability, data loss potential, broken contract
  - warning: Quality drift -- inconsistency, missing validation, tech debt accumulating
  - info: Observation -- not wrong, but worth noting (potential improvement, style drift)
- Do NOT inflate severity. A naming inconsistency is a warning, not critical.
- Check your findings against CLAUDE.md gotchas -- if the project already knows about
  something and has a documented workaround, don't report it as a finding.
- The report format is specified by the orchestrator. Follow it exactly.
- Log learnings to STATE.md (same Learning Protocol as other workers).
```

## 12. Visual Identity Protocol

```
VISUAL IDENTITY:
Trellis has a plant-themed personality. Every user-facing message should carry
a plant marker so the user always knows they're interacting with trellis.

LIFECYCLE EMOJIS — prefix the first text line of every user-facing output:
  🌱  Starting, planning, ideas (seedling stage)
  🌿  In-progress, implementing, working (growth stage)
  🌸  Review, feedback, audit results (bloom stage)
  🌳  Completion, done, idle status (mature tree)

For multi-phase operations (like audits), use the emoji matching the current phase:
  🌱 when starting/scoping, 🌿 while analyzing, 🌸 when presenting results.

ASCII ART FRAMING — all ASCII art code blocks use horizontal rule frames:
  - First line after opening ```: ─────────────────────────────────────────────
  - Last line before closing ```: ─────────────────────────────────────────────
  - The frame protects the art from first-line whitespace clipping
  - The emoji goes on the message line inside the art, not on the frame

NON-ART MESSAGES — when outputting text without ASCII art:
  - Prefix with the lifecycle emoji matching the current stage
  - Examples:
    "🌱 This looks like a standard task. Planning..."
    "🌿 Spawning implement worker..."
    "🌸 Review found 2 issues."
    "🌳 All done! Plan #003 complete."
  - One emoji per message block is enough — don't overdo it
```

## Machine-Parseable Output Tags

Workers produce structured outputs that orchestrators parse via regex. Tags must appear on their own line.

| Output | Tag | Expected values |
|--------|-----|-----------------|
| Review verdict | `<trellis:verdict>PASS\|FIXME</trellis:verdict>` | PASS or FIXME |
| Plan file path | `<trellis:plan_path>path/to/file.md</trellis:plan_path>` | Plan file path |

If a tag is missing from worker output, treat as FIXME (for verdict) or re-glob `.trellis/plans/*.md` (for plan path).

## Injection Map

Which sections to paste into each worker's spawn prompt. Inject only what the role
needs — extra sections waste context tokens without helping the worker.

| Section | IMPLEMENT | REVIEW | FIX | PLAN | AUDIT |
|---------|-----------|--------|-----|------|-------|
| §1 Commit Protocol | yes | — | yes | — | — |
| §2 Learning Protocol | yes | yes | yes | — | yes |
| §3 Review Protocol | — | yes | — | — | — |
| §4 Specialist Delegation | yes | — | — | — | — |
| §5 Pending Decisions | yes | — | — | — | — |
| §6 State Update | yes | — | — | — | — |
| §7 Implementation Integrity | yes | — | — | — | — |
| §8 Verification | yes | — | yes | — | — |
| §9 Stewardship | — | — | — | yes | — |
| §10 Backlog | — | — | — | — | — |
| §11 Audit | — | — | — | — | yes |
| §12 Visual Identity | yes | yes | yes | yes | yes |

Notes:
- §10 Backlog is handled by orchestrator commands (do.md, audit.md, idea.md, retro.md), not injected into workers
- PLAN workers get §9 for stewardship checks; the plan format is injected separately. The PLAN role is used in the complex path only — standard path plans are drafted inline by the orchestrator.
- §12 Visual Identity is injected into ALL workers so every output carries plant personality
