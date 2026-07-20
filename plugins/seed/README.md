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
/seed:dig "I need something for handling code reviews but I'm not sure what approach to take"
/seed:germinate "review my PR for security issues"
```

**Don't know what you need yet?** Start with `/seed:dig` — an adversarial discussion that helps you discover requirements before writing anything.

**Have a spec but want to stress-test it?** Use `/seed:harden` — fresh-context agents validate your spec survives contact with reality.

**Know what you want?** Go straight to `/seed:germinate` — interactive refinement in under 2 minutes.

The full pipeline: dig (discover) → harden (validate) → germinate (refine) → herbarium (preserve).

## Commands

| Command | Purpose |
|---------|---------|
| `/seed:dig` | Adversarial prompt discovery — figure out what you need through discussion |
| `/seed:harden` | Multi-pass validation — stress-test specs with fresh-context agents |
| `/seed:germinate` | Interactive prompt refinement — the main workflow |
| `/seed:catalog` | Browse templates, herbarium specimens, and techniques |
| `/seed:yield` | View cultivation metrics and usage statistics |

## Agent

| Agent | Purpose | Model |
|-------|---------|-------|
| `cultivator` | Multi-prompt system design, skill authoring, deep refinement | opus |

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
| Discovery phase | **Dig** | Unearthing what's actually needed through discussion |
| Stress testing | **Harden** | Exposing seedlings to elements before transplanting |
| Refinement process | **Germinate** | Interactive questioning + technique application |
| Finished prompt | **Bloom** | The cultivated, ready-to-use prompt |
| Technique library | **Soil** | The knowledge substrate that nourishes prompts |
| Template collection | **Plots** | Pre-shaped beds for common prompt patterns |
| Curated examples | **Herbarium** | Preserved specimens of good prompts |
| Quality metrics | **Yield** | Usage tracking and technique distribution |
