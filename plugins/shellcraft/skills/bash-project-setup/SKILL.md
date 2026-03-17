---
name: bash-project-setup
version: 1.0.0
description: |
  Architectural guidance for bash project scaffolding. Provides decision matrix
  for choosing between single-file and modular structures based on complexity
  and size signals, complete directory templates for both architectures, and
  scaling strategies for migrating from simple to complex as projects grow.

  Covers: architecture decision criteria, single-file project structure,
  modular bin/lib structure, scaling up from single-file to modular, and
  cross-references to testing infrastructure and advanced patterns.

allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Bash Project Setup

Architectural guidance for structuring bash projects based on complexity and size. Choose the right architecture from the start and know when to scale up.

## Quick Reference

**Decision Flowchart:**
1. Is it complex? (3+ commands OR shared state) → **Modular**
2. Is it large? (>500 lines) → **Modular**
3. Otherwise → **Single-file**

**Architecture Types:**
- **Single-file:** One executable script, minimal structure
- **Modular:** bin/ for commands, lib/ for shared code, dispatcher entry point

---

## 1. Architecture Decision Matrix

Choose your project structure based on **both size AND complexity signals**. Complexity can override size — a 200-line tool with 5 subcommands needs modular structure.

### Decision Table

| Size | Complexity | Structure | Trigger |
|------|-----------|-----------|---------|
| Small (<500 lines) | Simple (1-2 commands, no shared state) | Single-file | Default for new tools |
| Small | Complex (3+ commands OR shared state) | Modular | Complexity overrides size |
| Large (>500 lines) | Any | Modular | Size forces modularity |

### Complexity Signals

Your project is **complex** if it has any of:
- **3+ subcommands** (e.g., `tool add`, `tool list`, `tool remove`)
- **Shared state between operations** (JSON database, cache, session data)
- **Concurrent access requirements** (multiple processes writing to same data)
- **Multiple external tool integrations** (git + gh + jq + fzf all in one tool)

### Size Signals

Your project is **large** if:
- **Main logic exceeds 500 lines** (excluding tests)
- **10+ functions** with non-trivial implementations

### When in Doubt

**Start single-file.** You can always scale up later. Signs you've outgrown single-file:
- Adding a 3rd subcommand
- Functions starting to share state
- File approaching 500 lines
- Wanting to reuse utilities in other scripts

---

## 2. Single-File Structure

For quick tools, utilities, and single-purpose scripts under 500 lines with simple logic.

### Directory Tree

```
project/
├── src/
│   └── tool.sh              # Main executable
├── test/                    # or tests/
│   ├── lib/                 # bats submodules (bats-core, bats-support, bats-assert)
│   └── test_tool.bats       # Test file
├── Makefile                 # Build/test targets
└── README.md                # Usage documentation
```

### Key Conventions

**Executable location:**
- Keep script in `src/` directory (not root)
- Use meaningful name: `tool.sh`, not `main.sh`
- Include shebang: `#!/usr/bin/env bash`

**Testing:**
- Mirror executable name: `test_tool.bats` tests `tool.sh`
- See bash-testing skill for bats setup and test organization

**Structure inside script:**
- Strict mode at top (see bash-style-guide §3)
- Constants and configuration
- Helper functions
- Main logic
- Execution (call main or use guard: `[[ "${BASH_SOURCE[0]}" == "${0}" ]] && main "$@"`)

### Example Single-File Script

```bash
#!/usr/bin/env bash
set -euo pipefail

# === Configuration ===
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly CACHE_FILE="${XDG_CACHE_HOME:-$HOME/.cache}/tool/data.json"

# === Helper Functions ===
log() {
  printf '%s\n' "$1" >&2
}

die() {
  log "ERROR: $1"
  exit 1
}

ensure_cache_dir() {
  local cache_dir
  cache_dir="$(dirname "$CACHE_FILE")"
  [[ -d "$cache_dir" ]] || mkdir -p "$cache_dir"
}

# === Main Logic ===
main() {
  local action="${1:-help}"

  case "$action" in
    add)
      shift
      [[ $# -eq 0 ]] && die "Usage: tool add <item>"
      ensure_cache_dir
      printf '%s\n' "$1" >> "$CACHE_FILE"
      log "Added: $1"
      ;;
    list)
      [[ -f "$CACHE_FILE" ]] || die "No items yet"
      cat "$CACHE_FILE"
      ;;
    help|--help|-h)
      cat <<-'EOF'
				Usage: tool <command>

				Commands:
				  add <item>    Add item to list
				  list          Show all items
				  help          Show this help
				EOF
      ;;
    *)
      die "Unknown command: $action (try 'tool help')"
      ;;
  esac
}

# Execute only when run directly
[[ "${BASH_SOURCE[0]}" == "${0}" ]] && main "$@"
```

