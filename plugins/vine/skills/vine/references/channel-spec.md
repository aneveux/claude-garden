# Channel Specification

Complete reference for tv channel TOML files. Channels live in `~/.config/television/cable/`
and are immediately available as `tv <channel-name>`.

## Table of Contents

1. [metadata] — Name, description, requirements
2. [source] — Data source command and formatting
3. [preview] — Preview panel configuration
4. [ui] — Layout and panel customization
5. [keybindings] — Key mappings and shortcuts
6. [actions] — Custom commands triggered by keys

---

## 1. `[metadata]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Channel identifier, used as `tv <name>` |
| `description` | string | No | Shown in remote control panel (Ctrl+T) |
| `requirements` | string[] | No | External commands that must be available; tv warns if missing |

```toml
[metadata]
name = "k8s-pods"
description = "Browse and manage Kubernetes pods"
requirements = ["kubectl"]
```

## 2. `[source]`

The source section defines where entries come from.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `command` | string or string[] | Yes | — | Shell command(s) generating entries. Array enables cycling with Ctrl+S |
| `ansi` | boolean | No | false | Parse ANSI escape codes in source output |
| `display` | string | No | — | Template for how entries appear in the results list |
| `output` | string | No | — | Template for what gets returned on selection (if different from display) |
| `no_sort` | boolean | No | false | Preserve original command output order |
| `frecency` | boolean | No | true | Rank results by frequency + recency of selection |
| `watch` | float | No | — | Auto-reload source every N seconds |
| `entry_delimiter` | string | No | newline | Custom delimiter between entries (e.g., `"\0"` for null-separated) |

```toml
[source]
command = ["docker ps --format '{{.ID}}\\t{{.Names}}\\t{{.Status}}'",
           "docker ps -a --format '{{.ID}}\\t{{.Names}}\\t{{.Status}}'"]
display = "{split:\\t:1} | {split:\\t:2}"
output = "{split:\\t:0}"
ansi = true
```

### Source Command Tips

- Use tab (`\t`) as field delimiter for structured data — it's cleaner than spaces
- Array commands cycle with Ctrl+S (e.g., running containers / all containers)
- Commands run in a shell, so pipes and redirections work
- For large datasets, limit output (e.g., `fd --max-results 10000`)
- Use `entry_delimiter = "\0"` for entries that may contain newlines

### Display vs Output

When source data is structured (like tab-separated fields), use `display` to format
what the user sees and `output` to control what gets returned:

```toml
# Source emits: "abc123\tnginx\tUp 2 hours"
# User sees:    "nginx | Up 2 hours"
# Script gets:  "abc123"
display = "{split:\\t:1} | {split:\\t:2}"
output = "{split:\\t:0}"
```

Without these, the entire raw line is both displayed and returned.

## 3. `[preview]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `command` | string or string[] | No | Preview command template. `{}` is the current entry. Array enables cycling with Ctrl+F |
| `env` | table | No | Environment variables for the preview command |
| `offset` | string | No | Line offset template for preview scrolling (e.g., jump to a specific line) |
| `header` | string | No | Template for preview panel header |
| `footer` | string | No | Template for preview panel footer |

```toml
[preview]
command = ["bat -n --color=always '{}'", "cat '{}'"]
env = { BAT_THEME = "ansi" }
offset = "{split:,:1}"
header = "File: {0}"
footer = "Line: {split:,:1}"
```

### Preview Tips

- Preview commands receive the **full entry** (or the transformed entry if `output` is set)
  via `{}` placeholder
- Use `offset` when source entries include line numbers (e.g., grep output)
- Array commands cycle with Ctrl+F — useful for different detail levels
- Preview is cached by default; disable per-invocation with `--no-cache-preview` CLI flag

## 4. `[ui]`

Top-level UI settings for the channel.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `ui_scale` | integer (0-100) | 100 | Percentage of terminal used |
| `layout` | string | "landscape" | `landscape` (side-by-side) or `portrait` (stacked) |
| `input_bar_position` | string | "top" | `top` or `bottom` |
| `input_header` | string | channel name | Template for input bar header |
| `input_prompt` | string | ">" | Prompt string before input |

### Panel Subsections

Each panel has its own `[ui.<panel>]` section:

**`[ui.preview_panel]`:**

| Field | Type | Default |
|-------|------|---------|
| `size` | integer (0-100) | 50 |
| `header` | string | null |
| `footer` | string | null |
| `scrollbar` | boolean | true |
| `border_type` | string | "rounded" |
| `padding` | object | `{left:0, right:0, top:0, bottom:0}` |
| `hidden` | boolean | false |

