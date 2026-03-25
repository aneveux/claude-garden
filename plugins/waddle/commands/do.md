---
description: "Orchestrated development - plan, implement, review, learn. Use waddle when the user wants structured development with plan approval, code review cycles, and knowledge accumulation. Triggers on: feature implementation, refactoring tasks, bug fixes that need review, multi-file changes, or when the user wants an agent-driven workflow with planning and review phases. Also use for any task prefixed with quick: or deep: routing hints."
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Agent, AskUserQuestion
---

# Waddle Do - Main Command

You are the waddle orchestrator running in the user's session. You route requests, manage plans, spawn workers, and maintain state.

## Step 0: Load Context

1. Read `.waddle/waddle.yaml` (REQUIRED - if missing, tell user to run `/waddle:bootstrap`)
2. Read `.waddle/STATE.md` (REQUIRED)
3. Note any active plan, progress, pending decisions, recent learnings

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
2. Parse the plan:
   - Count `[x]` (done) vs `[ ]` (remaining) tasks
   - Determine plan type: has `## Wave` headers = complex, otherwise = standard
3. Show status:

```
    _
   (v)   Resuming Plan #NNN: <title>
   /V\   <done>/<total> tasks complete
   (_)>
   ~~
```

4. Route based on plan type and remaining work:

   **Standard plan with remaining tasks**:
   - Read conventions reference (Glob `**/waddle/references/conventions.md`)
   - Spawn implement worker with ONLY the unchecked tasks and the plan's Done When criteria
   - After implementation: spawn review worker covering ALL changes (not just this session's)
     Use `git diff` against the commit before the plan started, or review all files listed in the plan
   - Read `references/path-standard.md` (Glob `**/waddle/references/path-standard.md`) and follow the Review section for the review/fix cycle and Completion

   **Complex plan with remaining waves**:
   - Identify the first wave with unchecked tasks
   - Read `references/path-complex.md` (Glob `**/waddle/references/path-complex.md`)
   - Resume wave-by-wave from the Execution section
   - Partially-completed waves: spawn workers only for unchecked tasks within the wave
   - After all waves: read `references/path-standard.md` and follow Review and Completion

   **Plan with all tasks checked but not marked done** (interrupted during review):
   - Read `references/path-standard.md` and go directly to the Review section

5. If the plan file is missing or corrupted: inform the user, offer to start fresh or create a new plan for the remaining work.

## Step 1: Parse Request

The user's request follows `/waddle:do`. Parse it for:
- **Path override**: `quick:` prefix -> force simple. `deep:` prefix -> force complex.
- **Natural language request**: the actual task description

If the task description is empty (user ran `/waddle:do` with no argument), ask:
"What would you like to work on?" and wait for their response before continuing.

## Step 2: Route (Adaptive Sizing)

Read relevant code to understand scope. Consider:
- How many files will change?
- Is the change self-contained or cross-cutting?
- Is the domain familiar (check STATE.md learnings) or unknown?

| Signal | Path |
|--------|------|
| 1-2 files, clear fix, typo, config change | **Simple** |
| 3-8 files, clear feature, refactor, module | **Standard** |
| 8+ files, cross-cutting, unfamiliar domain, redesign | **Complex** |

Path overrides: `quick:` forces simple, `deep:` forces complex.

Inform the user which path you chose:
"This looks like a [simple/standard/complex] task. [1-2 sentence reasoning]."

## Step 3: Execute Path

Read the appropriate path reference file and follow its instructions:

- **Simple**: Glob `**/waddle/references/path-simple.md`, read and execute
- **Standard**: Glob `**/waddle/references/path-standard.md`, read and execute
- **Complex**: Glob `**/waddle/references/path-complex.md`, read and execute

## Error Handling

- **Worker fails or times out**: Update plan status to `failed`. Report to user. Offer to retry or adjust plan. Progress is saved via plan checkboxes and STATE.md — they can run `/waddle:do` to resume.
- **Review finds critical issues after 2 fix cycles**: Present remaining issues. Ask user to fix manually or adjust plan. If they cancel, update plan status to `failed`.
- **Context running low**: Save state immediately. Inform user: "Context is running low. Progress saved to STATE.md. Start a fresh session and run /waddle:status to continue."
- **Specialist not found**: Warn user, implement directly without specialist.
- **`.waddle/` not initialized**: Tell user to run `/waddle:bootstrap` first.
- **Active work in STATE.md**: Present status, ask user whether to resume or start new.
