---
description: Review accumulated learnings, promote patterns to CLAUDE.md
allowed-tools: Read, Write, Edit, Glob, AskUserQuestion
---

# Waddle Retro

Review accumulated learnings in STATE.md. Promote validated patterns to the project's CLAUDE.md. Prune STATE.md.

## Procedure

1. Read `.waddle/STATE.md` - focus on Learnings section
2. Read the project's `CLAUDE.md` (in project root). If it doesn't exist, note this — you'll create it in step 5 if patterns are approved for promotion.

3. Analyze learnings:
   - Group related learnings by theme (e.g., "testing patterns", "project conventions", "tool usage")
   - Identify patterns that appear 2+ times or are clearly universal truths about the project
   - Separate one-off discoveries from recurring patterns

4. Present findings to user:

Show looking penguin:
```
   _
  (o)   Waddle Retro
  /V\   Reviewing <N> learnings...
  (_)>
  ~~
```

**Patterns to promote** (seen 2+ times or clearly permanent):
- "<pattern>" (seen N times)
- ...

**One-off learnings** (keep in STATE.md):
- "<learning>"
- ...

**Stale learnings** (outdated or superseded):
- "<learning>" - recommend removal

Use AskUserQuestion:
- question: "Promote these patterns to CLAUDE.md?"
- header: "Promote"
- options:
  - label: "Approve"
    description: "Promote patterns and prune stale learnings"
  - label: "Modify"
    description: "I want to adjust what gets promoted"
  - label: "Skip"
    description: "Keep everything as-is for now"

5. If approved:
   - If CLAUDE.md doesn't exist, create it with `# <project-name>\n\n` as header (read project name from waddle.yaml)
   - Append promoted patterns to CLAUDE.md under a `## Project Patterns (from waddle)` section
   - If that section already exists, merge (don't duplicate)
   - Remove promoted learnings from STATE.md (they now live in CLAUDE.md)
   - Remove stale learnings from STATE.md
   - Keep one-off learnings in STATE.md

6. Report:
```
   _
  (v)   Retro complete!
 //-\\  Promoted: <N> patterns to CLAUDE.md
 (\_/)  Pruned: <M> stale learnings
  ^ ^   Remaining: <K> learnings in STATE.md
```
