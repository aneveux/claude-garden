---
name: bloom
version: 1.1.0
description: |
  Build, enhance, and review terminal presentations using presenterm — from brainstorming
  to polished slides, and surgical editing of existing decks.
  Use this skill whenever the user mentions presentations, slides, talks, keynotes, lightning
  talks, presenterm, slide decks, or wants to present something from the terminal/CLI.
  Also use when editing, enhancing, adding to, restructuring, or reviewing existing presenterm
  markdown files — including adding/removing/editing individual slides or sections.
  Triggers on: presentation, slides, talk, keynote, presenterm, slide deck, lightning talk,
  conference talk, workshop slides, speaker notes, slide themes, "add a slide", "edit slide",
  "remove section", "insert slides", "restructure my deck". Even if the user doesn't mention
  presenterm explicitly, use this skill when they want to create, modify, or review any kind
  of presentation — presenterm is the tool of choice for terminal-native slide decks.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Bloom — Terminal Presentations with presenterm

Presenterm renders markdown files as beautiful terminal presentations. Bloom helps you go
from a vague idea to a polished slide deck — or take an existing one and make it better.

## Three Modes

### Create Mode — from idea to slides

Use when the user wants to build a new presentation. The workflow has four phases:

1. **Discover** — understand the talk (topic, audience, occasion, length, tone)
2. **Structure** — propose an outline with sections and flow
3. **Build** — write slides section by section, validating with the user
4. **Polish** — theme, speaker notes, visual variety, final review

### Enhance Mode — surgical editing of existing slides

Use when the user has an existing deck and wants targeted changes — not a full review.
This is the right mode when someone says "add a slide about X", "edit the opening",
"remove the demo section", or "restructure the middle part".

The workflow:

1. **Read** — load the existing presentation, build a mental map of sections and slide numbers
2. **Locate** — identify exactly where the change goes (by slide number, section title, or content)
3. **Edit** — apply the change using `Edit` for surgical modifications, preserving surrounding
   slides, theme, tone, and presenterm features already in use
4. **Verify** — confirm the edit didn't break slide count, section flow, or syntax

**Common enhance operations:**

- **Add slides** — insert new slides at a specific position, matching the existing tone and
  visual style. Respect the slide budget — if the deck is already at capacity, suggest what
  to cut or compress to make room.
- **Edit slides** — rewrite content, change layout (text → columns, bullets → table),
  add pauses/reveals, swap code examples. Keep the slide's role in the narrative intact.
- **Remove slides** — delete slides or entire sections. Check that transitions still make
  sense after removal — the slide before and after the gap need to connect.
- **Restructure** — reorder sections, split one section into two, merge thin sections.
  After restructuring, verify section dividers and transitions are coherent.
- **Add section** — draft a complete new section (title slide + content slides) that fits
  the existing deck's tone, theme, and depth level. Place it where it makes narrative sense.
- **Add speaker notes** — generate notes for slides that lack them, matching the style of
  existing notes in the deck.
- **Change theme/style** — swap themes, add/modify footers, adjust visual features across
  the entire deck.

When enhancing, always use the presenterm features and patterns already present in the deck.
If the deck uses `---` separators, don't switch to `<!-- end_slide -->`. If it uses setext
titles, don't switch to ATX. Match the existing style.

### Review Mode — improve existing slides

Use when the user has an existing `.md` file they want to improve. The workflow:

1. **Analyze** — read the file, assess structure, syntax, and content
2. **Diagnose** — identify issues (pacing, visual monotony, weak opening/closing, syntax errors)
3. **Propose** — suggest concrete improvements, grouped by priority
4. **Apply** — make changes with user approval, one group at a time

---

## Discovery Questions

When creating from scratch, gather these before proposing structure. Ask naturally — not
as a checklist dump. Some answers may already be in the conversation.

- **Topic**: what is the talk about?
- **Audience**: who are they? What do they already know?
- **Occasion**: conference, meetup, workshop, internal, class?
- **Length**: lightning (5min, ~8-12 slides), standard (25min, ~25-30 slides), long (45min, ~35-45 slides)
- **Tone**: which preset fits? (see below)
- **Key takeaway**: if the audience remembers one thing, what is it?
- **Constraints**: must-include topics, corporate branding, required demos?

Don't ask all at once. Lead with topic and audience, then follow up based on what's missing.

---

## Tone Presets

Each preset shapes word choice, slide density, use of humor, and visual style.
The user can pick one or blend them (e.g., "professional but with some humor").

### Professional

Clean and structured. Short sentences. Data-driven. No filler, no fluff.
Think corporate keynote or executive briefing.

- Slides are concise — one idea per slide
- Use tables and bullet points for clarity
- Speaker notes carry the narrative; slides are visual anchors
- Neutral color themes (dark, terminal-dark, tokyonight-storm)

### Conference / Technical

Deep technical content. Code blocks, live demos, architecture diagrams.
Assumes domain knowledge. Think RustConf or KubeCon.