### When to Use Single-File

- Quick utilities (git wrappers, tmux launchers, etc.)
- Single-purpose tools (formatters, converters)
- Scripts with 1-2 commands
- No shared state between operations
- Under 500 lines

---

## 3. Modular Structure

For multi-command CLIs, complex tools, and projects with shared libraries.

### Directory Tree

```
project/
├── bin/                     # Executable subcommands
│   ├── command1             # Subcommand executable
│   ├── command2             # Each command is independent
│   └── command3
├── lib/                     # Shared libraries
│   ├── core.sh              # Core utilities (logging, error handling)
│   ├── feature1.sh          # Feature-specific functions
│   └── feature2.sh
├── test/                    # or tests/
│   ├── lib/                 # bats submodules
│   ├── test_helper.bash     # Test utilities (PROJECT_ROOT, load helpers)
│   ├── test_core.bats       # Tests for lib/core.sh
│   └── test_feature1.bats   # Tests for lib/feature1.sh
├── dispatcher               # Main entry point (exec pattern)
├── Makefile                 # Build/test targets
└── README.md                # Usage documentation
```

### Key Conventions

**Dispatcher:**
- Lives at project root
- Uses exec-based dispatch (see bash-patterns §2)
- No business logic — just routes to bin/ commands
- Sources lib/core.sh for shared utilities

**bin/ directory:**
- Each file is an executable subcommand
- No `.sh` extension on executables
- Include shebang: `#!/usr/bin/env bash`
- Source needed lib/ modules

**lib/ directory:**
- Use `.sh` extension: `core.sh`, not `core`
- Not executable (no shebang)
- Use lazy-loaded module pattern (see bash-patterns §1)
- Start with guard variable: `[[ -n "${_CORE_LOADED:-}" ]] && return`

**Testing:**
- Mirror lib/ structure: `test_core.bats` tests `lib/core.sh`
- `test_helper.bash` provides PROJECT_ROOT and load utilities
- See bash-testing skill for complete setup

### Example Dispatcher

```bash
#!/usr/bin/env bash
set -euo pipefail

# Prevent wrapper loop (see bash-patterns §3)
export TOOL_DISPATCHED=1

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly BIN_DIR="$SCRIPT_DIR/bin"

# Source core utilities
# shellcheck source=lib/core.sh
source "$SCRIPT_DIR/lib/core.sh"

# === Command Dispatch ===
main() {
  local command="${1:-help}"
  shift || true

  local command_path="$BIN_DIR/$command"

  case "$command" in
    help|--help|-h)
      show_help
      ;;
    *)
      if [[ -f "$command_path" && -x "$command_path" ]]; then
        exec "$command_path" "$@"
      else
        die "Unknown command: $command (try 'tool help')"
      fi
      ;;
  esac
}

show_help() {
  cat <<-'EOF'
		Usage: tool <command> [options]

		Commands:
		  add       Add item
		  list      List items
		  remove    Remove item
		  help      Show this help
		EOF
}

main "$@"
```

### Example lib/core.sh

```bash
# Guard against multiple loads
[[ -n "${_CORE_LOADED:-}" ]] && return
readonly _CORE_LOADED=1

# === Logging ===
log() {
  printf '%s\n' "$1" >&2
}

die() {
  log "ERROR: $1"
  exit 1
}

# === Environment Detection ===
is_interactive() {
  [[ -t 0 ]] && [[ -t 1 ]]
}

use_gum() {
  [[ "${USE_GUM:-1}" == "1" ]] && [[ -z "${CI:-}" ]] && command -v gum >/dev/null
}

# === Project Paths ===
readonly PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
readonly DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/tool"
readonly CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/tool"
```

### Example bin/add Command

```bash
#!/usr/bin/env bash
set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly LIB_DIR="$SCRIPT_DIR/../lib"

# Source required libraries
# shellcheck source=../lib/core.sh
source "$LIB_DIR/core.sh"

# === Command Implementation ===
main() {
  [[ $# -eq 0 ]] && die "Usage: tool add <item>"

  local item="$1"
  local data_file="$DATA_DIR/items.json"

  # Ensure data directory exists
  [[ -d "$DATA_DIR" ]] || mkdir -p "$DATA_DIR"

  # Initialize empty array if file doesn't exist
  [[ -f "$data_file" ]] || echo '[]' > "$data_file"

  # Add item to JSON array
  jq --arg item "$item" '. += [$item]' "$data_file" > "$data_file.tmp"
  mv "$data_file.tmp" "$data_file"

  log "Added: $item"
}

main "$@"
```

### When to Use Modular

- Multi-command CLIs (3+ subcommands)
- Tools with shared state (JSON DB, session management)
- Utilities you want to reuse across commands
- Projects approaching or exceeding 500 lines
- Concurrent access requirements

