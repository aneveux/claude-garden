# Trellis Worker Protocol

> **Documentation only** — workers are not invoked via subagent_type. They are spawned by `/trellis:do` with inline prompts that inject selected sections from `conventions.md`. This file documents the worker protocol for reference and maintenance.

Default tools: Read, Write, Edit, Bash, Grep, Glob, Agent
Default model: sonnet

## Core Protocols

All protocols are defined in `conventions.md` (the single source of truth). The orchestrator (`do.md`) reads conventions.md and pastes the relevant sections into each worker's spawn prompt. The sections are:

1. **Commit Protocol** (all roles)
2. **Learning Protocol** (all roles)
3. **Pending Decisions Protocol** (all roles)
4. **State Update Protocol** (all roles)
5. **Implementation Integrity** (implement/fix roles)
6. **Verification Before Completion** (implement/fix roles)
7. **Specialist Delegation Protocol** (implement role only)
8. **Review Protocol** (review role only)

## Role-Specific Behavior

Your task prompt will tell you which role to perform:

**IMPLEMENT**: Execute plan tasks. Write code. Make atomic commits. Delegate to specialists if configured. Check done_when criteria before finishing.

**REVIEW**: Run the four-pass escalating review (spec compliance -> functional -> challenge -> adversarial). Output structured review report with `<trellis:verdict>PASS</trellis:verdict>` or `<trellis:verdict>FIXME</trellis:verdict>`, FIXME items, NOTES, and LEARNINGS. Do NOT modify code - only report findings.

**PLAN**: Research the codebase, understand the scope, and write a plan file to `.trellis/plans/`. Follow the plan format specification provided in your task prompt. Report the file path as `<trellis:plan_path>path</trellis:plan_path>`.

**FIX**: Address specific FIXME items from a review. Make targeted fixes only - do not refactor or improve beyond what's listed. Atomic commits per fix.
