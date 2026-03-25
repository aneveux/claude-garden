---
description: Quick state report - current work, progress, recent learnings
allowed-tools: Read, Glob
---

# Waddle Status

Read and report the current project state.

## Procedure

1. Check `.waddle/waddle.yaml` exists. If not: "Waddle is not initialized. Run /waddle:bootstrap."

2. Read `.waddle/STATE.md`

3. Read `.waddle/waddle.yaml` for project info

4. Check for active plans: Glob `.waddle/plans/*.md` — if the directory doesn't exist yet, skip this step. Otherwise read any plans with status != done/cancelled.

5. Present status with appropriate penguin:

If work is active (plan in-progress):
```
    _
   (v)   Waddle Status: <project-name>
   /V\
   (_)>  Focus: <current focus>
   ~~    Plan: <plan path> (<N/M tasks done>)
         Last: <timestamp>

         Recent learnings:
         - <last 5 learnings>

         Pending decisions:
         - <any pending decisions>
```

If idle:
```
   _
  (v)   Waddle Status: <project-name>
 //-\\
 (\_/)  All clear! No active work.
  ^ ^
         Learnings so far: <count>
         Plans completed: <count>

         Run /waddle:do <request> to start!
```
