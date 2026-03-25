---
description: List waddle commands and quick usage guide
allowed-tools: Read
---

# Waddle Help

Show available commands and basic usage.

## Output

```
    _
  ('v')   Waddle - Structured Development
 //-=-\\
 (\_=_/)
  ^^ ^^
```

**Commands:**

| Command | Description |
|---------|-------------|
| `/waddle:do <task>` | Main command - routes to simple/standard/complex path |
| `/waddle:bootstrap` | Initialize waddle on a project (creates `.waddle/`) |
| `/waddle:status` | Show current state, progress, learnings |
| `/waddle:retro` | Review learnings, promote patterns to CLAUDE.md |
| `/waddle:audit [lens]` | Run project health audit (consistency, security, architecture, vision, dx, debt) |
| `/waddle:idea [description]` | Capture idea to backlog, or review/triage all backlog items |
| `/waddle:help` | This help message |

**Path prefixes** (optional with `/waddle:do`):
- `quick:` — force simple path (direct edit, no agents)
- `deep:` — force complex path (research + parallel waves)

**Examples:**
```
/waddle:do fix the typo in config.yaml
/waddle:do add input validation to the signup form
/waddle:do deep: redesign the authentication module
/waddle:audit consistency
/waddle:audit security
/waddle:audit                  (runs all configured lenses)
/waddle:idea add API versioning support
/waddle:idea                   (review & triage backlog)
/waddle:do                     (pick from backlog)
```

**Getting started:** Run `/waddle:bootstrap` first to initialize, then `/waddle:do <task>`.
