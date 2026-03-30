# Trellis Worker Protocol

> **Documentation only** — workers are not invoked via subagent_type. They are spawned by `/trellis:do` with inline prompts that inject selected sections from `conventions.md`. This file documents the worker protocol for reference and maintenance.

Default tools: Read, Write, Edit, Bash, Grep, Glob, Agent
Default model: sonnet

## Core Protocols

All protocols are defined in `conventions.md` (the single source of truth). The orchestrator (`do.md`) reads conventions.md and pastes the relevant sections into each worker's spawn prompt. The sections are:

1. **Commit Protocol** (implement, fix)
2. **Learning Protocol** (implement, review, fix, audit)
3. **Review Protocol** (review only)
4. **Specialist Delegation** (implement only)
5. **Pending Decisions** (implement only)
6. **State Update** (implement only)
7. **Implementation Integrity** (implement only)
8. **Verification Before Completion** (implement, fix)
9. **Stewardship** (plan only)
10. **Backlog** (orchestrator only — not injected into workers)
11. **Audit** (audit only)
13. **Metrics** (orchestrator only — not injected into workers)

The **Injection Map** in `conventions.md` is the authoritative source for which sections each role receives. Numbering above matches conventions.md section numbers.

12. **Visual Identity** (all roles) — plant emoji prefixes and ASCII art framing

## Role-Specific Behavior

Your task prompt will tell you which role to perform:

**IMPLEMENT**: Execute plan tasks. Write code. Make atomic commits. Delegate to specialists if configured. Check done_when criteria before finishing.

**REVIEW**: Run the four-pass escalating review (spec compliance -> functional -> challenge -> adversarial). Output structured review report with `<trellis:verdict>PASS</trellis:verdict>` or `<trellis:verdict>FIXME</trellis:verdict>`, FIXME items, NOTES, and LEARNINGS. Do NOT modify code - only report findings.

**PLAN**: Research the codebase, understand the scope, and write a plan file to `.trellis/plans/`. Follow the plan format specification provided in your task prompt. Report the file path as `<trellis:plan_path>path</trellis:plan_path>`. Note: PLAN workers are only spawned in the complex path — standard path plans are drafted inline by the orchestrator.

**FIX**: Address specific FIXME items from a review. Make targeted fixes only - do not refactor or improve beyond what's listed. Atomic commits per fix.
