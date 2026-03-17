---
name: bash-style-guide
version: 1.0.0
description: |
  Bash style conventions and coding standards for shell scripts. Apply when
  writing, editing, or reviewing bash/shell scripts. Covers section separators,
  naming conventions, strict mode, error handling, function documentation,
  string handling, and formatting rules. All rules are mandatory.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Bash Style Guide

All rules in this guide are **mandatory** by default. If you have a compelling reason to deviate from a rule, you must add an inline comment explaining why.

When modifying existing code, reformat the entire touched function to match these conventions.

## 1. Strict Mode and Script Safety

**Rule:** Every executable script starts with `set -euo pipefail` after the header comment block (not inside it).

**Rule:** Sourced library files do NOT include strict mode — the caller owns it.

**Rationale:** Strict mode prevents silent failures by exiting on errors, undefined variables, and pipe failures. Library files are sourced into an existing shell context and should not change the calling script's error handling behavior.

**Example - Executable script:**
```bash
#!/usr/bin/env bash
# qf - Quickflow unified CLI dispatcher
# Provides command-based workflow management

set -euo pipefail

# Rest of script content
```

**Example - Library file:**
```bash
#!/usr/bin/env bash
# Configuration management for quickflow

if [[ -n "${QUICKFLOW_CONFIG_LOADED:-}" ]]; then
	return 0
fi
QUICKFLOW_CONFIG_LOADED=1

# Library content - no strict mode
```

## 2. File Headers

**Rule:** Executable scripts use: shebang → doc block → `set -euo pipefail` → content.

**Rule:** Sourced library files use: doc block → guard variable → content (no shebang, no strict mode).

**Rule:** Lazy-load guard pattern: `if [[ -n "${MODULE_LOADED:-}" ]]; then return 0; fi` then `MODULE_LOADED=1`.

**Rationale:** Executable scripts need a shebang to tell the system how to run them and strict mode for safety. Library files are sourced, not executed, so they need neither shebang nor strict mode. Guard variables prevent duplicate sourcing which can cause unexpected behavior.

**Example - Executable script header:**
```bash
#!/usr/bin/env bash
#######################################
# qf - Quickflow unified CLI dispatcher
#
# Provides command-based workflow management for git operations,
# PR creation, commit generation, and context switching.
#
# Usage:
#   qf <command> [args...]
#
# Globals:
#   QUICKFLOW_ROOT - Root directory (computed from script location)
#   QF_DISPATCHED - Set to prevent recursive dispatch loops
#
# Dependencies:
#   - gum (interactive components)
#   - gh (GitHub CLI)
#   - fzf (fuzzy finding)
#######################################

set -euo pipefail

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🚀  BOOTSTRAP
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Compute root directory from script location
SCRIPT_PATH="${BASH_SOURCE[0]}"
while [[ -L "$SCRIPT_PATH" ]]; do
	SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"
	SCRIPT_PATH="$(readlink "$SCRIPT_PATH")"
	[[ "$SCRIPT_PATH" != /* ]] && SCRIPT_PATH="$SCRIPT_DIR/$SCRIPT_PATH"
done
QUICKFLOW_ROOT="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"
export QUICKFLOW_ROOT
```

**Example - Library file header:**
```bash
#!/usr/bin/env bash
#######################################
# Logging utilities for quickflow
#
# Provides structured logging with multiple levels (info, warn, error, debug)
# using gum log. All log output is also written to a persistent file.
#
# Globals:
#   QUICKFLOW_LOG_FILE - Path to log file (set by caller)
#   QUICKFLOW_DEBUG - Enable debug logging (0 or 1)
#
# Dependencies:
#   - gum (logging output)
#######################################

if [[ -n "${QUICKFLOW_LOG_LOADED:-}" ]]; then
	return 0
fi
QUICKFLOW_LOG_LOADED=1

# No strict mode - library file
# No shebang needed - this file is sourced

# Library content begins here
```

## 3. Section Separators

