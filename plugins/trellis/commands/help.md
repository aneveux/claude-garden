---
description: List trellis commands and quick usage guide
allowed-tools: Read
---

# Trellis Help

Show available commands and basic usage.

## Output

```
─────────────────────────────────────────────
       _ _
      (_\_)
     (__<_{}   Trellis - Structured Development
      (_/_)
     |\ |
      \\| /|
       \|//
        |/
   ,.,.,|.,.,.
─────────────────────────────────────────────
```

**Commands:**

| Command | Description |
|---------|-------------|
| `/trellis:do <task>` | Main command - routes to simple/standard/complex path |
| `/trellis:bootstrap` | Initialize trellis on a project (creates `.trellis/`) |
| `/trellis:status` | Show current state, progress, learnings |
| `/trellis:retro` | Review learnings, promote patterns to CLAUDE.md |
| `/trellis:audit [lens]` | Run project health audit (consistency, security, architecture, vision, dx, debt) |
| `/trellis:idea [description]` | Capture idea to backlog, or review/triage all backlog items |
| `/trellis:help` | This help message |

**Path prefixes** (optional with `/trellis:do`):
- `quick:` — force simple path (direct edit, no agents)
- `deep:` — force complex path (research + parallel waves)

**Examples:**
```
/trellis:do fix the typo in config.yaml
/trellis:do add input validation to the signup form
/trellis:do deep: redesign the authentication module
/trellis:audit consistency
/trellis:audit security
/trellis:audit                  (runs all configured lenses)
/trellis:idea add API versioning support
/trellis:idea                   (review & triage backlog)
/trellis:do                     (pick from backlog)
```

**Getting started:** Run `/trellis:bootstrap` first to initialize, then `/trellis:do <task>`.
