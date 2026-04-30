# Prompt Anti-Patterns

The fastest way to improve a prompt is to recognize what is wrong with it. Most
weak prompts share a small set of structural failures. This reference catalogs the
8 most common anti-patterns — what they look like, why they fail, and how to fix
them.

Use this as diagnostic guidance: if a prompt produces bad output, scan this list
before adding more instructions. The problem is almost always one of these eight.

---

## 1. The Wish Prompt

### What it looks like

The prompt states a desired outcome but provides no criteria for evaluating success.
Quality words like "good", "clean", "better", or "professional" appear without definition.

### Why it fails

"Good" is not a specification — it is a wish. The model has no signal for what good
means in your context, so it falls back on the most statistically common interpretation.
For code, that means generic patterns. For writing, that means corporate boilerplate.
The vaguer the request, the more average the output.

### How to fix it

- Replace every quality adjective with measurable criteria. "Good code" becomes
  "functions under 20 lines, early returns, typed parameters, no side effects."
- Define the audience and their expectations. "Professional" for a C-suite memo is
  completely different from "professional" for a code review comment.
- State what success looks like in concrete terms — not "clean UI" but "no more
  than 3 actions visible per screen, consistent 8px spacing grid."
- When you catch yourself writing "make it better", stop and ask: better along
  which axis? Speed? Readability? Correctness? Brevity?

### Before/After

**Before:**

```
Review my code and make it better. I want it to be clean and professional.
```

**After:**

```
Review this TypeScript function for:
1. Type safety — flag any `any` types or missing return types
2. Error handling — every async call needs try/catch with typed errors
3. Readability — functions over 25 lines should be split, prefer early returns
4. Naming — variables should describe content, not type (e.g., `userEmail` not `str`)

<code>
[the code]
</code>

For each issue, show the current line and a corrected version.
```

---

## 2. The Novel

### What it looks like

A wall of context — project history, architecture decisions, team preferences, past
failures — followed by a brief instruction buried at the end. The ratio of context
to instruction is 20:1 or worse.

### Why it fails

Claude processes tokens sequentially. When the instruction arrives after 2000 words
of context, two things go wrong. First, the model has already formed assumptions
about what you want based on the context alone, and those assumptions may be wrong.
Second, the sheer volume dilutes the actual task — the model gives equal weight to
all the background, making it harder to identify what you actually need done.

### How to fix it

- State the task in the first 2-3 sentences. Lead with what you need, not why.
- Move context into XML-tagged sections that the model can reference selectively:
  `<background>`, `<constraints>`, `<architecture>`.
- Apply the "newspaper test": if someone reads only the first paragraph, do they
  know what you are asking? If not, restructure.
- Cut ruthlessly. If a piece of context does not change how the model should
  respond, delete it.

### Before/After

**Before:**

```
Our team has been working on this project for 6 months. We started with a monolith
but moved to microservices in Q2. The auth service was the first one we extracted.
It uses JWT tokens with RS256 signing. We had some issues with token rotation last
month when the key store migration happened. The previous developer left in March
and the documentation is sparse. We're running on Kubernetes 1.28 with Istio for
service mesh. The staging environment has been flaky lately due to resource limits.
Our CI uses GitHub Actions with a custom runner fleet. We need to ship the refresh
token endpoint by Friday.

Can you help with the implementation?
```

**After:**

```
Implement a JWT refresh token endpoint for our auth microservice.

<requirements>
- Accept expired access token + valid refresh token
- Validate refresh token against Redis store
- Issue new access/refresh token pair
- Revoke the consumed refresh token (rotation)
- RS256 signing using keys from Vault
</requirements>

<context>
- TypeScript, Express, running on Kubernetes
- Existing auth middleware in src/middleware/auth.ts
- Token signing util in src/utils/jwt.ts
</context>

Return the endpoint handler, any new utility functions, and integration test stubs.
```

---

## 3. The Negative Spiral

### What it looks like

A prompt built primarily from negations. "Don't use bullet points. Don't be too
formal. Don't include code examples. Avoid jargon. Never start sentences with 'I'."
The model receives a long list of things to avoid and no clear picture of what to do.

### Why it fails

Negations require the model to first activate the concept (bullet points, jargon,
formality) and then suppress it. This is harder than directly activating the
desired behavior, and the suppression frequently leaks — especially when multiple
negations compete. Telling a model "don't think about elephants" guarantees it
thinks about elephants. The more "don'ts" you stack, the more the model fixates on
exactly what you are trying to avoid.

