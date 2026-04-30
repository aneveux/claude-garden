# Seed — Prompt Cultivation Plugin

> Your rough idea is the seed. Seed cultivates it into a well-engineered prompt.

```
  🌱
 /|\
  |    seed — from rough idea to structured prompt
 ===
```

Seed transforms natural-language intent into structured, technique-informed prompts through an
interactive refinement workflow. It provides a library of 8 prompting techniques, reusable templates
for common prompt patterns, and a growing herbarium of curated before/after examples.

## Quick Start

```
/seed:germinate "review my PR for security issues"
```

The germinate command walks you through:
1. Analyzing your rough prompt for gaps
2. Asking targeted clarifying questions
3. Recommending prompting techniques
4. Building a polished, structured prompt
5. Iterating until you're satisfied

## Commands

| Command | Purpose |
|---------|---------|
| `/seed:germinate` | Interactive prompt refinement — the main workflow |
| `/seed:catalog` | Browse templates, herbarium specimens, and techniques |
| `/seed:yield` | View cultivation metrics and usage statistics |

## Agent

| Agent | Purpose | Model |
|-------|---------|-------|
| `cultivator` | Multi-prompt system design, skill authoring, deep refinement | sonnet |

Use the cultivator agent for complex scenarios: designing interconnected prompt systems, building
Claude Code skills from scratch, or long iterative sessions. For single-prompt refinement, prefer
`/seed:germinate`.

## Skill

| Skill | Purpose | Lines |
|-------|---------|-------|
| `prompt-cultivation` | Core technique knowledge — prompt anatomy, 8 techniques, Claude optimizations | ~150 |

## Reference Files

| File | Purpose | Lines |
|------|---------|-------|
| `skills/prompt-cultivation/references/techniques.md` | Deep dive on all 8 techniques | ~1000 |
| `skills/prompt-cultivation/references/anti-patterns.md` | 8 common prompt mistakes and fixes | ~550 |
| `skills/prompt-cultivation/references/claude-specific.md` | Claude-specific optimizations | ~350 |

## Templates (Plots)

Pre-shaped structures for common prompt types, in `references/plots/`:

| Template | Category | Recommended Techniques |
|----------|----------|----------------------|
| code-task | code | Role, XML, Constraints |
| code-review | code | Role, XML, Constraints, Few-Shot |
| system-prompt | system | Role, XML, Positive, Anti-Hallucination |
| analysis | analysis | CoT, Constraints, XML |
| creative-writing | creative | Role, Constraints, Positive |
| debugging | debugging | CoT, XML, Anti-Hallucination |
| explanation | analysis | Role, Constraints |
| refactoring | code | XML, Constraints, Anti-Hallucination |

## Herbarium

Curated before/after prompt examples in `references/herbarium/specimens/`. Each specimen shows
the original rough prompt, a diagnosis of what was missing, the refined prompt, and which
techniques were applied.

New specimens are saved via `/seed:germinate` when the user chooses "Save to herbarium".

## Metrics

Usage statistics stored in `~/.config/seed/yield.json` (never committed). The germinate
command records all cultivations including technique distribution, template usage, and
herbarium saves.

View with `/seed:yield`.

## Garden Metaphor

| Concept | Garden Term | Description |
|---------|-------------|-------------|
| Raw user input | **Seed** | The rough idea or intent |
| Refinement process | **Germinate** | Interactive questioning + technique application |
| Finished prompt | **Bloom** | The cultivated, ready-to-use prompt |
| Technique library | **Soil** | The knowledge substrate that nourishes prompts |
| Template collection | **Plots** | Pre-shaped beds for common prompt patterns |
| Curated examples | **Herbarium** | Preserved specimens of good prompts |
| Quality metrics | **Yield** | Usage tracking and technique distribution |
