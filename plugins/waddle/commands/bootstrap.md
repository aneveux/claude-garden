---
description: Initialize waddle on a project (2 questions, 2 files)
allowed-tools: Read, Write, Bash, Glob, AskUserQuestion
---

# Waddle Bootstrap

Initialize waddle on the current project. Creates `.waddle/` directory with config and state files.

## Pre-check

1. Check if `.waddle/waddle.yaml` already exists
   - If yes: inform user "Waddle is already initialized. Run /waddle:status to check state."
   - Stop.

2. Locate templates:
   - Glob: `**/waddle/templates/*.template`
   - Read both template files

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

## Report

```
    _
   (v)   Waddle initialized!
   /V\
   (_)>  .waddle/waddle.yaml - project config
   ~~    .waddle/STATE.md    - state & learnings

         Run /waddle:do <request> to start working!
```

Also suggest committing the new directory:
"Consider committing `.waddle/` to version control — plans and learnings are useful project history."

Also mention context monitoring:
"Waddle can warn you when context is running low during long tasks. To enable this, install a statusline plugin that writes context metrics (see the waddle README for details)."

If existing codebase, also suggest:
"Tip: your first `/waddle:do` request could be 'explore the codebase and document the architecture' to build initial knowledge."
