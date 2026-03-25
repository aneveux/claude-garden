# Waddle Conventions

Protocols injected into worker spawn prompts by the waddle command.

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
- If yes, append ONE line to the Learnings section of .waddle/STATE.md:
  - YYYY-MM-DD | <concise discovery>
- Good learnings: conventions, gotchas, env requirements, patterns, tool quirks
- Bad learnings: obvious things, task-specific details that won't recur
- Do NOT skip this step. Knowledge accumulation is a core framework goal.
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

  <waddle:verdict>PASS</waddle:verdict>
  or
  <waddle:verdict>FIXME</waddle:verdict>

  Output the verdict as an XML tag on its own line. The orchestrator machine-parses
  this tag to decide the next step — the XML boundary makes extraction reliable even
  when the rest of your review contains code blocks or markdown formatting.
  Continue with the human-readable details below the tag.

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
- Before implementing, check .waddle/waddle.yaml for specialists config
- If a specialist is configured for this task's domain:
  1. Spawn the specialist agent with task description
  2. Include in prompt: "Implement [task]. Follow your conventions. Do NOT commit."
  3. Wait for specialist to finish
  4. Review the code against plan criteria yourself
  5. Commit with waddle commit protocol
  6. Log learnings
- If no specialist configured: implement directly
- The specialist handles CODE QUALITY. You handle PROTOCOL (commits, learning, criteria).

Domain detection — match the task's primary files against specialist keys in waddle.yaml:
  - bash: .sh, .bash files, Makefile targets, or explicit "bash/shell" in task
  - java: .java, .kt files, pom.xml, build.gradle, or explicit "java/kotlin" in task
  - go: .go files, go.mod, or explicit "go/golang" in task
  - python: .py files, or explicit "python" in task
  - For any other specialist key: match file extensions or explicit mentions in task
  - Default: implement directly (no specialist needed)
```

## 5. Pending Decisions Protocol

```
PENDING DECISIONS:
- When you encounter a question that needs user input or a choice that could
  go either way, log it to .waddle/STATE.md under Pending Decisions:
  - Format: - <concise question or decision needed>
- Examples of pending decisions:
  - "Redis vs in-memory for rate limit store"
  - "Should validation errors return 400 or 422?"
  - "Test DB: SQLite for speed or Postgres for parity?"
- Remove a decision from the list after it's been resolved
- Do NOT block on pending decisions. Make a reasonable default choice,
  implement it, and log the decision so the user can revisit.
```

## 6. State Update Protocol

```
STATE UPDATE:
- After completing tasks, update .waddle/STATE.md:
  - Progress: N/M tasks done (commits: hash1, hash2, ...)
  - Last: YYYY-MM-DD HH:MM
- After discovering learnings, append to Learnings section
- After all work is complete, set Focus to "idle" or describe what's next
```

## 7. Implementation Integrity

```
IMPLEMENTATION INTEGRITY:
The most common failure mode in AI-assisted development isn't writing bad code --
it's skipping steps that feel unnecessary in the moment but matter in production.
Watch for these patterns in yourself:

- "I'll add the test after" -- you won't. Write the test when the context is fresh.
- "This is too simple to fail" -- the simple cases are where assumptions hide.
- "The user probably meant X" -- if the plan says Y, implement Y. Log the
  ambiguity as a pending decision rather than silently reinterpreting.
- "I'll clean this up later" -- later doesn't exist in a single-session agent.
  Ship it clean or flag it explicitly.
- "This edge case won't happen" -- if you can name it, it can happen. Handle it
  or document why it's out of scope.

The review worker will catch shortcuts -- but catching them late wastes a full
fix/review cycle. Catching them yourself saves everyone time.
```

## 8. Verification Before Completion

```
VERIFICATION BEFORE COMPLETION:
Before declaring any task done, produce fresh evidence that it works:

1. Run the tests (or the relevant subset). Read the output. Don't assume green.
2. Check each done_when criterion against actual state -- run the command, read
   the file, hit the endpoint. Whatever the criterion requires.
3. If a criterion can't be verified (e.g., "deploys correctly" in a dev env),
   note it as unverified in your state update rather than silently claiming it.

Why: The review worker re-verifies everything, but if the implementer ships
broken code, the fix/re-review cycle costs 2x the tokens and time of getting it
right the first time. Self-verification is the cheapest quality gate in the system.
```

## 9. Stewardship Protocol

Used during planning phase (do.md, path-standard, path-complex). Implementation
workers use §5 (Pending Decisions) to capture new technical choices instead.

```
STEWARDSHIP RULES:
- During planning, before drafting tasks, check if stewardship documents exist:
  - Read VISION.md (path from waddle.yaml stewardship.vision)
  - Read DECISIONS.md (path from waddle.yaml stewardship.decisions)
  - Read ARCHITECTURE.md (path from waddle.yaml stewardship.architecture) if configured
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
- The backlog (.waddle/BACKLOG.md) is the unified inbox for actionable work items.
  Three sources feed it: user ideas, audit findings, and retro observations.
- After audit: append critical and warning findings to BACKLOG.md under their
  severity heading. Read the current backlog first — skip findings that duplicate
  existing open items from the same lens.
- After /waddle:do completion: check BACKLOG.md for items that were addressed.
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
AUDIT RULES (for AUDIT workers spawned by /waddle:audit):
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
