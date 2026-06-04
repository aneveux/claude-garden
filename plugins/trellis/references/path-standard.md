# Standard Path

Multi-module feature, refactor, or large change (6+ files, bounded scope — same package or module tree). Plan -> approve -> implement -> review.

Show the seedling:
```
─────────────────────────────────────────────
   |
 .'|'.    🌱 Planning...
/.'|\ \
| /|'.|
 \ |\/
  \|/
   `
─────────────────────────────────────────────
```

## Planning

1. Read relevant code files to understand the full scope
1b. Reactive stewardship check:
    - Read `.trellis/trellis.yaml` stewardship config
    - If stewardship.vision path exists: read the VISION.md file
    - If stewardship.decisions path exists: read the DECISIONS.md file
    - Keep these in context for step 3 (drafting the plan)
    - When drafting the plan, consider:
      - Does this work align with VISION.md principles?
      - Does the approach conflict with any ADR in DECISIONS.md?
      - If misalignment found: include a "## Notes" section in the plan flagging it
2. Find and read the plan format reference: Glob `**/trellis/references/plan-format.md`, then read it
3. Draft a lightweight plan:
   - Title
   - Numbered task list with file paths and descriptions
   - Done When criteria (observable, testable, specific)
4. Assign next plan number:
   - Check if `.trellis/plans/` exists, create with `mkdir -p` if needed
   - Glob `.trellis/plans/*.md` to find highest NNN
   - Use NNN+1 (first plan is 001)
5. Write plan to `.trellis/plans/NNN-<slug>.md` with `status: draft`
6. Present the plan to the user:
```
─────────────────────────────────────────────
   |        ,*-.
 .'|'.      |  |   🌱 Plan #NNN: <title>
/.'|\ \  ,. |  |
| /|'.|  | |_| | ,.
 \ |\/   `---. |_| |
  \|/        | .--`
   `         | |
─────────────────────────────────────────────
```

Show tasks and Done When criteria clearly.
Ask: **"Proceed? [approve / modify / cancel]"**

Use AskUserQuestion:
- question: "How does this plan look?"
- header: "Plan"
- options:
  - label: "Approve"
    description: "Looks good, start implementing"
  - label: "Modify"
    description: "I have changes to suggest"
  - label: "Cancel"
    description: "Scrap this plan"

7. Handle user response:
   - **Approve**: Update plan status to `approved`, continue to implementation
   - **Modify**: Ask what to change, adjust plan, re-present
   - **Cancel**: Update plan status to `cancelled`, stop

## TDD Phase (skip if tdd.enabled is not true in trellis.yaml)

7b. Read `tdd` config from `.trellis/trellis.yaml`:
    - `tdd.enabled` — if false or absent, skip this entire section
    - `tdd.approve_tests` — whether to pause for user approval before implementing
    - `tdd.exclude` — list of task-type patterns that bypass TDD (e.g., docs, config)

7c. Check exclusions: if ALL plan tasks match a `tdd.exclude` pattern, skip TDD for this plan.
    Matching is case-insensitive substring: task "update VISION.md docs" matches `docs`.

7d. Record current commit hash as the pre-test baseline:
    Run `git rev-parse HEAD` and save as `TEST_BASELINE_HASH`.

7e. Spawn the test writer worker:

```
description: "write tests for <plan-title>"
prompt: |
  You are a trellis TEST WRITER worker.

  ## Plan
  <paste full plan tasks and done_when here>

  ## Your Job
  Write tests that will FAIL until the production code is implemented.
  Map each Done When criterion to at least one test case.
  Do NOT write any production code.

  ## Protocols
  <paste these sections from conventions.md:>
  <"§1 Commit Protocol" section>
  <"§2 Learning Protocol" section>
  <"§16 TDD — TEST WRITER" sub-section>
  <"§12 Visual Identity" section>
model: <resolved standard tier>
```

7f. After test writer completes:
    - Run `git rev-parse HEAD` and save as `TEST_COMMIT_HASH`
    - Append a journal event:
      ```json
      {"ts":"YYYY-MM-DDTHH:MM:SS","event":"worker_complete","plan_id":"<NNN>","path":"standard","data":{"role":"test_writer","verdict":"none"}}
      ```
    - If `tdd.approve_tests` is true, before presenting the gate, show what the test writer created:
      Run `git diff --name-only <TEST_BASELINE_HASH>..HEAD` to list the test files added.
      Show the file paths and any key assertions noted in the test writer's output. Then present the gate:

    Use AskUserQuestion:
    - question: "Tests written. Review them before implementation starts?"
    - header: "TDD Gate"
    - options:
      - label: "Approve tests — start implementing"
        description: "Tests look correct. Proceed to production code."
      - label: "Adjust tests first"
        description: "I want to change something before we implement."
      - label: "Skip TDD for this plan"
        description: "Bypass TDD and go straight to implementation."

    Handle response:
    - **Approve**: continue to Implementation
    - **Adjust**: ask what to change, apply changes (or let user edit), re-commit, re-present gate
    - **Skip TDD**: note TEST_COMMIT_HASH as null, continue to Implementation without TDD constraint

    After resolving the gate, append a journal event:
    ```json
    {"ts":"YYYY-MM-DDTHH:MM:SS","event":"tdd_gate","plan_id":"<NNN>","path":"standard","data":{"decision":"approved|adjusted|skipped","test_commit_hash":"<TEST_COMMIT_HASH or null>"}}
    ```

    If `tdd.approve_tests` is false: continue directly to Implementation without presenting the gate.
    No `tdd_gate` event is needed — the `worker_complete` event for `test_writer` already records that
    TDD ran; the `tdd_gate` event records a human decision, and with `approve_tests: false` none was presented.

    Persist TDD hashes (skip only if TEST_COMMIT_HASH is null — user chose "Skip TDD"):
    - Read the plan file and add to its YAML frontmatter:
      `tdd_baseline_hash: <TEST_BASELINE_HASH>` and `tdd_commit_hash: <TEST_COMMIT_HASH>`
    - Write the updated plan file
    Rationale: if the session is interrupted during implementation and resumed later, the orchestrator
    reads these hashes from the plan frontmatter to reconstruct TDD context without re-running the test writer.

## Implementation

8. Find and read the conventions reference: Glob `**/trellis/references/conventions.md`, then read it. You will paste relevant sections from this file into each worker's spawn prompt.
9. Read `.trellis/trellis.yaml` for specialist config and worker model. Resolve the model tier:
   - If `models.tiers.standard` is set, use it for implement + fix workers
   - Else if `models.implementer` is set, use it
   - Else if `models.worker` is set, use it
   - Else default to `sonnet`
   For the review worker: if the plan touches security, auth, or architectural concerns
   (detected from task descriptions or changed file paths), upgrade to `models.tiers.complex`
   (default: opus) regardless of the standard tier setting. Otherwise use the standard tier.
10. Determine if a specialist applies using §4 (Specialist Delegation) from conventions.md.
11. Record the current commit hash as the implementation baseline:
    Run `git rev-parse HEAD` and save the result as `BASELINE_HASH`. You'll use this after implementation to find all changed files.
11b. Pre-spawn validation — quick inline sanity check before spawning the worker:
    - Re-read the plan file (it may have been written several messages ago)
    - Check for:
      - Ambiguous task descriptions (could be interpreted multiple ways)
      - File paths that don't exist (quick glob to verify)
      - Implicit assumptions not captured in Done When criteria
    - If issues found: flag them to the user before spawning. Don't block on
      cosmetic concerns — only flag things that would cause the worker to guess.
    - If clean: proceed without commentary.
12. Prepare and spawn the implement worker using the Agent tool:

```
description: "implement <plan-title>"
prompt: |
  You are a trellis IMPLEMENT worker.

  ## Your Plan
  <paste full plan tasks and done_when here>

  ## Protocols
  <paste these sections from conventions.md (read in step 8):>
  <"Commit Protocol" section>
  <"Learning Protocol" section>
  <"Specialist Delegation" section>
  <"Pending Decisions Protocol" section>
  <"State Update Protocol" section>
  <"Implementation Integrity" section>
  <"Verification Before Completion" section>
  <"Deviation Protocol" section>
  <"Visual Identity" section>

  ## Specialist
  <if specialist configured>:
  Delegate implementation to <specialist agent>. Spawn them with:
  "<task description>. Follow your conventions. Do NOT commit."
  Then review their code against plan criteria, commit with trellis protocol, and log learnings.
  <if no specialist>:
  Implement directly.

  ## State Tracking
  Plan file: <path to plan file>
  After completing each task, update the task checkbox in the plan file from [ ] to [x].

  ## Working
  - Make one commit per task
  - Update plan checkboxes as you go
  - Check done_when criteria before finishing
  - Log learnings and pending decisions to .trellis/STATE.md

  <if TDD is active (TEST_COMMIT_HASH is not null)>:
  ## TDD Constraint
  <paste §16 TDD — IMPLEMENT WORKER sub-section from conventions.md>
  TEST_BASELINE_HASH: <TEST_BASELINE_HASH>
  TEST_COMMIT_HASH: <TEST_COMMIT_HASH>
  </if>