**Rule:** Use centered emoji with box drawing character `━` (U+2501) as separators between major sections.

**Rule:** Format is three lines: separator line → centered emoji + space + UPPER CASE SECTION NAME → separator line.

**Rule:** Claude picks contextually appropriate emoji (not prescribed).

**Rationale:** Visual separators make code structure immediately clear and improve readability in long files. The centered format with box drawing characters creates a professional, consistent appearance.

**Example - Bootstrap section:**
```bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🚀  BOOTSTRAP
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Bootstrap code here
```

**Example - Configuration section:**
```bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ⚙️  CONFIGURATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Configuration code here
```

**Example - Dependencies section:**
```bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📦  DEPENDENCIES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Source library files
```

## 4. Naming Conventions

**Rule:** Functions use `snake_case`.

**Rule:** Constants use `UPPER_SNAKE_CASE` with `readonly`.

**Rule:** Local variables use `snake_case` with `local` keyword.

**Rule:** Internal/private helper functions use `_` prefix (e.g., `_resolve_path`, `_parse_line`).

**Rationale:** Consistent naming makes code predictable and easier to read. The underscore prefix clearly marks private functions that are not part of the public API.

**Example:**
```bash
# Constants at file/section scope
readonly MAX_DIFF_SIZE=50000
readonly CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/quickflow"

# Public function - snake_case
load_config() {
	local config_file="${CONFIG_DIR}/config"
	local retry_count=0

	# Use private helper
	if _validate_config_format "$config_file"; then
		source "$config_file"
		return 0
	fi
	return 1
}

# Private helper function - underscore prefix
_validate_config_format() {
	local file="$1"
	[[ -f "$file" ]] && grep -q "^[A-Z_]*=" "$file"
}
```

## 5. Function Documentation

**Rule:** Every function gets a Google Shell Style header with: description (first line), Globals, Arguments, Outputs, Returns.

**Rule:** Optional sections: multi-line elaboration, Usage examples.

**Rationale:** Complete documentation makes functions self-explanatory and maintainable. The Google Shell Style header format is industry standard and provides all information needed to use a function correctly.

**Example - Complete function header:**
```bash
#######################################
# Generate AI content via Claude CLI with automatic context loading.
# Prepends context files to prompt and calls Claude CLI.
# Detects authentication failures and validates output.
# Shows spinner when stderr is a TTY.
# Globals:
#   _CLAUDE_REAL - Path to real claude binary
# Arguments:
#   $1 - Prompt text (required)
#   $2 - Context type: "rules", "context", "both", "none" (default: "both")
#   $3 - Spinner title (optional, default: "Generating...")
# Outputs:
#   Writes AI-generated content to stdout
#   Writes error messages to stderr on failure
# Returns:
#   0 if successful
#   1 if prompt empty, auth failed, or output empty
# Usage:
#   result=$(ai_generate "Write a function..." "both" "Generating commit...")
#   structured=$(ai_generate "$prompt" "rules")
#######################################
ai_generate() {
	local prompt="$1"
	local context_type="${2:-both}"
	local spinner_title="${3:-Generating...}"

	# Function implementation
}
```

## 6. Error Handling

**Rule:** Guard clauses at top of functions — validate inputs, return early on failure.

**Rule:** Use `gum log --level error` for user-facing error messages (not echo/printf).

**Rule:** Defined exit codes: 1=general error, 2=usage/argument error, 126=not executable, 127=command not found.

**Rationale:** Guard clauses fail fast and keep the main logic clean. Structured error logging with gum log provides consistent formatting and proper stderr handling. Standard exit codes communicate failure reasons to calling scripts.

