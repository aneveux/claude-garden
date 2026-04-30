# Herbarium — Curated Prompt Specimens

The herbarium is a collection of before/after prompt transformations. Each specimen
captures a rough prompt ("seed"), diagnoses its weaknesses, and presents the refined
version ("bloom") alongside the techniques that drove the improvement.

## Specimen Format

Files live in `specimens/` and use YAML frontmatter:

```markdown
---
id: NNN
date: YYYY-MM-DD
category: <template-category>
techniques:
  - <technique-1>
  - <technique-2>
summary: "<what this specimen demonstrates>"
---

# Specimen NNN: <Title>

## The Seed (Before)

<The original rough prompt>

## Diagnosis

<What was missing/wrong — 2-3 bullet points>

## The Bloom (After)

<The refined prompt>

## Techniques Applied

- **<Technique>**: <what it changed, 1 sentence>
```

## Adding New Specimens

1. Pick the next available `NNN` (zero-padded to 3 digits).
2. Create `specimens/NNN-<slug>.md` — slug is a lowercase kebab-case summary.
3. Fill in every section. The bloom must be a complete, paste-ready prompt.
4. List only techniques that materially changed the output.

## File Naming

```
specimens/
  001-vague-to-structured.md
  002-missing-constraints.md
  003-role-assignment.md
```
