---
description: |
  Browse and manage the seed plugin's template library (plots), curated examples
  (herbarium), and technique reference. Use to explore available prompt templates,
  study before/after specimens, or look up technique details.
allowed-tools:
  - Read
  - Bash
  - Glob
  - AskUserQuestion
---

# /seed:catalog — Browse Templates, Examples, and Techniques

A browsing command for the seed plugin's knowledge base. Three modes, selected by argument or interactively.

## Mode Selection

If the user provides an argument, route directly:
- `/seed:catalog plots` or `/seed:catalog templates` → Plots mode
- `/seed:catalog herbarium` or `/seed:catalog examples` → Herbarium mode
- `/seed:catalog techniques` → Techniques mode

If no argument, use `AskUserQuestion` to let the user choose:
- **Templates** — Browse prompt templates for common task types
- **Herbarium** — Study curated before/after prompt examples
- **Techniques** — Quick reference of the 8 prompting techniques

## Plots Mode (Templates)

1. Read all template files from `references/plots/` in this plugin using `Glob`
2. For each template, extract from frontmatter: name, category, description, recommended-techniques
3. Present a summary table:

```
Prompt Templates (Plots)
━━━━━━━━━━━━━━━━━━━━━━━━

  code-task        Write, modify, or generate code
  code-review      Review code for bugs, security, quality
  system-prompt    Design system prompts for AI APIs or skills
  analysis         Analytical tasks — data, comparison, evaluation
  creative-writing Text generation — blogs, docs, explanations
  debugging        Diagnose issues and errors
  explanation      Explain concepts or code to an audience
  refactoring      Restructure existing code
```

4. Use `AskUserQuestion` to let the user select a template to view in full
5. Read and display the selected template with its structure, placeholders, and example
6. Offer: **Use as starting point** (launch `/seed:germinate` with this template pre-loaded) or **Back to list**

## Herbarium Mode (Curated Examples)

1. Read all specimen files from `references/herbarium/specimens/` using `Glob`
2. For each specimen, extract from frontmatter: id, date, category, techniques, summary
3. Present a summary list:

```
Herbarium Specimens
━━━━━━━━━━━━━━━━━━━

  001  Vague to Structured     [XML, Constraints, Role]
  002  Missing Constraints      [Constraints, Role]
  003  Role Assignment          [Role, Constraints]
```

4. Use `AskUserQuestion` to let the user select a specimen to view
5. Read and display the full specimen: original seed, diagnosis, cultivated bloom, techniques applied
6. Offer: **Use bloom as template** (start germinate with this as base) or **Back to list**

## Techniques Mode

1. Read the `prompt-cultivation` skill from `skills/prompt-cultivation/SKILL.md` in this plugin
2. Present the 8 techniques as a quick-reference table:

```
Prompting Techniques
━━━━━━━━━━━━━━━━━━━━

  1  Role/Persona Assignment    No perspective framing
  2  XML Tag Structuring        Content types mixed together
  3  Constraint Specification   Missing format/length/audience/tone
  4  Chain-of-Thought           Complex reasoning or multi-step logic
  5  Few-Shot Examples          Output format consistency needed
  6  Query-at-End Ordering      Data appears after instruction
  7  Positive Instructions      Negations stacking up
  8  Anti-Hallucination Guards  Fabrication risk in factual tasks
```

3. Use `AskUserQuestion` to let the user select a technique for the deep dive
4. Read `references/techniques.md` in `skills/prompt-cultivation/references/` and display the relevant section
5. Offer: **Another technique** or **Back to main menu**

## Navigation

After any leaf action, offer to return to the mode's list or switch to a different mode. Keep it lightweight — no verbose menus.
