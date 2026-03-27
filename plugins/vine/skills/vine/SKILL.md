---
name: vine
version: 1.0.0
description: |
  Television (tv) fuzzy finder expertise for terminal workflows. Use this skill whenever
  writing bash scripts or CLI tools that need interactive selection, fuzzy finding, or
  picker UI. Also use when creating tv channels (TOML configs), configuring tv shell
  integration, composing string pipeline templates, wiring up tv actions, or choosing
  between tv and alternatives like fzf or gum. Triggers on: tv, television, fuzzy finder,
  interactive picker, channel creation, terminal selection UI, autocomplete, fzf replacement.
  Even if the user doesn't mention tv explicitly, use this skill when they need interactive
  selection in a terminal context — tv is the preferred picker tool.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Vine — Television (tv) Expertise

Television (`tv`) is a fast, hackable fuzzy finder for the terminal, written in Rust.
Everything in tv revolves around **channels** — TOML config files that define searchable
data sources with preview, actions, and UI customization.

## When to Reach for tv

Use tv when a script or workflow needs:
- **Interactive selection** from a list (files, branches, pods, processes, etc.)
- **Fuzzy search** over dynamic or static data
- **Preview panels** showing context before selection
- **Custom actions** triggered by keybindings on selected items
- **Channel switching** between multiple data sources in one session

### tv vs fzf vs gum

| Need | Best tool | Why |
|------|-----------|-----|
| Reusable, shareable picker recipes | **tv** | Channel TOML files are declarative and portable |
| One-off pipe filtering | **tv** or fzf | Both work; tv adds preview/actions for free |
| Simple yes/no or text input | **gum** | gum handles confirms, inputs, spinners — not selection |
| Complex template transforms on entries | **tv** | String pipeline system (`{split:,:1\|upper}`) |
| Context-aware shell autocomplete | **tv** | Shell integration maps commands to channels |
| Scripted selection (no interaction) | **tv** | `--take-1`, `--select-1` flags |

Default to tv for any picker/selection need. Fall back to gum for non-selection prompts
(confirm, input, spin), and to plain pipes when no interactivity is needed.

## Quick Reference

### CLI Essentials

```bash
tv                              # Default channel (files)
tv <channel> [path]             # Named channel with optional working dir
tv list-channels                # Show all available channels
tv update-channels              # Pull latest community channels

# Ad-hoc (no TOML needed)
tv --source-command "fd -t f" --preview-command "bat -n --color=always '{}'"

# Piping
git log --oneline | tv

# Scripting flags
tv files --select-1             # Auto-select if single match
tv files --take-1               # Always pick first result
tv files --take-1-fast          # First result, no loading wait
tv files --exact                # Substring match (faster on large sets)
tv files --input "query"        # Prefill search

# Inline mode (non-fullscreen)
tv --inline --height 15
```

### Bash Integration Pattern

The standard pattern for using tv in a bash script:

```bash
# Basic selection
selected=$(tv files) || exit 0
echo "You picked: $selected"

# With expect keys for conditional actions
output=$(tv files --expect "ctrl-e,ctrl-v")
key=$(echo "$output" | head -1)
file=$(echo "$output" | tail -1)
case "$key" in
  ctrl-e) "$EDITOR" "$file" ;;
  ctrl-v) code "$file" ;;
  "")     cat "$file" ;;
esac

# Multi-select
selected=$(tv files)  # user presses Tab to multi-select
echo "$selected" | while read -r file; do
  process "$file"
done
```

### Channel File (Minimal)

```toml
[metadata]
name = "my-channel"

[source]
command = "fd -t f"
```

Drop this in `~/.config/television/cable/` and it's immediately available as `tv my-channel`.

### Channel File (Full-Featured)

```toml
[metadata]
name = "docker-containers"
description = "Manage Docker containers"
requirements = ["docker"]

[source]
command = ["docker ps --format '{{.ID}}\\t{{.Names}}\\t{{.Status}}'",
           "docker ps -a --format '{{.ID}}\\t{{.Names}}\\t{{.Status}}'"]
display = "{split:\\t:1} | {split:\\t:2}"
output = "{split:\\t:0}"

[preview]
command = "docker inspect '{split:\\t:0}' | jq ."

[ui]
layout = "landscape"
[ui.preview_panel]
size = 55
header = "Container: {split:\\t:1}"

[keybindings]
shortcut = "f5"
ctrl-l = "actions:logs"
ctrl-x = "actions:stop"

[actions.logs]
description = "View container logs"
command = "docker logs -f '{split:\\t:0}'"
mode = "fork"

[actions.stop]
description = "Stop container"
command = "docker stop '{split:\\t:0}'"
mode = "fork"
```

