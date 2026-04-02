# Thorn

Local code review processing for [localreview.nvim](https://github.com/aneveux/localreview.nvim).

Thorn discovers, parses, and acts on review comments left as hidden `.reviews.json` files in your codebase. Review your AI-generated code in nvim, then let Claude address the feedback.

## Skills

| Skill | Purpose | Lines |
|-------|---------|-------|
| [local-reviews](skills/local-reviews/SKILL.md) | localreview.nvim file format, discovery patterns, staleness detection | ~140 |

## Commands

| Command | Purpose |
|---------|---------|
| `/thorn:reviews` | Discover and summarize all pending review comments |
| `/thorn:reviews fix` | Address review comments by editing source files |
| `/thorn:reviews clean` | Remove processed `.reviews.json` files |

## Workflow

1. Review code in nvim using localreview.nvim — leave comments on lines that need attention
2. Run `/thorn:reviews` to see a summary of all pending comments
3. Choose to fix all, fix selectively, or just review the summary
4. Optionally clean up processed review files

## Install

Add to your Claude Code plugins or include in your `.claude-plugin/marketplace.json`:

```json
{
  "name": "thorn",
  "description": "Local code review processing for localreview.nvim. Discovers, parses, and acts on review comments left as hidden .reviews.json files.",
  "source": "./plugins/thorn",
  "strict": false
}
```
