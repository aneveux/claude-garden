# Presenterm Themes Reference

Theme selection, customization, and palette configuration.

## Table of Contents

1. [Built-in Themes](#built-in-themes)
2. [Selecting a Theme](#selecting-a-theme)
3. [Custom Theme Structure](#custom-theme-structure)
4. [Footer Configuration](#footer-configuration)
5. [Palette and Colors](#palette-and-colors)
6. [Code Highlighting Themes](#code-highlighting-themes)

---

## Built-in Themes

| Theme | Style | Good for |
|-------|-------|----------|
| `dark` | Default dark | General purpose |
| `light` | Default light | Bright rooms, projectors |
| `terminal-dark` | Uses terminal colors (dark) | Matching user's terminal |
| `terminal-light` | Uses terminal colors (light) | Matching user's terminal |
| `catppuccin-latte` | Warm light | Educational, friendly |
| `catppuccin-frappe` | Muted dark | Comfortable reading |
| `catppuccin-macchiato` | Medium dark | Balanced contrast |
| `catppuccin-mocha` | Rich dark | Code-heavy, technical |
| `gruvbox-dark` | Retro warm dark | Developer talks |
| `tokyonight-day` | Clean light | Workshops, tutorials |
| `tokyonight-night` | Deep blue dark | Conference stages |
| `tokyonight-moon` | Softer blue dark | Extended viewing |
| `tokyonight-storm` | Moderate blue dark | Professional, corporate |

Preview all themes: `presenterm --list-themes`

---

## Selecting a Theme

### In front matter

```yaml
# By name
theme:
  name: catppuccin-mocha

# Light/dark auto-detection
theme:
  light: catppuccin-latte
  dark: catppuccin-mocha

# Custom file
theme:
  path: ./my-theme.yaml

# Inline override (extends current theme)
theme:
  override:
    footer:
      style: template
      left: "{author}"
      right: "{current_slide} / {total_slides}"
```

### In config file

`~/.config/presenterm/config.yaml`:
```yaml
defaults:
  theme: dark
```

### CLI

```bash
presenterm slides.md --theme catppuccin-mocha
```

---

## Custom Theme Structure

Save as `~/.config/presenterm/themes/my-theme.yaml` — auto-loaded by name.

```yaml
extends: dark                      # Inherit from another theme

default:
  margin:
    percent: 8                     # or fixed: 5 (columns)
  colors:
    foreground: "e6e6e6"
    background: "040312"

intro_slide:
  title:
    alignment: center              # left, center, right
    colors:
      foreground: "ffffff"
  subtitle:
    alignment: center
    colors:
      foreground: "cccccc"
  author:
    alignment: center
    positioning: below_title       # or page_bottom
    colors:
      foreground: "aaaaaa"

slide_title:
  prefix: "██ "
  font_size: 2
  padding_top: 1
  padding_bottom: 1
  separator: true
  bold: true
  underlined: false
  italics: false
  colors:
    foreground: "beeeff"

headings:
  h1:
    prefix: "██ "
    colors:
      foreground: "beeeff"
    bold: true
  h2:
    prefix: "▓▓▓ "
    colors:
      foreground: "feeedd"
  # h3 through h6: same structure

code:
  theme_name: base16-eighties.dark
  padding:
    horizontal: 2
    vertical: 1
  background: true
  line_numbers: false

block_quote:
  prefix: "▍ "

bold:
  colors:
    foreground: "ff9e64"

italics:
  colors:
    foreground: "9ece6a"

alert:
  base_colors:
    foreground: "ffffff"
  prefix: "▍ "
  styles:
    note:
      color: blue
      title: Note
      icon: I
    tip:
      color: green
      title: Tip
      icon: T
    important:
      color: cyan
      title: Important
      icon: I
    warning:
      color: orange
      title: Warning
      icon: W
    caution:
      color: red
      title: Caution
      icon: C

mermaid:
  background: transparent
  theme: dark

typst:
  ppi: 300
  colors:
    foreground: "ffffff"
    background: "000000"
```

All color values are hex strings without `#` prefix.

---

## Footer Configuration

Three footer styles:

### Template Footer

```yaml
footer:
  style: template
  left: "{author}"
  center: "**{title}**"
  right: "{current_slide} / {total_slides}"
  height: 3
```

Available variables: `{current_slide}`, `{total_slides}`, `{title}`,
`{sub_title}`, `{author}`, `{event}`, `{location}`, `{date}`.

Escape literal braces: `{{not a variable}}`.

Footer text supports markdown: `**bold**`, `_italic_`.

### Image Footer

```yaml
footer:
  style: template
  left:
    image: logo.png
  right: "{current_slide} / {total_slides}"
```

### Progress Bar Footer

```yaml
footer:
  style: progress_bar
  character: "█"            # or any character/emoji
```

### No Footer

```yaml
footer:
  style: empty
```

Per-slide: `<!-- no_footer -->`

---

## Palette and Colors

Define reusable colors and classes in your theme:

```yaml
palette:
  colors:
    brand: "ff6b35"
    success: "2ecc71"
    danger: "e74c3c"
  classes:
    highlight:
      foreground: "ffffff"
      background: "ff6b35"
    dim:
      foreground: "888888"
```

Use in slides:

```markdown
<span style="color: palette:brand">Brand colored text</span>
<span style="color: p:success">Short form</span>
<span class="highlight">Highlighted with background</span>
<span class="dim">Dimmed text</span>
```

---

## Code Highlighting Themes

Set in theme under `code.theme_name`:

| Theme | Style |
|-------|-------|
| `base16-ocean.dark` | Ocean blue dark |
| `base16-eighties.dark` | Retro 80s dark |
| `base16-mocha.dark` | Mocha warm dark |
| `base16-ocean.light` | Ocean blue light |
| `Catppuccin` | Pastel dark |
| `Coldark` | Cold blue |
| `DarkNeon` | Neon accents |
| `InspiredGitHub` | GitHub light style |
| `Nord-sublime` | Nord palette |
| `Solarized` | Solarized (auto) |
| `Solarized (dark)` | Solarized dark |
| `Solarized (light)` | Solarized light |
| `TwoDark` | Atom One Dark |
| `dracula-sublime` | Dracula |
| `gruvbox` | Gruvbox |
| `onehalf` | One Half |
| `sublime-monokai-extended` | Monokai |
| `sublime-snazzy` | Snazzy |
| `visual-studio-dark-plus` | VS Code dark |
| `zenburn` | Zenburn |

Custom `.tmTheme` files go in `~/.config/presenterm/themes/highlighting/`.

---

## Config File Reference

`~/.config/presenterm/config.yaml`:

```yaml
defaults:
  theme: dark
  terminal_font_size: 16
  image_protocol: auto           # auto|kitty-local|kitty-remote|iterm2|sixel
  max_columns: 100
  max_columns_alignment: center  # left|center|right
  max_rows: 50
  max_rows_alignment: center     # top|center|bottom
  validate_overflows: never      # never|always|when_presenting|when_developing
  incremental_lists:
    pause_before: true
    pause_after: true
```

JSON schema for IDE autocompletion:
```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/mfontanini/presenterm/master/config-file-schema.json
```
