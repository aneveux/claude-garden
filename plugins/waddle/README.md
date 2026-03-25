# Waddle

An agent framework for structured development with Claude Code. Waddle breaks work into plan-implement-review cycles, delegates to specialist agents when configured, and accumulates project knowledge over time.

```
    _
  ('v')
 //-=-\\
 (\_=_/)
  ^^ ^^
```

## Quick Start

```
/waddle:bootstrap          # Initialize on your project (2 questions)
/waddle:do add user auth   # Give it a task
```

Bootstrap creates `.waddle/` with two files: `waddle.yaml` (config) and `STATE.md` (state + learnings).

## Commands

| Command | Description |
|---------|-------------|
| `/waddle:bootstrap` | Initialize waddle on a project |
| `/waddle:do <task>` | Main command - plan, implement, review |
| `/waddle:status` | Show current state, progress, learnings |
| `/waddle:retro` | Review learnings, promote patterns to CLAUDE.md |

## How It Works

`/waddle:do` reads your request, examines the codebase, and picks one of three paths:

| Path | When | What Happens |
|------|------|-------------|
| **Simple** | 1-2 files, clear fix | Direct edit + commit. No agents. |
| **Standard** | 3-8 files, feature/refactor | Plan -> approve -> implement worker -> review worker |
| **Complex** | 8+ files, cross-cutting | Research -> plan with waves -> parallel workers -> review |

Force a path with prefixes: `quick:` (simple) or `deep:` (complex).

Standard and complex paths always go through review. The review runs four passes (spec compliance, functional, challenge, adversarial) with increasing skepticism. If issues are found, a fix worker addresses them (max 2 fix/review cycles).

## Configuration

`.waddle/waddle.yaml`:

```yaml
project:
  name: "my-project"
  description: "What it does"

specialists:
  # bash: shellcraft:bash-developer
  # java: javacraft:java-developer

models:
  worker: sonnet       # default for all workers (sonnet, opus, haiku, or any model ID)
  # planner: opus      # per-role overrides (optional)
  # implementer: sonnet
  # reviewer: haiku
  # fixer: sonnet
```

## Specialists

When a task involves a specific domain and a specialist is configured, waddle delegates the implementation to that agent. The specialist writes the code following its own conventions, while the waddle worker handles commits, state updates, and learning extraction.

```yaml
specialists:
  bash: shellcraft:bash-developer
```

With this config, tasks involving `.sh` files or bash scripts get routed to the shellcraft developer agent.

## Learning System

Every worker asks itself after each task: "Did I discover anything non-obvious about this codebase?" Discoveries get logged to `.waddle/STATE.md`:

```
## Learnings
- 2026-03-24 | Tests require REDIS_URL env var even for unit tests
- 2026-03-24 | Auth middleware must be registered before route handlers
```

Run `/waddle:retro` periodically to review learnings. Patterns that show up repeatedly get promoted to your project's `CLAUDE.md`, where future sessions pick them up automatically.

## Hooks

Waddle includes two optional hooks:

- `context-monitor.js` (PostToolUse) warns when remaining context drops below 35% and 25%, so you can wrap up and continue in a fresh session.
- `session-save.js` (Stop) updates the `Last:` timestamp in STATE.md when a session ends.

The context monitor reads metrics from a statusline bridge file (`/tmp/claude-ctx-{session_id}.json`). If no bridge file exists, it stays silent — context monitoring is inactive until you install a statusline plugin that writes this file. Built-in options include `/safety-net:set-statusline` and `/gsd:settings`.

## Plugin Structure

```
plugins/waddle/
  commands/
    do.md              # Main orchestrator (routes to path files)
    bootstrap.md       # Project initialization
    status.md          # State reporter
    retro.md           # Learning promotion
    help.md            # Usage guide
  references/
    path-simple.md     # Simple path execution
    path-standard.md   # Standard path (plan/implement/review)
    path-complex.md    # Complex path (research/waves/parallel)
    conventions.md     # Worker protocols (injected into spawn prompts)
    plan-format.md     # Plan file specification
    worker-protocol.md # Worker role documentation
    personality.md     # ASCII art + tone guide
  templates/
    waddle.yaml.template
    STATE.md.template
  hooks/
    hooks.json
    context-monitor.js
    session-save.js
```

## State Files

All waddle state lives in `.waddle/`:

```
.waddle/
  waddle.yaml          # Project config
  STATE.md             # Current focus, progress, learnings
  plans/
    001-user-auth.md   # Plan files (created by /waddle:do)
    002-api-rework.md
```

Plans track status (`draft` -> `approved` -> `in-progress` -> `done`) and task completion via checkboxes. `/waddle:status` reads all of this and gives you a quick summary.

## Version Control

Commit the entire `.waddle/` directory. Plans are useful project history, and `STATE.md` is small — keeping it in git lets team members (and future sessions) see the full context of what happened and what was learned.
