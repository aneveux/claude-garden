# Complex Path

Cross-cutting change, redesign, or unfamiliar domain (8+ files). Research -> plan with waves -> parallel workers -> review.

Show sumo penguin:
```
    _
  ('v')  Big task. Let me research and plan.
 //-=-\\
 (\_=_/)
  ^^ ^^
```

## Research (optional)

1. If the domain is unfamiliar (no relevant learnings in STATE.md, unfamiliar tech stack):
   Spawn a research worker:

```
description: "research for <task>"
prompt: |
  You are a waddle PLAN worker doing research.
  Explore the codebase to understand: <specific questions about the domain>
  Read relevant files, check dependencies, understand patterns.
  Return a summary of findings relevant to: <the user's request>
  Do NOT write any files. Just report back.
```

2. Use research findings to inform planning

## Planning

3. Find and read the plan format reference (Glob `**/waddle/references/plan-format.md`)
4. Either:
   a. Draft the plan yourself (if scope is clear from research + code reading)
   b. Spawn a plan worker (if scope is large):

```
description: "plan <task>"
prompt: |
  You are a waddle PLAN worker.

  ## Request
  <user's request>

  ## Research Findings
  <from research phase, if any>

  ## Plan Format
  <paste full format section from plan-format.md>

  ## Instructions
  - Write a plan file to .waddle/plans/NNN-<slug>.md
  - Use the full format with waves
  - Group independent tasks into the same wave
  - Dependent tasks go in later waves
  - Write specific, testable Done When criteria
  - Include Must Haves for structural verification
  - Set status: draft

  ## Output
  When done, report the plan file path using this exact format:
  <waddle:plan_path>.waddle/plans/NNN-slug.md</waddle:plan_path>
model: <from waddle.yaml models.planner if set, else models.worker, default sonnet>
```

5. After the plan worker completes:
   - Extract the plan file path from `<waddle:plan_path>...</waddle:plan_path>` in the worker's output
   - Fallback: if no XML tag found, re-glob `.waddle/plans/*.md` and find the newest draft
   - Read the plan file
6. Present plan to user (same approval flow as standard path — use AskUserQuestion with Approve/Modify/Cancel)

## Execution

7. Read conventions reference: Glob `**/waddle/references/conventions.md`, then read it.
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
   - Show group penguin for parallel waves:
```
  <`)   <`)   <`)
  /V\   /V\   /V\
 <(_)  <(_)  <(_)
  ~~    ~~    ~~
```

   - Proceed to next wave

## Review and Completion

After all waves complete, follow the **Review** and **Completion** sections from `references/path-standard.md` (Glob `**/waddle/references/path-standard.md`). The review/fix cycle and completion flow are identical — gather changed files, spawn review worker, handle verdict, update state.
