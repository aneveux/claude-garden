---
description: Run project audit — consistency, security, architecture, vision, DX, or tech debt checks
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Agent, AskUserQuestion
---

# Trellis Audit

Run project health checks against stewardship documents and codebase patterns.

## Step 1: Load Context

1. Read `.trellis/trellis.yaml` (REQUIRED - if missing, tell user to run `/trellis:bootstrap`)
2. Read `.trellis/STATE.md`
3. Extract stewardship config: vision path, decisions path, architecture path, audits config

## Step 2: Parse Argument

The user's argument follows `/trellis:audit`. Determine mode:

- **Single lens** (e.g., `consistency`, `security`): run that lens only in focused mode
- **No argument**: run all lenses with `frequency > 0` in lightweight mode
- **`all`**: run all 6 lenses regardless of config in lightweight mode

Valid lenses: `consistency`, `security`, `architecture`, `vision`, `dx`, `debt`

If the argument doesn't match any lens, suggest the closest match.

## Step 3: Load Lens Definitions and Conventions

1. Read the audit lenses reference: Glob `**/trellis/references/audit-lenses.md`, then read it.
2. Read the conventions reference: Glob `**/trellis/references/conventions.md`, then read it.
   You'll need the **Audit Protocol** and **Learning Protocol** sections for the audit agent prompt in Step 6.

## Step 4: Determine Scope

For each lens to run:

1. Read `.trellis/.audit-tracker.json` if it exists — check last audit date for this lens
2. If previous audit exists for this lens:
   - Run `git log --oneline` since last audit date to identify recent changes
   - Focus the audit on changed files matching the lens's signal patterns
3. If no previous audit: broader sweep analyzing full project structure

## Step 5: Load Stewardship Documents

Based on each lens's "Requires" field from the lenses reference:

- Read VISION.md (path from trellis.yaml `stewardship.vision`) if the lens requires it and the file exists
- Read DECISIONS.md (path from trellis.yaml `stewardship.decisions`) if the lens requires it and the file exists
- Read ARCHITECTURE.md (path from trellis.yaml `stewardship.architecture`) if configured and the lens requires it
- Read the project's CLAUDE.md if it exists (for consistency lens especially)

If a lens requires a document that doesn't exist:
- For ARCHITECTURE.md specifically: check if a template exists (Glob `**/trellis/templates/ARCHITECTURE.md.template`).
  If found, offer to create it:
  "Architecture audit needs ARCHITECTURE.md but it doesn't exist yet. Want me to create one from the template?"
  Use AskUserQuestion:
  - question: "Create ARCHITECTURE.md from template?"
  - header: "Missing Document"
  - options:
    - label: "Create"
      description: "Scaffold ARCHITECTURE.md from the trellis template"
    - label: "Skip"
      description: "Run the audit without it"
  If Create: read the template, replace {{PROJECT_NAME}} (from trellis.yaml), write to the configured path.
  Then remind the user to fill it in: "Created ARCHITECTURE.md — fill in the sections for more useful architecture audits."
- For other documents: note as an info-level finding:
  "<Lens> audit would benefit from <Document>. Consider creating one via /trellis:bootstrap or manually."

## Step 6: Execute Audit

### Lightweight mode (multi-lens sweep)

Run inline — read files, check patterns, report findings for each lens. Keep it efficient:
- Check the lens's signal file patterns
- Look for the specific items in the lens's Checks list
- Produce findings with severity, location, description, and suggestion

### Focused mode (single lens)

Spawn an audit agent for deeper analysis:

```
description: "audit <lens> for <project>"
prompt: |
  You are a trellis AUDIT worker performing a <lens> audit.

  ## Lens Definition
  <from audit-lenses.md — paste the full section for this lens>

  ## Protocols
  <paste the Audit Protocol section from conventions.md>
  <paste the Learning Protocol section from conventions.md>

  ## Project Direction
  <VISION.md contents if available>
  <DECISIONS.md contents if available>
  <ARCHITECTURE.md contents if available>
  <CLAUDE.md contents if available>

  ## Scope
  <git diff summary or full project structure>
  <files matching lens signal patterns>

  ## Output
  - Save your audit report to .trellis/audits/YYYY-MM-DD-<lens>.md
  - Use this exact format for the report:

    # Audit: <Lens> — YYYY-MM-DD

    Scope: <N> commits since last audit / full sweep
    Documents checked: <list>

    ## Critical
    1. **[file:line]** Description. Violates: <principle/decision>.
       Suggestion: ...

    ## Warning
    1. ...

    ## Info
    1. ...

    ## Summary
    - N findings (X critical, Y warning, Z info)
    - Key themes: ...

  - Log any codebase discoveries to .trellis/STATE.md Learnings section
  - Do NOT write to .trellis/BACKLOG.md — the orchestrator handles backlog updates after you finish
model: <from trellis.yaml models.worker, default sonnet>
```

Wait for the agent to complete.

## Step 7: Update Tracking

1. Create `.trellis/audits/` directory if it doesn't exist (`mkdir -p .trellis/audits`)
2. For lightweight mode: save a combined report to `.trellis/audits/YYYY-MM-DD-sweep.md`
3. Update `.trellis/.audit-tracker.json`:
   - Reset commit counter to 0 for each lens that was audited
   - Set `last_audit.<lens>` to today's date for each audited lens
   - Create the file if it doesn't exist:
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

## Step 8: Update Backlog and State

1. Read `.trellis/BACKLOG.md` (create from template if missing: Glob `**/trellis/templates/BACKLOG.md.template`)
2. For each **critical** and **warning** finding:
   - Check if a similar item already exists in the backlog (same lens + similar description). Skip duplicates.
   - Append new findings under the matching severity heading in the `## Open` section:
     ```
     - [ ] <finding description> — `audit:<lens>` YYYY-MM-DD
     ```
3. Add significant findings as learnings in `.trellis/STATE.md` (patterns worth remembering)
4. Update the Audits section in STATE.md with the audit date
5. Genuine decisions (e.g., "should we use approach A or B?") still go to Pending Decisions
   in STATE.md. Actionable tasks go to the backlog.

## Step 9: Present Results

Show findings with the bloom:

```
      ,xXXXXx,
     ,XXXXXXXX,
     XXXXXXXXXX   Audit Complete: <lens(es)>
     `"""XX"""`
         XX       <N> findings (<critical> critical, <warning> warning, <info> info)
         XX
         XX
```

List critical findings first, then warnings. Info items can be summarized.

If critical findings exist, suggest `/trellis:do` tasks to address them:
"Consider running `/trellis:do fix <issue description>` for critical findings."
