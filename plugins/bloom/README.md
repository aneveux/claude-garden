# Bloom

Terminal presentations that bloom from ideas — powered by [presenterm](https://github.com/mfontanini/presenterm).

Bloom helps you brainstorm, structure, write, enhance, and polish slide decks entirely from the command line. It masters presenterm's markdown syntax so you can focus on your message, not the formatting. Already have a deck? Add slides, edit sections, restructure — bloom handles surgical editing too.

## Installation

```
/plugin marketplace add aneveux/claude-garden
/plugin install bloom@claude-garden
```

**Dependency**: [presenterm](https://github.com/mfontanini/presenterm) must be installed.

```bash
cargo install presenterm
# or
brew install presenterm
```

## Quick Start

1. `/bloom:present` — start building a presentation from scratch
2. Answer a few questions about your topic, audience, and tone
3. Bloom proposes a structure, you approve or adjust
4. Slides are built section by section with your input
5. Preview: `presenterm your-talk.md`

Already have slides? `/bloom:enhance talk.md` to add, edit, or restructure slides. `/bloom:review talk.md` for a full review with improvement suggestions.

## Commands

| Command | Purpose |
|---------|---------|
| `/bloom:present [topic]` | Create a new presentation from scratch |
| `/bloom:enhance [file] [change]` | Add, edit, remove, or restructure slides in an existing deck |
| `/bloom:review [file]` | Review and improve an existing presentation |

## Skills

| Skill | Purpose | Lines |
|-------|---------|-------|
| bloom | Presentation creation, enhancement, review, and presenterm mastery | ~500 |

## References

| File | Content | When loaded |
|------|---------|-------------|
| `syntax.md` | Complete presenterm syntax reference | Complex layouts, uncommon directives |
| `themes.md` | Built-in themes, custom themes, palettes, footers | Theme customization or branding |
| `advanced.md` | Code execution, diagrams, speaker notes, export | Live demos, mermaid, LaTeX, PDF export |

## Tone Presets

| Tone | Style | Best for |
|------|-------|----------|
| Professional | Clean, structured, data-driven | Corporate keynotes, executive briefings |
| Conference | Code-heavy, deep technical | RustConf, KubeCon, tech conferences |
| Educational | Step-by-step, progressive | Workshops, tutorials, classes |
| Casual | Conversational, personal stories | Meetups, team knowledge-sharing |
| Fun | Playful, surprising, humor | Lightning talks, creative presentations |

## Version

1.1.0
