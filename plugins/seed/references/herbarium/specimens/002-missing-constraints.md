---
id: 002
date: 2026-04-30
category: content-generation
techniques:
  - constraint-specification
  - role-assignment
summary: "Adding explicit constraints to an underspecified content generation prompt"
---

# Specimen 002: Missing Constraints

## The Seed (Before)

> write a blog post about Kubernetes

## Diagnosis

- No audience definition — the model cannot calibrate depth, and defaults to beginner-level fluff.
- No structural or length constraints — output is either 300 words of nothing or 5000 words of everything.
- No tone guidance — risks drifting into marketing language, listicle filler, or academic dryness.

## The Bloom (After)

```
You are a staff platform engineer writing for your team's engineering blog.
You value clarity, practical examples, and honest trade-off analysis. You
never use marketing language, hype, or filler phrases like "in today's
fast-paced world."

Write a blog post about using Kubernetes network policies to isolate
multi-tenant workloads.

<audience>
DevOps engineers and platform teams with 2+ years of Kubernetes experience.
They already understand pods, services, and namespaces. They do NOT need
an introduction to what Kubernetes is.
</audience>

<constraints>
- Length: ~1500 words (hard ceiling: 1800)
- Tone: practical and direct — write like you are explaining to a peer
- Structure: follow this arc:
  1. The problem (why default flat networking is dangerous in multi-tenant clusters)
  2. The solution (network policies as namespace-level firewalls)
  3. Implementation (a real-world example with YAML manifests)
  4. Gotchas (CNI requirements, policy ordering, common misconfigurations)
- Format: markdown with H2 headings, code blocks for all YAML/commands
- Include at least one complete, working NetworkPolicy manifest
- End with a "What to do Monday" section — 3 concrete next steps
- Do NOT include a generic introduction paragraph or a "conclusion" recap
</constraints>
```

## Techniques Applied

- **constraint-specification**: Defined audience, word count, tone, structure arc, format requirements, and anti-patterns — eliminating every axis of ambiguity.
- **role-assignment**: Framed the model as a staff platform engineer writing for peers, which suppresses beginner-level padding and marketing language.
