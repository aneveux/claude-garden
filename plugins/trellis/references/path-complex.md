# Complex Path

Cross-cutting change spanning unrelated subsystems, redesign, or unfamiliar domain. Research -> plan with waves -> parallel workers -> review.

Show the sprout:
```
─────────────────────────────────────────────
       _ _
      (_\_)
     (__<_{}   🌱 Big task. Let me research and plan.
      (_/_)
     |\ |
      \\| /|
       \|//
        |/
   ,.,.,|.,.,.
─────────────────────────────────────────────
```

## Research (optional)

1. If the domain is unfamiliar (no relevant learnings in STATE.md, unfamiliar tech stack):
   Spawn a research worker:

```
description: "research for <task>"
prompt: |
  You are a trellis PLAN worker doing research.
  Explore the codebase to understand: <specific questions about the domain>
  Read relevant files, check dependencies, understand patterns.
  Return a summary of findings relevant to: <the user's request>
  Do NOT write any files. Just report back.

  <paste "Visual Identity" section from conventions.md>
model: <tiers.complex > models.planner > models.worker, default sonnet — research benefits from broader reasoning>
```

2. Use research findings to inform planning

## Planning

2b. Resolve model tiers from `.trellis/trellis.yaml` before spawning any workers:
    - Complex tier (plan + review): `models.tiers.complex` > `models.planner/reviewer` > `models.worker` > `opus`
    - Standard tier (implement + fix per wave): `models.tiers.standard` > `models.implementer/fixer` > `models.worker` > `sonnet`
    Complex path always uses the complex tier for planning and review. Use standard tier for implementation waves.

2c. Reactive stewardship check:
    - Read `.trellis/trellis.yaml` stewardship config
    - If stewardship.vision path exists: read the VISION.md file
    - If stewardship.decisions path exists: read the DECISIONS.md file
    - Pass these to the plan worker (include in the prompt under "## Project Direction"):
      <VISION.md contents>
      <DECISIONS.md contents>
    - Tell the plan worker: "Flag any misalignment with vision principles or decision conflicts in a ## Notes section"

3. Find and read the plan format reference (Glob `**/trellis/references/plan-format.md`)
4. Either:
   a. Draft the plan yourself (if scope is clear from research + code reading)
   b. Spawn a plan worker (if scope is large):

```
description: "plan <task>"
prompt: |
  You are a trellis PLAN worker.

  ## Request
  <user's request>

  ## Research Findings
  <from research phase, if any>

  ## Project Direction
  <paste VISION.md contents if loaded, otherwise omit>
  <paste DECISIONS.md contents if loaded, otherwise omit>
  Flag any misalignment with vision principles or decision conflicts in a ## Notes section.

  ## Plan Format
  <paste full format section from plan-format.md>

  ## Protocols
  <paste these sections from conventions.md:>
  <"Stewardship Protocol" section>
  <"Visual Identity" section>

  ## Instructions
  - Write a plan file to .trellis/plans/NNN-<slug>.md
  - Use the full format with waves
  - Group independent tasks into the same wave
  - Dependent tasks go in later waves
  - Write specific, testable Done When criteria
  - Include Must Haves for structural verification
  - Set status: draft

  ## Output
  When done, report the plan file path using this exact format:
  <trellis:plan_path>.trellis/plans/NNN-slug.md</trellis:plan_path>
model: <complex tier — tiers.complex > models.planner > models.worker, default opus>
```

5. After the plan worker completes:
   - Extract the plan file path from `<trellis:plan_path>...</trellis:plan_path>` in the worker's output
   - Fallback: if no XML tag found, re-glob `.trellis/plans/*.md` and find the newest draft
   - Read the plan file
6. Present plan to user (same approval flow as standard path — use AskUserQuestion with Approve/Modify/Cancel)

## TDD Phase (skip if tdd.enabled is not true in trellis.yaml)

6b. Read `tdd` config from `.trellis/trellis.yaml` (same as standard path).
    If `tdd.enabled` is false or absent, skip to Execution.

6c. Check exclusions: if ALL plan tasks match a `tdd.exclude` pattern, skip TDD.
    Matching is case-insensitive substring: task "update VISION.md docs" matches `docs`.

6d. Record current commit hash: run `git rev-parse HEAD` and save as `TEST_BASELINE_HASH`.

6e. Spawn the test writer worker.
    For complex plans, the test writer covers ALL waves — write the full test suite upfront.
    Rationale: test isolation between waves is harder to enforce than a single complete suite.

```
description: "write tests for <plan-title>"
prompt: |
  You are a trellis TEST WRITER worker.

  ## Plan
  <paste full plan tasks and done_when here (all waves)>

  ## Your Job
  Write tests that will FAIL until the production code is implemented.
  Map each Done When criterion to at least one test case.
  Do NOT write any production code.

  ## Test Grouping by Wave (required for complex plans)
  This plan executes in waves. Each wave's workers will be told to make only THEIR wave's
  tests pass — tests for later waves are expected to still fail at that point. For this to
  work, tests must be clearly attributed to a wave. Group them using describe blocks:
    describe("Wave 1 — <first wave title>", () => { ... })
    describe("Wave 2 — <second wave title>", () => { ... })
  Or use separate test files per wave when the project conventions support it.
  Without this grouping, wave workers cannot tell "expected to fail" from "I broke something"
  — they'll either over-fix (touching out-of-scope code) or under-fix (missing their tests).

  ## Protocols
  <paste these sections from conventions.md:>
  <"§1 Commit Protocol" section>
  <"§2 Learning Protocol" section>
  <"§16 TDD — TEST WRITER" sub-section>
  <"§12 Visual Identity" section>
model: <resolved standard tier>
```