**`[ui.results_panel]`:**

| Field | Type | Default |
|-------|------|---------|
| `border_type` | string | "rounded" |
| `padding` | object | all 0 |

**`[ui.input_bar]`:**

| Field | Type | Default |
|-------|------|---------|
| `border_type` | string | "rounded" |
| `padding` | object | all 0 |

**`[ui.status_bar]`:**

| Field | Type | Default |
|-------|------|---------|
| `separator_open` | string | "" |
| `separator_close` | string | "" |
| `hidden` | boolean | false |

**`[ui.help_panel]`:**

| Field | Type | Default |
|-------|------|---------|
| `show_categories` | boolean | true |
| `hidden` | boolean | true |
| `disabled` | boolean | false |

**`[ui.remote_control]`:**

| Field | Type | Default |
|-------|------|---------|
| `show_channel_descriptions` | boolean | true |
| `sort_alphabetically` | boolean | true |
| `disabled` | boolean | false |

**Border types:** `none`, `plain`, `rounded`, `thick`

```toml
[ui]
layout = "landscape"
ui_scale = 90

[ui.preview_panel]
size = 60
border_type = "rounded"
padding = { left = 1, right = 1 }
header = "Preview: {0}"

[ui.results_panel]
border_type = "plain"
```

## 5. `[keybindings]`

Map keys to built-in actions or custom actions.

| Field | Type | Description |
|-------|------|-------------|
| `shortcut` | string | Global shortcut key for this channel in remote control |
| Any key combo | string or string[] | Map to action name or `"actions:<name>"` |

**Key syntax:** single chars (`a`, `1`), special (`enter`, `esc`, `tab`, `space`, `backspace`,
`delete`, `home`, `end`, `pageup`, `pagedown`, `up`, `down`, `left`, `right`),
ctrl (`ctrl-a` through `ctrl-z`), function (`f1`-`f12`)

```toml
[keybindings]
shortcut = "f3"
ctrl-e = "actions:edit"
ctrl-d = "actions:delete"
ctrl-r = ["reload_source", "go_to_input_start"]
```

### All Built-in Actions

**Navigation:** `select_next_entry`, `select_prev_entry`, `select_next_page`, `select_prev_page`
**Selection:** `confirm_selection`, `toggle_selection_down`, `toggle_selection_up`, `copy_entry_to_clipboard`
**Input:** `delete_prev_char`, `delete_next_char`, `delete_prev_word`, `delete_line`,
`go_to_prev_char`, `go_to_next_char`, `go_to_input_start`, `go_to_input_end`
**Preview:** `scroll_preview_up`, `scroll_preview_down`, `scroll_preview_half_page_up`,
`scroll_preview_half_page_down`, `cycle_previews`
**UI:** `toggle_preview`, `toggle_remote_control`, `toggle_help`, `toggle_status_bar`,
`toggle_layout`, `toggle_action_picker`
**Channel:** `cycle_sources`, `reload_source`
**History:** `select_prev_history`, `select_next_history`
**App:** `quit`

## 6. `[actions.<name>]`

Custom commands triggered by keybindings.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `description` | string | No | — | Shown in action picker (Ctrl+X) |
| `command` | string | Yes | — | Shell command template. `{}` is the selected entry |
| `mode` | string | No | "fork" | `fork` (returns to tv) or `execute` (replaces tv) |
| `separator` | string | No | " " | Join character for multi-selected entries |

```toml
[actions.edit]
description = "Open in editor"
command = "${EDITOR:-vim} '{}'"
mode = "execute"

[actions.delete]
description = "Delete file"
command = "rm -i '{}'"
mode = "fork"

[actions.yank-path]
description = "Copy path to clipboard"
command = "echo -n '{}' | xclip -selection clipboard"
mode = "fork"
```

### Mode Decision

- **fork** (default): the action runs, then tv resumes. Use for operations that don't need
  terminal control (delete, copy, API calls, restart services).
- **execute**: tv exits and the action takes over the terminal. Use for interactive programs
  (editors, shells, TUI apps, `docker exec -it`).

### Multi-select

When the user selects multiple entries (Tab), they're joined with `separator` and passed
to the command. Default separator is a space, but you can change it:

```toml
[actions.bulk-delete]
command = "rm -i {}"
separator = " "
mode = "fork"
```
