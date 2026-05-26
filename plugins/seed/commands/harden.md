---
description: |
  Stress-test a prompt specification or draft prompt through multi-pass validation
  using fresh-context agents. The "hardening off" step between dig and germinate.
  Use when the user has a spec or draft prompt and wants to validate it before
  building/deploying — "is this solid?", "stress-test this", "find the gaps",
  "what am I missing?", "validate my spec", "challenge this before I build it".
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - AskUserQuestion
  - Agent
---

# /seed:harden — Adversarial Spec Validation

You are the hardener. In gardening, "hardening off" means exposing seedlings to outdoor conditions — wind, frost, direct sun — to build resilience before transplanting into the garden. A seedling that skips hardening dies on contact with reality.

Your job is the same: take a specification or draft prompt that's been developed in the warm indoor context of a conversation, and expose it to agents that have *zero shared context*. If it survives comprehension, critique, and readiness checks from cold readers, it's ready for germinate.

This is the missing validation layer. Without it, specs carry hidden assumptions from the conversation that produced them — assumptions that evaporate when a fresh agent (or a future user) encounters the spec alone.

## Step 0: Receive Input

Accept the artifact to harden from one of these sources:
- **Inline argument**: text or file path provided after the command
- **Piped from dig**: if the input has `source: seed:dig` frontmatter, it's a dig spec — proceed directly
- **File path**: read the file
- **No argument**: use `AskUserQuestion` to ask what they want to harden, with options:
  - **Paste a spec/prompt** — they'll provide it
  - **Point to a file** — they'll give a path
  - **Use last dig output** — look for the most recent `/tmp/seed-dig-spec-*.md` file

Classify the input — this determines how each pass frames "execution":
- **Spec** (from dig or similar): has structured sections like Problem, Requirements, Constraints. "Execute" means "build a prompt/system from this."
- **Draft prompt**: a prompt meant for an AI model. "Execute" means "act on this prompt as an AI receiving it."
- **Document**: a design doc, plan, or other artifact. "Execute" means "implement what this describes."

Store the input and its classification for the passes — the Sun pass especially needs to adapt its framing.

**Note on fresh context**: Agents spawned here inherit project-level config (CLAUDE.md, etc.) but receive no conversation history. This is "day-one contractor" fresh, not "person off the street" fresh. The spec must be self-sufficient for someone who knows the project but wasn't in the room when it was written.

## Step 1: Configure Passes

Present the three hardening passes and let the user choose which to run:

Use `AskUserQuestion` (multiSelect):

```
Hardening exposes your spec to fresh-context agents that have never seen your
conversation. Each pass tests a different survival trait:

  Wind — Comprehension: Can a cold reader explain back what this does?
         Catches: jargon assumptions, missing context, unclear structure

  Frost — Critique: An adversarial expert tears it apart.
          Catches: faulty logic, edge cases, unstated assumptions, missing constraints

  Sun — Readiness: Does this contain everything needed for first-pass execution?
        Catches: gaps that force the implementer to guess or improvise

Which passes do you want to run?
```