model: <resolved tier model from step 9 — tiers.standard > models.implementer > models.worker > sonnet>
```

13. Update plan status to `in-progress`. Append a journal event:
    ```json
    {"ts":"YYYY-MM-DDTHH:MM:SS","event":"plan_start","plan_id":"<NNN>","path":"standard","data":{"title":"<plan title>","baseline_hash":"<BASELINE_HASH>"}}
    ```
14. Wait for implement worker to complete. When it does, append:
    ```json
    {"ts":"YYYY-MM-DDTHH:MM:SS","event":"worker_complete","plan_id":"<NNN>","path":"standard","data":{"role":"implement","verdict":"none"}}
    ```

## Review

15. After implement worker completes, gather changed files:
    - Run `git diff --name-only <BASELINE_HASH>..HEAD` (using the hash recorded in step 11)
    - Or read the plan file for updated checkboxes as fallback
16. Prepare and spawn the review worker:

```
description: "review <plan-title>"
prompt: |
  You are a trellis REVIEW worker.

  ## Plan Being Reviewed
  <paste full plan including done_when>

  ## Changed Files
  <list files modified during implementation>

  ## Protocols
  <paste these sections from conventions.md (read in step 8):>
  <"Review Protocol" section>
  <"Learning Protocol" section>
  <"Visual Identity" section>

  <if TDD is active (TEST_COMMIT_HASH is not null)>:
  ## TDD Verification
  <paste §16 TDD — REVIEW WORKER sub-section from conventions.md>
  TEST_BASELINE_HASH: <TEST_BASELINE_HASH>
  TEST_COMMIT_HASH: <TEST_COMMIT_HASH>
  </if>
