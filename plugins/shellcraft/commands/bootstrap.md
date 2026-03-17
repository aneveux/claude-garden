---
description: Copy shellcraft project templates (CLAUDE.md, Makefile, .shellcheckrc) to current directory
allowed-tools: Read, Write, Bash, Glob
---

# Bootstrap Shellcraft Project

Copy the shellcraft project templates to the current working directory. Templates provide a ready-to-use project setup with conventions, lint config, and build targets.

## Template Location

Templates are located at `$CLAUDE_PLUGIN_ROOT/templates/`. Find the plugin root by locating the directory containing this command file, then navigate to the sibling `templates/` directory.

Available templates:
- `CLAUDE.md.template` → `CLAUDE.md`
- `Makefile.template` → `Makefile`
- `.shellcheckrc.template` → `.shellcheckrc`

## Procedure

### 1. Locate Templates

Use Glob to find the template files:
```
Glob pattern: **/plugins/shellcraft/templates/*.template
```

### 2. Read Templates

Read all three template files to get their contents.

### 3. Copy to Current Directory

For each template, strip the `.template` extension and write to the current working directory:

**Conflict handling:**

- **CLAUDE.md**: If it already exists, APPEND the template content at the end with a separator:
  ```
  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  #   SHELLCRAFT CONVENTIONS (appended by bootstrap)
  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ```
  Then append the template content below the separator.

- **Makefile**: If it already exists, report the conflict and DO NOT overwrite. Tell the user to merge manually.

- **.shellcheckrc**: If it already exists, report the conflict and DO NOT overwrite. Tell the user to merge manually.

### 4. Report Results

After copying, report what was done:

```
Shellcraft bootstrap complete:
  ✓ CLAUDE.md — [created | appended to existing]
  ✓ Makefile — [created | SKIPPED (already exists)]
  ✓ .shellcheckrc — [created | SKIPPED (already exists)]
```

If any files were skipped, suggest:
```
Skipped files already exist. Review templates at:
  plugins/shellcraft/templates/
and merge manually if needed.
```
