---
description: Initialize trellis on a project (2 questions, 2 files)
allowed-tools: Read, Write, Bash, Glob, Agent, AskUserQuestion
---

# Trellis Bootstrap

Initialize trellis on the current project. Creates `.trellis/` directory with config and state files.

## Pre-check

1. Check if `.trellis/trellis.yaml` already exists
   - If yes: inform user "Trellis is already initialized. Run /trellis:status to check state."
   - Stop.

2. Locate templates:
   - Glob: `**/trellis/templates/*.template`
   - Read `trellis.yaml.template` and `STATE.md.template` (core config files)

## Questions

Show the sprout welcome:
```
─────────────────────────────────────────────
       _ _
      (_\_)
     (__<_{}   Welcome to Trellis!
      (_/_)    Let's get your project growing.
     |\ |
      \\| /|
       \|//
        |/
   ,.,.,|.,.,.
─────────────────────────────────────────────
```

**Q1**: Output the question directly and wait for the user's response:

"Hey! What's this project called, and what does it do in one line?"

Extract: PROJECT_NAME, PROJECT_DESCRIPTION

**Q2**: Use AskUserQuestion with selection:
- question: "Is this a brand new project or an existing codebase?"
- header: "Codebase"
- options:
  - label: "New project"
    description: "Starting fresh - trellis is ready when you are"
  - label: "Existing codebase"
    description: "There's code already - first task could be exploring the architecture"
- multiSelect: false

Extract INITIAL_FOCUS from selection:
- New: "Project initialized. Ready for first task."
- Existing: "Existing project. First task should explore codebase structure."

## Create Files

1. Create directory: `.trellis/` (use `mkdir -p .trellis`)

2. Read `trellis.yaml.template`, replace placeholders, write to `.trellis/trellis.yaml`

3. Read `STATE.md.template`, replace placeholders (including current date for BOOTSTRAP_DATE), write to `.trellis/STATE.md`

## Stewardship Documents

After creating .trellis/ files, set up stewardship documents.

4. Read trellis.yaml stewardship config for document paths (vision, decisions)

5. For each stewardship document path, check if the file already exists at that path.
   If yes: skip (don't overwrite existing project docs).

6. For each stewardship document, follow the pattern below. Process in order: VISION.md, DECISIONS.md, then ARCHITECTURE.md.

### Stewardship Document Pattern

For each document (VISION, DECISIONS, ARCHITECTURE):
1. Check if the file already exists at the configured path — if yes, skip
2. Read the template: Glob `**/trellis/templates/<DOC>.md.template`
3. Replace placeholders ({{PROJECT_NAME}}, {{PROJECT_DESCRIPTION}})
4. **For existing codebases**: spawn an analysis agent (read-only) to infer content from the codebase, then pre-fill the template with findings
5. **For new projects**: use the empty template (no analysis needed — there's no code yet)
6. Present draft to user with AskUserQuestion (Approve / Modify / Skip)
   - Approve: write to configured path
   - Modify: let user describe changes, apply them, then write
   - Skip: write the empty template

### Document-Specific Analysis Prompts

**VISION.md** agent prompt:
```
description: "analyze codebase for vision doc"
prompt: |
  Analyze this codebase to help fill in a project vision document.
  Read: README.md, CLAUDE.md, package.json/Cargo.toml/pom.xml/go.mod (whichever exists),
  and scan the top-level directory structure.
  Infer and report:
  - Target user, 3-5 likely principles, 3-5 likely non-goals, key constraints
  Be specific and grounded in evidence. Report as structured text, not a file.
```

**DECISIONS.md** agent prompt:
```
description: "analyze codebase for decisions doc"
prompt: |
  Analyze this codebase for significant architectural decisions.
  Read: CLAUDE.md, directory structure, config files, key source files.
  Look for evidence of deliberate choices (framework, structure, error handling patterns).
  Report max 5 potential ADRs, each with: Title, Context, Decision.
```

**ARCHITECTURE.md** agent prompt (existing codebases only):
```
description: "analyze codebase for architecture doc"
prompt: |
  Analyze this codebase to document its architecture.
  Read: directory structure, entry points, key modules, config files, package manifests.
  Map out: overview, layers/tiers, key modules, dependency direction, request flow, hard boundaries.
  Be specific and grounded in evidence. Report as structured text, not a file.
```

Note: if `stewardship.architecture` is not configured (commented out in trellis.yaml), skip ARCHITECTURE.md entirely. For new projects, write the empty ARCHITECTURE.md template with a note: "Fill it in as your architecture takes shape."

9. Create `.trellis/.audit-tracker.json` with zeroed counters:
   ```json
   {
     "commits": {
       "consistency": 0, "security": 0, "architecture": 0,
       "vision": 0, "dx": 0, "debt": 0
     },
     "last_audit": {},
     "last_nudge": null
   }
   ```

9b. Create `.trellis/metrics.json`:
    ```json
    {
      "tasks": []
    }
    ```

10. Read `BACKLOG.md.template`: Glob `**/trellis/templates/BACKLOG.md.template`
    Write it to `.trellis/BACKLOG.md`.

## Report

```
─────────────────────────────────────────────
    ,*-.
    |  |   🌳 Trellis initialized!
,.  |  |
| |_|  |   .trellis/trellis.yaml  - project config
`---.  |   .trellis/STATE.md     - state & learnings
    |  |   .trellis/BACKLOG.md   - unified task backlog
    |  |   .trellis/metrics.json - task metrics
    |  |
    |  |   Stewardship docs created. Run /trellis:audit to check project health anytime.
           Run /trellis:do <request> to start growing!
─────────────────────────────────────────────
```

Also suggest committing the new directory:
"Consider committing `.trellis/` to version control — plans and learnings are useful project history."

Also mention context monitoring:
"Trellis can warn you when context is running low during long tasks. To enable this, install a statusline plugin that writes context metrics (see the trellis README for details)."

If existing codebase, also suggest:
"Tip: your first `/trellis:do` request could be 'explore the codebase and document the architecture' to build initial knowledge."
