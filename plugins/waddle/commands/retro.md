---
description: Review accumulated learnings, promote patterns to CLAUDE.md
allowed-tools: Read, Write, Edit, Glob, AskUserQuestion
---

# Waddle Retro

Review accumulated learnings in STATE.md. Promote validated patterns to the project's CLAUDE.md. Prune STATE.md.

## Procedure

1. Read `.waddle/STATE.md` - focus on Learnings section
1b. Read `.waddle/audits/` directory — if it exists, read the most recent audit report(s)
2. Read the project's `CLAUDE.md` (in project root). If it doesn't exist, note this — you'll create it in step 5 if patterns are approved for promotion.

2b. Read `.waddle/BACKLOG.md` if it exists — note open items and their dates

3. Analyze learnings:
   - Group related learnings by theme (e.g., "testing patterns", "project conventions", "tool usage")
   - Identify patterns that appear 2+ times or are clearly universal truths about the project
   - Separate one-off discoveries from recurring patterns

3b. Also review recent audit findings:
    - Recurring audit findings (same issue found in 2+ audits) should be promoted as patterns
    - Audit findings that have been addressed can be noted as resolved
    - Example: if consistency audits keep finding mixed naming conventions, promote
      a naming convention rule to CLAUDE.md

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

**Audit-derived patterns** (recurring findings across audits):
- "<pattern>" (found in N audits)

**Stale learnings** (outdated or superseded):
- "<learning>" - recommend removal

**Stale backlog items** (open > 30 days):
- "<item>" — open since <date>, <source>. Still relevant?

Use AskUserQuestion:
- question: "Promote these patterns to CLAUDE.md?"
- header: "Promote"
- options:
  - label: "Approve"
    description: "Promote patterns, prune stale learnings, and triage stale backlog items"
  - label: "Modify"
    description: "I want to adjust what gets promoted or triaged"
  - label: "Skip"
    description: "Keep everything as-is for now"

5. If approved:
   - If CLAUDE.md doesn't exist, create it with `# <project-name>\n\n` as header (read project name from waddle.yaml)
   - Append promoted patterns to CLAUDE.md under a `## Project Patterns (from waddle)` section
   - If that section already exists, merge (don't duplicate)
   - Remove promoted learnings from STATE.md (they now live in CLAUDE.md)
   - Remove stale learnings from STATE.md
   - Keep one-off learnings in STATE.md
   - For stale backlog items the user confirms are irrelevant: mark `[x]` and move to Done
     with note "archived via retro"
   - For stale backlog items the user wants to keep: leave as-is (they'll age again for next retro)

6. Report:
```
   _
  (v)   Retro complete!
 //-\\  Promoted: <N> patterns to CLAUDE.md
 (\_/)  Pruned: <M> stale learnings
  ^ ^   Remaining: <K> learnings in STATE.md
```
