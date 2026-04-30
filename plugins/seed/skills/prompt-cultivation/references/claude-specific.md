# Claude-Specific Prompt Optimizations

Practices here are drawn from Anthropic's published documentation, prompt engineering
guides, and confirmed testing results — not speculation. Where a practice diverges
from general LLM advice (e.g., GPT-optimized techniques), the difference is noted.

## Table of Contents

1. XML Tags
2. Query-at-End Ordering
3. Positive Framing
4. Explain the Why
5. Effort Calibration
6. Over-Prompting Risks
7. System vs User Prompt
8. Extended Thinking

---

## 1. XML Tags

Claude was specifically trained to recognize and respect XML tag boundaries. This is
the primary structural divergence from other models, where markdown headers or JSON
delimiters are more common.

**When tags help:** separating content types (code from instructions, examples from
data), isolating injected variables from instructions, formatting output, and any
prompt over ~500 words.

**Naming:** use self-documenting snake_case names. `<code_to_review>` over `<input>`.
Avoid attributes — they add complexity without benefit for prompt structuring.

**Nesting:** works well for hierarchical content. Keep to 2-3 levels.

```xml
<examples>
  <example>
    <input>Revenue increased 15% YoY</input>
    <output>Positive financial indicator: year-over-year revenue growth of 15%</output>
  </example>
</examples>
```

**Contrast:** GPT-family models respond better to markdown headers (`## Section`).
Claude understands both, but XML tags are the higher-signal choice.

Before:
```
Context: The user is a junior developer.
Task: Review their code for security issues.
Code: def login(user, pw): ...
```

After:
```xml
<context>The user is a junior developer.</context>
<task>Review the code for security vulnerabilities. Flag each issue with
severity (critical/warning/info) and a fix suggestion.</task>
<code>def login(user, pw): ...</code>
```

---

## 2. Query-at-End Ordering

Anthropic's testing shows ~30% quality improvement when context precedes the
instruction, compared to instruction-first ordering.

Claude processes prompts sequentially. When the instruction comes first, Claude begins
formulating its approach before absorbing the full picture. Place data first and the
question last — like briefing a colleague before asking them to act.

**The pattern:**
```
1. Role/persona (if used)
2. Context and background data
3. Examples (if used)
4. Constraints and format
5. The actual question or instruction  <-- last
```

Before:
```xml
<task>Summarize the key risks in this contract.</task>
<contract>[3 pages of contract text...]</contract>
```

After:
```xml
<contract>[3 pages of contract text...]</contract>
<task>Summarize the key risks, focusing on liability, termination, and IP.</task>
```

**When to break the rule:** short prompts (under ~100 words) see negligible difference.
The benefit scales with prompt length. In multi-turn conversations, apply query-at-end
to each message — place fresh context before the follow-up question.

---

## 3. Positive Framing

"Write flowing prose" consistently outperforms "Don't use bullet points." This reflects
how language models process instructions, not just style preference.

**The mechanism:** "don't use bullet points" activates the concept of bullet points,
then must suppress it, then Claude must independently guess what you want instead.
"Write in flowing prose" activates the desired behavior directly — no suppression step,
no ambiguity.

| Negative (weaker) | Positive (stronger) |
|---|---|
| Don't use jargon | Write for a general audience using plain language |
| Don't be verbose | Keep responses under 200 words, prioritizing clarity |
| Don't make assumptions | State your assumptions explicitly before answering |
| Don't hallucinate | Support each claim with evidence from the provided context |
| Don't repeat yourself | Cover each point once, then move forward |

**When negatives work:** as guardrails alongside positive instructions. State what to
do positively, then add a negative boundary for a known failure mode.

```xml
<instructions>
Write a technical blog post in flowing prose with clear section transitions.
Do not include a "conclusion" section that merely restates the introduction.
</instructions>
```

Prompts with 3+ "don't" statements almost always underperform a single clear positive
description. If you're writing a list of don'ts, step back and describe what you want.

---

## 4. Explain the Why

Claude generalizes from explanations significantly better than from bare rules. A
reason transforms a rigid instruction into a transferable principle that Claude applies
to edge cases the rule never anticipated.

Bare rule:
```
Use short sentences.
```

With explanation:
```
Use short sentences because the audience is non-native English speakers who
process shorter syntactic structures more easily.
```

The bare rule gives Claude one behavior. The explanation lets Claude make related
decisions — simplify vocabulary, avoid idioms, prefer active voice — because those
flow from the same reasoning.

```xml
<guidelines>
Use present tense for API docs because developers read them while actively
working with the API, and present tense matches their "what does this do now"
mental model.

Format parameters as tables because developers scan for specific names rather
than reading sequentially.
</guidelines>
```

From these two explained rules, Claude will also use imperative mood for methods, put
return types prominently, and front-load common parameters — logical extensions.

**When to skip:** purely mechanical rules with no judgment calls ("output as JSON",
"limit to 3 items"). Explanations pay off when Claude exercises judgment — tone,
depth, structure, emphasis, or what to include vs omit.

---

## 5. Effort Calibration

Prompt detail, the `effort` parameter, and extended thinking interact. Understanding
how prevents both under-specified and over-constrained prompts.

| Effort level | Prompt style | Best for |
|---|---|---|
| Low / no thinking | Brief, direct | Extraction, formatting, classification |
| Medium | Key constraints only | Generation, summarization, code writing |
| High / thinking | Goal + format, let thinking reason | Analysis, multi-step, architecture |

**Prompt heavily** when: non-obvious output format, domain-specific constraints Claude
can't infer, subtle failure modes, or consistency across thousands of runs matters.