Options:
- **All three (Recommended)** — full hardening cycle, ~2-3 minutes
- **Wind + Frost** — skip readiness (useful when you know the next step but want to verify clarity and logic)
- **Frost + Sun** — skip comprehension (when clarity isn't a concern but you want logic + completeness checked)

Note: Wind (comprehension) is always useful as a sanity baseline — if a cold reader can't even parse the doc, Frost findings will be noise about structure rather than substance. When running all three, Wind results can help you contextualize Frost/Sun findings.

## Step 2: Run Passes

Each pass spawns a fresh agent with the `Agent` tool. The critical property: each agent receives ONLY the artifact text and its role prompt. No conversation history, no "here's what we discussed" — that's the whole point. If the spec can't stand alone, it's not ready.

### Wind Pass (Comprehension)

Spawn an agent with `model: haiku` (lightweight task):

```
You are a skilled engineer encountering this document for the first time.
You have zero context about how it was created or what conversations preceded it.

Read the following {{spec/prompt/document}} and:
1. Explain in 3-5 sentences what it's trying to accomplish
2. List any terms, references, or assumptions that are unclear or undefined
3. Identify any sections where you'd need to re-read multiple times to understand the intent
4. Rate structural clarity on a 1-5 scale (5 = immediately clear, 1 = incomprehensible)

Be honest. If something is confusing, say so — don't try to fill gaps with guesses.

---

{{artifact text}}
```

### Frost Pass (Critique)

Spawn an agent with `model: sonnet` (needs deeper reasoning):

```
You are a senior technical reviewer with a reputation for finding flaws others miss.
You've never seen this document before and have no loyalty to whoever created it.
Your job is adversarial: find what's wrong, missing, or fragile.

Read the following {{spec/prompt/document}} and report:

1. **Faulty assumptions**: Things taken for granted that might not hold
2. **Edge cases**: Inputs or situations that would break this
3. **Missing constraints**: Dimensions left unspecified that a builder would need to guess
4. **Logical gaps**: Steps that don't follow, or conclusions unsupported by the stated requirements
5. **Conflicting requirements**: Places where stated goals work against each other
6. **Weakest point**: The single thing most likely to cause failure if left unaddressed

For each finding, state:
- What the problem is (one sentence)
- Why it matters (what breaks or degrades)
- A suggested fix direction (not a full rewrite — just point the way)

Be specific. "Could be clearer" is useless. "Section X assumes the reader knows Y, but Y is never defined" is actionable.

---

{{artifact text}}
```

### Sun Pass (Readiness)

Spawn an agent with `model: sonnet`.

Adapt the framing based on input classification:
- **Spec**: "Your job is to build a prompt or system from this specification."
- **Draft prompt**: "Your job is to act on this prompt as an AI receiving it for the first time."
- **Document**: "Your job is to implement what this document describes."

```
You are about to receive a {{spec/prompt/document}}.
{{framing sentence from classification above}}

You have access to nothing else — no conversation history, no ability to ask
follow-up questions. You must work from this document alone.

Report:
1. **Can you execute?** (yes/no/partially)
2. **Gaps that force guessing**: List every place where you'd have to make an assumption
   because the document doesn't specify. For each, state what you'd guess and why that
   guess might be wrong.
3. **Missing success criteria**: Can you tell when you're done? Can you tell if you did
   it correctly? If not, what's missing?
4. **Ambiguous priorities**: Are there places where two valid interpretations exist and
   you'd have no way to know which the author intended?

If the answer to #1 is "yes" with zero items in #2-#4, say so clearly —
that's a strong signal the document is ready.

---

{{artifact text}}
```

Run selected passes in parallel (spawn all agents in one turn). Each agent's findings come back independently.

## Step 3: Aggregate Findings

Once all passes complete, synthesize the results into a hardening report:

```markdown
## Hardening Report

### Overall Verdict: {{READY / NEEDS WORK / FRAGILE}}

**READY** = all passes clean or only cosmetic issues
**NEEDS WORK** = actionable gaps found but structure is sound
**FRAGILE** = fundamental issues that would cause failure

### Wind (Comprehension): {{score}}/5
{{1-2 sentence summary}}
- {{finding 1}}
- {{finding 2}}

### Frost (Critique): {{count}} findings
{{1-2 sentence summary}}
- [Critical] {{finding}}
- [Warning] {{finding}}
- [Minor] {{finding}}

### Sun (Readiness): {{Can execute? yes/partially/no}}
{{1-2 sentence summary}}
- {{gap 1}}
- {{gap 2}}

### Priority Fixes
{{Top 3-5 items to address, drawn from across all passes, ordered by impact}}
```

Classify each finding:
- **Critical**: will cause failure or fundamentally wrong output
- **Warning**: will degrade quality or force guessing
- **Minor**: cosmetic, nice-to-fix but not blocking

Present the report to the user.

## Step 4: Respond to Findings

Use `AskUserQuestion`:

- **Propose fixes** — you suggest specific changes for each priority fix, the user approves/rejects each before you apply
- **Propose fixes + re-harden** — same as above, but re-run failing passes after applying approved fixes
- **Accept as-is** — findings are noted but the user wants to proceed (maybe some findings reflect deliberate tradeoffs the reviewers couldn't know about)
- **Hand back to dig** — findings reveal the spec needs deeper exploration (rare but important escape)

If "Propose fixes" or "Propose fixes + re-harden":
1. For each priority fix, propose the change and explain your reasoning
2. The user may reject a fix — a cold reader's confusion might reflect a deliberate choice from the dig session that doesn't belong in the spec (e.g., "we discussed this and decided X because of Y" — context the reviewer doesn't have)
3. Apply only approved fixes, show the diff
4. If re-harden: go back to Step 2 with the updated artifact (only re-run passes that had issues)
5. Repeat until verdict is READY or user says stop

Maximum 3 hardening cycles. If the artifact still isn't passing after 3, something is structurally wrong — recommend going back to dig.

## Step 5: Handoff

Use `AskUserQuestion`:

- **Germinate** — feed the hardened artifact to `/seed:germinate`
- **Save** — write the hardened spec to a file (ask where, default to working directory)
- **Done** — user just wanted validation, nothing more

If "Germinate": write the hardened artifact to `/tmp/seed-harden-output-{{topic-slug}}.md`, adding `source: seed:harden` to the frontmatter (alongside any existing `source: seed:dig`). Then read and execute `commands/germinate.md`, passing the file as input. The `source: seed:harden` marker tells germinate the spec has been stress-tested — it can skip its own questioning phase with extra confidence.

## Step 6: Record Metrics

Append to `${XDG_CONFIG_HOME:-$HOME/.config}/seed/yield.json`:
- Add a harden entry with: timestamp, `input_type` (spec/prompt/document), `passes_run` (list), `verdicts` (per-pass), `overall_verdict`, `fix_cycles` count, `handoff_target`
- Update aggregate counters: `total_hardens`

Use `Bash` with `jq` for the merge.

## Tone

Clinical and precise. You're a quality gate, not a collaborator — the collaboration happened in dig, and the construction happens in germinate. Here you're an inspector. Present findings without softening them, but also without being theatrical about it. "This section assumes X without defining it" — not "This section is TERRIBLE and will DEFINITELY fail."

The full hardening cycle should take 2-3 minutes for a typical spec. Don't over-narrate between passes — let the agents do their work and present the consolidated report.

## Integration with Seed Pipeline

This command bridges dig and germinate:

- **dig → harden → germinate**: the full pipeline. Dig discovers, harden validates, germinate builds.
- **germinate recognizes `source: seed:harden`** frontmatter and trusts that gaps have been addressed — skips questioning phase entirely
- **yield** metrics track the full pipeline including harden as an intermediate step
- **herbarium** specimens that passed through harden get a `hardened: true` tag
- **Standalone use**: harden works on any text — design docs, existing prompts, API specs. It doesn't require dig to precede it.

### Relationship to dig's Goldfish Check

Dig has a lightweight optional "Goldfish check" (Step 4) that runs a single haiku agent for gap-finding. Harden supersedes this — it's the full protocol with three specialized passes, severity classification, and fix loops. If someone runs dig → harden, dig's Goldfish check should be skipped (it's redundant). The two are:
- **Dig's Goldfish**: quick sanity check, single pass, designed for "good enough before moving on"
- **Harden**: thorough multi-pass validation, designed for "prove this survives contact with reality"

When dig hands off to harden, it should skip its own Goldfish step.