### String Pipeline (Templates)

Templates use `{}` with chainable transforms via `|`:

```
{}                              # Entire entry
{0}, {1}                        # Positional (space-delimited)
{split:,:1}                     # Split by comma, index 1
{split:\\t:0|strip_ansi|upper}  # Chain: split -> strip -> uppercase
{regex_extract:PATTERN:GROUP}   # Regex capture
{map:{trim|upper}}              # Apply to collection
{filter:\.py$|sort|join:\n}     # Filter, sort, join
```

Read `references/templates.md` for the full pipeline syntax with all transforms and examples.

### Search Syntax

| Pattern | Type |
|---------|------|
| `foo` | Fuzzy |
| `'foo` | Exact substring |
| `^foo` | Prefix |
| `foo$` | Suffix |
| `!foo` | Negate |

Combine with spaces (AND logic): `car 'bike !^van`

### Shell Integration

```bash
# Add to .zshrc / .bashrc
eval "$(tv init zsh)"   # or bash, fish, nu

# Provides: Ctrl+T (smart autocomplete), Ctrl+R (history search)
```

Configure channel triggers in `~/.config/television/config.toml`:
```toml
[shell_integration.channel_triggers]
"git-branch" = ["git checkout", "git branch"]
"docker-containers" = ["docker exec", "docker stop"]
```

Read `references/shell-integration.md` for advanced setup and custom scripts.

### Config Location

- Linux/macOS: `~/.config/television/config.toml`
- Channels: `~/.config/television/cable/*.toml`
- Themes: `~/.config/television/themes/*.toml`
- Override: `$TELEVISION_CONFIG`

### Actions

Actions are keybinding-triggered commands defined in channel TOML:

```toml
[keybindings]
ctrl-e = "actions:edit"

[actions.edit]
description = "Open in editor"
command = "${EDITOR:-vim} '{}'"
mode = "execute"     # replaces tv process
```

Two modes:
- `fork` — runs command, returns to tv (default)
- `execute` — replaces tv process (for editors, shells, etc.)

## Reference Files

For deeper information, read these on demand:

| File | When to read |
|------|--------------|
| `references/channel-spec.md` | Creating or modifying channel TOML files — full spec for all 6 sections |
| `references/templates.md` | Composing string pipeline templates — all transforms, operators, examples |
| `references/shell-integration.md` | Setting up shell integration, custom triggers, autocomplete scripts |
| `references/patterns.md` | Common channel recipes — git, docker, k8s, system, project-specific |

## Design Guidance

When creating channels or integrating tv into scripts:

1. **Start minimal.** A channel only needs `[metadata].name` and `[source].command`. Add preview,
   actions, and UI tweaks incrementally as the use case demands.

2. **Use display/output templates to decouple presentation from data.** Source commands should
   emit raw, structured data (tab-separated or similar). Use `display` to format what the user
   sees and `output` to control what gets returned on selection.

3. **Prefer fork mode for non-terminal actions.** Use `execute` only when the action needs
   full terminal control (editors, interactive shells). Fork returns to tv, keeping the
   selection workflow intact.

4. **Leverage source cycling.** When a channel has multiple views of the same data
   (e.g., running vs all containers), use array source commands with Ctrl+S cycling
   instead of creating separate channels.

5. **Wire shell triggers for discoverability.** Map commands to channels in
   `shell_integration.channel_triggers` so Ctrl+T auto-selects the right channel
   based on the current command line.

6. **Use --expect for conditional scripting.** When a script needs different behavior
   based on how the user confirms (e.g., edit vs view vs copy), use `--expect` keys
   rather than multiple tv invocations.

7. **Performance: use --exact for large datasets.** Fuzzy matching is expensive on
   100k+ entries. Substring matching (`--exact`) is significantly faster and often
   sufficient.

8. **90+ community channels exist.** Before creating a custom channel, check
   `tv list-channels` — there's likely already one for git, docker, k8s, package
   managers, system services, ssh hosts, and more.

## Troubleshooting

- **Logs:** `~/.local/share/television/television.log` (Linux), debug with `RUST_LOG=debug tv`
- **Reset:** `mv ~/.config/television ~/.config/television.bak && tv files`
- **Colors wrong:** `export TERM=xterm-256color`, try a different theme
- **Shell integration not working:** ensure `eval "$(tv init zsh)"` is sourced, reload shell
- **Keybindings:** always lowercase (`ctrl-a`, not `Ctrl-A`)