**Prompt lightly** when: well-understood tasks, extended thinking is enabled (detailed
prompts can interfere), Claude 4.x handles it well with minimal guidance, or you're
iterating and want the model's natural approach first.

**Thinking interaction:** when thinking is enabled, overly prescriptive step-by-step
instructions conflict with the model's internal reasoning.

Instead of:
```
Step 1: Read the code. Step 2: Identify functions. Step 3: Check each for X.
Step 4: Compile issues. Step 5: Format as table.
```

With thinking, prefer:
```
Review this code for security vulnerabilities. Focus on injection vectors,
auth bypasses, and data exposure. Present findings as a severity/location/fix table.
```

The thinking block handles reasoning steps. Your prompt defines goal and output format.

---

## 6. Over-Prompting Risks

Prompts migrated from Claude 3.x to 4.x often carry scaffolding that actively degrades
quality. Claude 4.x understands nuance, follows complex instructions naturally, and
reasons through ambiguity without hand-holding.

**Symptoms:** robotic output from excessive formatting constraints; guardrails
overtriggering on benign content; meta-instructions drowning out the actual task;
prompted version performing worse than zero-shot.

| 3.x-era pattern | 4.x approach |
|---|---|
| "Think step by step before answering" | Enable extended thinking, or just ask directly |
| "You are a helpful, harmless, honest AI" | Drop — baked into the model |
| "Answer in [language], do not switch" | Only if input is multilingual |
| Long edge-case instruction lists | State the principle, trust Claude to apply it |
| "Do not apologize or say you're an AI" | Usually unnecessary unless specific persona |
| Repeated "IMPORTANT:", "CRITICAL:", "MUST" | Use once for genuinely critical constraints |

**The trust gradient:** start minimal, add constraints only when output deviates.

```
Iteration 1: "Review this PR for issues."
  → Too broad, flags style nits
Iteration 2: "Review this PR for logic errors and security issues. Skip style."
  → Good focus, missing severity
Iteration 3: "Review for logic and security. Rate critical/warning/info. Skip style."
  → Dialed in
```

Three targeted constraints beat twenty speculative ones.

**When heavy prompting is justified:** production pipelines (consistency > per-response
quality), safety-critical domains (non-negotiable guardrails), multi-model systems
(prompts shared across providers need explicit structure).

---

## 7. System vs User Prompt

Claude distinguishes system and user prompts at a fundamental level. Each serves a
distinct purpose.

**System prompt** — persistent context true across every user message:
- Identity and role
- Behavioral rules, tone, format defaults
- Output structure, available tools
- Static reference data (taxonomy, glossary)

```xml
<system>
You are a senior code reviewer for a Python monorepo. Review for correctness,
security, and PEP 8. Respond with: severity (critical/warning/info), location
(file:line), issue, and fix. If no issues, respond "LGTM" with brief feedback.
</system>
```

**User prompt** — per-request content that changes each interaction:
- The specific task or question
- Input data (code, text, documents)
- Request-specific constraints
- Conversation context, follow-ups

**Anti-patterns:**

*Duplicating across both.* "Respond in JSON" in system and "make sure response is
JSON" in user wastes tokens and causes drift when duplicated instructions diverge.

*Dynamic data in system.* Claude treats system content as more authoritative —
variable data there can override user-level corrections unexpectedly.

*Empty system for applications.* Skipping system means Claude defaults to generic
personality. A brief role+format system prompt pays for itself in consistency.

*Everything in system.* Monolithic system prompts blur what's the "current request."
Claude distinguishes priority less precisely when everything is at the same level.

**Priority model:** system-level instructions are higher-authority than user-level.
Safety constraints resist user-level overrides. Format specs persist even when users
don't mention format. Personas hold across turns. For prompt injection defense,
critical rules belong in system because they are harder to override from user input.

---

## 8. Extended Thinking

Extended thinking gives Claude an internal scratchpad — a thinking block before the
response where it reasons through problems, plans approach, and resolves ambiguity
before committing to output.

**Strong fit:** multi-step reasoning, complex code analysis, architectural decisions,
tasks where first intuition is likely wrong, long-form content benefiting from
outlining, ambiguous requests, debugging, root cause analysis.

**Weak fit:** simple extraction, short factual lookups, clear-category classification,
tasks where speed matters more than depth.

### Interaction with prompting

Thinking partially replaces explicit chain-of-thought. When thinking is on, "think
step by step" is redundant and can create competing reasoning tracks.

Without thinking:
```
Analyze this code for race conditions. Think through each shared resource,
identify accessing threads, and determine if synchronization is adequate.
```

With thinking:
```
Analyze this code for race conditions. Focus on shared mutable state and
synchronization gaps.
```

### Practical considerations

- Thinking tokens consume context budget — keep input focused
- Set budget proportional to complexity; the model self-regulates for simple tasks
- You cannot instruct *how* Claude thinks (thinking content is model-controlled)
- Thinking enhances reasoning over provided information but does not replace domain
  expertise you inject via the prompt

**Quality impact on complex tasks:** fewer logical errors (model catches own mistakes),
more complete analysis (plans coverage first), better-structured output (outlines
before writing), more accurate code (traces execution mentally).

The tradeoff is latency and token cost. Enable thinking selectively for high-stakes
operations rather than as a blanket default.

| Technique | Interaction with thinking |
|---|---|
| XML tags | Fully compatible — structure both input and requested output |
| Query-at-end | Still beneficial — thinking works better with full context first |
| Few-shot examples | Less necessary — thinking reduces format errors independently |
| Role/persona | Compatible — persona frames the thinking style applied |
| Positive framing | Still preferred — thinking doesn't change instruction processing |
| Anti-hallucination guards | Thinking reduces hallucination, but guards add a safety net |
