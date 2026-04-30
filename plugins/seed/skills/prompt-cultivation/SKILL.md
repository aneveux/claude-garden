---
name: prompt-cultivation
version: 1.0.0
description: |
  Prompt engineering knowledge and refinement techniques for Claude. Loaded by
  /seed:germinate and the cultivator agent. Provides the 8 core prompting techniques,
  diagnostic triggers, Claude-specific optimizations, and the prompt anatomy framework.
  Use whenever transforming rough ideas into structured prompts, reviewing prompt quality,
  or designing multi-prompt systems.
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
---

# Prompt Cultivation

The art of transforming rough intent into structured, effective prompts.

## Prompt Anatomy

Every effective prompt has up to six components. Not all are required — match structure to complexity.

| # | Component | Purpose | Required? |
|---|-----------|---------|-----------|
| 1 | Role/Persona | Who the AI is in this context | When expertise framing helps |
| 2 | Context | Background data, XML-tagged inputs | When input data exists |
| 3 | Task | What to do, with success criteria | Always |
| 4 | Constraints | Format, length, audience, tone, scope | When defaults aren't enough |
| 5 | Output format | Structure, tags, examples | When specific structure needed |
| 6 | Query | The actual question/instruction — placed last | Always |

Ordering matters: context and data come first, the question or instruction comes last. Claude processes prompts sequentially — front-loading context gives it the full picture before the task.

## The 8 Core Techniques

Each technique addresses a specific weakness in a prompt. Apply based on diagnosis, not habit.

### 1. Role/Persona Assignment

**Principle:** Frame the AI's expertise and perspective to calibrate depth and vocabulary.

**Diagnostic trigger:** No perspective framing, generic "you are helpful", or output lacks domain depth.

**Transformation:** Add a role statement that specifies expertise area, experience level, and perspective. Be specific — "senior security engineer who has reviewed 500+ PRs" outperforms "security expert".

**Pairs well with:** Constraints, XML Structuring.

### 2. XML Tag Structuring

**Principle:** Use XML tags to separate content types. Claude treats XML tags as semantic boundaries.

**Diagnostic trigger:** Multiple content types mixed together, long prompts with unclear section breaks, Claude-targeted prompts without structure.

**Transformation:** Wrap each content type in descriptive XML tags: `<context>`, `<code>`, `<requirements>`, `<examples>`, `<output_format>`. Tag names should be self-documenting.

**Pairs well with:** Every other technique — XML is the universal organizer.

### 3. Constraint Specification

**Principle:** Make implicit expectations explicit. What's "good" is undefined without constraints.

**Diagnostic trigger:** Missing format, length, audience, tone, or scope. Vague quality words like "thorough" or "concise" without calibration.

**Transformation:** Add explicit constraints for each dimension. Quantify where possible: "1500 words" beats "medium length", "DevOps engineers with 2+ years" beats "technical audience".

**Pairs well with:** Role Assignment, XML Structuring.

### 4. Chain-of-Thought

**Principle:** Ask the model to reason through steps before concluding.

**Diagnostic trigger:** Complex reasoning, multi-step logic, analysis tasks, mathematical operations, or anywhere the first intuition might be wrong.

**Transformation:** Add instructions to think through the problem step-by-step. For Claude, "think thoroughly about this" works better than prescribing exact reasoning steps — Claude generalizes from intent better than rigid checklists.

**Pairs well with:** Few-Shot Examples, Anti-Hallucination Guards.

### 5. Few-Shot Examples

**Principle:** Show the model what you want through concrete input/output pairs.

**Diagnostic trigger:** Output format consistency needed, edge cases to demonstrate, the model keeps getting the format wrong, or the task has a non-obvious mapping from input to output.

**Transformation:** Add 1-3 examples of expected input/output pairs. Place examples after the task description but before the actual input. Quality over quantity — one excellent example beats three mediocre ones.

**Pairs well with:** Chain-of-Thought, XML Structuring.

### 6. Query-at-End Ordering

**Principle:** Place all context and data before the instruction. The question comes last.

**Diagnostic trigger:** Data or context appears after the instruction. The prompt starts with "Please analyze..." and then provides the thing to analyze.

**Transformation:** Restructure: context/data first, instruction/question last. This gives Claude the full picture before asking it to act, producing measurably better results.

**Pairs well with:** XML Structuring (tags make reordering clean).

### 7. Positive Instructions

**Principle:** Tell the model what TO do, not what NOT to do.

**Diagnostic trigger:** Negations like "don't use bullet points", "avoid jargon", "don't be verbose". Multiple "don't" statements stacking up.

**Transformation:** Reframe each negation as a positive direction: "don't use bullet points" becomes "write in flowing prose with paragraph breaks". Positive instructions activate the desired behavior directly instead of asking the model to inhibit something.

**Pairs well with:** Constraint Specification, Role Assignment.

### 8. Anti-Hallucination Guards

**Principle:** Add explicit instructions for handling uncertainty and unsupported claims.

**Diagnostic trigger:** Tasks where fabrication is dangerous — factual research, citation-required work, medical/legal/financial domains, code that must compile.

**Transformation:** Add guards: "If unsure, say so explicitly", "Only cite sources you can verify", "Distinguish between what the code does and what you infer". Pair with output format to create sections for confidence levels.

**Pairs well with:** Chain-of-Thought, Constraint Specification.

## Technique Compatibility Matrix

Common effective combinations:

| Combination | Use case |
|-------------|----------|
| Role + Constraints + XML | General-purpose refinement — the "default stack" |
| CoT + Few-Shot | Complex analytical tasks with specific output format |
| Anti-Hallucination + Constraints | Factual/research tasks with accuracy requirements |
| Role + Few-Shot + XML | Tasks needing consistent expert-level output format |
| Positive Instructions + Constraints | Replacing a prompt full of "don'ts" |
| XML + Query-at-End | Long prompts with lots of context data |

## Claude-Specific Optimizations

These are confirmed by Anthropic's own documentation and testing:

1. **XML tags are the gold standard** — Claude was specifically trained to respect XML tag boundaries. Prefer `<tag>content</tag>` over markdown headers or JSON for structuring prompts.

2. **Data first, query last** — Placing context before the instruction yields ~30% quality improvement in Anthropic's testing. Claude processes sequentially; give it the full picture first.

3. **Positive over negative** — "Write flowing prose" activates the desired behavior directly. "Don't use bullet points" forces Claude to think about bullet points and then suppress them.

4. **Explain the why** — Claude generalizes from explanations better than from bare rules. "Use short sentences because the audience is non-native English speakers" is more effective than "Use short sentences."

5. **Think thoroughly > step lists** — Claude 4.x reasons well with general thinking instructions. Prescriptive step-by-step lists from the 3.x era can over-constrain and produce worse results.

6. **Over-prompting risk** — Claude 4.x is significantly more capable than earlier models. Aggressive instructions written for 3.x often cause overtriggering. When in doubt, trust the model and prompt lighter.

7. **System vs user prompt** — Persistent identity, rules, and format go in system. Per-request data and the specific task go in user. Don't duplicate between them.

## Reference Files

For deeper information, read these files from the `references/` directory:

| File | When to read | Lines |
|------|-------------|-------|
| `techniques.md` | Deep dive on any technique — full examples, common mistakes, combinations | ~1000 |
| `anti-patterns.md` | Diagnosing what's wrong with a prompt — the 8 most common mistakes | ~550 |
| `claude-specific.md` | Claude-targeted optimization — system/user split, thinking, effort parameter | ~350 |
