# Trellis

An agent framework for structured development with Claude Code. Trellis breaks work into plan-implement-review cycles, delegates to specialist agents when configured, and accumulates project knowledge over time.

```
       _ _
      (_\_)
     (__<_{}
      (_/_)
     |\ |
      \\| /|
       \|//
        |/
   ,.,.,|.,.,.
```

## Quick Start

```
/trellis:bootstrap          # Initialize on your project (2 questions)
/trellis:do add user auth   # Give it a task
```

Bootstrap creates `.trellis/` with config, state, and direction documents. Two questions, then you're ready.

## Commands

| Command | Description |
|---------|-------------|
| `/trellis:bootstrap` | Initialize trellis on a project |
| `/trellis:do <task>` | Main command - plan, implement, review |
| `/trellis:status` | Show current state, progress, learnings |
| `/trellis:retro` | Review learnings, promote patterns to CLAUDE.md |
| `/trellis:audit [lens]` | Run project health audit (6 lenses) |
| `/trellis:idea [description]` | Capture and evaluate ideas against project direction |
| `/trellis:help` | Show commands and usage guide |

## How It Works

`/trellis:do` reads your request, examines the codebase, and picks one of three paths:

| Path | When | What Happens |
|------|------|-------------|
| **Simple** | 1-2 files, clear fix | Direct edit + commit. No agents. |
| **Standard** | 3-8 files, feature/refactor | Plan -> approve -> implement worker -> review worker |
| **Complex** | 8+ files, cross-cutting | Research -> plan with waves -> parallel workers -> review |

Force a path with prefixes: `quick:` (simple) or `deep:` (complex).

Standard and complex paths always go through review. The review runs four passes (spec compliance, functional, challenge, adversarial) with increasing skepticism. If issues are found, a fix worker addresses them (max 2 fix/review cycles).

## Configuration

`.trellis/trellis.yaml`:

```yaml
project:
  name: "my-project"
  description: "What it does"

specialists:
  # bash: bark:bash-developer
  # java: javacraft:java-developer

models:
  worker: sonnet       # default for all workers (sonnet, opus, haiku, or any model ID)
  # planner: opus      # per-role overrides (optional)
  # implementer: sonnet
  # reviewer: haiku
  # fixer: sonnet
```

## Specialists

When a task involves a specific domain and a specialist is configured, trellis delegates the implementation to that agent. The specialist writes the code following its own conventions, while the trellis worker handles commits, state updates, and learning extraction.

```yaml
specialists:
  bash: bark:bash-developer
```

With this config, tasks involving `.sh` files or bash scripts get routed to the bark developer agent.

## Learning System

Every worker asks itself after each task: "Did I discover anything non-obvious about this codebase?" Discoveries get logged to `.trellis/STATE.md`:

```
## Learnings
- 2026-03-24 | Tests require REDIS_URL env var even for unit tests
- 2026-03-24 | Auth middleware must be registered before route handlers
```

Run `/trellis:retro` periodically to review learnings. Patterns that show up repeatedly get promoted to your project's `CLAUDE.md`, where future sessions pick them up automatically.

## Stewardship

Trellis watches project direction, consistency, and quality — not just execution. Stewardship extends the lifecycle: ideate, build, learn, audit, ideate.

### Stewardship Documents

Bootstrap creates direction documents alongside the trellis config:

- **VISION.md** — Principles, non-goals, constraints. The north star for "should we build this?"
- **DECISIONS.md** — Architecture Decision Records (ADRs). Why X over Y, captured once so future sessions don't re-debate.
- **ARCHITECTURE.md** — Optional. Layer definitions, module boundaries, data flow. Created during bootstrap.

### Audits (`/trellis:audit`)

Six lenses check different aspects of project health:

| Lens | What it checks | Default frequency |
|------|---------------|-------------------|
| Consistency | Naming, patterns, API shape uniformity | Every 8 commits |
| Security | Auth patterns, secrets, input validation | Every 15 commits (auto) |
| Architecture | Layer boundaries, dependency direction | Every 20 commits |
| Vision | Alignment with principles, non-goal violations | On-demand |
| DX | Error messages, CLI UX, onboarding friction | On-demand |
| Tech Debt | TODOs, dead code, test gaps, stale deps | On-demand |

Run a single lens (`/trellis:audit security`) or sweep all configured lenses (`/trellis:audit`).

### Ideas (`/trellis:idea`)

Capture ideas with automatic evaluation against project direction. Each idea is checked against VISION.md principles and DECISIONS.md for conflicts before storage.

### Reactive Stewardship

During planning (standard + complex paths), trellis reads VISION.md and DECISIONS.md to flag misalignment before implementation begins. Obvious conflicts are caught at routing time in `/trellis:do`.

### Audit Configuration

Configure thresholds and modes in `.trellis/trellis.yaml`:

```yaml
stewardship:
  vision: VISION.md
  decisions: DECISIONS.md
  # architecture: docs/ARCHITECTURE.md

  audits:
    consistency:
      frequency: 8      # commits between checks
      mode: nudge        # remind user
    security:
      frequency: 15
      mode: auto         # run automatically
    architecture:
      frequency: 20
      mode: nudge
```

## Hooks

Trellis includes three hooks:

- `context-monitor.js` (PostToolUse) warns when remaining context drops below 35% and 25%, so you can wrap up and continue in a fresh session.
- `audit-nudge.js` (PostToolUse) counts git commits and nudges when audit thresholds are reached. Security audits auto-trigger; others nudge only.
- `session-save.js` (Stop) updates the `Last:` timestamp in STATE.md when a session ends.

The context monitor reads metrics from a statusline bridge file (`/tmp/claude-ctx-{session_id}.json`). If no bridge file exists, it stays silent — context monitoring is inactive until you install a statusline plugin that writes this file. Built-in options include `/safety-net:set-statusline` and `/gsd:settings`.

## Plugin Structure

```
plugins/trellis/
  commands/
    do.md              # Main orchestrator (routes to path files)
    bootstrap.md       # Project initialization
    status.md          # State reporter
    retro.md           # Learning promotion
    audit.md           # Project health audits
    idea.md            # Idea capture + evaluation
    help.md            # Usage guide
  references/
    path-simple.md     # Simple path execution
    path-standard.md   # Standard path (plan/implement/review)
    path-complex.md    # Complex path (research/waves/parallel)
    conventions.md     # Worker protocols (injected into spawn prompts)
    plan-format.md     # Plan file specification
    worker-protocol.md # Worker role documentation
    audit-lenses.md    # Audit lens definitions (6 lenses)
  templates/
    trellis.yaml.template
    STATE.md.template
    VISION.md.template
    DECISIONS.md.template
    ARCHITECTURE.md.template
    BACKLOG.md.template
  hooks/
    hooks.json
    context-monitor.js
    audit-nudge.js
    session-save.js
```

## State Files

All trellis state lives in `.trellis/`:

```
.trellis/
  trellis.yaml          # Project config
  STATE.md             # Current focus, progress, learnings
  BACKLOG.md           # Unified task backlog (ideas + audit findings)
  .audit-tracker.json  # Commit counters per audit lens
  plans/
    001-user-auth.md   # Plan files (created by /trellis:do)
    002-api-rework.md
  audits/
    2026-03-25-security.md  # Audit reports
```

Plans track status (`draft` -> `approved` -> `in-progress` -> `done`) and task completion via checkboxes. `/trellis:status` reads all of this and gives you a quick summary.

## Version Control

Commit the entire `.trellis/` directory. Plans are useful project history, and `STATE.md` is small — keeping it in git lets team members (and future sessions) see the full context of what happened and what was learned.
