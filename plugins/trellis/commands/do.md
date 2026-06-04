---
description: "Orchestrated development - plan, implement, review, learn. Use trellis when the user wants structured development with plan approval, code review cycles, and knowledge accumulation. Triggers on: feature implementation, refactoring tasks, bug fixes that need review, multi-file changes, or when the user wants an agent-driven workflow with planning and review phases. Also use for any task prefixed with quick: or deep: routing hints."
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Agent, AskUserQuestion
---

# Trellis Do - Main Command

You are the trellis orchestrator running in the user's session. You route requests, manage plans, spawn workers, and maintain state.

## Step 0: Load Context

1. Read `.trellis/trellis.yaml` (REQUIRED - if missing, tell user to run `/trellis:bootstrap`)
2. Read `.trellis/STATE.md` (REQUIRED)
3. Note any active plan, progress, pending decisions, recent learnings
3b. Read stewardship config from trellis.yaml
3c. If stewardship.vision path configured and file exists: read VISION.md, keep in context
3d. If stewardship.decisions path configured and file exists: read DECISIONS.md, keep in context
3e. Note: these documents are available for the planning phase in path-standard.md
    and path-complex.md. The path files reference them during plan drafting (see
    reactive stewardship steps). No additional do.md logic needed beyond loading
    them into context — the path files handle the checking.

If STATE.md shows work in progress (Progress is not "idle" and not "done"), inform the user:
"There's active work: [focus]. Resume this, or start something new?"

Use AskUserQuestion:
- question: "Resume the in-progress work or start fresh?"
- header: "Active Work"
- options:
  - label: "Resume"
    description: "Continue from where we left off"
  - label: "New task"
    description: "Start something new (active plan stays as-is)"

**If Resume**: Jump to the **Resumption Flow** below.
**If New task**: Continue to Step 1 with the user's new request. The active plan remains in its current state.

### Resumption Flow

1. Read the plan file listed in STATE.md's Plan field
1b. Load stewardship documents (same as Step 0, steps 3b-3d):
    - Read stewardship config from trellis.yaml
    - If vision path configured and file exists: read VISION.md
    - If decisions path configured and file exists: read DECISIONS.md
    These are needed if the resumed work reaches the review phase, where
    the reviewer may need to check alignment.
1c. Recover TDD context from plan frontmatter:
    - Check the plan's YAML frontmatter for `tdd_baseline_hash` and `tdd_commit_hash`
    - If both are present and non-null: set TEST_BASELINE_HASH and TEST_COMMIT_HASH from them
    - The TDD phase does NOT re-run during resumption — hashes present means the test writer ran
      and the gate was already resolved in the prior session. Skip straight to implementation.
2. Parse the plan:
   - Count `[x]` (done) vs `[ ]` (remaining) tasks
   - Determine plan type: has `## Wave` headers = complex, otherwise = standard
3. Show status:

```
─────────────────────────────────────────────
    ,*-.
    |  |   🌿 Resuming Plan #NNN: <title>
,.  |  |   <done>/<total> tasks complete
| |_|  | ,.
`---.  |_| |
    |  .--`
    |  |
    |  |
─────────────────────────────────────────────
```

