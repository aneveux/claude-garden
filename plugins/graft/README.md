# Graft v1.0.0

Jenkins plugin development plugin with expert-level agents for implementing, reviewing, and testing Jenkins plugins. Encodes community best practices, core maintainer review patterns, and the full Jenkins API surface.

## Installation

```
/plugin marketplace add aneveux/claude-garden
/plugin install graft@claude-garden
```

## Quick Start

1. Install the plugin (see above)
2. Implement plugin code: `/agent jenkins-developer`
3. Review code: `/agent jenkins-reviewer`
4. Write tests: `/agent jenkins-tester`

## Skills

Comprehensive knowledge base covering the full Jenkins plugin development stack.

| Skill                   | Purpose                                       | Lines |
|-------------------------|-----------------------------------------------|-------|
| `jenkins-architecture`  | Core APIs, Descriptor pattern, Stapler, annotations | ~290 |
| `jenkins-pipeline`      | Pipeline steps, CPS threading, @Symbol, credentials | ~290 |
| `jenkins-testing`       | Test rules, patterns, dependencies            | ~200 |
| `jenkins-ui`            | Design Library, Jelly, forms, XSS prevention  | ~200 |
| `jenkins-reviews`       | Review patterns, security, grading            | ~170 |

Skills are loaded on-demand by agents for context-specific guidance.

### Reference Files

Deep-dive documentation loaded by skills when more detail is needed:

| Reference                              | Purpose                           |
|----------------------------------------|-----------------------------------|
| `jenkins-testing/references/test-rules.md`    | JenkinsRule, RealJenkinsRule, LoggerRule API |
| `jenkins-testing/references/test-patterns.md` | Config roundtrip, ATH, anti-patterns |
| `jenkins-ui/references/design-components.md`  | Full Design Library component catalog |
| `jenkins-ui/references/form-validation.md`    | doCheck, doFill, validateButton   |

## Agents

Specialized agents that auto-load skills as context.

| Agent               | Purpose                    | Skills                                          | Tool Access                    |
|---------------------|----------------------------|-------------------------------------------------|--------------------------------|
| `jenkins-developer` | Plugin implementation      | architecture, pipeline, ui                      | Read, Write, Edit, Bash, Grep, Glob |
| `jenkins-reviewer`  | Code quality review        | reviews, architecture, ui                       | Read, Bash, Grep, Glob        |
| `jenkins-tester`    | Test suite generation      | testing, pipeline, architecture                 | Read, Write, Edit, Bash, Grep, Glob |

**Invocation:** `/agent <agent-name>`

The jenkins-developer writes production plugin code following community standards. The jenkins-reviewer produces structured review reports modeled on core maintainer review patterns with P0/P1/P2 severity and A/B/C grading. The jenkins-tester generates JenkinsRule, Pipeline, snippetizer, and security tests.

## Knowledge Sources

This plugin's knowledge was distilled from:

- [Jenkins Developer Documentation](https://www.jenkins.io/doc/developer/)
- [Jenkins Core](https://github.com/jenkinsci/jenkins) API analysis
- [Jenkins Design Library](https://github.com/jenkinsci/design-library-plugin) component catalog
- [Jenkins Test Harness](https://github.com/jenkinsci/jenkins-test-harness) API (JenkinsRule, RealJenkinsRule)
- [Acceptance Test Harness](https://github.com/jenkinsci/acceptance-test-harness) page object patterns
- Production plugin exemplars for best practice patterns
- PR review analysis of Jenkins core maintainers across jenkinsci
