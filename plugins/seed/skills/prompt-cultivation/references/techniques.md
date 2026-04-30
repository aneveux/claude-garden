# Prompt Cultivation — Technique Deep Reference

A practitioner's guide to the 8 core prompting techniques. Each entry gives you the
diagnostic triggers to recognize when a technique applies, the transformation steps to
apply it, concrete before/after examples, common mistakes, effective combinations, and
Claude-specific nuances.

Read the technique you need, apply it, move on. This is a workshop manual, not a textbook.

## Table of Contents

1. [Role/Persona Assignment](#1-rolepersona-assignment)
2. [XML Tag Structuring](#2-xml-tag-structuring)
3. [Constraint Specification](#3-constraint-specification)
4. [Chain-of-Thought](#4-chain-of-thought)
5. [Few-Shot Examples](#5-few-shot-examples)
6. [Query-at-End Ordering](#6-query-at-end-ordering)
7. [Positive Instructions](#7-positive-instructions)
8. [Anti-Hallucination Guards](#8-anti-hallucination-guards)

---

## 1. Role/Persona Assignment

**Principle:** Frame the AI's expertise and perspective to calibrate vocabulary, depth,
and the lens through which it processes the task.

### When to Apply

Use role assignment when you observe any of these in the prompt:

- [ ] No expertise framing at all — the prompt talks to a generic assistant
- [ ] The output lacks domain depth or uses the wrong vocabulary level
- [ ] The prompt says "you are a helpful assistant" or similar boilerplate
- [ ] The task requires a specific professional perspective (security auditor, UX researcher, database architect)
- [ ] Output needs to match the communication style of a particular discipline

### How to Apply

1. **Identify the expertise required.** What professional would you hire for this task
   in the real world? Be specific about the subdomain — "backend engineer specializing
   in distributed systems" outperforms "software engineer."

2. **Add experience markers.** Quantify credibility where it matters: "who has reviewed
   500+ pull requests" or "with 10 years of production Kubernetes experience." This
   calibrates the depth of the response.

3. **Specify the perspective, not just the title.** A "security engineer reviewing code
   for vulnerabilities" produces different output than a "security engineer writing a
   threat model." Same role, different lens.

4. **Place the role statement first.** It sets the frame for everything that follows.
   The model reads sequentially — establishing identity early colors all subsequent
   processing.

5. **Include audience awareness in the role when relevant.** "A senior engineer
   explaining to a junior developer" produces different output than "a senior engineer
   writing for a architecture review board."

### Before/After Example

**Before:**
```
Look at this Python function and tell me if there are any issues:

def process_payment(amount, card_number, cvv):
    log.info(f"Processing payment: {card_number}, CVV: {cvv}")
    if amount > 0:
        return charge_card(card_number, cvv, amount)
    return None
```

**After:**
```
You are a senior application security engineer who specializes in PCI-DSS compliance
and has conducted 200+ secure code reviews for payment processing systems.

<code language="python">
def process_payment(amount, card_number, cvv):
    log.info(f"Processing payment: {card_number}, CVV: {cvv}")
    if amount > 0:
        return charge_card(card_number, cvv, amount)
    return None
</code>

Review this function for security vulnerabilities. Prioritize findings by severity
(critical/high/medium/low) and include the relevant compliance standard for each finding.
```

The role framing here activates PCI-DSS knowledge and the severity classification habit
that a real payment security reviewer would bring. The generic version might mention the
logging issue but would likely miss the compliance dimension.

### Common Mistakes

1. **Vague roles.** "You are an expert programmer" tells the model almost nothing. Every
   word in the role should narrow the expertise: domain, subdomain, experience level,
   and perspective. "You are a Rust systems programmer who maintains a high-throughput
   message broker" is actionable.

2. **Role/task mismatch.** Assigning "creative writer" when the task is API documentation,
   or "data scientist" when the task is code review. The role should match what you
   actually need the output to be. If the mismatch is intentional (wanting a fresh
   perspective), state that explicitly.

3. **Overloading the role.** "You are a senior full-stack engineer, DevOps expert,
   security specialist, and technical writer" dilutes all four. Pick the primary
   expertise needed. If you genuinely need multiple perspectives, run separate prompts
   or use role transitions within the prompt.

### Combinations

- **Role + Constraints:** Role sets the expertise level; constraints set the output
  parameters. Together they define both *who* is speaking and *how* they should speak.
  This is the most natural pairing.
- **Role + XML Structuring:** Wrap the role in the system prompt context and use XML
  tags to separate the data the role needs to process. Clean separation of identity
  from input.
- **Role + Few-Shot Examples:** Show the role *how* you want it to respond. An example
  from the persona's perspective locks in both the expertise level and the output format.

### Claude-Specific Notes

- Claude responds well to specific, grounded roles. "Senior security engineer at a
  fintech company reviewing payment code" works better than abstract titles.
- On Claude 4.x models, lighter role prompting often suffices. A single sentence of
  role context can be enough — you do not need a paragraph-long backstory.
- Place the role in the system prompt if you are using the API. In Claude Code
  skills/commands, place it at the top of the prompt body.
- Avoid roleplaying instructions that conflict with Claude's values or safety guidelines.
  Claude will follow the expertise framing but will not adopt personas that compromise
  its core behavior.

---

## 2. XML Tag Structuring

**Principle:** Use XML tags to create semantic boundaries between content types. Claude
was specifically trained to respect XML tag structure, making it the preferred method
for organizing complex prompts.

### When to Apply

- [ ] The prompt mixes multiple content types (code, instructions, context, examples)
  with no clear separation
- [ ] The prompt is longer than ~200 words and has no structural markers
- [ ] The model is confusing instructions with input data (treating example text as
  something to follow literally)
- [ ] You are building a prompt for Claude specifically (XML is Claude's native structure)
- [ ] The prompt contains user-provided data that should be isolated from instructions

### How to Apply

1. **Identify distinct content types.** Read through the prompt and mark each section
   that serves a different purpose: context, code, requirements, examples, constraints,
   output format, instructions.

2. **Choose descriptive tag names.** Use self-documenting names: `<context>`,
   `<code_to_review>`, `<requirements>`, `<examples>`, `<output_format>`. Avoid
   generic names like `<section1>` or single-letter tags.

3. **Wrap each section.** Place opening and closing tags around each content type.
   Maintain a flat structure when possible — avoid deep nesting unless it genuinely
   reflects hierarchical data.

4. **Add attributes sparingly.** `<code language="python">` is useful context.
   `<section id="3" priority="high" category="input" format="raw">` is noise.
   Attributes should add information the model needs, not metadata for your own
   organization.

5. **Verify the instruction text is outside the data tags.** Your actual task
   instruction should not be wrapped in a data tag. Keep instructions as plain text
   between or after the tagged sections.

### Before/After Example

**Before:**
```
I need you to review this code. The project uses React 18 with TypeScript and follows
the Airbnb style guide. Here's the component:

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetch(`/api/users/${userId}`).then(r => r.json()).then(setUser);
  }, []);
  if (!user) return <div>Loading...</div>;
  return <div>{user.name}</div>;
}

I want you to focus on performance, correctness, and accessibility. Format your response
as a list of findings with severity levels. Don't include style nitpicks since we have
a linter for that.
```

**After:**
```
<context>
Project: React 18 with TypeScript, Airbnb style guide.
Linting handles style — focus review on substance.
</context>

<code language="tsx">
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetch(`/api/users/${userId}`).then(r => r.json()).then(setUser);
  }, []);
  if (!user) return <div>Loading...</div>;
  return <div>{user.name}</div>;
}
</code>

<review_scope>
- Performance
- Correctness
- Accessibility
</review_scope>

<output_format>
List each finding with:
- Severity: critical / high / medium / low
- Line(s) affected
- Issue description
- Suggested fix
</output_format>

Review the component above for the listed focus areas. Return findings in the specified format.
```

The tagged version makes it impossible for the model to confuse the code with the
instructions, or the scope with the output format. Each section has a clear purpose.

### Common Mistakes

1. **Over-tagging.** Wrapping every sentence in its own tag adds visual noise without
   helping the model. Tags should separate *content types*, not individual sentences.
   If two sentences serve the same purpose, they belong in the same tag.

2. **Using XML tags with non-Claude models.** XML structuring is Claude's strength.
   Other models may not respect tag boundaries the same way. If you are writing
   model-agnostic prompts, markdown headers may be more portable — but for Claude,
   XML is always preferred.

3. **Nesting too deeply.** `<context><project><details><stack>React</stack></details>
   </project></context>` is harder to parse than a flat `<context>` with plain text
   inside. Reserve nesting for genuinely hierarchical data (like representing a tree
   structure).

### Combinations

- **XML + Every other technique.** XML is the universal organizer. Role goes above the
  tags. Constraints go in a `<constraints>` tag. Examples go in `<examples>`. CoT
  instructions go in the main text. It works with everything.
- **XML + Query-at-End:** Tags make reordering sections clean. Put all `<data>`,
  `<context>`, `<code>` tags first, then the instruction text.
- **XML + Few-Shot Examples:** Wrap each example in `<example>` tags (or
  `<example index="1">`) to keep them visually separated from the actual input.

### Claude-Specific Notes

- Claude was trained with XML-aware processing. It treats tag boundaries as semantic
  separators more reliably than markdown headers, bullet points, or JSON blocks.
- Use closing tags — Claude respects them and they prevent ambiguity about where a
  section ends.
- Tag names matter for comprehension. `<code_to_review>` is slightly more effective
  than `<code>` because it tells Claude the purpose, not just the content type.
- In Claude Code commands/skills, XML tags are the standard structural pattern. Every
  plugin in this garden uses them for data injection.
- On Claude 4.x, you can trust that the model will respect tag boundaries even in very
  long prompts (100k+ tokens). Earlier models sometimes lost track of deeply nested
  tags in long contexts.

---

## 3. Constraint Specification

**Principle:** Make implicit expectations explicit. Without constraints, "good output"
is undefined — the model guesses, and its guess may not match yours.

### When to Apply

- [ ] The prompt has no explicit format, length, audience, tone, or scope
- [ ] Quality words like "thorough," "concise," "detailed," or "comprehensive" appear
  without calibration (thorough compared to what?)
- [ ] The model's output is the wrong length, wrong format, or wrong register
- [ ] The prompt assumes shared context that the model does not have ("the usual format")
- [ ] Vague scope markers like "cover the main points" or "include the important parts"

### How to Apply

1. **Audit for implicit expectations.** Read your prompt and ask: if someone else ran
   this, would they get the same output I expect? Every assumption that could diverge
   is a missing constraint.

2. **Quantify where possible.** Replace relative terms with numbers:
   - "concise" -> "under 200 words"
   - "detailed" -> "1500-2000 words with code examples"
   - "brief summary" -> "3-5 bullet points, one sentence each"
   - "technical audience" -> "backend engineers familiar with distributed systems"

3. **Cover the five dimensions.** Check each one and add constraints where the default
   is wrong:
   - **Format:** prose, bullets, table, JSON, code, markdown structure
   - **Length:** word count, section count, depth level
   - **Audience:** expertise level, domain familiarity, reading context
   - **Tone:** formal, casual, instructional, analytical, encouraging
   - **Scope:** what to include, what to exclude, boundaries

4. **Make exclusions explicit.** "Focus on security issues only — do not comment on
   code style, naming, or formatting" is more effective than "focus on security."
   Explicit exclusions prevent the model from padding with tangential content.

5. **Set priority when constraints might conflict.** "Prioritize correctness over
   completeness — it is better to cover fewer points thoroughly than many points
   superficially."

### Before/After Example

**Before:**
```
Write a blog post about Kubernetes.
```

**After:**
```
<constraints>
- Audience: DevOps engineers with 2+ years of experience (skip container basics)
- Length: 1500 words (+/- 200)
- Tone: practical and opinionated, not marketing copy
- Structure: Problem statement -> Solution approach -> Implementation steps -> Gotchas
- Format: Markdown with H2 sections, include 2-3 code snippets (YAML manifests)
- Scope: Focus on Kubernetes network policies specifically, not general Kubernetes
- Exclude: "What is Kubernetes" introductions, comparisons to Docker Compose
</constraints>

Write a blog post on implementing Kubernetes network policies for microservice
isolation. Follow the constraints above.
```

The unconstrained version could produce anything from a 200-word overview to a 5000-word
tutorial aimed at beginners. The constrained version will produce a predictable,
usable result.

### Common Mistakes

1. **Contradictory constraints.** "Be thorough and comprehensive" + "Keep it under
   300 words" creates a tension the model has to resolve by guessing which constraint
   you care about more. When constraints conflict, state which one wins: "Prioritize
   brevity — omit details rather than exceed 300 words."

2. **Constraint inflation.** Adding 15 constraints to a simple task over-steers the
   model and produces rigid, unnatural output. Match constraint density to task
   complexity. A quick code review needs 3-4 constraints. A formal report might
   need 8-10.

3. **Using vague constraints as constraints.** "Be professional" and "high quality" are
   not constraints — they are vibes. Every constraint should be observable and
   verifiable. "Professional" becomes "formal tone, no contractions, third-person
   voice." "High quality" becomes "accurate, cited, with error handling."

### Combinations

- **Constraints + Role:** Role defines expertise. Constraints define output parameters.
  Together: "You are a senior DevOps engineer. Write for an audience of junior engineers.
  1000 words. Practical tone." The role sets the knowledge level; constraints set
  the communication level.
- **Constraints + XML Structuring:** Wrap constraints in a `<constraints>` tag to
  separate them from the task and context. Especially useful when there are many
  constraints — they become a self-contained reference block.
- **Constraints + Positive Instructions:** Convert "don't" constraints into "do"
  constraints. "Don't be wordy" becomes "Use short sentences averaging 15 words."

### Claude-Specific Notes

- Claude is good at following multiple simultaneous constraints without losing track.
  You can specify 8-10 constraints for complex tasks and Claude will respect them.
- When a constraint seems restrictive but important, explain why. "Under 200 words
  because this will be displayed in a mobile notification" helps Claude make better
  trade-offs when it cannot satisfy all constraints simultaneously.
- On Claude 4.x, constraints about format and structure are followed very reliably.
  Length constraints are approximate — Claude tends to be within 20% of the target.
  If exact length matters, say so: "This must be exactly 100 words for a contest
  submission."
- Claude respects scope exclusions well. "Do not discuss X" works, but "Focus
  exclusively on Y" is even more effective (positive framing).

---

## 4. Chain-of-Thought

**Principle:** Ask the model to reason through steps before reaching a conclusion.
Explicit reasoning reduces errors on complex tasks by making the model's logic
visible and self-correcting.

### When to Apply

- [ ] The task involves multi-step reasoning (math, logic, causal analysis)
- [ ] The first intuitive answer is likely wrong or incomplete
- [ ] You need to see the reasoning, not just the conclusion
- [ ] The task requires weighing competing factors or trade-offs
- [ ] Debugging or root cause analysis where jumping to conclusions is dangerous

### How to Apply

1. **Decide the level of reasoning guidance.** You have a spectrum:
   - *Light:* "Think through this carefully before answering."
   - *Medium:* "Consider the trade-offs between A and B before recommending."
   - *Heavy:* "First, identify the constraints. Then, enumerate the options. Then,
     evaluate each option against the constraints. Finally, recommend."

2. **Match guidance level to model capability.** For Claude 4.x, light guidance
   usually suffices — the model reasons well when told to think. For earlier models
   or very structured tasks, medium or heavy guidance produces better results.

3. **Separate reasoning from output when needed.** If you want both the thinking
   and a clean final answer: "Think through the problem step by step, then provide
   your final recommendation in a separate section."

4. **Use CoT for verification, not just generation.** "After writing your solution,
   verify each step is correct" catches errors the initial generation misses.

5. **Do not prescribe the exact reasoning steps for open-ended problems.** Over-
   specifying the reasoning path can prevent the model from finding a better approach.
   "Think through this thoroughly" gives Claude room to reason its own way.

### Before/After Example

**Before:**
```
We have 3 microservices. Service A handles auth, Service B handles orders,
Service C handles inventory. We're seeing intermittent 500 errors on order
creation. Service A logs show no issues. Service B logs show timeout errors
when calling Service C. Service C CPU is at 95%.

What's the root cause and fix?
```

**After:**
```
<symptoms>
- Intermittent 500 errors on order creation
- Service A (auth): logs show no issues
- Service B (orders): logs show timeout errors calling Service C
- Service C (inventory): CPU at 95%
- Architecture: A -> B -> C (auth -> orders -> inventory)
</symptoms>

Think through this systematically:
- What does the evidence tell us about where the problem originates?
- What could cause Service C's high CPU, and how does that propagate?
- What are the possible root causes (list at least 3)?
- Which root cause best explains ALL the symptoms?

Then provide:
1. Most likely root cause with reasoning
2. Immediate mitigation steps
3. Long-term fix
```

The CoT version forces the model to consider multiple hypotheses before converging,
rather than jumping to "Service C is overloaded, scale it up." The systematic approach
might reveal that Service C's CPU spike is caused by a missing database index triggered
by a recent deployment, which is a better root cause than just "high CPU."

### Common Mistakes

1. **Prescribing rigid step lists for creative or open-ended tasks.** "Step 1: identify
   the theme. Step 2: choose a metaphor. Step 3: write the opening." This constrains
   the model's creative process. Use CoT for analytical tasks; for creative tasks,
   let the model find its own path.

2. **Asking for reasoning but ignoring it.** If you ask for step-by-step reasoning
   but only use the final answer, you are wasting tokens and context. Either use the
   reasoning (for verification, debugging, or learning) or skip CoT entirely.

3. **Combining CoT with very strict output formats.** "Think step by step, then output
   only a JSON object" creates tension. The model has to reason but also produce a
   clean format. Solution: use XML tags to separate the reasoning section from the
   output section, or use Claude's extended thinking (which keeps reasoning in a
   separate block automatically).

### Combinations

- **CoT + Few-Shot Examples:** Show an example of the reasoning process you want.
  One worked example of the thinking + conclusion pattern is extremely effective at
  calibrating the depth and style of reasoning.
- **CoT + Anti-Hallucination Guards:** "Think through the evidence, and flag any
  step where you are making an assumption rather than reasoning from the provided
  data." This combination catches fabrication during the reasoning process itself.
- **CoT + XML Structuring:** Use `<reasoning>` and `<conclusion>` tags to separate
  the thinking from the final answer. Clean for downstream parsing.

### Claude-Specific Notes

- Claude 4.x models reason well with minimal prompting. "Think carefully about this"
  is often enough. You do not need to spell out every reasoning step for most tasks.
- Claude has extended thinking capability (when enabled). For tasks that genuinely
  benefit from deep reasoning, extended thinking handles the CoT internally — you
  get the benefits without cluttering the prompt or output with reasoning scaffolding.
- Over-specifying reasoning steps on Claude 4.x can actually degrade output quality.
  The model may follow your prescribed steps even when its own reasoning path would
  be better. Prefer intent ("think this through thoroughly") over prescription
  ("first do X, then do Y, then do Z").
- For Claude Code specifically, chain-of-thought is most useful for debugging,
  architecture decisions, and code review — tasks where the reasoning process itself
  is valuable to the user.

---

## 5. Few-Shot Examples

**Principle:** Show the model what you want through concrete input/output pairs.
Examples communicate format, tone, depth, and edge case handling more reliably than
descriptions alone.

### When to Apply

- [ ] The output format is specific and hard to describe in words
- [ ] The model keeps getting the format or style wrong despite descriptions
- [ ] There are non-obvious input-to-output mappings the model needs to learn
- [ ] Edge cases exist that need explicit demonstration
- [ ] Consistency across multiple invocations matters (batch processing, templates)

### How to Apply

1. **Start with one excellent example.** One high-quality, representative example is
   better than three mediocre ones. The example should demonstrate the most common
   case, not an edge case.

2. **Show the complete input/output pair.** Do not just show the output. The model
   needs to see what input produced that output to understand the mapping.

3. **Add edge case examples only when needed.** If the primary example covers the
   happy path, add a second example showing how to handle an unusual case. Do not
   add examples for every possible variation — that is few-shot overload.

4. **Place examples after the task description but before the actual input.** The model
   needs to understand what it is doing (task description) before seeing how (examples),
   and needs both before processing the actual input.

5. **Label examples clearly.** Use XML tags or clear markers:
   `<example>`, `<input>`, `<output>`, or "Example 1:", "Input:", "Output:". Ambiguity
   about where the example ends and the real input begins causes errors.

### Before/After Example

**Before:**
```
Extract the key decisions from this meeting transcript and format them nicely.

[meeting transcript here]
```

**After:**
```
Extract key decisions from the meeting transcript below. Format each decision
as shown in the example.

<example>
<transcript_excerpt>
Sarah: I think we should go with PostgreSQL for the new service.
Mike: Agreed. The team already has PostgreSQL expertise and the data model is relational.
Sarah: Okay, let's finalize that. Mike, can you set up the database by Friday?
Mike: Done. I'll also write the migration scripts.
</transcript_excerpt>

<extracted_decisions>
- **Decision:** Use PostgreSQL for the new service
  **Rationale:** Team expertise + relational data model
  **Owner:** Mike
  **Deadline:** Friday
  **Action items:** Set up database, write migration scripts
</extracted_decisions>
</example>

Now extract decisions from this transcript:

<transcript>
[actual meeting transcript here]
</transcript>
```

The example does three things the description alone cannot: it shows the exact output
structure, demonstrates how to identify implicit decisions (the database choice was
agreed upon, not formally announced), and shows that action items should be extracted
alongside decisions.

### Common Mistakes

1. **Too many examples.** Three or more examples consume a lot of context and can cause
   the model to over-fit to the examples' specific content rather than learning the
   pattern. Start with one. Add a second only if the model gets it wrong. Three is
   the practical maximum for most tasks.

2. **Unrepresentative examples.** If your example shows a short, simple input but your
   actual input is long and complex, the model may produce output calibrated to the
   example's complexity, not the real input's. Match example complexity to actual
   input complexity.

3. **Examples placed before the task description.** The model sees the example but does
   not yet know what task it is for, leading to confusion. Always describe the task
   first, then show examples, then provide the actual input.

### Combinations

- **Few-Shot + XML Structuring:** Wrap each example in `<example>` tags to create a
  clear boundary between examples and actual input. This is the recommended pattern
  for Claude.
- **Few-Shot + Chain-of-Thought:** Show an example that includes the reasoning process
  and the final output. This teaches both *how* to think and *what* to produce. Very
  effective for complex analytical tasks.
- **Few-Shot + Constraint Specification:** When examples alone do not fully specify the
  format, add explicit constraints for the dimensions the example does not cover
  (length, tone, edge case handling).

### Claude-Specific Notes

- Claude is particularly good at extracting patterns from a single example. You almost
  never need more than two examples for format demonstration.
- When using few-shot with Claude, wrap examples in XML tags. Claude respects the
  boundary between `<example>` content and real input more reliably when tags are used.
- On Claude 4.x, the model can often infer the desired format from a good task
  description alone. Try without examples first. Add them only when the output format
  is wrong or inconsistent.
- For Claude Code commands that process variable input, few-shot examples in the
  command template ensure consistent output across different invocations. This is
  especially useful for commands that produce structured reports.
- Claude will not blindly copy example content. It understands that examples
  demonstrate the pattern, not literal text to reproduce. You do not need to add
  "do not copy the example content literally" — Claude already knows.

---

## 6. Query-at-End Ordering

**Principle:** Place all context, data, and background information before the
instruction or question. The query — what you want the model to do — comes last.

### When to Apply

- [ ] The prompt starts with the instruction ("Please analyze...") then provides the
  data to analyze afterward
- [ ] Context or data appears after the main question
- [ ] The prompt contains a large data payload (code, documents, logs) with the
  instruction buried in the middle
- [ ] The model seems to partially process the task, as if it started answering before
  reading all the context

### How to Apply

1. **Identify the query.** Find the sentence(s) that tell the model what to do. This
   is the instruction, the question, or the call to action.

2. **Identify the context.** Everything else — background information, data to process,
   code to review, documents to analyze, constraints, examples.

3. **Reorder: context first, query last.** Move all context to the top. Move the query
   to the bottom. The last thing the model reads should be the task instruction.

4. **Use XML tags to make the boundary clear.** Tag the data sections so the model
   knows where context ends and instructions begin.

5. **For multi-part queries, place the primary instruction last.** If you have setup
   instructions ("use this format") and the actual task ("analyze this code"), the
   format instruction can go near the top (as a constraint), but the main task goes
   at the end.

### Before/After Example

**Before:**
```
Can you review this PR for potential security issues? Pay special attention to
input validation and SQL injection. The PR adds a new user search endpoint to
our Express API. Here's the diff:

--- a/routes/users.js
+++ b/routes/users.js
@@ -15,0 +16,12 @@
+router.get('/search', async (req, res) => {
+  const { name, email, role } = req.query;
+  let query = 'SELECT * FROM users WHERE 1=1';
+  if (name) query += ` AND name LIKE '%${name}%'`;
+  if (email) query += ` AND email = '${email}'`;
+  if (role) query += ` AND role = '${role}'`;
+  const results = await db.raw(query);
+  res.json(results);
+});

The codebase uses Knex.js as the query builder and all other endpoints use
parameterized queries. We run ESLint with security plugin but this passed.
```

**After:**
```
<codebase_context>
- Framework: Express API
- Query builder: Knex.js
- Convention: All existing endpoints use parameterized queries
- Linting: ESLint with security plugin (this code passed linting)
</codebase_context>

<pr_diff>
--- a/routes/users.js
+++ b/routes/users.js
@@ -15,0 +16,12 @@
+router.get('/search', async (req, res) => {
+  const { name, email, role } = req.query;
+  let query = 'SELECT * FROM users WHERE 1=1';
+  if (name) query += ` AND name LIKE '%${name}%'`;
+  if (email) query += ` AND email = '${email}'`;
+  if (role) query += ` AND role = '${role}'`;
+  const results = await db.raw(query);
+  res.json(results);
+});
</pr_diff>

Review this PR for security vulnerabilities. Focus on input validation and
SQL injection risks.
```

In the "before" version, the model encounters the instruction ("review for security
issues") before it has seen the code. It starts forming a response strategy with
incomplete information. In the "after" version, the model has the full picture — the
tech stack, the code, the conventions — before it reads the instruction. This produces
more targeted analysis because the instruction is colored by everything above it.

### Common Mistakes

1. **Splitting the query.** "Please analyze the following code for bugs. [code here]
   Also check for performance issues and suggest optimizations." The instruction is
   split around the data. Consolidate all instructions at the end.

2. **Burying important context after the query.** "Review this code. [code] Oh also,
   we are using Python 3.8 so no walrus operator." Post-query context may receive
   less attention. Move it to the top with the rest of the context.

### Combinations

- **Query-at-End + XML Structuring:** The most natural pairing. XML tags delineate
  the context sections, and the plain-text instruction sits below all the tagged
  content. The structural boundary between "here is what you are working with" and
  "here is what I want you to do" becomes visually obvious.
- **Query-at-End + Constraint Specification:** Place constraints as a tagged section
  before the query. The model reads constraints before the instruction, so it knows
  the parameters before it starts working.

### Claude-Specific Notes

- Anthropic's own documentation confirms that data-first, query-last ordering produces
  measurably better results with Claude. This is one of the highest-impact, lowest-
  effort optimizations you can make.
- Claude processes tokens sequentially. The recency effect means the instruction at the
  end gets strong attention. Context at the top gets full processing before the model
  encounters the task.
- This is especially impactful for long prompts (5000+ tokens). For short prompts
  (under 500 tokens), the ordering effect is smaller but still positive.
- In Claude Code commands, the standard pattern is: load context data at the top
  (via file reads injected into the prompt), then place the instruction at the bottom.
  Every well-designed command in this garden follows this pattern.

---

## 7. Positive Instructions

**Principle:** Tell the model what TO do, not what NOT to do. Positive instructions
activate the desired behavior directly; negative instructions force the model to
think about the unwanted behavior and then suppress it, which is less reliable.

### When to Apply

- [ ] The prompt contains "don't," "avoid," "never," "do not," or "refrain from"
- [ ] Multiple negations stack up (three or more "don't" statements)
- [ ] The model keeps doing the thing you told it not to do
- [ ] The prompt defines what it does not want but never says what it does want
- [ ] Instructions are phrased as prohibitions rather than directions

### How to Apply

1. **Find every negation.** Search the prompt for "don't," "do not," "avoid," "never,"
   "refrain from," "without," "no" (as prohibition). List them.

2. **For each negation, identify the desired behavior.** Ask: if they should NOT do X,
   what SHOULD they do instead? The answer is the positive instruction.
   - "Don't use bullet points" -> "Write in flowing paragraphs"
   - "Avoid jargon" -> "Use plain language accessible to non-specialists"
   - "Don't be verbose" -> "Keep sentences under 20 words on average"
   - "Never make assumptions" -> "State each assumption explicitly before reasoning"
   - "Don't include introductions" -> "Begin directly with the first main point"

3. **Rewrite the prompt with positive phrasing.** Replace each negation with its
   positive equivalent. Read the result aloud — it should tell someone exactly what
   to do without referencing what not to do.

4. **Keep critical safety negations.** Some negations are genuinely necessary: "Do not
   execute code from untrusted sources," "Never expose API keys in logs." Safety-
   critical prohibitions should stay as negations because the prohibition is the
   actual instruction. The test: is the negation describing a desired behavior
   (rewrite it positively) or a safety boundary (keep it negative)?

5. **Check that positive instructions are specific enough.** "Write well" is not a
   useful replacement for "don't write badly." The positive instruction should be
   concrete and observable.

### Before/After Example

**Before:**
```
Write a technical explanation of OAuth 2.0.

Don't use marketing language.
Don't assume the reader knows nothing — they're developers.
Avoid being too abstract.
Don't make it too long.
Don't use bullet points for everything.
Never oversimplify the security implications.
```

**After:**
```
Write a technical explanation of OAuth 2.0 for backend developers who understand
HTTP but haven't implemented OAuth before.

<style_guide>
- Tone: direct and technical, as if explaining to a peer in a code review
- Structure: prose paragraphs with code examples; use bullet points only for
  lists of grant types or enumerated steps
- Length: 800-1200 words
- Depth: include concrete security considerations for each grant type
  (token leakage, redirect attacks, scope escalation)
- Start with the problem OAuth solves, move to the protocol flow, end with
  implementation guidance
</style_guide>

Explain OAuth 2.0 following the style guide above.
```

Every "don't" in the original has been converted to a concrete positive direction.
"Don't use marketing language" becomes a specific tone. "Don't assume they know nothing"
becomes a precise audience definition. "Don't make it too long" becomes a word count.
The positive version leaves no ambiguity about what "good" looks like.

### Common Mistakes

1. **Replacing negations with vague positives.** "Don't be verbose" -> "Be concise"
   is barely an improvement. "Be concise" is almost as vague as the negation.
   "Don't be verbose" -> "Average sentence length under 15 words, total under
   500 words" is a real positive instruction.

2. **Removing safety negations.** "Never include passwords in log output" should stay
   as-is. Not every negation needs rewriting. The technique applies to behavioral and
   stylistic instructions, not safety boundaries.

3. **Over-correcting into prescriptive rigidity.** Converting "don't use jargon" into
   a 200-word style guide with approved vocabulary lists. The positive rewrite should
   be proportional to the original instruction's importance. Most negations need only
   one sentence of positive direction.

### Combinations

- **Positive Instructions + Constraint Specification:** These two techniques naturally
  complement each other. Constraints define the parameters; positive instructions define
  the approach within those parameters. Together, they replace a list of "don'ts" with
  a clear creative brief.
- **Positive Instructions + Role Assignment:** The role itself is a positive framing.
  "You are a senior engineer explaining to a junior" implicitly sets many positive
  behaviors without needing to prohibit anything.
- **Positive Instructions + Few-Shot Examples:** An example inherently demonstrates the
  positive behavior. If your example shows flowing prose, you do not need to say
  "don't use bullet points" — the example already shows what you want.

### Claude-Specific Notes

- Claude responds particularly well to positive framing. Anthropic's guidelines confirm
  that "write flowing prose" activates the desired behavior more reliably than "don't
  use bullet points."
- The reason: when Claude reads "don't use bullet points," it processes the concept of
  bullet points, activates that representation, and then tries to suppress it. This
  suppression is imperfect. "Write flowing prose" activates prose directly without
  ever activating the bullet point concept.
- On Claude 4.x, this effect is more pronounced because the model is better at following
  direct instructions. Positive instructions get followed more precisely, and negative
  instructions fail more visibly (the model "knows" what you do not want but sometimes
  does it anyway).
- Exception: Claude handles simple, clear negations well: "Do not include code examples
  in this response." Single, unambiguous negations are fine. The problem is stacking
  multiple negations, which creates a "don't do this, don't do that" cognitive load.

---

## 8. Anti-Hallucination Guards

**Principle:** Add explicit instructions for handling uncertainty, gaps in knowledge,
and the boundary between what is known and what is inferred. Guards make the model
honest about what it does not know.

### When to Apply

- [ ] The task involves factual claims that need to be accurate (research, citations,
  technical specifications)
- [ ] Fabrication would be harmful or embarrassing (medical, legal, financial domains)
- [ ] The model needs to work with code that must compile and run correctly
- [ ] The task requires distinguishing between established facts and the model's
  inferences or opinions
- [ ] The input data might be incomplete, and the model should flag gaps rather than
  fill them silently

### How to Apply

1. **Identify the fabrication risk.** Where in the output could the model invent
   something plausible but wrong? Common risk areas: specific numbers, dates, URLs,
   API details, library versions, legal statutes, medical dosages, attribution of
   quotes.

2. **Add explicit uncertainty instructions.** Tell the model what to do when it is not
   sure:
   - "If you are not certain about a specific version number, say 'verify the current
     version' rather than guessing."
   - "Distinguish between what the code demonstrably does and what you infer about
     its intended behavior."
   - "If the input data is insufficient to answer a question, state what additional
     information is needed."

3. **Create confidence-level markers.** For tasks where partial confidence is acceptable:
   - "Mark each recommendation as: CONFIRMED (you can verify this), LIKELY (strong
     evidence but not certain), or INVESTIGATE (needs human verification)."

4. **Add source attribution requirements.** "Only reference libraries, APIs, or
   functions that exist in the provided code context. Do not assume external
   dependencies without evidence."

5. **Include a verification step.** "After completing your analysis, review each
   factual claim and mark any that you cannot verify from the provided context."

### Before/After Example

**Before:**
```
Research the latest developments in quantum computing error correction and
write a summary. Include specific papers, researchers, and metrics.
```

**After:**
```
<task_context>
I need a summary of quantum computing error correction for a technical newsletter.
Accuracy is critical — our readers are physicists and will catch errors.
</task_context>

<accuracy_requirements>
- Only reference research developments, methods, and concepts you are confident about
- For specific claims (error rates, qubit counts, dates), add "[verify]" if you are
  not certain of the exact figure
- Do not fabricate paper titles, author names, or journal citations — if you cannot
  recall the exact reference, describe the work without a specific citation and note
  "[citation needed]"
- Clearly separate established results from ongoing/speculative research
- If a development is recent enough that your training data may not cover it, say so
</accuracy_requirements>

<output_format>
- 800-1000 words
- Organized by error correction approach (surface codes, color codes, etc.)
- Each claim tagged with confidence: [established], [recent], or [verify]
</output_format>

Write the summary following the accuracy requirements and output format above.
```

The guarded version gives the model explicit permission to be uncertain and provides
specific mechanisms for expressing that uncertainty. The unguarded version invites
fabrication by asking for "specific papers, researchers, and metrics" without any
escape hatch for when the model is not sure.

### Common Mistakes

1. **Guards so strict they paralyze the model.** "Only state things you are 100% certain
   about" on a complex topic produces an empty or uselessly hedged response. Allow
   graduated confidence levels instead: "confirmed / likely / needs verification."
   Give the model room to be useful while being honest.

2. **Asking for citations without an uncertainty escape.** "Include citations for all
   claims" with no fallback for when the model cannot recall specific citations. The
   model will either fabricate citations or hedge every statement. Better: "Cite where
   you can; use [citation needed] where you cannot, and describe the work in enough
   detail that I can find it myself."

3. **Applying anti-hallucination guards to creative tasks.** "Write a short story but
   do not include any details you cannot verify" defeats the purpose of creative
   writing. Guards are for factual tasks. For creative tasks, the model should
   invent freely.

### Combinations

- **Anti-Hallucination + Chain-of-Thought:** "Think through the evidence for each claim
  before stating it." CoT makes the reasoning visible, which naturally surfaces weak
  claims the model might otherwise state confidently. The reasoning process itself
  becomes a guard.
- **Anti-Hallucination + Constraint Specification:** Constraints on scope reduce the
  surface area for fabrication. "Only discuss the three algorithms mentioned in the
  provided paper" is a constraint that also functions as a hallucination guard.
- **Anti-Hallucination + XML Structuring:** Use tags to separate facts from inferences:
  `<verified_findings>` and `<inferred_analysis>`. This structural separation makes
  it easy for the reader to assess which claims need checking.
- **Anti-Hallucination + Few-Shot Examples:** Show an example where the model correctly
  says "I'm not certain about this" or uses a confidence marker. This normalizes
  uncertainty in the output.

### Claude-Specific Notes

- Claude is naturally more cautious about fabrication than many models, but it still
  benefits from explicit guards. Without them, Claude may present uncertain information
  with confident-sounding phrasing even though it "knows" it is uncertain.
- The most effective guard for Claude is giving it explicit permission and format for
  expressing uncertainty. Claude responds well to: "It is better to say 'I'm not sure'
  than to guess. Use [verify] tags for any claim you are not confident about."
- On Claude 4.x, the model is better at self-calibrating confidence. Lighter guards
  often work: "Flag anything you're not confident about" is sufficient for many tasks.
  Earlier models needed more explicit instruction about what uncertainty looks like.
- For code-related tasks in Claude Code, the most useful guard is: "Only reference
  functions, classes, and APIs that exist in the provided code context. If you need
  to reference something outside the provided context, state that assumption
  explicitly." This prevents the model from inventing API calls or library functions.
- Claude handles graduated confidence well. Three-level systems (confirmed / likely /
  investigate) produce cleaner output than binary (certain / uncertain) or five-level
  scales (which the model may not calibrate consistently).
