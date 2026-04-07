---
description: "Edit an existing presenterm presentation — add, remove, edit, or restructure slides without a full review."
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion
---

# /bloom:enhance — Enhance a Presentation

Make targeted changes to an existing presenterm slide deck.

## Step 0: Parse Arguments

Arguments: a path to a `.md` file and/or a description of the change.

Examples:
- `/bloom:enhance talk.md add a slide about error handling after slide 5`
- `/bloom:enhance talk.md` (will ask what to change)
- `/bloom:enhance add speaker notes to all slides` (will search for the file)

If no file is provided, search the current directory for presenterm `.md` files
(contain YAML front matter with `title` or `theme`, and `---` slide separators).

If no change is described, ask what the user wants to do.

## Step 1: Read and Map

Read the entire presentation. Build a map of:

- **Slide index**: number each slide (1-based), noting its title or first line of content
- **Sections**: group slides by section dividers or topic shifts
- **Style inventory**: theme, separator style (`---` vs `<!-- end_slide -->`), title style
  (setext vs ATX), features in use (pauses, columns, incremental lists, speaker notes)
- **Current slide count** and estimated duration

Present a brief summary to orient the user:
```
📄 talk.md — 28 slides, ~25 minutes
Theme: tokyonight-storm | Separators: --- | Titles: setext
Sections: Intro (1-3), Problem (4-8), Solution (9-18), Demo (19-23), Closing (24-28)
Speaker notes: 22/28 slides
```

## Step 2: Plan the Change

Based on the user's request, determine which operation(s) to perform:

### Add Slides
- Identify insertion point (after which slide number or section)
- Draft new slides matching the deck's tone, theme, and visual patterns
- Check the slide budget — if adding pushes past a reasonable count for the
  talk length, flag it and suggest what to compress or cut

### Edit Slides
- Locate the target slide(s) by number, title, or content description
- Apply the requested change (layout swap, content rewrite, add features)
- Preserve the slide's role in the overall narrative flow

### Remove Slides
- Identify slides to remove
- Check that the slides before and after the gap still connect narratively
- If removing creates a jarring transition, draft a bridge or adjust the
  surrounding slides

### Restructure
- Map out the current order and the proposed new order
- Move sections, adjusting section dividers and transitions
- Verify the narrative still builds toward the key takeaway

### Batch Operations
- "Add speaker notes everywhere" — generate notes for all slides missing them,
  matching the style of existing notes
- "Add pauses to all code slides" — find code blocks without pauses and add reveals
- "Convert all bullets to incremental lists" — wrap list sections with incremental markers

For any operation, explain what you plan to do before doing it:
```
I'll add 2 slides about secret management after slide 15 (Kustomize Overlays),
using the same column layout style. This brings the total to 30 slides, still
within budget for a 25-minute talk.
```

## Step 3: Apply

Use `Edit` for surgical changes to preserve the rest of the file. Only use `Write`
if the restructuring is so extensive that a full rewrite is cleaner.

Rules:
- Match the existing separator style, title style, and formatting conventions
- If the deck uses speaker notes, add them to any new slides
- If the deck uses pauses/reveals, add them where they'd help pacing
- Pass new content text through `/humanizer` (or a custom voice skill if available)
  to match the deck's voice
- After applying, count total slides and report the new total

## Step 4: Verify

After changes are applied:

1. Count total slides — report the new count vs the old count
2. If slides were added or removed, list the updated slide map
3. Check for broken references (if a slide referenced "as we saw earlier"
   and that slide was removed, fix the reference)
4. Suggest previewing:
   ```bash
   presenterm <filename>.md
   ```

## Multi-Turn Enhancement

The user may want to make several changes in sequence. After each change,
stay ready for the next one. Keep your mental map of the deck updated —
don't re-read the whole file unless the changes were extensive.
