# Bark

Bash development plugin with quality validation agents, comprehensive skills, and project templates. Encodes Antoine's conventions, patterns, and tool preferences for consistent bash development.

## Installation

```
/plugin marketplace add aneveux/claude-garden
/plugin install bark@claude-garden
```

## Quick Start

1. Install the plugin (see above)
2. Bootstrap your project: `/bark bootstrap`
3. Write bash code: `/agent bash-developer`
4. Review code: `/agent bash-code-reviewer`
5. Generate tests: `/agent bash-test-writer`

## Skills

Comprehensive knowledge base encoding Antoine's bash development methodology.

| Skill                   | Purpose                              | Lines |
|-------------------------|--------------------------------------|-------|
| `bash-style-guide`      | Style conventions and standards      | 549   |
| `bash-tools`            | Tool ecosystem and usage patterns    | 902   |
| `bash-testing`          | Testing methodology with bats        | 1062  |
| `bash-patterns`         | Common patterns and solutions        | 1294  |
| `bash-project-setup`    | Project architecture decisions       | 505   |

**Total:** 4,312 lines of distilled knowledge

Skills are loaded on-demand for context-specific guidance.

## Agents

Specialized agents that auto-load skills as context to enforce conventions.

| Agent                  | Purpose                  | Skills                                    | Tool Access       |
|------------------------|--------------------------|-------------------------------------------|--------------------|
| `bash-developer`       | Script development       | style-guide, tools, patterns, project-setup, testing | Read, Write, Edit |
| `bash-code-reviewer`   | Code quality validation  | style-guide, tools, patterns              | Read only          |
| `bash-test-writer`     | Test suite generation    | testing, tools, style-guide, project-setup | Read, Write       |

**Invocation:** `/agent <agent-name>`

The bash-developer writes production scripts following all bark conventions. The bash-code-reviewer provides actionable feedback with severity levels (P0/P1/P2) and fixability indicators. The bash-test-writer generates bats test suites with setup/teardown isolation and selective mocking patterns.

## Commands

| Command     | Purpose                                                                |
|-------------|------------------------------------------------------------------------|
| `bootstrap` | Copy project templates (CLAUDE.md, Makefile, .shellcheckrc) to cwd    |

**Invocation:** `/bark bootstrap`

## Templates

Project starter files that reference skills without duplicating content.

| Template        | Purpose                                         | How to Use                                                                |
|-----------------|-------------------------------------------------|---------------------------------------------------------------------------|
| `CLAUDE.md`     | Project conventions distilled from skills       | Copy from `templates/CLAUDE.md.template`, merge into project CLAUDE.md   |
| `Makefile`      | Standard targets (check, lint, test, format)    | Copy as `Makefile`, adjust config variables for project type             |
| `.shellcheckrc` | Linter configuration with documented rationale  | Copy as `.shellcheckrc`, customize disabled rules as needed              |

**Location:** `plugins/bark/templates/`

Templates provide static reference files that complement the dynamic agent and skill system.

## Version

2.0.0