4. Route based on plan type and remaining work:

   **Standard plan with remaining tasks**:
   - Read conventions reference (Glob `**/trellis/references/conventions.md`)
   - Spawn implement worker with ONLY the unchecked tasks and the plan's Done When criteria.
     If TEST_BASELINE_HASH and TEST_COMMIT_HASH were recovered in step 1c, include the TDD Constraint
     block in the implement worker's prompt (paste §16 TDD — IMPLEMENT WORKER from conventions.md
     with the recovered hash values).
   - After implementation: spawn review worker covering ALL changes (not just this session's).
     Use `git diff` against the commit before the plan started, or review all files listed in the plan.
     If TEST_BASELINE_HASH and TEST_COMMIT_HASH were recovered, include the TDD Verification block too.
   - Read `references/path-standard.md` (Glob `**/trellis/references/path-standard.md`) and follow the Review section for the review/fix cycle and Completion

   **Complex plan with remaining waves**:
   - Identify the first wave with unchecked tasks
   - Read `references/path-complex.md` (Glob `**/trellis/references/path-complex.md`)
   - Resume wave-by-wave from the Execution section
   - Partially-completed waves: spawn workers only for unchecked tasks within the wave
   - If TDD hashes were recovered in step 1c: the Execution section in path-complex.md uses
     `if TDD is active (TEST_COMMIT_HASH is not null)` guards — those conditions are now true.
     Each wave worker will receive the TDD Constraint automatically.
   - After all waves: read `references/path-standard.md` and follow Review and Completion

   **Plan with all tasks checked but not marked done** (interrupted during review):
   - Read `references/path-standard.md` and go directly to the Review section

5. If the plan file is missing or corrupted: inform the user, offer to start fresh or create a new plan for the remaining work.

## Step 1: Parse Request

The user's request follows `/trellis:do`. Parse it for:
- **Path override**: `quick:` prefix -> force simple. `plan:` prefix -> force standard. `deep:` prefix -> force complex.
- **Natural language request**: the actual task description

### Clarification Gate

After parsing, apply a vagueness heuristic before doing anything else. A request is vague when:
- It's **fewer than 8 words** AND contains a high-ambiguity verb:
  `improve`, `fix`, `clean up`, `refactor`, `update`, `make better`, `handle`, `deal with`, `look at`, `check`
- OR it **names no specific file, module, feature, or behaviour** (e.g. "fix the auth" vs "fix login redirect loop in auth.ts")

If vague AND no path override was given: ask 1-2 targeted questions before routing.

Use AskUserQuestion:
- question: "A bit more context will help me plan this correctly — [specific question about scope or behaviour]"
- header: "Clarify"
- options: (2-3 concrete options inferred from STATE.md learnings + codebase context, plus "I'll describe it" as free-text fallback)

Ask ONE question at a time — no more. After the answer, proceed to Step 2.

**Do NOT apply the gate when:**
- A path override is present (`quick:`, `plan:`, `deep:`) — user has already committed to a path
- The request references a specific file, function, or error message
- The request came from a backlog item (already scoped)
- STATE.md shows active work being resumed

If the task description is empty (user ran `/trellis:do` with no argument):
1. Read `.trellis/BACKLOG.md` if it exists
2. If backlog has open items, present the top items (critical first) and offer to pull one:

   Use AskUserQuestion:
   - question: "Pick a backlog item to work on, or describe something new?"
   - header: "What to work on"
   - options:
     - label: "<top critical/warning item description>" (one option per top item, max 3)
       description: "<source> — <date>"
     - label: "Something else"
       description: "Describe a new task"

   If they pick a backlog item, use its description as the task.
   If they pick "Something else", ask: "What would you like to work on?"

3. If no backlog or backlog is empty, ask:
   "What would you like to work on?" and wait for their response before continuing.

## Step 2: Route (Adaptive Sizing)

Read relevant code to understand scope. Consider:
- How many files will change?
- Is the change self-contained or cross-cutting?
- Is the domain familiar (check STATE.md learnings) or unknown?

If VISION.md was loaded: before routing, quick-check whether the request aligns
with vision principles. If obvious misalignment (e.g., request explicitly violates
a non-goal), flag it to the user before routing:
"Note: this request may conflict with non-goal '<X>' in VISION.md. Proceed anyway?"
Use AskUserQuestion with Proceed/Cancel options.

| Signal | Path |
|--------|------|
| 1-5 files, clear fix, feature, config change | **Simple** |
| 6+ files, bounded scope (same package/module tree) | **Standard** |
| Spans unrelated subsystems, unfamiliar domain, redesign | **Complex** |

Path overrides: `quick:` forces simple, `plan:` forces standard, `deep:` forces complex.

Inform the user which path you chose (use 🌱 lifecycle emoji):
"🌱 This looks like a [simple/standard/complex] task. [1-2 sentence reasoning]."

## Step 3: Execute Path

Read the appropriate path reference file and follow its instructions:

- **Simple**: Glob `**/trellis/references/path-simple.md`, read and execute
- **Standard**: Glob `**/trellis/references/path-standard.md`, read and execute
- **Complex**: Glob `**/trellis/references/path-complex.md`, read and execute

## Context Health (applies throughout path execution)

Between worker spawns (after any worker completes, before spawning the next):

1. If a "TRELLIS CONTEXT WARNING" or "TRELLIS CONTEXT CRITICAL" message appeared
   in recent tool outputs: the hook has fired. Follow its guidance — finish
   current commit, save state, inform user.

2. If no hook is configured but the session has been heavy (3+ workers spawned,
   or you've processed many large file reads): proactively checkpoint.
   - Update STATE.md with current progress
   - Update plan checkboxes for completed tasks
   - Ask user: "This session has used significant context. Continue or save and resume fresh?"
   Use AskUserQuestion with "Continue" / "Fresh session" options.
   Fresh session: inform user to run `/trellis:do` to resume from checkpoint.

A fresh context reviewing code produces better results than a fatigued one.

## Step 4: Post-Completion Backlog Check

After work is completed (path execution finished, review passed):

1. Read `.trellis/BACKLOG.md` if it exists
2. Check if any open items were addressed by the work just completed
   (compare the task description and changed files against open backlog items)
3. If matches found, mark them `[x]` and move to the Done section:
   ```
   - [x] <description> — `<source>` done YYYY-MM-DD
   ```
4. If the completed task originated from a backlog item, make sure that item is marked done

This step is lightweight — a quick scan, not a deep analysis. Skip if no backlog exists.

## Step 5: Log Journal + Metrics

After work is completed (any path), append a completion event to `.trellis/journal.jsonl`:
```json
{"ts":"YYYY-MM-DDTHH:MM:SS","event":"completion","plan_id":"<NNN or null>","path":"simple|standard|complex","data":{"agents_spawned":<n>,"fix_cycles":<n>,"verdict":"pass|fixme|none"}}
```
Create the file if it doesn't exist. Append one line — never rewrite.

Then log task metrics to `.trellis/metrics.json`:

1. Read `.trellis/metrics.json` (create with `{"tasks":[]}` if missing)
2. Append a task entry:
   ```json
   {
     "plan_id": "<NNN or null for simple>",
     "title": "<task description, max 80 chars>",
     "path": "simple|standard|complex",
     "agents_spawned": <count>,
     "review_verdict": "pass|fixme|none",
     "fix_cycles": <count>,
     "tdd_used": true|false,
     "completed": "YYYY-MM-DD"
   }
   ```
3. Write the updated file back

Agent counting:
- Simple path: 0 agents (direct edit)
- Standard path: count implement + review + fix workers spawned
- Complex path: count research + plan + implement (per wave) + review + fix workers

## Error Handling

- **Worker fails or times out**: Update plan status to `failed`. Report error to user. Offer:
  a) Retry the same worker (once — for transient failures)
  b) Adjust plan and retry
  c) Abort and keep current progress
  Max 1 automatic retry per worker. On second failure: ask user for manual intervention.
- **Review finds critical issues after 2 fix cycles**: Follow the structured recovery flow in path-standard.md step 19 (Accept with debt / Rollback / Manual fix).
- **Context running low**: Save state immediately (update plan checkboxes, STATE.md timestamp). Inform user: "🌿 Context is running low. Progress saved to STATE.md. Start a fresh session and run /trellis:do to resume."
- **Specialist not found**: Warn user, implement directly without specialist.
- **`.trellis/` not initialized**: Tell user to run `/trellis:bootstrap` first.
- **Plan file missing or corrupted**: Inform user. Offer to start fresh or create a new plan for the remaining work.