model: <if security/auth/arch concerns: tiers.complex > opus; else tiers.standard > models.reviewer > models.worker > sonnet>
```

17. Show the bloom with review summary:
```
─────────────────────────────────────────────
      ,xXXXXx,
     ,XXXXXXXX,
     XXXXXXXXXX   🌸 Review complete!
     `"""XX"""`
         XX
         XX
         XX
─────────────────────────────────────────────
```

18. Process review result — extract verdict from the review output:
    - Find `<trellis:verdict>...</trellis:verdict>` in the output and extract the inner text (PASS or FIXME)
    - If no XML tag found, treat as FIXME and log a note that the reviewer didn't produce a structured verdict.
    - Append a journal event:
      ```json
      {"ts":"YYYY-MM-DDTHH:MM:SS","event":"review_verdict","plan_id":"<NNN>","path":"standard","data":{"verdict":"PASS|FIXME","issues_count":<n>}}
      ```
    - **If PASS**: Continue to Completion
    - **If FIXME**: Before spawning the fix worker, do an inline root-cause diagnosis:

    **Diagnosis step** (done by you, the orchestrator — not a separate agent):
    a. Read the FIXME items from the review output
    b. Look at each failed `<trellis:evidence>` block (result="fail" or missing)
    c. For each failing criterion, identify WHY it fails:
       - Import/reference error → specific file and line
       - Test failure → which assertion, what was expected vs actual
       - Type error → which type, where the mismatch is
       - Logic error → which branch or condition is wrong
    d. Produce a short diagnosis summary (3-5 bullet points max):
       "Root causes: (1) X is failing because Y. (2) Z is missing from W."

    Then show the diagnosis and FIXME items to the user. Append a journal event before spawning the fix worker:
    ```json
    {"ts":"YYYY-MM-DDTHH:MM:SS","event":"fix_cycle","plan_id":"<NNN>","path":"standard","data":{"cycle":<1|2>}}
    ```
    Then spawn the fix worker:

```
description: "fix <plan-title> issues"
prompt: |
  You are a trellis FIX worker.

  ## Root Cause Diagnosis
  <paste the diagnosis summary from the orchestrator's analysis>

  ## Issues to Fix
  <paste FIXME items from review>

  ## Protocols
  <paste these sections from conventions.md (read in step 8):>
  <"Commit Protocol" section>
  <"Learning Protocol" section>
  <"Verification Before Completion" section>
  <"Visual Identity" section>

  ## Rules
  - Fix ONLY the listed issues. No other changes.
  - Start from the root causes in the diagnosis, not from symptoms.
  - One commit per fix.

  <if TDD is active (TEST_COMMIT_HASH is not null)>:
  ## TDD Constraint
  <paste §16 TDD — IMPLEMENT WORKER sub-section from conventions.md>
  TEST_BASELINE_HASH: <TEST_BASELINE_HASH>
  TEST_COMMIT_HASH: <TEST_COMMIT_HASH>
  </if>
