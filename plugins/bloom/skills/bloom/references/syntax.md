# Presenterm Syntax Reference

Complete reference for all presenterm markdown syntax and comment commands.

## Table of Contents

1. [Front Matter](#front-matter)
2. [Slide Structure](#slide-structure)
3. [Comment Commands](#comment-commands)
4. [Text Formatting](#text-formatting)
5. [Column Layouts](#column-layouts)
6. [Code Blocks](#code-blocks)
7. [Images](#images)
8. [Tables](#tables)
9. [Alerts](#alerts)
10. [File Inclusion](#file-inclusion)

---

## Front Matter

YAML block at the top of the file. All fields optional.

```yaml
---
title: "My _first_ **presentation**"
sub_title: (in presenterm!)
author: John Doe
event: RustConf 2025
location: Paris
date: 2025-06-15

# Multiple authors
authors:
  - Alice
  - Bob

# Theme selection (pick one style)
theme:
  name: catppuccin-mocha
# or light/dark auto-detection:
theme:
  light: catppuccin-latte
  dark: catppuccin-mocha
# or custom file:
theme:
  path: /home/me/my-theme.yaml
# or inline override:
theme:
  override:
    default:
      colors:
        foreground: "e6e6e6"

# Presentation options
options:
  end_slide_shorthand: true         # Use --- as slide separator
  implicit_slide_ends: true         # Slide titles auto-end previous
  h1_slide_titles: true             # First # H1 becomes slide title
  incremental_lists: true           # All lists are incremental
  command_prefix: "cmd:"            # Prefix for comment commands
  image_attributes_prefix: ""       # Custom image attr prefix
  list_item_newlines: 2             # Lines between list items
  auto_render_languages:            # Auto-render without +render
    - mermaid
    - typst
  strict_front_matter_parsing: false
---
```

When `title`, `sub_title`, or `author` are set, presenterm auto-generates an intro slide.

---

## Slide Structure

### Separators

With `end_slide_shorthand: true`:
```markdown
Slide 1 content

---

Slide 2 content
```

Without (default):
```markdown
Slide 1 content

<!-- end_slide -->

Slide 2 content
```

### Slide Titles

Setext headers get special slide-title styling (centered, padded, theme-colored):

```markdown
My Title
========

My Subtitle Style
-----------------
```

ATX headers (`# H1`, `## H2`) are regular headings within a slide — they don't get
slide-title styling unless `h1_slide_titles: true` is set.

### Implicit Slide Ends

With `implicit_slide_ends: true`, a setext header automatically ends the previous slide:

```markdown
First Slide
===========
Content

Second Slide
============
Content here — no end_slide needed
```

---

## Comment Commands

All directives use HTML comment syntax: `<!-- command -->`.

### Content Flow

| Command | Effect |
|---------|--------|
| `<!-- pause -->` | Progressive reveal — next content appears on key press |
| `<!-- end_slide -->` | End current slide |
| `<!-- skip_slide -->` | Exclude slide from presentation entirely |

### Incremental Lists

```markdown
<!-- incremental_lists: true -->
- Appears first
- Then this
- Then this
<!-- incremental_lists: false -->
```

### Spacing and Position

| Command | Effect |
|---------|--------|
| `<!-- jump_to_middle -->` | Vertically center remaining content |
| `<!-- new_line -->` | Insert one blank line |
| `<!-- new_lines: N -->` | Insert N blank lines |
| `<!-- alignment: center -->` | Set text alignment (left, center, right) |
| `<!-- font_size: N -->` | Set font size 1-7 (kitty terminal ≥0.40.0 only) |
| `<!-- list_item_newlines: N -->` | Override spacing between list items |

### Metadata

| Command | Effect |
|---------|--------|
| `<!-- no_footer -->` | Hide footer on this slide |
| `<!-- speaker_note: text -->` | Add speaker note |
| `<!-- include: other-file.md -->` | Include external markdown file |

### User Comments (ignored by presenterm)

```markdown
<!-- // personal note, not rendered -->
<!-- comment: also ignored -->
```

### Command Prefix

With `command_prefix: "cmd:"` in options:
```markdown
<!-- cmd:pause -->            # Recognized as command
<!-- just a comment -->       # Treated as regular comment
```

---

## Text Formatting

```markdown
**bold**
_italics_
**_bold and italic_**
~strikethrough~
`inline code`
[link text](https://example.com)
```

### Colored Text

Only `<span>` tags are supported (no other HTML):

```markdown
<span style="color: red">Named color</span>
<span style="color: #ff8800">Hex color</span>
<span style="color: palette:mycolor">From theme palette</span>
<span style="color: p:mycolor">Short form</span>
<span style="background-color: blue">With background</span>
<span class="myclass">Using palette class</span>
```

---

## Column Layouts

Define columns with proportional widths, then fill them:

```markdown
<!-- column_layout: [3, 2] -->

<!-- column: 0 -->
### Left (wider)
This column gets 3/5 of the width.

<!-- column: 1 -->
### Right (narrower)
This gets 2/5.

<!-- reset_layout -->

Full-width content again.
```

You can use any number of columns: `[1, 1, 1]` for three equal columns.

Columns can contain any content: text, code blocks, lists, images.

---

## Code Blocks

### Basic

````markdown
```python
def hello():
    print("world")
```
````

### Attributes (appended after language)

| Attribute | Effect |
|-----------|--------|
| `+line_numbers` | Show line numbers |
| `+no_background` | Remove code background |
| `+exec` | Make executable (Ctrl+E to run) |
| `+exec_replace` | Execute and replace code with output |
| `+auto_exec` | Auto-execute on slide load |
| `+image` | Render output as image |
| `+validate` | Validate snippet compiles (not shown as executable) |
| `+validate +expect:failure` | Expect validation to fail |
| `+render` | Pre-render to image (mermaid, typst, d2, latex) |
| `+render +width:50%` | Set rendered image width |
| `+pty` | Run in pseudo-terminal |
| `+pty:80:30` | PTY with custom cols:rows |
| `+id:name` | Named snippet for output placement |

### Selective Line Highlighting

````markdown
```rust {1,3,5-7}
// Only specified lines are highlighted; rest is dimmed
```
````

### Dynamic Highlighting (animated frames)

````markdown
```rust {1,3|5-7|all}
// Frame 1: lines 1,3 — Frame 2: lines 5-7 — Frame 3: all
```
````

### External File Inclusion

````markdown
```file +exec +line_numbers
path: snippet.rs
language: rust
start_line: 5
end_line: 10
```
````

### Hidden Lines (executed but not displayed)

- **Rust**: prefix with `# ` (hash space)
- **Python, Bash, Go, Java, JS, TS, etc.**: prefix with `/// ` (triple-slash space)

### Snippet Output Placement

```markdown
<!-- snippet_output: my_id -->
```

Displays the output of a `+id:my_id` snippet at this location.

---

## Images

```markdown
![](image.png)
![image:width:50%](image.png)
![image:w:30%](photo.jpg)
```

- Paths relative to presentation file
- No remote URLs (by design)
- Animated GIFs supported
- tmux requires `allow-passthrough` enabled
- Unsupported terminals show ASCII placeholder blocks

---

## Tables

Standard markdown tables:

```markdown
| Name   | Value |
|--------|-------|
| Speed  | Fast  |
| Beauty | High  |
```

---

## Alerts

GitHub-style callout boxes:

```markdown
> [!note]
> Informational callout

> [!tip]
> Helpful suggestion

> [!important]
> Key information

> [!warning]
> Proceed with caution

> [!caution]
> Danger — risk of data loss
```

---

## File Inclusion

Include external markdown files inline:

```markdown
<!-- include: chapters/intro.md -->
```

Paths are relative to the main presentation file. The included content is rendered
as if it were part of the current file — slides, commands, and all.