- Heavy use of code blocks with syntax highlighting
- Mermaid diagrams for architecture
- Incremental reveals for complex explanations
- Speaker notes with demo scripts and fallback plans
- Themes that make code pop (catppuccin-mocha, gruvbox-dark, tokyonight-night)

### Educational / Workshop

Progressive disclosure. Step-by-step builds. "Let's build together" energy.
Think tutorial or hands-on workshop.

- Incremental lists to pace the learning
- Before/after code comparisons
- Frequent pauses for exercises or questions
- Clear section headers marking progression
- Lighter themes work well (catppuccin-latte, tokyonight-day)

### Casual / Meetup

Conversational and personal. Stories over stats. "Let me tell you about..."
Think local meetup or team knowledge-sharing.

- Shorter slides, more white space
- Personal anecdotes and real-world examples
- Relaxed language — contractions, colloquialisms
- Mix of text and visuals to keep energy up

### Fun / Creative

Playful and surprising. Humor, unexpected transitions, creative formatting.
Think lightning talk that gets the room laughing.

- Bold use of columns, alignment tricks, colored text
- ASCII art or creative text layouts
- Punchlines on separate slides (pause → reveal)
- Memes described as text art (presenterm supports local images but not URLs — for memes, text art is more portable)
- Short, punchy slides — speed over depth

---

## Content Voice

All slide content — titles, bullets, speaker notes, section transitions — goes through
the `/humanizer` skill before being finalized. This prevents the robotic, overly-structured
tone that AI-generated slides tend to have.

The humanizer should respect the chosen tone preset. Professional tone stays crisp and clean;
fun tone gets loose and playful. The humanizer polishes the voice without fighting the tone.

If `/humanizer` is not available, write in a natural, direct voice. Avoid:
- Starting every bullet with a gerund ("Leveraging...", "Implementing...")
- Hollow transitions ("Let's dive into...", "Moving on to...")
- Filler adjectives ("robust", "seamless", "cutting-edge")

---

## Slide Structure Best Practices

### Opening (first 2-3 slides after title)

Hook the audience immediately. Options by tone:
- **Professional**: striking statistic or bold claim
- **Technical**: the problem statement, why it matters
- **Educational**: what they'll be able to do by the end
- **Casual**: a personal story that connects to the topic
- **Fun**: something unexpected — a joke, a provocative question

### Slide Budget

Before proposing structure, calculate a slide budget based on talk length.
A common mistake is building too many slides — audiences absorb less than you think,
and rushing through slides is worse than having fewer well-paced ones.

| Length | Minutes | Content slides | Section dividers | Total |
|--------|---------|---------------|-----------------|-------|
| Lightning | 5 | 6-10 | 0-2 | 8-12 |
| Standard | 25 | 20-25 | 3-5 | 25-30 |
| Long | 45 | 30-38 | 4-6 | 35-45 |

Track your count as you build each section. After writing each section, count the total
slides so far and compare against the budget. When you reach 80% of budget, wrap up —
leave room for the closing. If a section is eating too many slides, move detail into
speaker notes rather than adding slides. The budget is a hard ceiling, not a suggestion —
a 25-minute talk with 50 slides means 30 seconds per slide, which is too fast for
technical content. If you find yourself exceeding the budget, stop and trim before
continuing. Fewer well-paced slides always beat more rushed ones.

### Middle (the substance)

Organize into 3-5 clear sections. Each section:
- Opens with a section title slide
- Contains 3-5 content slides (not more — split into subsections if needed)
- Ends with a transition or summary beat

Vary slide formats to prevent monotony:
- Text slides → code block → diagram → comparison table → demo

### Closing (last 2-3 slides)

- Recap the key takeaway (one slide, one sentence)
- Call to action or next steps
- Resources / links (if applicable)
- Thank you + contact info (optional — many speakers skip this now)

### Slide Density

Each slide should pass the "glance test" — if someone looks at it for 3 seconds,
they should get the point. Rules of thumb:

- Max 5-6 bullet points per slide
- Max 1 code block per slide, max ~15 lines of code (trim boilerplate, use
  `+line_numbers` with selective highlighting `{3,8,14}` to guide the eye)
- If a YAML/JSON block exceeds 15 lines, trim it to the essential fields and
  add a speaker note with the full version or a "see repo for complete example"
- If a slide feels dense, split it
- Use speaker notes for everything the audience doesn't need to read

### Self-Check

After building all sections, do a quick sanity pass:
1. Count total slides — are you within the budget?
2. Scan for 3+ consecutive same-format slides — break them up
3. Verify every complex slide has a speaker note
4. Check that the opening hooks and the closing resonates

---

## Presenterm Essentials

This section covers the syntax for 80% of slides. For advanced features
(code execution, diagrams, custom themes, exports), read the reference files.

### File Structure

```markdown
---
title: "My Talk Title"
sub_title: "Optional Subtitle"
author: Speaker Name
event: Conference Name
date: 2026-04-07
theme:
  name: catppuccin-mocha
options:
  end_slide_shorthand: true
  incremental_lists: false
---

First slide content here

---

Second slide content
```

