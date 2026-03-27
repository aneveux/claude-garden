---
description: Capture and evaluate ideas against project vision and decisions
allowed-tools: Read, Write, Edit, Glob, AskUserQuestion
---

# Trellis Idea

Structured idea capture with automatic evaluation against project direction.
Ideas are stored in the unified backlog alongside audit findings and other actionable items.

## Determine Mode

The user's argument follows `/trellis:idea`. Two modes:

- **With argument** (e.g., `/trellis:idea add rate limiting per API key`): capture mode
- **No argument** (`/trellis:idea`): review mode

## Capture Mode

### Step 1: Load Context

1. Read `.trellis/trellis.yaml` — extract stewardship doc paths
2. Read VISION.md (path from `stewardship.vision`) if it exists — extract principles + non-goals
3. Read DECISIONS.md (path from `stewardship.decisions`) if it exists — scan for potential conflicts
4. Read `.trellis/STATE.md` — check recent audit findings (does this idea address a known issue?)
5. Read `.trellis/BACKLOG.md` — check if this idea duplicates an existing item

### Step 2: Evaluate

Assess the idea against project direction:

- **Alignment**: Which principles does this support? Does it hit any non-goals?
- **Conflicts**: Does this contradict any existing ADR in DECISIONS.md?
- **Addresses known issues**: Does this fix something already in the backlog?
- **Complexity estimate**: Small (1-2 files) / Medium (3-8 files) / Large (8+ files)

If VISION.md doesn't exist, skip alignment checks and note:
"No VISION.md found — alignment not checked. Run `/trellis:bootstrap` to create one."

If the idea duplicates an existing backlog item, note it:
"This looks similar to an existing backlog item: '<item>'. Adding anyway as a separate entry, or would you prefer to update the existing one?"

### Step 3: Store

Read `.trellis/BACKLOG.md`. If it doesn't exist, create it from template (Glob `**/trellis/templates/BACKLOG.md.template`).

Append the idea under `### Normal` in the `## Open` section:

```markdown
- [ ] <idea-title> — `user` YYYY-MM-DD
  Alignment: <summary> | Complexity: <estimate>
```

### Step 4: Present

Show the seedling with evaluation:

```
─────────────────────────────────────────────
   |
 .'|'.    🌱 Idea captured: <title>
/.'|\ \
| /|'.|   Alignment: <summary>
 \ |\/    Complexity: <estimate>
  \|/
   `
─────────────────────────────────────────────
```

If conflicts found, highlight them clearly.

### Step 5: Offer Promotion

Use AskUserQuestion:
- question: "Just capture, or start working on it now?"
- header: "Idea"
- options:
  - label: "Capture only"
    description: "Save it in the backlog for later"
  - label: "Work on it"
    description: "Start working on it with /trellis:do"

If "Work on it": suggest the `/trellis:do` command with the idea as task description.

## Review Mode

### Step 1: Load Backlog

1. Read `.trellis/BACKLOG.md`
2. If file doesn't exist: "No backlog yet. Use `/trellis:idea <description>` to add an idea, or run `/trellis:audit` to populate with findings."

**Migration**: If `.trellis/BACKLOG.md` doesn't exist but `.trellis/ideas.md` does, offer migration:
"Found ideas.md from an older trellis version. Want me to migrate these to BACKLOG.md?"
Use AskUserQuestion with Migrate/Skip options. If Migrate: read ideas.md, convert each
captured/promoted idea to backlog format under `### Normal`, write to BACKLOG.md.

### Step 2: Present

List all open backlog items grouped by severity, with source attribution:

```
─────────────────────────────────────────────
   |
 .'|'.    🌱 Backlog (<N> open items)
/.'|\ \
| /|'.|
 \ |\/
  \|/
   `

   Critical: (<count>)
   1. <description> — <source> <date>
   2. ...

   Warning: (<count>)
   1. <description> — <source> <date>
   2. ...

   Normal: (<count>)
   1. <description> — <source> <date>
   2. ...

   Done: (<count> completed)
─────────────────────────────────────────────
```

If no open items: "Backlog is clear! Run `/trellis:audit` to check for issues, or `/trellis:idea <desc>` to capture an idea."

### Step 3: Act

Use AskUserQuestion:
- question: "What would you like to do?"
- header: "Backlog"
- options:
  - label: "Work on item"
    description: "Pick an item to start with /trellis:do"
  - label: "Archive"
    description: "Remove completed or irrelevant items"
  - label: "Done"
    description: "Just reviewing"

Handle based on selection:
- **Work on item**: Ask which item (by number), suggest `/trellis:do` command with the item description
- **Archive**: Ask which item(s), mark as `[x]` and move to Done section with today's date
- **Done**: Exit