### How to fix it

- For each "don't", write the positive alternative. "Don't use bullet points"
  becomes "write in flowing paragraphs with clear topic sentences."
- If you must include a negation, pair it with a positive: "Avoid jargon —
  use plain language that a first-year CS student would understand."
- Limit negations to at most one or two that address a specific, observed failure.
  Use them as guardrails, not as the primary instruction.
- Test by reading only the positive instructions — does the prompt still make
  sense without the negations? If not, the positive framing is too weak.

### Before/After

**Before:**

```
Write a technical blog post about WebSockets. Don't make it too long. Don't use
overly technical jargon. Don't include code examples longer than 10 lines. Don't
be dry or academic. Don't use passive voice. Don't start with "In this article".
Don't add a conclusion section.
```

**After:**

```
Write a technical blog post about WebSockets for frontend developers with 1-2
years of experience.

Tone: conversational and direct, like explaining to a colleague over coffee.
Length: 800-1000 words.
Structure: open with a concrete problem WebSockets solve, walk through the
lifecycle (connect, message, close), end with a practical "try this next" action.

Code examples: short inline snippets (under 10 lines) showing the key API calls.
Use active voice throughout.
```

---

## 4. The Kitchen Sink

### What it looks like

Every possible instruction, constraint, and preference crammed into a single prompt.
The instructions contradict each other, or the sheer volume makes prioritization
impossible. "Be concise but thorough. Be creative but follow best practices. Write
production-ready code but move fast."

### Why it fails

Contradictory instructions force the model to make tradeoff decisions you did not
specify. "Concise but thorough" is a genuine tension — the model cannot know which
side you lean toward without more signal. When everything is equally important,
nothing is. The model compromises on all dimensions and excels on none, producing
output that is mediocre across the board.

### How to fix it

- Identify contradictions explicitly and resolve them. If you want concise, say
  "prioritize brevity over completeness — cover the top 3 points, skip the rest."
- Rank your constraints. State which 2-3 matter most. "Above all, the code must
  compile and handle errors. Style is secondary."
- Split compound prompts into sequential steps. First generate, then review,
  then refine. Each step gets focused instructions.
- Remove instructions that restate defaults. Claude already writes grammatical
  English and uses standard formatting. You do not need to say "use proper grammar."

### Before/After

**Before:**

```
Write a Python function that parses CSV files. Make it fast and memory efficient
but also readable and well-documented. Handle all edge cases. Use type hints.
Follow PEP 8. Add comprehensive error handling. Make it production-ready but keep
it simple. Support all CSV dialects. Add logging. Write it in a functional style
but make it easy to extend with OOP later. Include docstrings in Google style.
Make sure it works with files up to 10GB.
```

**After:**

```
Write a Python function that streams large CSV files (up to 10GB) without loading
them entirely into memory.

Priority order:
1. Memory safety — must stream, never load full file
2. Error handling — malformed rows logged and skipped, not crashed
3. Type safety — full type hints, returns Iterator[dict[str, str]]

<signature>
def stream_csv(path: Path, delimiter: str = ",") -> Iterator[dict[str, str]]:
</signature>

Use csv.reader under the hood. Google-style docstring. Skip logging and dialect
support for now — this is the v1 core.
```

---

## 5. The Implicit Expert

### What it looks like

The prompt assumes the model knows your codebase, your team's conventions, your
domain acronyms, or your internal terminology without providing any of that context.
"Fix the flaky integration test in the auth module" sent to a model that has never
seen your repository.

### Why it fails

The model does not have access to your codebase, your Jira board, or your team's
Slack history. It cannot infer what "the auth module" means in your project, what
makes the test flaky, or what "fixed" looks like for your team. Without this context,
the model either asks clarifying questions (best case) or hallucinates plausible-
sounding but wrong details (worst case). Domain jargon is especially dangerous
because the model may know a different definition of the same term.

### How to fix it

- Include the relevant code, configuration, or error output directly in the prompt
  using XML tags: `<code>`, `<error_log>`, `<config>`.
- Define domain terms on first use. "Our gateway (the API layer that sits between
  the CDN and the microservices)" takes five seconds to write and prevents
  misinterpretation.
- State conventions explicitly. "We use the Result pattern — functions return
  `{ok: true, data: T} | {ok: false, error: E}`, never throw."
- Assume the model is a skilled contractor on their first day. They are smart but
  have zero context about your specific project.

### Before/After

**Before:**

