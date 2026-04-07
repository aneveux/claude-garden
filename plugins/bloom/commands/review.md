---
description: "Review and improve an existing presenterm presentation. Analyze structure, content, and syntax, then suggest and apply improvements."
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion
---

# /bloom:review — Review a Presentation

Analyze an existing presenterm slide deck and help improve it.

## Step 0: Parse Arguments

Argument: path to a `.md` presentation file (e.g., `/bloom:review talk.md`).
If not provided, ask the user or search the current directory for `.md` files
that look like presenterm presentations (contain `<!-- end_slide -->` or `---`
separators with YAML front matter).

## Step 1: Analyze

Read the entire presentation file. Build a mental model of:

- **Metadata**: title, author, theme, options
- **Slide count**: total slides, slides per section
- **Structure**: sections, flow, opening/closing quality
- **Format mix**: text vs code vs diagrams vs tables vs visual slides
- **Presenterm features used**: pauses, columns, incremental lists, speaker notes
- **Estimated duration**: ~1-2 minutes per content slide, less for transition slides

## Step 2: Diagnose

Assess across five dimensions. Be honest but constructive — this is collaborative,
not a grade.

### Structure
- Is there a hook in the first 2-3 slides?
- Do sections flow logically?
- Is there a clear takeaway and strong closing?
- Is the depth appropriate for the estimated length?

### Pacing
- Are any slides too dense (fails the 3-second glance test)?
- Too many slides in a row without a visual break?
- Enough pauses and reveals for complex content?
- Slide count appropriate for the target duration?

### Visual Variety
- More than 3 consecutive same-format slides?
- Could content benefit from columns, tables, or diagrams?
- Is the theme well-chosen for the content and tone?
- Are images or colored text used where they'd help?

### Content Quality
- Does the language feel natural (not AI-generated)?
- Are bullets concise and parallel?
- Are code examples realistic and complete?
- Do speaker notes exist where the presenter needs guidance?

### Syntax Correctness
- Is YAML front matter valid?
- Are comment commands properly formatted?
- Are code block attributes correct?
- Are image paths valid and files present?

## Step 3: Propose

Present findings as a structured summary, grouped by priority:

1. **Quick wins** — small changes, high impact
   (e.g., "the opening slide is just a title — add a hook question or statistic")
2. **Structural changes** — reordering, splitting, merging sections
   (e.g., "slides 12-18 are all text — break them up with a diagram or comparison")
3. **Enhancements** — adding presenterm features
   (e.g., "the code walkthrough would benefit from incremental reveals with pauses")
4. **Nitpicks** — wording, formatting, consistency
   (e.g., "inconsistent bullet style — some start with verbs, others with nouns")

For each finding, explain **what** to change and **why** it helps. Don't just list
problems — propose concrete solutions.

Ask the user which improvements they want to apply. They may want all, some, or
have different ideas.

## Step 4: Apply

Apply the approved changes using `Edit` for surgical modifications or `Write` for
larger restructuring. Work through the groups the user approved:

1. Apply changes one group at a time
2. Show a brief summary of what changed after each group
3. If a change requires new content (e.g., adding a diagram), draft it and
   pass through `/humanizer` for natural voice
4. After all changes, suggest previewing:
   ```bash
   presenterm <filename>.md
   ```

## Additional Capabilities

If the user asks for specific improvements beyond the review:

- **"Add a section about X"** — draft new slides matching the existing tone and style
- **"Make it shorter"** — identify slides to cut or merge, propose consolidation
- **"Make it longer"** — identify where to expand, add depth or examples
- **"Change the tone"** — rewrite content to match a different tone preset
- **"Add speaker notes"** — generate notes for all slides that lack them
- **"Fix the theme"** — suggest and apply a better theme with optional customization
