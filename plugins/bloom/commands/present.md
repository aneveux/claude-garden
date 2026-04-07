---
description: "Create a terminal presentation from scratch using presenterm. Brainstorm, structure, and build slides together with the user."
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion
---

# /bloom:present — Create a Presentation

Build a presenterm slide deck from idea to polished output.

## Step 0: Parse Arguments

Optional argument: a topic hint (e.g., `/bloom:present Rust error handling`).
If provided, skip asking about the topic in discovery.

## Step 1: Discover

Gather context through natural conversation. Don't dump all questions at once —
lead with topic and audience, then follow up.

**Must know before structuring:**
- Topic (what the talk is about)
- Audience (who, what they know)
- Length (lightning ~5min / standard ~25min / long ~45min)
- Tone preset (professional / conference / educational / casual / fun — or a blend)

**Nice to know:**
- Occasion (conference, meetup, workshop, internal)
- Key takeaway (the one thing the audience should remember)
- Must-include topics or demos
- Whether they need speaker notes
- Preferred theme or branding

Use `AskUserQuestion` for the essential questions. Infer what you can from context.

## Step 2: Structure

First, calculate the slide budget from the talk length (see SKILL.md's Slide Budget table).
Then propose an outline. Format it as a numbered list with per-section slide counts that
**add up to the budget**. Show the total.

Example for a 5-minute lightning talk (budget: 8-12 slides):
```
Slide budget: 10 slides

1. Hook — "The bug that cost us 3 days" (1 slide, story format)
2. The Problem — What are Rust error types? (2 slides, text + code)
3. Solution Patterns — Result, ?, anyhow, thiserror (3 slides, code-heavy)
4. Real-World Example — Refactoring a match ladder (2 slides, before/after)
5. Takeaways + Resources (2 slides, comparison table + links)
Total: 10 slides ✓
```

Present this to the user and get approval before building. They may want to
reorder, add sections, remove sections, or change emphasis. If the outline
exceeds the budget, cut scope — don't try to cram everything in.

## Step 3: Build

Write slides section by section. For each section:

1. Draft the slides following the approved structure
2. Apply the chosen tone preset throughout
3. Use the `/humanizer` skill (or a custom voice skill if available) for all content text
4. Add appropriate presenterm features:
   - Pauses for reveals
   - Column layouts for comparisons
   - Code blocks with syntax highlighting
   - Incremental lists for pacing
   - Speaker notes for presenter guidance
5. Present the section to the user for feedback before moving on

Build in a single markdown file. Start with the front matter (title, author, theme,
options) then add sections incrementally.

**Theme selection**: suggest a theme that matches the tone. Offer to customize if
the user wants specific branding.

**Visual variety**: ensure no more than 3 consecutive same-format slides. Alternate
between text, code, diagrams, tables, and visual layouts.

## Step 4: Polish

After all sections are built:

1. **Count slides** — verify the total is within the budget. If over, identify
   slides to merge or move to speaker notes. A 25-minute talk with 50 slides
   means 30 seconds per slide — that's too fast for technical content.
2. **Read through the complete file** — check flow, transitions, and pacing
3. **Add missing speaker notes** — especially for complex or demo slides
4. **Verify syntax** — all comment commands are properly formatted
5. **Suggest a preview command**:
   ```bash
   presenterm <filename>.md
   ```
6. **Offer enhancements**:
   - Mermaid diagrams for architecture (if relevant)
   - Code execution for live demos (if relevant)
   - PDF/HTML export if needed
   - Custom theme tweaks

## Output

The final deliverable is a single `.md` file ready to run with `presenterm`.

Suggest a filename based on the topic (e.g., `rust-error-handling.md`,
`team-retro-q1.md`). Save in the current working directory unless the user
specifies otherwise.
