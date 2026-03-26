# Standard Path

Feature, refactor, or module-level change (3-8 files). Plan -> approve -> implement -> review.

Show the seedling:
```
   |
 .'|'.    Planning...
/.'|\ \
| /|'.|
 \ |\/
  \|/
   `
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
   |        ,*-.
 .'|'.      |  |   Plan #NNN: <title>
/.'|\ \  ,. |  |
| /|'.|  | |_| | ,.
 \ |\/   `---. |_| |
  \|/        | .--`
   `         | |
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

## Implementation

8. Find and read the conventions reference: Glob `**/trellis/references/conventions.md`, then read it. You will paste relevant sections from this file into each worker's spawn prompt.
9. Read `.trellis/trellis.yaml` for specialist config and worker model
10. Determine if a specialist applies:
    - Check specialists config in trellis.yaml
    - Match task domain to specialist (e.g., .sh/.bash files -> bash specialist)
11. Record the current commit hash as the implementation baseline:
    Run `git rev-parse HEAD` and save the result as `BASELINE_HASH`. You'll use this after implementation to find all changed files.
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
  <"Pending Decisions Protocol" section>
  <"State Update Protocol" section>
  <"Implementation Integrity" section>
  <"Verification Before Completion" section>

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
model: <from trellis.yaml models.implementer if set, else models.worker, default sonnet>
```

13. Update plan status to `in-progress`
14. Wait for implement worker to complete

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
model: <from trellis.yaml models.reviewer if set, else models.worker, default sonnet>
```

17. Show the bloom with review summary:
```
      ,xXXXXx,
     ,XXXXXXXX,
     XXXXXXXXXX   Review complete!
     `"""XX"""`
         XX
         XX
         XX
```

18. Process review result — extract verdict from the review output:
    - Find `<trellis:verdict>...</trellis:verdict>` in the output and extract the inner text (PASS or FIXME)
    - If no XML tag found, treat as FIXME and log a note that the reviewer didn't produce a structured verdict.
    - **If PASS**: Continue to Completion
    - **If FIXME**: Show issues to user, then spawn fix worker:

```
description: "fix <plan-title> issues"
prompt: |
  You are a trellis FIX worker.

  ## Issues to Fix
  <paste FIXME items from review>

  ## Protocols
  <paste these sections from conventions.md (read in step 8):>
  <"Commit Protocol" section>
  <"Learning Protocol" section>
  <"Verification Before Completion" section>

  ## Rules
  - Fix ONLY the listed issues. No other changes.
  - One commit per fix.
model: <from trellis.yaml models.fixer if set, else models.worker, default sonnet>
```

19. After fix worker: spawn another review worker (max 2 fix/review cycles total)
    - If still FIXME after 2 cycles: present remaining issues to user, ask for guidance

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
      ,xXXXXx,
     ,XXXXXXXX,
     XXXXXXXXXX   All done! Plan #NNN complete.
     `"""XX"""`
         XX
         XX
         XX
```
