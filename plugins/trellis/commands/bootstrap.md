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
       _ _
      (_\_)
     (__<_{}   Welcome to Trellis!
      (_/_)    Let's get your project growing.
     |\ |
      \\| /|
       \|//
        |/
   ,.,.,|.,.,.
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

6. If VISION.md doesn't exist:
   a. Read the VISION.md template: Glob `**/trellis/templates/VISION.md.template`
   b. Replace {{PROJECT_NAME}} and {{PROJECT_DESCRIPTION}} with values from Q1
   c. Spawn a codebase analysis agent (read-only):

      ```
      description: "analyze codebase for vision doc"
      prompt: |
        Analyze this codebase to help fill in a project vision document.
        Read: README.md, CLAUDE.md, package.json/Cargo.toml/pom.xml/go.mod (whichever exists),
        and scan the top-level directory structure.

        Infer and report:
        - Target user (who uses this? developer tool? end-user app? library?)
        - 3-5 likely principles (what patterns suggest the project values?)
        - 3-5 likely non-goals (what does the project deliberately NOT do?)
        - Key constraints (language, framework, platform requirements)

        Be specific and grounded in evidence from the code. Don't guess — if you
        can't infer something, say so. Report as structured text, not a file.
      ```

   d. Pre-fill the template with agent findings
   e. Present the draft VISION.md to user:
      "I've drafted a VISION.md based on your codebase. Please review:"
      <show draft>

      Use AskUserQuestion:
      - question: "How does this look?"
      - header: "VISION.md"
      - options:
        - label: "Approve"
          description: "Write it as-is"
        - label: "Modify"
          description: "I want to edit before saving"
        - label: "Skip"
          description: "Write the empty template, I'll fill it in later"

      - Approve: write to configured path
      - Modify: let user describe changes, apply them, then write
      - Skip: write the empty template (user fills in later)

7. If DECISIONS.md doesn't exist:
   a. Read the DECISIONS.md template: Glob `**/trellis/templates/DECISIONS.md.template`
   b. Replace {{PROJECT_NAME}}
   c. Spawn analysis agent (read-only):

      ```
      description: "analyze codebase for decisions doc"
      prompt: |
        Analyze this codebase for significant architectural decisions.
        Read: CLAUDE.md (conventions/gotchas), directory structure, config files,
        key source files (entry points, main modules).

        Look for evidence of deliberate choices:
        - Why this framework/language/tool over alternatives?
        - Why this project structure?
        - Any patterns that suggest a conscious decision (e.g., "all errors go through
          a central handler" suggests a decision was made about error handling)

        Report as a list of potential ADRs with context and decision.
        Max 5 most significant. Format each as:
        Title: ...
        Context: ...
        Decision: ...
      ```

   d. Pre-fill template with found decisions (format as ADR-001, ADR-002, etc.)
   e. Present draft, same Approve/Modify/Skip flow as VISION.md

8. If ARCHITECTURE.md path is configured in trellis.yaml (`stewardship.architecture`) and the file doesn't exist:

   **For existing codebases** (Q2 = "Existing codebase"):
   a. Read the ARCHITECTURE.md template: Glob `**/trellis/templates/ARCHITECTURE.md.template`
   b. Replace {{PROJECT_NAME}}
   c. Spawn analysis agent (read-only):

      ```
      description: "analyze codebase for architecture doc"
      prompt: |
        Analyze this codebase to document its architecture.
        Read: directory structure, entry points, key modules, config files,
        package manifests (package.json/go.mod/pom.xml/Cargo.toml).

        Map out:
        - High-level overview (what does the system do?)
        - Layers/tiers (CLI -> Service -> Data? Frontend -> API -> DB?)
        - Key modules and their responsibilities
        - Dependency direction between modules
        - How a typical request/command flows through the system
        - Hard boundaries (what should never cross them?)

        Be specific and grounded in evidence. If a layer or boundary isn't
        clear from the code, say so. Report as structured text, not a file.
      ```

   d. Pre-fill template with agent findings
   e. Present draft, same Approve/Modify/Skip flow as VISION.md

   **For new projects** (Q2 = "New project"):
   a. Read the ARCHITECTURE.md template, replace {{PROJECT_NAME}}
   b. Write the empty template to the configured path (no agent analysis needed — there's no code yet)
   c. Note: "Created an empty ARCHITECTURE.md — fill it in as your architecture takes shape."

   If `stewardship.architecture` is not configured (commented out in trellis.yaml), skip this step.

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

10. Read `BACKLOG.md.template`: Glob `**/trellis/templates/BACKLOG.md.template`
    Write it to `.trellis/BACKLOG.md`.

## Report

```
    ,*-.
    |  |   Trellis initialized!
,.  |  |
| |_|  |   .trellis/trellis.yaml  - project config
`---.  |   .trellis/STATE.md     - state & learnings
    |  |   .trellis/BACKLOG.md   - unified task backlog
    |  |
    |  |   Stewardship docs created. Run /trellis:audit to check project health anytime.
           Run /trellis:do <request> to start growing!
```

Also suggest committing the new directory:
"Consider committing `.trellis/` to version control — plans and learnings are useful project history."

Also mention context monitoring:
"Trellis can warn you when context is running low during long tasks. To enable this, install a statusline plugin that writes context metrics (see the trellis README for details)."

If existing codebase, also suggest:
"Tip: your first `/trellis:do` request could be 'explore the codebase and document the architecture' to build initial knowledge."