The frontmatter `title`, `sub_title`, and `author` auto-generate an intro slide.

### Slide Separators

Always set `end_slide_shorthand: true` in options and use `---` as the separator.
This is cleaner and more readable than `<!-- end_slide -->`. Be careful with YAML
multi-document separators (`---`) inside code blocks — they won't be confused with
slide separators as long as they're inside fenced code blocks.

### Slide Titles

Setext-style headers get special slide title styling:

```markdown
My Slide Title
==============

Content below the title
```

### Text Formatting

```markdown
**bold**  _italics_  **_both_**  ~strikethrough~  `inline code`
[link text](https://example.com)
```

### Colored Text

```markdown
<span style="color: red">Red text</span>
<span style="color: #ff8800">Hex color</span>
```

### Pauses and Incremental Reveals

```markdown
First point visible immediately

<!-- pause -->

This appears on next key press

<!-- pause -->

And this after another press
```

For incremental lists (bullets appear one at a time):

```markdown
<!-- incremental_lists: true -->

- First point
- Second point (appears on next press)
- Third point

<!-- incremental_lists: false -->
```

### Column Layouts

```markdown
<!-- column_layout: [1, 1] -->

<!-- column: 0 -->
Left column content

<!-- column: 1 -->
Right column content

<!-- reset_layout -->
```

Ratios are proportional: `[2, 1]` makes left column twice as wide.

### Vertical Positioning

```markdown
<!-- jump_to_middle -->

This text is vertically centered on the slide
```

### Alignment

```markdown
<!-- alignment: center -->

Centered text

<!-- alignment: left -->
```

### Code Blocks

````markdown
```python
def hello():
    print("Hello, world!")
```
````

Add `+line_numbers` for line numbers. See `references/advanced.md` for executable code.

### Images

```markdown
![](path/to/image.png)
![image:width:50%](logo.png)
```

Paths are relative to the presentation file.

### Tables

```markdown
| Feature | Status |
|---------|--------|
| Speed   | Fast   |
| Beauty  | High   |
```

### Alerts (GitHub-style)

```markdown
> [!tip]
> This renders as a styled callout box
```

Available types: `note`, `tip`, `important`, `warning`, `caution`.

### Speaker Notes

```markdown
<!-- speaker_note: Remember to show the demo here -->
```

Multi-line:
```markdown
<!--
speaker_note: |
  Key points to mention:
  - The migration took 3 weeks
  - Performance improved 40%
-->
```

Run with two terminals:
```bash
presenterm slides.md --publish-speaker-notes   # audience display
presenterm slides.md --listen-speaker-notes     # your notes display
```

### Spacing

```markdown
<!-- new_line -->
<!-- new_lines: 3 -->
```

---

## Reference Files

Load these when you need deeper knowledge:

- **`references/syntax.md`** — Complete presenterm syntax reference. Read when you need
  column layouts with complex ratios, file inclusion, font sizing, comment commands,
  or any directive not covered above.

- **`references/themes.md`** — Built-in theme list, custom theme YAML structure, footer
  templates, palette classes, code highlighting themes. Read when the user wants custom
  branding, specific colors, or footer customization.

- **`references/advanced.md`** — Code execution (+exec, +pty), mermaid/typst/d2 diagram
  rendering, LaTeX math, PDF/HTML export, slide transitions, speaker notes setup.
  Read when the user needs live demos, diagrams, or export.

---

## Review Mode Details

When reviewing an existing presentation, assess these dimensions:

### Structure
- Is there a clear opening hook?
- Are sections well-defined with logical flow?
- Does it build toward the key takeaway?
- Is the closing strong?

### Pacing
- Are slides too dense or too sparse?
- Is there enough variety in slide formats?
- Are transitions smooth between sections?
- For the stated length, is slide count reasonable?

### Visual Variety
- Are there too many consecutive text-only slides?
- Could some content be restructured as tables, columns, or diagrams?
- Are pauses and incremental reveals used effectively?
- Is the theme appropriate for the tone?

### Presenterm Syntax
- Is the frontmatter well-formed?
- Are comment commands syntactically correct?
- Are there features that could enhance the deck (alerts, columns, code highlighting)?

### Content Quality
- Is the language natural and engaging (not AI-sounding)?
- Are bullets concise and parallel in structure?
- Are speaker notes present for complex slides?
- Are code examples realistic and runnable?

Present findings grouped by priority:
1. **Quick wins** — small changes, big impact (fix a weak opening, add pauses)
2. **Structural** — reordering, splitting, or merging sections
3. **Enhancement** — adding visuals, diagrams, speaker notes, better theming
4. **Nitpicks** — wording tweaks, formatting consistency

---

## Running Presentations

```bash
presenterm slides.md                     # Dev mode (hot-reload)
presenterm slides.md --present           # Presentation mode
presenterm slides.md --export-pdf        # Export to PDF
presenterm slides.md --export-html       # Export to self-contained HTML
```

Always suggest `presenterm slides.md` first so the user can preview in hot-reload mode.