**Example:**
```bash
load_config() {
	local config_file="${QUICKFLOW_CONFIG_DIR}/config"

	# Guard clause - validate file exists
	if [[ ! -f "$config_file" ]]; then
		gum log --level error "Configuration file not found: $config_file"
		gum log --level info "Please copy templates/config.example to $config_file and customize it"
		return 1
	fi

	# Guard clause - validate file is readable
	if [[ ! -r "$config_file" ]]; then
		gum log --level error "Configuration file is not readable: $config_file"
		return 1
	fi

	# Main logic - all preconditions satisfied
	# shellcheck source=/dev/null
	source "$config_file"

	gum log --level debug "Configuration loaded from $config_file"
	return 0
}
```

**Example - Exit code usage:**
```bash
#!/usr/bin/env bash
# Script demonstrating exit code conventions

set -euo pipefail

if [[ $# -lt 1 ]]; then
	gum log --level error "Usage: $0 <command>"
	exit 2  # Usage/argument error
fi

if ! command -v gum &>/dev/null; then
	gum log --level error "gum command not found"
	exit 127  # Command not found
fi

if [[ ! -x "./deploy.sh" ]]; then
	gum log --level error "deploy.sh is not executable"
	exit 126  # Not executable
fi

# General errors
if ! ./deploy.sh; then
	gum log --level error "Deployment failed"
	exit 1  # General error
fi
```

## 7. Comments

**Rule:** Above-line comments explain WHY, not WHAT.

**Rule:** No inline trailing comments restating code.

**Rationale:** Good comments explain the reasoning behind decisions, not the mechanics of the code itself. The code should be self-documenting for the WHAT; comments add context about WHY.

**Example:**
```bash
# Switch to main to compute diff against current feature branch
git checkout main

# Fetch latest to ensure diff comparison is against current remote state
git fetch origin main

# Need to filter large binary files that would exceed Claude's context window
if [[ $(git diff --stat | tail -1 | awk '{print $4}') -gt $MAX_DIFF_SIZE ]]; then
	gum log --level warn "Diff too large, filtering to text files only"
	git diff --diff-filter=d '*.sh' '*.md' '*.txt'
else
	git diff
fi

# Reset back to feature branch for continued work
git checkout -
```

## 8. String Handling

**Rule:** Prefer `printf` over `echo` for data output.

**Rule:** Use `gum log` for user-facing messages (not echo, not printf).

**Rule:** Always double-quote variable expansions.

**Rationale:** `printf` is more portable and predictable than `echo`. `gum log` provides structured logging with levels and consistent formatting. Double-quoting prevents word splitting and glob expansion bugs.

**Example:**
```bash
generate_report() {
	local user="$1"
	local count="$2"

	# Data output - use printf
	printf '%s\t%d\n' "$user" "$count"

	# User-facing messages - use gum log
	gum log --level info "Processing user: $user"
	gum log --level debug "Found $count items"

	# Always quote variable expansions
	local file_path="${CONFIG_DIR}/${user}.conf"
	if [[ -f "$file_path" ]]; then
		source "$file_path"
	fi
}
```

## 9. Formatting

**Rule:** Tabs for indentation (enforced by `shfmt -i 0`).

**Rule:** When modifying existing code, reformat the entire touched function to match conventions.

**Rule:** Use `shellcheck` for linting (advisory, not blocking).

**Rationale:** Consistent formatting makes code readable and maintainable. Tabs are the standard for shell scripts. Reformatting entire functions prevents inconsistent style within a single function. Shellcheck catches common bugs and antipatterns.

**Example - Reformatting workflow:**
```bash
# Before modification (mixed indentation)
my_function() {
  local var1="$1"
    local var2="$2"
  echo "Processing"
    process_data "$var1" "$var2"
}

# After modification (entire function reformatted with tabs)
my_function() {
	local var1="$1"
	local var2="$2"
	local output_file="$3"

	gum log --level info "Processing"

	# New functionality added
	if ! process_data "$var1" "$var2" > "$output_file"; then
		gum log --level error "Processing failed"
		return 1
	fi

	return 0
}
```

**Example - Running formatters:**
```bash
# Format all shell scripts with tabs
shfmt -i 0 -w .

# Run shellcheck on a script
shellcheck my-script.sh
```

## 10. Output and Logging