---

## 4. Scaling Up: Single-File to Modular

When your single-file script outgrows its structure, migrate to modular incrementally.

### Migration Triggers

**Time to scale when:**
1. Adding a 3rd subcommand
2. Functions sharing state via global variables
3. Main script approaching 500 lines
4. Wanting to reuse functions in other scripts
5. Multiple people contributing (modular is easier to review)

### Refactoring Order

**Step 1: Extract core utilities to lib/core.sh**
- Logging functions (log, die, debug)
- Environment detection (is_interactive, use_gum)
- Path constants (PROJECT_ROOT, DATA_DIR)
- Keep these in lib/core.sh — every command needs them

**Step 2: Extract feature modules to lib/**
- Group related functions by feature
- Each module gets lazy-load guard: `[[ -n "${_FEATURE_LOADED:-}" ]] && return`
- Example: `lib/database.sh` for JSON operations, `lib/ui.sh` for prompts

**Step 3: Create bin/ subcommands**
- Each subcommand case in your original script becomes a file in bin/
- Source lib/core.sh and feature modules as needed
- Make them executable: `chmod +x bin/*`

**Step 4: Create dispatcher**
- Move command routing logic to root dispatcher
- Use exec pattern (see bash-patterns §2)
- Add wrapper loop prevention (see bash-patterns §3)

**Step 5: Update tests**
- Keep passing throughout migration
- Split test file into test_core.bats, test_feature.bats, etc.
- Update test_helper.bash with PROJECT_ROOT calculation

### Migration Example

**Before (single-file):**
```bash
main() {
  case "$1" in
    add) add_item "$2" ;;
    list) list_items ;;
    remove) remove_item "$2" ;;
  esac
}
```

**After (modular):**
- `dispatcher` — Routes to bin/add, bin/list, bin/remove
- `lib/core.sh` — Shared utilities
- `lib/database.sh` — JSON operations
- `bin/add` — Calls database functions
- `bin/list` — Calls database functions
- `bin/remove` — Calls database functions

### Keep Tests Passing

Run tests after each step:
1. After extracting lib/core.sh → `make test`
2. After extracting lib/feature.sh → `make test`
3. After creating bin/ commands → `make test`
4. After creating dispatcher → `make test`

If tests fail, rollback the last change and investigate before proceeding.

---

## 5. Testing Infrastructure

Both single-file and modular projects use the same testing approach.

### Test Directory Setup

See bash-testing skill for complete setup including:
- Installing bats via git submodules
- Creating test_helper.bash with PROJECT_ROOT calculation
- Setting up mock executables with heredoc pattern
- Handling CI mode with USE_GUM=0 and CI=true

### Test Organization

**Single-file:** One test file mirrors executable
```
test/test_tool.bats → tests src/tool.sh
```

**Modular:** Test files mirror lib/ structure
```
test/test_core.bats → tests lib/core.sh
test/test_database.bats → tests lib/database.sh
```

---

## 6. Cross-References

**Related Skills:**
- **bash-testing** — Test infrastructure setup (bats submodules, test_helper.bash, mocking patterns)
- **bash-patterns** §1 — Lazy-loaded module pattern (used in modular lib/ files)
- **bash-patterns** §2 — Exec-based dispatch pattern (used in modular dispatcher)
- **bash-patterns** §3 — Wrapper loop prevention (used in dispatcher)
- **bash-style-guide** — All conventions apply (naming, strict mode, formatting)
- **bash-tools** — Tool usage patterns for gum, fzf, jq, etc.

**Templates:**
- Makefile template: See `templates/Makefile.template` for standard targets (check, lint, test, format, format-check, install, help)
- .shellcheckrc template: See `templates/.shellcheckrc.template` for linter configuration
- CLAUDE.md template: See `templates/CLAUDE.md.template` for project conventions supplement

---

## Summary

**Choose your architecture:**
1. **Simple tool?** → Single-file (src/tool.sh)
2. **Complex tool?** → Modular (bin/ + lib/ + dispatcher)
3. **Growing tool?** → Scale up incrementally (core → features → commands → dispatcher)

**Decision criteria:**
- Complexity signals (3+ commands, shared state) override size
- Size signals (>500 lines) force modular
- When in doubt, start simple and refactor when you hit limits

**Key patterns:**
- Single-file uses guard for direct execution
- Modular uses lazy-loaded modules with guards
- Modular uses exec-based dispatcher
- Both use bats for testing with identical setup

**Next steps:**
1. Choose architecture using decision matrix
2. Create directory structure with appropriate template
3. Set up testing infrastructure (see bash-testing)
4. Apply patterns as you build (see bash-patterns)
5. Follow conventions throughout (see bash-style-guide)
