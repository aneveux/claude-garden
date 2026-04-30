---
description: |
  Display prompt cultivation metrics and usage statistics. Shows total cultivations,
  technique distribution, template usage, and recent history from the seed plugin.
allowed-tools:
  - Read
  - Bash
---

# /seed:yield — Cultivation Metrics

Display usage statistics from the seed plugin's cultivation history.

## Data Source

Read metrics from `${XDG_CONFIG_HOME:-$HOME/.config}/seed/yield.json`.

If the file doesn't exist, report that no cultivations have been recorded yet and suggest running `/seed:germinate` to get started.

## Display

Present a formatted report with these sections:

### Summary

```
🌱 Seed Yield Report
━━━━━━━━━━━━━━━━━━━

Prompts cultivated:  47
Herbarium specimens: 12
Most used template:  code-review (14 times)
```

- `Prompts cultivated` = `total_cultivations` from the JSON
- `Herbarium specimens` = count files in `references/herbarium/specimens/` in this plugin using `ls | wc -l`
- `Most used template` = highest value in `template_counts`

### Technique Distribution

Show a horizontal bar chart of technique usage, sorted by frequency:

```
Technique distribution:
  XML Structuring      ████████████████████ 89%
  Constraint Spec      ██████████████████   78%
  Role Assignment      ████████████████     68%
  Query-at-End         ██████████████       60%
  Positive Instruct    ████████             34%
  Few-Shot Examples    ██████               26%
  Chain-of-Thought     ████                 17%
  Anti-Hallucination   ██                    9%
```

Calculate percentages relative to `total_cultivations`. Use `█` characters for the bars, scaled to a max width of 20 characters.

### Recent Cultivations

Show the last 5 cultivations from the `cultivations` array:

```
Recent cultivations:
  2026-04-30  code-review    [XML, Constraints, Role]
  2026-04-29  system-prompt  [XML, Constraints, Role, Few-Shot]
  2026-04-28  debugging      [XML, CoT, Anti-Hallucination]
```

Format dates as YYYY-MM-DD. Abbreviate technique names for readability:
- `xml-structuring` → XML
- `constraint-specification` → Constraints
- `role-assignment` → Role
- `chain-of-thought` → CoT
- `few-shot-examples` → Few-Shot
- `query-at-end` → Query-End
- `positive-instructions` → Positive
- `anti-hallucination` → Anti-Halluc

### Insights (if enough data)

If there are 10+ cultivations, add a brief insight:
- Identify the least-used technique and suggest trying it
- Note if one template dominates (>50% of cultivations)
- Flag if the user rarely saves to the herbarium

Keep insights to 1-2 sentences. Practical, not preachy.
