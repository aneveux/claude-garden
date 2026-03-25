# 🌱 Claude Garden

A small, slightly opinionated garden of personal Claude plugins.  
Some are practical, some are weird, all are grown with care.

Take what you need, ignore the rest, and don’t be surprised if things evolve.

---

## 🌼 Plugins

| Plugin | Version | Description |
|--------|---------|-------------|
| [shellcraft](plugins/shellcraft/) | 1.0.0 | Opinionated Bash development — conventions, patterns, and tool preferences |
| [waddle](plugins/waddle/) | 1.0.0 | Agent framework for structured development — plan, implement, review, learn |

More seeds will appear over time.

---

## 🌿 Installation

Add the garden to your marketplace:

```
/plugin marketplace add aneveux/claude-garden
```

Pick what you want to grow locally:

```
/plugin install shellcraft@claude-garden
/plugin install waddle@claude-garden
```

---

## 🌳 Structure

```
.claude-plugin/
  marketplace.json
plugins/
  shellcraft/
    agents/
    skills/
    commands/
  waddle/
    commands/
    references/
    templates/
    hooks/
```

---

## 🌸 Notes

- This is a personal space shared publicly.
- Stability is a spectrum.
- Ideas here tend to grow, mutate, or get composted.

Enjoy the garden.