model: <resolved tier model from step 9 — tiers.standard > models.fixer > models.worker > sonnet>
```

19. After fix worker: spawn another review worker (max 2 fix/review cycles total)
    - If PASS: continue to Completion
    - If still FIXME after 2 cycles: escalate with structured recovery options.

    Show remaining issues, then present options:

    Use AskUserQuestion:
    - question: "Review found issues that 2 fix cycles couldn't resolve. How to proceed?"
    - header: "Recovery"
    - options:
      - label: "Accept with debt"
        description: "Commit as-is, log remaining issues to BACKLOG.md"
      - label: "Rollback"
        description: "Reset to pre-implementation state (BASELINE_HASH)"
      - label: "Manual fix"
        description: "I'll fix these myself, then re-run review"

    Handle response:
    - **Accept with debt**: Continue to Completion. Append remaining FIXME items
      to .trellis/BACKLOG.md as warnings with source `review:<plan-id>`.
    - **Rollback**: Run `git reset --hard <BASELINE_HASH>`. Update plan status
      to `failed`. Set STATE.md Focus to idle. Inform user work was rolled back.
    - **Manual fix**: Tell user which files/lines need attention. Wait for them
      to say done. Spawn review worker (doesn't count toward 2-cycle limit since
      human fixed it). If PASS: continue. If FIXME: re-present options.

## Completion

20. Update plan status to `done`
21. Copy reviewer LEARNINGS to STATE.md (if not already there)
22. Update `.trellis/STATE.md` Current section:
    - Focus: idle
    - Plan: completed plan path
    - Progress: done
    - Last: current timestamp
23. Show the tree:
```
─────────────────────────────────────────────
      ,xXXXXx,
     ,XXXXXXXX,
     XXXXXXXXXX   🌳 All done! Plan #NNN complete.
     `"""XX"""`
         XX
         XX
         XX
─────────────────────────────────────────────
```
