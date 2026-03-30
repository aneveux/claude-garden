---
description: Quick state report - current work, progress, recent learnings
allowed-tools: Read, Glob
---

# Trellis Status

Read and report the current project state.

## Procedure

1. Check `.trellis/trellis.yaml` exists. If not: "Trellis is not initialized. Run /trellis:bootstrap."

2. Read `.trellis/STATE.md`

3. Read `.trellis/trellis.yaml` for project info

3b. Read `.trellis/.audit-tracker.json` if it exists
3c. Read stewardship config from trellis.yaml
3d. Read `.trellis/metrics.json` if it exists — compute summary stats:
    - Total tasks completed (by path: simple/standard/complex)
    - First-pass review rate: tasks where review_verdict == "pass" / tasks where review_verdict is "pass" or "fixme"
    - Average agents per task

4. Check for active plans: Glob `.trellis/plans/*.md` — if the directory doesn't exist yet, skip this step. Otherwise read any plans with status != done/cancelled.

4b. Read `.trellis/BACKLOG.md` if it exists — count open items by severity (critical, warning, normal).

5. Present status with appropriate plant:

If work is active (plan in-progress):
```
─────────────────────────────────────────────
    ,*-.
    |  |   🌿 Trellis Status: <project-name>
,.  |  |
| |_|  |   Focus: <current focus>
`---.  |   Plan: <plan path> (<N/M tasks done>)
    |  |   Last: <timestamp>
    |  |
               Recent learnings:
               - <last 5 learnings>

               Pending decisions:
               - <any pending decisions>

               Audits:
               - Last: <most recent audit date and lens, or "never">
               - Commits since: <total commits across all lenses from tracker>
               - Due: <any lens past its threshold, or "all clear">

               Backlog: <N critical, N warning, N normal from .trellis/BACKLOG.md, if file exists>

               Metrics: <N tasks (S simple, T standard, C complex)>
               - First-pass review rate: <X%>
               - Avg agents/task: <N.N>
─────────────────────────────────────────────
```

If idle:
```
─────────────────────────────────────────────
      ,xXXXXx,
     ,XXXXXXXX,
     XXXXXXXXXX   🌳 Trellis Status: <project-name>
     `"""XX"""`
         XX       All clear! No active work.
         XX       Learnings so far: <count>
         XX       Plans completed: <count>

                  Audits:
                  - Last: <most recent audit date and lens, or "never">
                  - Commits since: <total commits across all lenses from tracker>
                  - Due: <any lens past its threshold, or "all clear">

                  Backlog: <N critical, N warning, N normal from .trellis/BACKLOG.md, if file exists>

                  Metrics: <N tasks (S simple, T standard, C complex)>
                  - First-pass review rate: <X%>
                  - Avg agents/task: <N.N>

                  Run /trellis:do <request> to start!
─────────────────────────────────────────────
```