```
The BFF is timing out when the downstream saga fails to compensate. Fix the retry
logic so it respects the CB threshold.
```

**After:**

```
Our Backend-for-Frontend (BFF) service calls an order processing saga. When a saga
step fails, a compensating transaction should roll back prior steps. The problem:
the BFF retries the saga call 3 times before the circuit breaker (CB) opens, but
the saga's compensation can take up to 30s, causing the retries to overlap with
in-progress compensation.

<current_retry_logic>
const result = await retry(sagaClient.process(order), {
  attempts: 3,
  delay: 1000,
  backoff: 'exponential'
});
</current_retry_logic>

<circuit_breaker_config>
threshold: 5 failures in 60s
reset: 30s half-open
</circuit_breaker_config>

Fix the retry logic to:
1. Check circuit breaker state before each retry attempt
2. Use a delay that exceeds the max compensation time (30s)
3. Add a compensating-in-progress check via the saga status endpoint
```

---

## 6. The Premature Example

### What it looks like

The prompt leads with examples before explaining the task. One or more input/output
pairs appear first, followed by the actual instruction at the end — or worse, the
instruction is absent entirely and the model must infer the task from examples alone.

### Why it fails

When examples appear before the task description, the model begins pattern-matching
immediately without understanding the underlying rule. It latches onto surface
features of the examples (formatting, word choice, length) rather than the semantic
transformation you intend. If your examples have any inconsistencies — and they
almost always do — the model has no task description to resolve the ambiguity. The
result is brittle: it works for inputs that look exactly like your examples and
fails for anything else.

### How to fix it

- Always state the task and rules first. What is the transformation? What are the
  constraints? What does success look like?
- Place examples after the task description, introduced with context: "Here are
  examples of the expected input and output format."
- Wrap examples in `<examples>` tags so they are clearly demarcated from the
  instruction.
- Ensure examples are consistent with each other. If they contradict the stated
  rules, the model will follow the examples — so audit them.

### Before/After

**Before:**

```
Input: "The server crashed at 3am"
Output: {"severity": "critical", "component": "server", "time": "03:00"}

Input: "Disk usage hit 90%"
Output: {"severity": "warning", "component": "disk", "time": null}

Input: "Deploy succeeded for auth-service"
Output: {"severity": "info", "component": "auth-service", "time": null}

Now process: "Memory leak detected in payment-service at 14:30"
```

**After:**

```
Classify infrastructure log messages into structured JSON alerts.

Rules:
- severity: "critical" (outages, crashes), "warning" (thresholds, degradation),
  "info" (successful operations, status updates)
- component: extract the system or service name mentioned
- time: extract if an explicit time is mentioned, format as HH:MM, null otherwise

<examples>
Input: "The server crashed at 3am"
Output: {"severity": "critical", "component": "server", "time": "03:00"}

Input: "Disk usage hit 90%"
Output: {"severity": "warning", "component": "disk", "time": null}

Input: "Deploy succeeded for auth-service"
Output: {"severity": "info", "component": "auth-service", "time": null}
</examples>

Now classify this message:
"Memory leak detected in payment-service at 14:30"
```

---

## 7. The Copy-Paste

### What it looks like

A prompt written for GPT-4 (or another model) pasted directly into Claude without
adaptation. Common tells: JSON-based structuring instead of XML, aggressive
system-prompt repetition, "you must" phrasing on every instruction, elaborate
persona scripts, rigid step-by-step reasoning chains, or markdown-heavy formatting
where XML would be cleaner.

### Why it fails

Different models have different training distributions and architectural strengths.
Claude was specifically fine-tuned to respect XML tag boundaries — JSON structuring
in prompts loses that advantage. Claude 4.x reasons well from general intent —
prescriptive step-by-step chains from the GPT-3.5 era over-constrain it and produce
worse results. Claude responds better to positive framing and explanations of why
a rule exists, while some models need more forceful "you must never" phrasing. Using
a prompt designed for another model means you are paying for Claude's capabilities
but not using them.

### How to fix it

- Replace JSON prompt structuring with XML tags. Instead of
  `{"role": "system", "content": "..."}` nesting, use `<context>`, `<requirements>`,
  `<output_format>`.
- Convert rigid step-by-step reasoning chains to intent-based instructions. Replace
  "Step 1: identify the nouns. Step 2: classify each noun." with "Analyze the text
  and classify the key entities, thinking through your reasoning."
- Replace "you must never" / "you are absolutely forbidden" phrasing with positive
  instructions and explanations. "Use plain language because the audience is
  non-technical" outperforms "You must NEVER use jargon. NEVER use technical terms."
