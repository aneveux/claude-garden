---
id: 001
date: 2026-04-30
category: code-review
techniques:
  - xml-structuring
  - constraint-specification
  - role-assignment
summary: "Transforming a vague review request into a structured code review prompt"
---

# Specimen 001: Vague to Structured

## The Seed (Before)

> review my code for issues

## Diagnosis

- No role framing — the model defaults to generic advice instead of expert-level analysis.
- No input structure — the model has to guess what code, what language, what context.
- No output format — findings come back as an unstructured wall of text with inconsistent severity.

## The Bloom (After)

```
You are a senior security engineer who reviews production code for a living.
Your reviews are thorough, opinionated, and focused on what actually breaks
in production — not style nitpicks.

Review the code below. Focus on security vulnerabilities, logic errors, and
performance issues. Ignore formatting and naming conventions unless they
mask a real bug.

<code language="python">
{{paste your code here}}
</code>

<context>
This is a FastAPI endpoint handling user authentication. It runs behind
an nginx reverse proxy and connects to a PostgreSQL database. The service
processes ~10k requests/minute.
</context>

Classify every finding using this severity taxonomy:
- **critical**: security vulnerability or data loss risk — must fix before deploy
- **warning**: logic error or performance issue — fix in this PR cycle
- **info**: improvement suggestion — address when convenient

For each finding, provide:
1. The exact line or block affected
2. What the issue is (1 sentence)
3. A concrete fix (code snippet preferred)

Return findings grouped by severity, critical first. If the code is clean,
say so — do not invent issues.
```

## Techniques Applied

- **xml-structuring**: Separated code and context into tagged sections so the model can parse inputs unambiguously.
- **constraint-specification**: Defined a severity taxonomy, output format, and explicit scope (security/logic/performance, not style).
- **role-assignment**: Framed the model as a senior security engineer, shifting output from generic suggestions to production-focused analysis.
