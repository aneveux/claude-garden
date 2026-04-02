# 🌱 Claude Garden

A small, slightly opinionated garden of personal Claude plugins.  
Some are practical, some are weird, all are grown with care.

Take what you need, ignore the rest, and don’t be surprised if things evolve.

---

## 🌼 Plugins

| Plugin | Version | Description |
|--------|---------|-------------|
| [bark](plugins/bark/) | 2.0.0 | Opinionated Bash development — conventions, patterns, and tool preferences |
| [trellis](plugins/trellis/) | 2.2.0 | Agent framework for structured development — plan, implement, review, learn |
| [vine](plugins/vine/) | 1.0.0 | Television (tv) fuzzy finder expertise — channels, templates, shell integration |
| [graft](plugins/graft/) | 1.0.0 | Jenkins plugin development — agents, review patterns, and deep API knowledge |
| [thorn](plugins/thorn/) | 1.0.0 | Local code review processing — find and act on localreview.nvim comments |

More seeds will appear over time.

---

## 🌿 Installation

Add the garden to your marketplace:

```
/plugin marketplace add aneveux/claude-garden
```

Pick what you want to grow locally:

```
/plugin install bark@claude-garden
/plugin install trellis@claude-garden
/plugin install vine@claude-garden
/plugin install graft@claude-garden
/plugin install thorn@claude-garden
```

---

## 🌳 Structure

```
.claude-plugin/
  marketplace.json
plugins/
  bark/
    agents/
    skills/
    commands/
  trellis/
    commands/
    references/
    templates/
    hooks/
  vine/
    skills/
      vine/
        references/
  graft/
    agents/
    skills/
      jenkins-architecture/
      jenkins-pipeline/
      jenkins-testing/
        references/
      jenkins-ui/
        references/
      jenkins-reviews/
  thorn/
    skills/
      local-reviews/
    commands/
```

---

## 🌸 Notes

- This is a personal space shared publicly.
- Stability is a spectrum.
- Ideas here tend to grow, mutate, or get composted.

Enjoy the garden.