- Move data and context before the instruction (query-at-end). Some models are less
  sensitive to ordering, but Claude measurably benefits from having the full picture
  before the task.

### Before/After

**Before (GPT-4 style):**

```
You are an expert code reviewer. You MUST follow these rules EXACTLY:
1. You MUST check for security vulnerabilities
2. You MUST check for performance issues
3. You MUST check for code style
4. You MUST NOT suggest changes that break backwards compatibility
5. You MUST respond in the following JSON format:
{"issues": [{"severity": "high|medium|low", "line": <number>, "description": "..."}]}

Here is the code to review:
function processPayment(amount, card) { ... }

IMPORTANT: Follow the JSON format EXACTLY. Do not deviate.
```

**After (Claude-optimized):**

```
<code_to_review>
function processPayment(amount, card) { ... }
</code_to_review>

Review this code as a senior engineer focused on shipping safely. Prioritize:
1. Security vulnerabilities (injection, auth, data exposure)
2. Correctness and edge cases (null, overflow, concurrency)
3. Performance (only if there is a clear bottleneck)

Skip style nitpicks unless they affect readability.
Flag anything that would break the existing public API.

Respond in this format for each issue:

<issue>
<severity>high | medium | low</severity>
<line>line number</line>
<description>what is wrong and how to fix it</description>
</issue>
```

---

## 8. Semantic Contamination

### What it looks like

The prompt uses words, metaphors, or framing that activate unintended model
behaviors. The word choices are technically correct but carry associations that
steer the output in the wrong direction. This is the subtlest anti-pattern and
the hardest to spot.

### Why it fails

Language models associate words with their most frequent contexts in training data.
When you ask a model to "play checkers" on your data, it may activate associations
with the board game rather than the data-checking task you intended. Asking it to
"roast" a configuration file might trigger comedy-roast associations instead of
thorough criticism. Telling it to be "creative" in a code review activates
fiction-writing patterns. These associations are statistical — the model is not
confused, it is doing exactly what the word distribution suggests. The contamination
is invisible because the words seem perfectly reasonable to a human reader.

### How to fix it

- Audit your prompt for words with strong alternative meanings. "Scan" (security
  scan vs. quick read), "check" (verify vs. chess/checkers), "flag" (mark vs.
  national symbol), "execute" (run code vs. other meanings).
- Replace metaphorical language with literal descriptions of what you want.
  "Tear apart this PR" becomes "identify every defect, missed edge case, and
  design flaw in this pull request."
- Test by asking: if this word appeared in a different context, what would the
  model generate? If the answer is far from your intent, choose a different word.
- Be especially careful with role assignments. "Act as a judge" activates legal
  reasoning. "Act as a critic" activates literary criticism. "Evaluate this code
  for correctness" is more precise than both.

### Before/After

**Before:**

```
Play detective on this codebase. Sniff out any code smells and smoke out the bugs
hiding in the corners. Give me the raw truth — don't sugarcoat anything. I want
you to grill this code hard.
```

This activates associations with detective fiction, cooking ("grill", "smoke out",
"raw"), and informal storytelling. The output is likely to be narrative and
metaphor-heavy rather than technically precise.

**After:**

```
Audit this codebase for defects and design weaknesses.

<code>
[the code]
</code>

For each finding, report:
1. Location (file and line)
2. Category: bug, design flaw, maintainability risk, or performance issue
3. Severity: critical (will cause production failures), moderate (causes problems
   under specific conditions), low (technical debt, no immediate impact)
4. Recommended fix with a code snippet

Order findings by severity, highest first. If no significant issues exist, say so
explicitly rather than manufacturing low-priority findings.
```

---

## Quick Reference

| Anti-Pattern | Core Problem | One-Line Fix |
|---|---|---|
| The Wish Prompt | No success criteria | Define "good" with measurable specifics |
| The Novel | Context drowns the task | Lead with the task, tag the context |
| The Negative Spiral | Only says what NOT to do | Rewrite every negation as a positive |
| The Kitchen Sink | Contradictory instructions | Rank constraints, resolve tensions |
| The Implicit Expert | Assumes shared context | Include code, define terms, state conventions |
| The Premature Example | Examples before task | Task and rules first, examples after |
| The Copy-Paste | Wrong model, wrong style | XML tags, data-first, positive framing |
| Semantic Contamination | Words trigger wrong behavior | Literal language, audit loaded terms |
