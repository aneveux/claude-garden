# Complex Path

Cross-cutting change, redesign, or unfamiliar domain (8+ files). Research -> plan with waves -> parallel workers -> review.

Show the sprout:
```
       _ _
      (_\_)
     (__<_{}   Big task. Let me research and plan.
      (_/_)
     |\ |
      \\| /|
       \|//
        |/
   ,.,.,|.,.,.
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
model: <from trellis.yaml models.planner if set, else models.worker, default sonnet>
```

2. Use research findings to inform planning

## Planning

2b. Reactive stewardship check:
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

  ## Plan Format
  <paste full format section from plan-format.md>

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
model: <from trellis.yaml models.planner if set, else models.worker, default sonnet>
```

5. After the plan worker completes:
   - Extract the plan file path from `<trellis:plan_path>...</trellis:plan_path>` in the worker's output
   - Fallback: if no XML tag found, re-glob `.trellis/plans/*.md` and find the newest draft
   - Read the plan file
6. Present plan to user (same approval flow as standard path — use AskUserQuestion with Approve/Modify/Cancel)

## Execution

7. Read conventions reference: Glob `**/trellis/references/conventions.md`, then read it.
8. Execute wave by wave:
   For each wave:
   - Identify independent task groups within the wave
   - If tasks are truly independent (different files, no shared imports):
     Spawn parallel implement workers (one per task group)
     Each worker gets its subset of tasks + done_when + commit/learning protocols
   - If tasks have potential file overlap, or you're unsure:
     Default to worktree isolation — the merge cost is low, the conflict risk is not.
     Spawn workers with `isolation: "worktree"` for safety.
     When worktree workers complete, their changes are on separate branches.
     Merge each branch sequentially: `git merge <branch>`.
     If a merge conflict occurs, do NOT auto-resolve — present the conflict diff to the user and ask for guidance on how to resolve it.
   - Wait for all workers in wave to complete
   - Verify wave tasks are done (check plan checkboxes)
   - Show garden for parallel waves:
```
                    _
                  _(_)_                          wWWWw   _
      @@@@       (_)@(_)   vVVVv     _     @@@@  (___) _(_)_
     @@()@@ wWWWw  (_)\    (___)   _(_)_  @@()@@   Y  (_)@(_)
      @@@@  (___)     `|/    Y    (_)@(_)  @@@@   \|/   (_)\
       /      Y       \|    \|/    /(_)    \|      |/      |
    \ |     \ |/       | / \ | /  \|/       |/    \|      \|/
    \\|//   \\|///  \\\|//\\\|/// \|///  \\\|//  \\|//  \\\|//
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
```

   - Proceed to next wave

## Review and Completion

After all waves complete, follow the **Review** and **Completion** sections from `references/path-standard.md` (Glob `**/trellis/references/path-standard.md`). The review/fix cycle and completion flow are identical — gather changed files, spawn review worker, handle verdict, update state.
