# Vine

Television (`tv`) fuzzy finder expertise for terminal workflows. Knows when and how to use tv for interactive selection, channel creation, shell integration, and scripting patterns.

## Installation

```
/plugin marketplace add aneveux/claude-garden
/plugin install vine@claude-garden
```

## Quick Start

1. Install the plugin (see above)
2. Ask Claude to create a tv channel, add interactive selection to a script, or wire up shell integration
3. The vine skill activates automatically when tv is relevant

## Skill

Single knowledge skill with progressive reference loading.

| Component | Purpose | Lines |
|-----------|---------|-------|
| `vine` (SKILL.md) | Core: when to use tv, CLI essentials, design guidance | ~230 |
| `references/channel-spec.md` | Full TOML channel specification (6 sections) | ~250 |
| `references/templates.md` | String pipeline syntax and all transforms | ~200 |
| `references/shell-integration.md` | Shell setup, triggers, custom scripts | ~130 |
| `references/patterns.md` | Ready-to-use channel recipes and scripting patterns | ~320 |

SKILL.md loads automatically. Reference files are read on demand when deeper detail is needed.

## What It Covers

- **Tool selection**: tv vs fzf vs gum decision matrix
- **Channel creation**: TOML spec, source/preview/actions/UI/keybindings
- **String pipeline**: Template transforms, chaining, regex, collections
- **Shell integration**: Ctrl+T smart autocomplete, Ctrl+R history, custom triggers
- **Scripting patterns**: expect keys, inline mode, multi-select, watch mode
- **Design guidance**: minimal-first approach, display/output separation, mode selection
- **90+ community channels**: git, docker, k8s, system, package managers, and more

## Version

1.0.0
