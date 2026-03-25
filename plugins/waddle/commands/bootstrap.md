---
description: Initialize waddle on a project (2 questions, 2 files)
allowed-tools: Read, Write, Bash, Glob, Agent, AskUserQuestion
---

# Waddle Bootstrap

Initialize waddle on the current project. Creates `.waddle/` directory with config and state files.

## Pre-check

1. Check if `.waddle/waddle.yaml` already exists
   - If yes: inform user "Waddle is already initialized. Run /waddle:status to check state."
   - Stop.

2. Locate templates:
   - Glob: `**/waddle/templates/*.template`
   - Read `waddle.yaml.template` and `STATE.md.template` (core config files)

## Questions

Show the sumo penguin welcome:
```
    _
  ('v')   Welcome to Waddle!
 //-=-\\  Let's get you set up (^ ^)
 (\_=_/)
  ^^ ^^
```

**Q1**: Output the question directly and wait for the user's response:

"Hey! What's this project called, and what does it do in one line?"

Extract: PROJECT_NAME, PROJECT_DESCRIPTION

**Q2**: Use AskUserQuestion with selection:
- question: "Is this a brand new project or an existing codebase?"
- header: "Codebase"
- options:
  - label: "New project"
    description: "Starting fresh - waddle is ready when you are"
  - label: "Existing codebase"
    description: "There's code already - first task could be exploring the architecture"
- multiSelect: false

Extract INITIAL_FOCUS from selection:
- New: "Project initialized. Ready for first task."
- Existing: "Existing project. First task should explore codebase structure."

## Create Files

1. Create directory: `.waddle/` (use `mkdir -p .waddle`)

2. Read `waddle.yaml.template`, replace placeholders, write to `.waddle/waddle.yaml`

3. Read `STATE.md.template`, replace placeholders (including current date for BOOTSTRAP_DATE), write to `.waddle/STATE.md`

## Stewardship Documents

After creating .waddle/ files, set up stewardship documents.

4. Read waddle.yaml stewardship config for document paths (vision, decisions)

5. For each stewardship document path, check if the file already exists at that path.
   If yes: skip (don't overwrite existing project docs).

6. If VISION.md doesn't exist:
   a. Read the VISION.md template: Glob `**/waddle/templates/VISION.md.template`
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
   a. Read the DECISIONS.md template: Glob `**/waddle/templates/DECISIONS.md.template`
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

8. If ARCHITECTURE.md path is configured in waddle.yaml (`stewardship.architecture`) and the file doesn't exist:

   **For existing codebases** (Q2 = "Existing codebase"):
   a. Read the ARCHITECTURE.md template: Glob `**/waddle/templates/ARCHITECTURE.md.template`
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

   If `stewardship.architecture` is not configured (commented out in waddle.yaml), skip this step.

9. Create `.waddle/.audit-tracker.json` with zeroed counters:
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

10. Read `BACKLOG.md.template`: Glob `**/waddle/templates/BACKLOG.md.template`
    Write it to `.waddle/BACKLOG.md`.

## Report

```
    _
   (v)   Waddle initialized!
   /V\
   (_)>  .waddle/waddle.yaml  - project config
   ~~    .waddle/STATE.md     - state & learnings
         .waddle/BACKLOG.md   - unified task backlog

         Stewardship docs created. Run /waddle:audit to check project health anytime.
         Run /waddle:do <request> to start working!
```

Also suggest committing the new directory:
"Consider committing `.waddle/` to version control — plans and learnings are useful project history."

Also mention context monitoring:
"Waddle can warn you when context is running low during long tasks. To enable this, install a statusline plugin that writes context metrics (see the waddle README for details)."

If existing codebase, also suggest:
"Tip: your first `/waddle:do` request could be 'explore the codebase and document the architecture' to build initial knowledge."