**Rule:** `gum log --level info|warn|error|debug` is the primary output method.

**Rule:** All log levels documented: info (general), warn (potential issues), error (failures), debug (verbose/conditional).

**Rule:** stderr for errors, stdout for data.

**Rationale:** Structured logging provides consistent formatting, proper stream separation, and level-based filtering. This makes debugging easier and allows users to control verbosity.

**Example - Log wrapper functions:**
```bash
log_info() {
	gum log --level info "$@"
	_log_to_file "INFO" "$@"
}

log_warn() {
	gum log --level warn "$@"
	_log_to_file "WARN" "$@"
}

log_error() {
	gum log --level error "$@"
	_log_to_file "ERROR" "$@"
}

log_debug() {
	if [[ "${QUICKFLOW_DEBUG:-0}" == "1" ]]; then
		gum log --level debug "$@"
	fi
	_log_to_file "DEBUG" "$@"
}

log_success() {
	gum log --level info "✓" "$@"
	_log_to_file "SUCCESS" "$@"
}

# Private helper - log to file
_log_to_file() {
	local level="$1"
	shift
	local timestamp
	timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
	printf '[%s] %s: %s\n' "$timestamp" "$level" "$*" >> "${LOG_FILE:-/dev/null}"
}
```

**Example - Stream separation:**
```bash
process_and_report() {
	local input_file="$1"

	# Data goes to stdout - can be piped or redirected
	process_data "$input_file"

	# User messages go to stderr via gum log
	gum log --level info "Processing complete"
}

# Usage - data and messages are separated
result=$(process_and_report data.txt)  # stdout captured, stderr shows messages
process_and_report data.txt > output.txt  # stdout redirected, stderr shows messages
```

## 11. Variable Patterns

**Rule:** Use `${VAR:-default}` for safe undefined variable access.

**Rule:** Use `local` for all function-scoped variables.

**Rule:** Constants declared at file/section scope with `readonly`.

**Rationale:** Default value expansion prevents errors when variables might be unset. `local` prevents functions from polluting the global namespace. `readonly` prevents accidental modification of constants.

**Example:**
```bash
# File-scope constants
readonly DEFAULT_TIMEOUT=30
readonly CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/myapp"

# Function demonstrating all patterns
setup_environment() {
	local config_file="${1:-${CONFIG_DIR}/config}"
	local timeout="${2:-${DEFAULT_TIMEOUT}}"
	local debug_mode="${DEBUG:-0}"

	# Safe access to potentially unset environment variable
	local user_home="${HOME:-/tmp}"
	local custom_path="${CUSTOM_PATH:-}"

	if [[ -n "$custom_path" ]]; then
		export PATH="${custom_path}:${PATH}"
	fi

	# Local variables don't leak outside function
	local temp_file
	temp_file=$(mktemp)
	process_config "$config_file" > "$temp_file"
	rm "$temp_file"
}
```

**Example - Guard variable pattern:**
```bash
# Library file lazy-load pattern
if [[ -n "${MYLIB_LOADED:-}" ]]; then
	return 0
fi
MYLIB_LOADED=1

# Use defaults for optional configuration
readonly MYLIB_TIMEOUT="${MYLIB_TIMEOUT:-60}"
readonly MYLIB_RETRIES="${MYLIB_RETRIES:-3}"
```

## Summary

This style guide defines mandatory conventions for all bash scripts. Key principles:

1. **Safety first**: Strict mode for executables, guard clauses for validation
2. **Consistent structure**: Clear headers, visual separators, standard patterns
3. **Good documentation**: Google Shell Style headers on every function
4. **Modern tooling**: Use gum for UI, avoid echo/printf for messages
5. **Readable code**: Comments explain WHY, code shows WHAT
6. **Standard naming**: snake_case functions, UPPER_SNAKE_CASE constants
7. **Error handling**: Defined exit codes, early returns, structured logging

When in doubt, look at these patterns as your guide. If you must deviate, document why inline.