6f. After test writer completes:
    - Run `git rev-parse HEAD` and save as `TEST_COMMIT_HASH`
    - Append a journal event:
      ```json
      {"ts":"YYYY-MM-DDTHH:MM:SS","event":"worker_complete","plan_id":"<NNN>","path":"complex","data":{"role":"test_writer","verdict":"none"}}
      ```
    - If `tdd.approve_tests` is true: present the TDD Gate approval question (same as standard path §TDD Phase step 7f,
      including the "show test files first" step — run `git diff --name-only <TEST_BASELINE_HASH>..HEAD` and list them).
    - If approved or approve_tests is false: append a tdd_gate journal event and continue to Execution.
      ```json
      {"ts":"YYYY-MM-DDTHH:MM:SS","event":"tdd_gate","plan_id":"<NNN>","path":"complex","data":{"decision":"approved|adjusted|skipped","test_commit_hash":"<TEST_COMMIT_HASH or null>"}}
      ```
    - If user skips TDD: set TEST_COMMIT_HASH to null and continue without TDD constraint.
    - Persist TDD hashes (skip only if TEST_COMMIT_HASH is null):
      Read the plan file and add to its YAML frontmatter:
      `tdd_baseline_hash: <TEST_BASELINE_HASH>` and `tdd_commit_hash: <TEST_COMMIT_HASH>`
      Write the updated plan file. These survive session interruption — the resumption flow in do.md
      reads them to reconstruct TDD context without re-running the test writer.

## Execution

7. Read conventions reference: Glob `**/trellis/references/conventions.md`, then read it.
8. Read `.trellis/trellis.yaml` for specialist config
9. Determine if a specialist applies using §4 (Specialist Delegation) from conventions.md.
10. Record the current commit hash as the implementation baseline:
    Run `git rev-parse HEAD` and save the result as `BASELINE_HASH`.
    Append a journal event:
    ```json
    {"ts":"YYYY-MM-DDTHH:MM:SS","event":"plan_start","plan_id":"<NNN>","path":"complex","data":{"title":"<plan title>","baseline_hash":"<BASELINE_HASH>"}}
    ```
11. Execute wave by wave:
   For each wave:
   - Identify independent task groups within the wave
   - If tasks are truly independent (different files, no shared imports):
     Spawn parallel implement workers (one per task group)
     Each worker gets its subset of tasks + done_when + commit/learning protocols
     If TDD is active: include the TDD Constraint block (§16 IMPLEMENT WORKER) in each worker's prompt,
       with TEST_BASELINE_HASH and TEST_COMMIT_HASH values.
       Also append to the TDD Constraint: "The TDD baseline covers all waves. Your job is to
       make only the tests for YOUR wave's Done When criteria pass — tests for later waves are
       expected to still fail until those waves run."
     Include specialist delegation in each worker's prompt if applicable (same as path-standard step 12)
   - If tasks touch overlapping files, share imports, or you're unsure:
     Default to worktree isolation — the merge cost is low, the conflict risk is not.
     Spawn workers with `isolation: "worktree"` for safety.
     When worktree workers complete, their changes are on separate branches.
     Merge each branch sequentially: `git merge <branch>`.
     If a merge conflict occurs:
       - Show the conflict diff to the user
       - Ask: "How should I resolve this?" with options:
         a) User describes the resolution — apply it, complete the merge
         b) Abort this wave — revert merge, mark wave as failed, ask user to adjust plan
   - Wait for all workers in wave to complete
   - For each worker that finished, append a journal event:
     ```json
     {"ts":"YYYY-MM-DDTHH:MM:SS","event":"worker_complete","plan_id":"<NNN>","path":"complex","data":{"role":"implement","verdict":"none","wave":<wave-number>}}
     ```
   - Verify wave tasks are done (check plan checkboxes)
   - Show garden for parallel waves:
```
─────────────────────────────────────────────────────────────────
                    _
                  _(_)_                          wWWWw   _
      @@@@       (_)@(_)   vVVVv     _     @@@@  (___) _(_)_
     @@()@@ wWWWw  (_)\    (___)   _(_)_  @@()@@   Y  (_)@(_)
      @@@@  (___)     `|/    Y    (_)@(_)  @@@@   \|/   (_)\
       /      Y       \|    \|/    /(_)    \|      |/      |
    \ |     \ |/       | / \ | /  \|/       |/    \|      \|/
    \\|//   \\|///  \\\|//\\\|/// \|///  \\\|//  \\|//  \\\|//
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
─────────────────────────────────────────────────────────────────
```

   - Proceed to next wave

## Review and Completion

After all waves complete, follow path-standard.md (Glob `**/trellis/references/path-standard.md`) starting from the **Review** section. The review/fix cycle and completion flow are identical — gather changed files using `git diff --name-only <BASELINE_HASH>..HEAD` (from step 10), spawn review worker, handle verdict, update state.
