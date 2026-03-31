---
name: bash-patterns
version: 1.0.0
description: |
  Advanced bash patterns for production-quality shell development. Apply when
  building modular bash projects, multi-command CLIs, concurrent systems, or
  AI-integrated tools. Covers lazy-loaded modules, exec-based dispatch, wrapper
  loop prevention, flock-based JSON database, nameref for TTY and non-interactive
  returns, trap-based temp file cleanup, AI CLI integration with auth, and
  layered context loading. Each pattern includes rationale, usage criteria,
  complete working examples, gotchas, and anti-patterns.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Bash Patterns

This skill catalogs 8 advanced bash patterns that enable production-quality shell development. Each pattern solves a specific architectural problem and includes complete, copy-pasteable working code.

**Pattern philosophy:** These patterns handle edge cases and race conditions that naive implementations miss. Use them when the problem matches; recognize when simpler solutions suffice.

## Quick Reference

| Pattern | Use When | Key Benefit |
|---------|----------|-------------|
| Lazy-Loaded Modules | Modular projects with shared libraries | Idempotent sourcing, dependency management |
| Exec-Based Dispatch | Multi-command CLIs | No wrapper overhead, symlinkable commands |
| Wrapper Loop Prevention | Subcommands that can be called directly | Ensures consistent entry point |
| Flock-Based JSON DB | Concurrent JSON state updates | Race-free atomic operations |
| Nameref Pattern | Functions need TTY access OR return complex values | Avoids subshell capture |
| Trap-Based Cleanup | Scripts creating temporary files | Guaranteed cleanup on exit/signal |
| AI Integration | Wrapping AI CLIs with auth | Centralized auth, session management |
| Layered Context | Multiple config sources with priority | Global + repo + runtime overrides |

## Pattern 1: Lazy-Loaded Modules

### Rationale

In modular bash projects with shared libraries, naive sourcing (`source lib/module.sh`) causes problems:
- Sourcing the same file twice redefines functions and resets state
- Circular dependencies create infinite loops
- No clear way to express "load this if not already loaded"

Guard variables make sourcing idempotent: safe to source multiple times, safe to have circular dependencies, enables lazy loading where modules load their dependencies on demand.

### When to Use

- Modular projects with `lib/` directory containing shared bash libraries
- Projects where modules have dependencies on other modules
- Any project with more than 3 library files

**Complexity trigger:** When you find yourself manually tracking which libraries have been sourced.

### Complete Example

```bash
#!/usr/bin/env bash
# lib/github.sh - GitHub operations module

# Guard variable - prevents duplicate loading
if [[ -n "${MYAPP_GITHUB_LOADED:-}" ]]; then
	return 0
fi
MYAPP_GITHUB_LOADED=1

# Compute project root if not already set
MYAPP_ROOT="${MYAPP_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

# Load dependencies using the same guard pattern
# This is safe even if core.sh also loads git.sh
if [[ -z "${MYAPP_CORE_LOADED:-}" ]]; then
	source "${MYAPP_ROOT}/lib/core.sh"
fi

if [[ -z "${MYAPP_GIT_LOADED:-}" ]]; then
	source "${MYAPP_ROOT}/lib/git.sh"
fi

# Module functions
create_pr() {
	local title="$1"
	local body="$2"

	if ! in_git_repo; then
		log_error "Not in a git repository"
		return 1
	fi

	gh pr create --title "$title" --body "$body"
}

list_open_prs() {
	gh pr list --state open --json number,title --jq '.[] | "\(.number) - \(.title)"'
}
```

```bash
#!/usr/bin/env bash
# lib/core.sh - Core utilities module

if [[ -n "${MYAPP_CORE_LOADED:-}" ]]; then
	return 0
fi
MYAPP_CORE_LOADED=1

MYAPP_ROOT="${MYAPP_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

# Core helper to load other modules
myapp_lib() {
	local module="$1"
	local module_var="MYAPP_${module^^}_LOADED"

	if [[ -z "${!module_var:-}" ]]; then
		source "${MYAPP_ROOT}/lib/${module}.sh"
	fi
}

log_info() {
	gum log --level info "$@"
}

log_error() {
	gum log --level error "$@"
}
```

### Gotchas

**Typo in guard variable name:** If you inconsistently name the guard (`MYAPP_GITHUB_LOADED` vs `MYAPP_GITHUB_LIB_LOADED`), the guard won't work and you'll load the module twice.

**Fix:** Use consistent naming convention: `${PROJECT}_${MODULE}_LOADED` (see bash-style-guide §4 for naming conventions).

**Forgetting to set guard after check:** If you check the guard but don't set it, the module will reload every time.

**Fix:** Always set the guard immediately after checking it: `MODULE_LOADED=1`.

**Wrong expansion order:** Using `${MYAPP_ROOT}` before setting it can cause empty paths.

**Fix:** Always compute/set `MYAPP_ROOT` before using it in dependency paths.

### When NOT to Use

**Single-file scripts:** If everything is in one file, you're not sourcing anything, so guards are unnecessary.

**Simple scripts with no shared libraries:** If your project has executable scripts that don't share code, guards add no value.

**Non-bash projects:** This pattern is bash-specific. Zsh and other shells have different module systems.

**Alternative:** For single-file scripts, just write all code in one file. For simple multi-script projects without shared libraries, don't create a lib/ directory.

## Pattern 2: Exec-Based Command Dispatch

### Rationale

Multi-command CLIs (like `git`, `gh`, `docker`) need to route subcommands to implementations. Naive approaches have problems:

- **Functions in dispatcher:** Works but makes one giant file and prevents subcommands from being called directly
- **Sourcing subcommands:** Pollutes namespace, loads all commands even if unused
- **Shell script wrapper:** Adds process overhead (fork + exec for wrapper, then fork + exec for real command)

The `exec` pattern transfers control to the subcommand, replacing the current process. Result: no wrapper overhead, subcommands can be symlinked to PATH, clean separation.

### When to Use

- Multi-command CLIs with 3+ subcommands
- When you want subcommands in separate files for maintainability
- When subcommands should be independently executable (can be added to PATH)
- Projects using `bin/` directory structure

### Complete Example

```bash
#!/usr/bin/env bash
# myapp - Main dispatcher

set -euo pipefail

# Compute project root
SCRIPT_PATH="${BASH_SOURCE[0]}"
while [[ -L "$SCRIPT_PATH" ]]; do
	SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"
	SCRIPT_PATH="$(readlink "$SCRIPT_PATH")"
	[[ "$SCRIPT_PATH" != /* ]] && SCRIPT_PATH="$SCRIPT_DIR/$SCRIPT_PATH"
done
MYAPP_ROOT="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"
export MYAPP_ROOT

# Parse subcommand
subcommand="${1:-}"
shift || true

# Show help if no subcommand
if [[ -z "$subcommand" ]]; then
	echo "Usage: myapp <command> [args...]"
	echo ""
	echo "Commands:"
	echo "  start       Start a new task"
	echo "  commit      Generate commit message"
	echo "  pr          Create pull request"
	exit 1
fi

# Mark as dispatched (prevents wrapper loops)
export MYAPP_DISPATCHED=1

# Dispatch to subcommand - exec replaces current process
case "$subcommand" in
	start)
		exec "$MYAPP_ROOT/bin/start" "$@"
		;;
	commit)
		exec "$MYAPP_ROOT/bin/commit" "$@"
		;;
	pr)
		exec "$MYAPP_ROOT/bin/pr" "$@"
		;;
	*)
		echo "Unknown command: $subcommand" >&2
		exit 1
		;;
esac

# Code after exec NEVER runs - exec replaces the process
```

### Gotchas

**Code after exec:** Nothing after the `exec` statement will run because `exec` replaces the current process. Don't put cleanup code after exec.

**Fix:** Do all setup before the dispatch case statement. If you need cleanup, use traps.

**Forgetting to export DISPATCHED variable:** If you don't export it, subcommands won't see it and wrapper detection breaks.

**Fix:** Always use `export MYAPP_DISPATCHED=1`, not just `MYAPP_DISPATCHED=1`.

**exec failure:** If the exec'd file doesn't exist or isn't executable, bash prints an error and the script exits. No fallback code runs.

**Fix:** This is actually desired behavior. If a subcommand is missing, the program should fail. Test that all subcommand files exist and are executable.

### When NOT to Use

**Single-command tools:** If your script has only one command, dispatching adds unnecessary complexity.

**When you need post-command code:** If you need to run code after the subcommand finishes (cleanup, logging, metrics), exec won't work because it replaces the process.

**Alternative:** Use a case statement that calls functions or sources subcommands, then runs cleanup code after they return.

**Scripts with complex argument parsing:** If the dispatcher needs to parse flags that apply to all commands, do the parsing before exec.

## Pattern 3: Wrapper Loop Prevention

### Rationale

When using exec-based dispatch (Pattern 2), subcommands can be called two ways:
1. Via dispatcher: `myapp commit` (dispatcher execs to bin/commit)
2. Directly: `bin/commit` (called as standalone script)

If a subcommand is called directly but should always go through the dispatcher (for environment setup, logging, etc.), the subcommand needs to detect direct invocation and re-exec through the dispatcher. Without this, calling `bin/commit` directly skips the dispatcher's setup.

But naive re-execution creates infinite loops: subcommand detects it wasn't dispatched → execs dispatcher → dispatcher execs subcommand → subcommand detects it wasn't dispatched → loop forever.

The solution: dispatcher sets an environment variable (`DISPATCHED=1`) that subcommands check. If not set, re-exec through dispatcher. After checking, **unset the variable** so child processes don't inherit it and skip their own detection.

### When to Use

- Multi-command CLIs using exec-based dispatch
- When subcommands should always be called through the dispatcher
- When subcommands can be symlinked to PATH but need dispatcher environment

**Always use this with Pattern 2 (Exec-Based Dispatch).**

### Complete Example

```bash
#!/usr/bin/env bash
# bin/commit - Subcommand with wrapper detection

# Wrapper detection: if called directly (not via dispatcher), re-exec through dispatcher
if [[ "${BASH_SOURCE[0]}" == "${0}" ]] && [[ -z "${MYAPP_DISPATCHED:-}" ]]; then
	MYAPP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
	exec "$MYAPP_ROOT/myapp" commit "$@"
fi

# Unset DISPATCHED so child processes don't skip their detection
unset MYAPP_DISPATCHED

set -euo pipefail

# Now we know we came through dispatcher - dispatcher's environment is set
MYAPP_ROOT="${MYAPP_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

# Load libraries
source "${MYAPP_ROOT}/lib/core.sh"
myapp_lib "git"

# Subcommand implementation
log_info "Generating commit message..."

# Get staged diff
if ! git diff --cached --quiet; then
	diff=$(git diff --cached)
	log_info "Found staged changes"
else
	log_error "No staged changes"
	exit 1
fi

# Generate message (simplified)
message=$(echo "$diff" | head -20 | sed 's/^/# /')
echo "$message"
```

**How it works:**

1. User runs `bin/commit` directly
2. Check `BASH_SOURCE[0] == $0` is true (not sourced), and `MYAPP_DISPATCHED` is unset
3. Compute project root, exec dispatcher with "commit" subcommand
4. Dispatcher sets `MYAPP_DISPATCHED=1` and execs back to `bin/commit`
5. Now check fails (MYAPP_DISPATCHED is set), wrapper detection passes
6. `unset MYAPP_DISPATCHED` prevents child processes from inheriting it
7. Subcommand runs normally

### Gotchas

**Forgetting to unset DISPATCHED:** If you don't unset the variable, child processes will inherit it and skip their own wrapper detection.

**Example:** `bin/commit` calls `bin/pr` internally. If `DISPATCHED` is still set, `bin/pr` will think it came through the dispatcher even though it didn't, and its environment setup will be skipped.

**Fix:** Always unset immediately after checking: `unset MYAPP_DISPATCHED`.

**Wrong check logic:** Using just `BASH_SOURCE[0] == $0` without checking `DISPATCHED` causes loops (subcommand always thinks it's direct).

**Fix:** Always check both conditions: direct invocation AND not dispatched.

**Infinite loop if dispatcher missing:** If the dispatcher file doesn't exist or isn't executable, exec fails and bash exits. This is good (fail fast), but error message can be confusing.

**Fix:** Make sure dispatcher exists and is in PATH or use absolute path.

### When NOT to Use

**Scripts that are ONLY called by dispatcher:** If a subcommand is never meant to be called directly (not in PATH, not symlinked), wrapper detection is unnecessary.

**Scripts that DON'T use exec dispatch:** If you're not using Pattern 2, you don't need Pattern 3.

**Single-command tools:** No dispatch = no wrapper detection needed.

**Alternative:** For dispatcher-only scripts, skip the wrapper detection block. For non-exec dispatchers, you can't re-exec anyway.

## Pattern 4: Flock-Based JSON Database

### Rationale

Many shell scripts need persistent state: cache data, track work items, store configuration. JSON files are convenient for this but have a major problem: **race conditions**.

If two processes read the same JSON file, modify it, and write it back, one modification is lost (last write wins). Without locking, concurrent updates corrupt data.

Naive locking with PID files has race conditions (two processes can create PID file simultaneously). The `flock` system call provides kernel-level file locking with these properties:

- **Atomic:** Lock acquisition is atomic (no race conditions)
- **Blocking:** Process waits for lock if held by another process
- **Automatic cleanup:** Lock released when file descriptor closes (no stale locks)

This pattern combines `flock` with atomic file replacement (write to temp, validate, move) for race-free JSON updates.

### When to Use

- Scripts that maintain JSON state files (caches, databases, work queues)
- When multiple processes might update the same JSON file concurrently
- CI/CD systems, background jobs, parallel test runners
- Any time you see "data loss" or "corrupted JSON" bugs

**Complexity trigger:** If you're doing `jq ... > file` without locking, you need this pattern.

### Complete Example

```bash
#!/usr/bin/env bash
# Atomic JSON database operations

# Store configuration
STORE_PATH="${XDG_DATA_HOME:-$HOME/.local/share}/myapp/data.json"
LOCK_PATH="${STORE_PATH}.lock"

# Initialize store and lock file
init_store() {
	local dir=$(dirname "$STORE_PATH")
	mkdir -p "$dir"
	chmod 700 "$dir"

	# Create empty store if missing
	if [[ ! -f "$STORE_PATH" ]]; then
		echo '{"version":1,"entries":{}}' > "$STORE_PATH"
		chmod 600 "$STORE_PATH"
	fi

	# Create lock file
	touch "$LOCK_PATH"
	chmod 600 "$LOCK_PATH"
}

# Safe JSON update with validation
safe_json_update() {
	local jq_filter="$1"
	shift

	local temp_file="${STORE_PATH}.tmp.$$"

	# Apply jq filter to temp file
	if ! jq "$jq_filter" "$@" "$STORE_PATH" > "$temp_file" 2>/dev/null; then
		rm -f "$temp_file"
		log_error "jq filter failed: $jq_filter"
		return 1
	fi

	# Validate JSON syntax
	if ! jq empty "$temp_file" 2>/dev/null; then
		rm -f "$temp_file"
		log_error "Generated invalid JSON"
		return 1
	fi

	# Atomic move (replaces old file)
	chmod 600 "$temp_file"
	mv "$temp_file" "$STORE_PATH"
}

# Execute callback under exclusive lock
with_lock() {
	local callback="$1"
	shift

	# Open lock file on fd 200 (convention for flock)
	exec 200>"$LOCK_PATH"

	# Get exclusive lock - blocks if another process holds it
	flock 200

	# Execute callback with remaining arguments
	"$callback" "$@"
	local status=$?

	# Release lock (automatic when fd closes)
	exec 200>&-

	return $status
}

# Read value from store (no lock needed for reads)
read_value() {
	local key="$1"
	jq -r ".entries[\"$key\"] // empty" "$STORE_PATH"
}

# Update value in store (requires lock)
update_value() {
	local key="$1"
	local value="$2"
	safe_json_update ".entries[\"$key\"] = \"$value\""
}

# Delete value from store (requires lock)
delete_value() {
	local key="$1"
	safe_json_update "del(.entries[\"$key\"])"
}

# Usage examples
init_store

# Read doesn't need lock
current_value=$(read_value "task-123")

# Writes need lock to prevent races
with_lock update_value "task-123" "in-progress"

# Complex updates also need lock
with_lock safe_json_update '.entries["task-456"] = {"status": "done", "timestamp": now}'

# Reads during batch operations need lock for consistency
with_lock bash -c '
	value=$(read_value "counter")
	new_value=$((value + 1))
	update_value "counter" "$new_value"
'
```

### Gotchas

**Forgetting to validate before mv:** If you skip `jq empty` validation, corrupt JSON can be written to the store, making it unreadable.

**Fix:** Always validate temp file with `jq empty` before moving it. This catches syntax errors from jq filter bugs.

**Not using atomic mv:** Using `cp` instead of `mv` means there's a window where the file is partially written. Another process reading during this window gets corrupt data.

**Fix:** Always use `mv` for atomic replacement. The move is atomic at filesystem level.

**Reading without lock during batch operations:** If you do read-modify-write without holding the lock for the entire operation, another process can modify the value between your read and write.

**Fix:** Hold the lock for the entire read-modify-write sequence (see "counter" example above).

**Wrong fd number:** File descriptor 200 is a convention for flock. Using a different number works but might conflict with other open files.

**Fix:** Use fd 200 consistently for flock operations.

**Lock file not cleaned up:** If you forget to release the lock (`exec 200>&-`), the lock persists until the process exits.

**Fix:** Always close the fd to release the lock. The `with_lock` helper does this automatically.

### When NOT to Use

**Read-only JSON:** If you never modify the JSON file, locking is unnecessary.

**Single-process scripts:** If only one process ever accesses the file, races are impossible.

**Alternative:** For read-only data, just use `jq` directly. For single-process, simple `jq > temp && mv temp file` is sufficient.

**High-throughput requirements:** Flock serializes access (one process at a time). For high concurrency, use a real database.

**Alternative:** For high-throughput state management, use Redis, SQLite, or a proper database.

## Pattern 5: Nameref Pattern (Interactive and Non-Interactive)

### Rationale

Bash functions traditionally return values via `echo` and command substitution: `result=$(myfunction)`. This works for simple cases but breaks in two scenarios:

**Problem 1: Interactive functions (TTY capture)**

When a function uses interactive tools like `gum`, `tv`, or `read`, command substitution captures stdin. The interactive tool can't access the terminal and fails with "not a tty" or hangs.

```bash
# BROKEN - gum can't access terminal
description=$(get_user_input "Enter description")
```

**Problem 2: Multiple return values**

Functions can only return one exit code and one string via echo. Returning multiple values requires string parsing or global variables.

```bash
# UGLY - parsing string output
result=$(get_user_info)
name=$(echo "$result" | cut -d: -f1)
email=$(echo "$result" | cut -d: -f2)
```

**Solution: Nameref**

Bash 5.1+ supports `local -n`, which creates a nameref (reference to a variable). The function receives a variable name and assigns to it directly, avoiding subshells.

Benefits:
- No subshell = TTY access works
- Direct assignment = no string parsing
- Multiple outputs = pass multiple nameref parameters

### When to Use

**Interactive scenario:** Functions that call `gum write`, `gum input`, `tv`, `read`, or any tool requiring TTY access.

**Non-interactive scenario:** Functions that need to return multiple values or complex data structures (arrays, associative arrays).

**Requires Bash 5.1+** (check with `bash --version`).

### Complete Example

**Example 1: Interactive use (gum/tv/read)**

For gum-specific interactive patterns, see bash-tools skill. This example shows the general nameref pattern.

```bash
#!/usr/bin/env bash
# Interactive functions with TTY access

# Function that needs TTY for gum write
get_multiline_input() {
	local prompt="$1"
	local -n result_var="$2"  # Nameref declaration

	local value
	if ! value=$(gum write --header "$prompt" --placeholder "Type here..."); then
		return 1
	fi

	result_var="$value"  # Assign to nameref
	return 0
}

# Function that needs TTY for tv
select_from_list() {
	local -n result_var="$1"
	shift
	local options=("$@")

	local selected
	if ! selected=$(printf "%s\n" "${options[@]}" | tv); then
		return 1
	fi

	result_var="$selected"
	return 0
}

# Usage - no subshell, TTY works correctly
main() {
	local description
	if ! get_multiline_input "Enter task description" description; then
		log_error "Input cancelled"
		return 1
	fi
	log_info "Description: $description"

	local options=("feature" "bugfix" "refactor")
	local task_type
	if ! select_from_list task_type "${options[@]}"; then
		log_error "Selection cancelled"
		return 1
	fi
	log_info "Type: $task_type"
}
```

**Example 2: Non-interactive use (multiple return values)**

```bash
#!/usr/bin/env bash
# Non-interactive functions returning multiple values

# Parse user info from string, return multiple values
parse_user_info() {
	local input="$1"
	local -n name_var="$2"
	local -n email_var="$3"
	local -n age_var="$4"

	# Simulate parsing
	if [[ "$input" =~ ^([^,]+),([^,]+),([0-9]+)$ ]]; then
		name_var="${BASH_REMATCH[1]}"
		email_var="${BASH_REMATCH[2]}"
		age_var="${BASH_REMATCH[3]}"
		return 0
	else
		return 1
	fi
}

# Usage - no string parsing needed
main() {
	local name email age
	if ! parse_user_info "John Doe,john@example.com,30" name email age; then
		log_error "Invalid format"
		return 1
	fi

	log_info "Name: $name"
	log_info "Email: $email"
	log_info "Age: $age"
}
```

**Example 3: Complex data (arrays)**

```bash
#!/usr/bin/env bash
# Functions returning arrays via nameref

# Find files matching pattern, return as array
find_project_files() {
	local pattern="$1"
	local -n result_array="$2"

	local -a files
	while IFS= read -r -d '' file; do
		files+=("$file")
	done < <(find . -name "$pattern" -print0)

	# Assign array to nameref
	result_array=("${files[@]}")

	return 0
}

# Usage
main() {
	local bash_files
	find_project_files "*.sh" bash_files

	log_info "Found ${#bash_files[@]} bash files:"
	for file in "${bash_files[@]}"; do
		log_info "  - $file"
	done
}
```

### Gotchas

**Bash version requirement:** Nameref requires Bash 5.1+. On older versions, you'll get "invalid option" errors.

**Fix:** Check bash version at script start: `if (( BASH_VERSINFO[0] < 5 || (BASH_VERSINFO[0] == 5 && BASH_VERSINFO[1] < 1) )); then echo "Requires Bash 5.1+"; exit 1; fi`

**Variable name collision:** The nameref variable name must be different from the referenced variable. This fails:

```bash
local result
get_value "prompt" result  # result is both local and nameref - ERROR
```

**Fix:** Use descriptive names: `local user_input` + nameref parameter `input_var`.

**Passing wrong variable name:** If you pass a string literal instead of a variable name, bash creates a new variable with that name.

```bash
get_input "prompt" "hardcoded"  # Creates variable named "hardcoded"
```

**Fix:** Always pass variable names without quotes: `get_input "prompt" my_var`

**Scope issues:** If the nameref variable is local to the calling function but you pass it to a subshell or background process, assignment won't work.

**Fix:** Namerefs only work in the same shell process. Don't use with subshells or background jobs.

### When NOT to Use

**Simple functions with single string output:** If your function just returns a simple string and doesn't need TTY, `echo` + command substitution is simpler.

```bash
# Simple case - nameref is overkill
get_username() {
	echo "john_doe"
}
username=$(get_username)
```

**Bash 4.x or older:** If you need compatibility with older bash versions, nameref won't work.

**Alternative:** For simple string returns, use `echo`. For multiple returns with older bash, use global variables or parse delimited strings. For interactive tools with older bash, use temporary files or FIFOs to avoid subshell capture.

## Pattern 6: Trap-Based Temp File Cleanup

### Rationale

Scripts often create temporary files for intermediate processing. Naive cleanup (`rm $tempfile` at end) has problems:

- **Errors before cleanup:** If script exits early (error, Ctrl-C), cleanup doesn't run and temp files leak
- **Multiple exit points:** Each exit point needs cleanup code (duplication)
- **Signals:** SIGINT, SIGTERM cause immediate exit, skipping cleanup

The `trap` builtin runs code when the shell exits or receives signals. Registering cleanup via `trap` guarantees it runs regardless of how the script exits.

**This is the canonical pattern.** bash-testing skill references this pattern for test cleanup.

### When to Use

- Scripts that create temporary files
- Scripts that need guaranteed cleanup on exit or signal
- Any time you use `mktemp` or create files in `/tmp`

**Use this by default.** The overhead is negligible and the safety is valuable.

### Complete Example

```bash
#!/usr/bin/env bash
set -euo pipefail

# Track temporary files in array
declare -a TEMP_FILES=()

# Create and track temp file
temp_file() {
	local prefix="${1:-script}"
	local suffix="${2:-.tmp}"

	local file
	file=$(mktemp "/tmp/${prefix}-XXXXXX${suffix}")
	TEMP_FILES+=("$file")
	echo "$file"
}

# Cleanup function
cleanup_temp_files() {
	local file
	for file in "${TEMP_FILES[@]}"; do
		if [[ -f "$file" ]]; then
			rm -f "$file"
		fi
	done
	TEMP_FILES=()
}

# Register cleanup for EXIT, INT, TERM signals
trap cleanup_temp_files EXIT INT TERM

# Usage
config_file=$(temp_file "myapp-config" ".json")
echo '{"setting": "value"}' > "$config_file"

diff_file=$(temp_file "myapp-diff" ".patch")
git diff > "$diff_file"

# Process files
process_config "$config_file"
apply_diff "$diff_file"

# Cleanup happens automatically:
# - Normal exit: EXIT trap runs
# - Ctrl-C: INT trap runs
# - kill: TERM trap runs
# - Error with set -e: EXIT trap runs
```

**Example with additional cleanup actions:**

```bash
#!/usr/bin/env bash
set -euo pipefail

declare -a TEMP_FILES=()

temp_file() {
	local file=$(mktemp)
	TEMP_FILES+=("$file")
	echo "$file"
}

# Comprehensive cleanup function
cleanup() {
	# Clean up temp files
	for file in "${TEMP_FILES[@]}"; do
		[[ -f "$file" ]] && rm -f "$file"
	done

	# Additional cleanup
	# Restore terminal if running interactive tool
	[[ -n "${INTERACTIVE_PID:-}" ]] && kill "$INTERACTIVE_PID" 2>/dev/null

	# Log completion
	log_info "Cleanup complete"
}

trap cleanup EXIT INT TERM

# Rest of script
```

### Gotchas

**Trap replacement:** `trap` replaces the previous trap for the same signal. If you set two traps for EXIT, only the second runs.

```bash
trap cleanup_temp_files EXIT
trap restore_terminal EXIT  # This REPLACES the first trap
# cleanup_temp_files will NOT run
```

**Fix:** Combine multiple cleanup actions in one function:

```bash
cleanup() {
	cleanup_temp_files
	restore_terminal
}
trap cleanup EXIT INT TERM
```

**Traps not inherited by subshells:** If you run a subshell or background process, traps are not inherited.

```bash
trap cleanup EXIT
(exit 1)  # Subshell exit doesn't trigger trap
```

**Fix:** This is expected behavior. Subshells should set their own traps if needed, or don't use subshells for code that needs cleanup.

**Errexit in trap:** If a command in your trap fails and you're using `set -e`, the trap handler stops executing.

```bash
cleanup() {
	rm "$file1"  # If this fails, next line doesn't run
	rm "$file2"
}
```

**Fix:** Make cleanup operations idempotent and ignore errors:

```bash
cleanup() {
	rm -f "$file1" || true
	rm -f "$file2" || true
}
```

### When NOT to Use

**Scripts that don't create temp files:** If your script doesn't use `mktemp` or create temporary files, this pattern is unnecessary (obviously).

**Very short-lived scripts:** If your script runs for <1 second and temp files would be cleaned up by OS soon anyway, the pattern adds little value. But the overhead is negligible, so using it anyway is fine.

**Alternative:** For scripts without temp files, don't use this pattern. For short scripts, still consider using it as good practice.

## Pattern 7: AI Integration (CLI Wrapper + Auth)

### Rationale

Modern shell scripts increasingly integrate AI tools (`claude`, `chatgpt`, `copilot`, etc.) for content generation. Common problems:

- **Authentication:** AI CLIs require auth that expires (OAuth tokens, SSO sessions, API keys)
- **Session management:** Detecting expired sessions and re-authenticating
- **Environment setup:** Setting provider-specific env vars before calling CLI
- **Shell function shadowing:** Shell functions shadow the real binary, causing recursion

A wrapper function pattern solves these:
1. Resolve real binary location before defining wrapper
2. Check auth state before each call
3. Refresh auth if expired
4. Set environment variables
5. Call real binary

This pattern is **generalized** - not tied to any specific AI provider. Examples show AWS SSO for context, but the pattern applies to any auth system.

### When to Use

- Scripts that call AI CLIs (claude, chatgpt, copilot, etc.)
- When AI CLI requires authentication that can expire
- When you need to set environment variables before calling AI tool
- Projects that integrate multiple AI providers

### Complete Example

**Example 1: Generalized AI CLI wrapper**

```bash
#!/usr/bin/env bash
# Wrapper for AI CLI with auth management

# Resolve real binary BEFORE defining wrapper
# command -v finds the real executable, not shell functions
_AI_CLI_REAL="$(command -v ai-cli)"

# Check if auth is valid
check_auth() {
	# Provider-specific check
	# Examples:
	# - For AWS SSO: aws sts get-caller-identity
	# - For OAuth: curl token endpoint
	# - For API key: check env var is set
	# Return 0 if valid, 1 if expired/missing

	# Generic example (replace with actual check):
	if [[ -z "${AI_API_KEY:-}" ]]; then
		return 1
	fi
	return 0
}

# Perform login
do_login() {
	# Provider-specific login
	# Examples:
	# - For AWS SSO: aws sso login --profile $profile
	# - For OAuth: open browser, wait for token
	# - For API key: prompt user to set env var

	log_info "Authentication required"

	# Generic example (replace with actual login):
	read -p "Enter API key: " -s api_key
	export AI_API_KEY="$api_key"
	echo
}

# Wrapper function
ai-cli() {
	# Check auth before every call
	if ! check_auth; then
		log_info "Session expired, authenticating..."
		do_login

		# Verify login worked
		if ! check_auth; then
			log_error "Authentication failed"
			return 1
		fi
	fi

	# Set provider-specific environment
	# Examples:
	# - For Bedrock: CLAUDE_CODE_USE_BEDROCK=true
	# - For OpenAI: OPENAI_API_KEY=$key
	# - For Azure: AZURE_ENDPOINT=$endpoint

	# Call real binary (not recursive - we resolved it earlier)
	"$_AI_CLI_REAL" "$@"
}
```

**Example 2: Specific implementation (AWS SSO with Bedrock)**

```bash
#!/usr/bin/env bash
# Claude CLI wrapper with AWS Bedrock SSO auth

_CLAUDE_REAL="$(command -v claude)"

# Claude wrapper
claude() {
	local profile="${AWS_PROFILE:-bedrock-profile}"

	# Check if AWS SSO session is valid
	if ! aws sts get-caller-identity --profile "$profile" &>/dev/null; then
		log_info "AWS SSO session expired, logging in..."
		aws sso login --profile "$profile"

		# Verify login worked
		if ! aws sts get-caller-identity --profile "$profile" &>/dev/null; then
			log_error "AWS SSO login failed"
			return 1
		fi
	fi

	# Set Bedrock environment and call real claude
	CLAUDE_CODE_USE_BEDROCK=true AWS_PROFILE="$profile" \
		"$_CLAUDE_REAL" "$@"
}
```

**Example 3: Multiple AI providers**

```bash
#!/usr/bin/env bash
# Support multiple AI providers with unified interface

_CLAUDE_REAL="$(command -v claude)"
_GPT_REAL="$(command -v chatgpt)"

# Claude via Bedrock
claude() {
	check_aws_auth "bedrock-profile" || return 1
	CLAUDE_CODE_USE_BEDROCK=true AWS_PROFILE="bedrock-profile" \
		"$_CLAUDE_REAL" "$@"
}

# ChatGPT via OpenAI API
chatgpt() {
	if [[ -z "${OPENAI_API_KEY:-}" ]]; then
		log_error "OPENAI_API_KEY not set"
		return 1
	fi
	"$_GPT_REAL" "$@"
}

# Unified interface - pick provider based on env var
ai() {
	local provider="${AI_PROVIDER:-claude}"
	case "$provider" in
		claude)
			claude "$@"
			;;
		gpt)
			chatgpt "$@"
			;;
		*)
			log_error "Unknown provider: $provider"
			return 1
			;;
	esac
}

# Helper for AWS SSO check
check_aws_auth() {
	local profile="$1"
	if ! aws sts get-caller-identity --profile "$profile" &>/dev/null; then
		log_info "AWS SSO session expired"
		aws sso login --profile "$profile"
		aws sts get-caller-identity --profile "$profile" &>/dev/null
	fi
}
```

### Gotchas

**Shell function shadowing:** If you define a function named `claude` and then try to call `claude` from within the function, you get infinite recursion.

**Fix:** Resolve the real binary path before defining the wrapper: `_CLAUDE_REAL="$(command -v claude)"`. Call `"$_CLAUDE_REAL"` from within the wrapper.

**Environment not exported:** If you set env vars without `export` or in the function body, they won't be seen by the called binary.

**Fix:** Either export vars globally or set them in the command prefix: `VAR=value "$binary" args`.

**Auth check too expensive:** If `check_auth` is slow (network request), calling it before every command adds latency.

**Fix:** Cache auth state with timestamp, only re-check after expiry window (e.g., 15 minutes).

**Login fails silently:** If `do_login` fails but doesn't return error code, wrapper tries to call CLI anyway and gets auth errors.

**Fix:** Always verify auth after login and return error if it fails.

### When NOT to Use

**One-off AI commands:** If you're writing a script that calls `claude` once and doesn't need to worry about session expiry, wrapping is overkill.

**AI CLI with no auth:** If the tool doesn't require authentication (local model, no API key), wrapping adds no value.

**Alternative:** For one-off commands, call the CLI directly. For no-auth tools, just call them directly.

## Pattern 8: Layered Context Loading

### Rationale

Scripts often need configuration from multiple sources with priority ordering:
- **Global config:** User's home directory (`~/.config/tool/`)
- **Repository config:** Project root (`.tool/` or `.config/`)
- **Runtime overrides:** Command-line arguments or environment variables

Naive approaches have problems:
- **Single config file:** Can't have both global defaults and repo-specific overrides
- **Hard-coded precedence:** Can't easily change priority or add new layers
- **String concatenation:** Joining configs with newlines produces extra blank lines

Layered loading pattern:
1. Define layers in priority order (later layers override earlier)
2. Load each layer if it exists
3. Combine with separators between non-empty layers
4. Pass combined context to tools

### When to Use

- Scripts that load AI context, configuration files, or instructions from multiple locations
- Tools that support both global defaults and per-project overrides
- When you want "base + overlay" configuration pattern

### Complete Example

```bash
#!/usr/bin/env bash
# Load context from multiple layers

# Load context files with priority ordering
load_context_files() {
	local context=""

	# Layer 1: Global base config (user's home directory)
	local global_context="${XDG_CONFIG_HOME:-$HOME/.config}/myapp/context.md"
	if [[ -f "$global_context" ]]; then
		context=$(cat "$global_context")
		log_debug "Loaded global context: $global_context"
	fi

	# Layer 2: Repository-specific overlay (optional)
	if in_git_repo; then
		local repo_root=$(git rev-parse --show-toplevel)
		local repo_context="$repo_root/.myapp/context.md"

		if [[ -f "$repo_context" ]]; then
			# Append with separator if base context exists
			if [[ -n "$context" ]]; then
				context="${context}\n\n---\n\n$(cat "$repo_context")"
			else
				context=$(cat "$repo_context")
			fi
			log_debug "Loaded repo context: $repo_context"
		fi
	fi

	# Layer 3: Runtime overrides (environment variable)
	if [[ -n "${MYAPP_EXTRA_CONTEXT:-}" ]]; then
		if [[ -n "$context" ]]; then
			context="${context}\n\n---\n\n${MYAPP_EXTRA_CONTEXT}"
		else
			context="${MYAPP_EXTRA_CONTEXT}"
		fi
		log_debug "Added runtime context from MYAPP_EXTRA_CONTEXT"
	fi

	echo -e "$context"
}

# Usage with AI CLI
generate_commit_message() {
	local context=$(load_context_files)
	local diff=$(git diff --cached)

	# Pass context and diff to AI
	claude prompt \
		--context "$context" \
		--stdin <<< "$diff" \
		"Generate a commit message for these changes"
}

# Helper to check if in git repo
in_git_repo() {
	git rev-parse --git-dir &>/dev/null
}
```

**Example 2: Layered configuration with TOML/JSON**

```bash
#!/usr/bin/env bash
# Load and merge configuration from multiple JSON files

load_config() {
	local merged_config="{}"

	# Layer 1: Default config (embedded)
	merged_config='{"timeout": 30, "retries": 3, "log_level": "info"}'

	# Layer 2: Global config
	local global_config="$HOME/.config/myapp/config.json"
	if [[ -f "$global_config" ]]; then
		# Merge with jq (later values override earlier)
		merged_config=$(jq -s '.[0] * .[1]' <(echo "$merged_config") "$global_config")
	fi

	# Layer 3: Repository config
	if in_git_repo; then
		local repo_root=$(git rev-parse --show-toplevel)
		local repo_config="$repo_root/.myapp/config.json"

		if [[ -f "$repo_config" ]]; then
			merged_config=$(jq -s '.[0] * .[1]' <(echo "$merged_config") "$repo_config")
		fi
	fi

	# Layer 4: Environment variable overrides
	if [[ -n "${MYAPP_TIMEOUT:-}" ]]; then
		merged_config=$(jq ".timeout = ${MYAPP_TIMEOUT}" <<< "$merged_config")
	fi
	if [[ -n "${MYAPP_LOG_LEVEL:-}" ]]; then
		merged_config=$(jq ".log_level = \"${MYAPP_LOG_LEVEL}\"" <<< "$merged_config")
	fi

	echo "$merged_config"
}

# Usage
config=$(load_config)
timeout=$(jq -r '.timeout' <<< "$config")
log_level=$(jq -r '.log_level' <<< "$config")

log_info "Using timeout: ${timeout}s, log level: $log_level"
```

### Gotchas

**Empty layers create extra separators:** If you naively concatenate with `\n\n---\n\n` between each layer, empty layers produce standalone separator lines.

**Fix:** Only add separator if previous content exists: `if [[ -n "$context" ]]; then context="${context}\n\n---\n\n$new"; else context="$new"; fi`

**Newline handling:** `echo -e` interprets escape sequences. If your content has literal `\n`, it gets converted to newlines.

**Fix:** If you need literal backslash-n, use `echo` without `-e` or `printf '%s'` for exact output.

**Wrong merge order:** If you accidentally merge layers in wrong order (later layers loaded first), priority is reversed.

**Fix:** Load layers in priority order: global first, repo second, runtime last. Later layers override earlier.

**File read errors:** If `cat` fails (permissions, missing file after check), context is incomplete.

**Fix:** Check file existence with `[[ -f ]]` before reading. Handle read errors explicitly if needed.

### When NOT to Use

**Single config source:** If your script only reads config from one location, layering is unnecessary complexity.

**No override requirements:** If users never need to override global config per-project, single config file is simpler.

**Alternative:** For single config source, just read the file directly. For no-override scenarios, use one global config file.

**Complex merging logic:** If config values need complex merging (arrays, nested objects with specific merge rules), bash is not the right tool.

**Alternative:** Use a proper config management tool or language (Python with TOML, Ruby with YAML, etc.).

## Cross-References

- **Nameref pattern for gum:** See bash-tools skill for gum-specific recipe with nameref to handle interactive inputs without TTY capture.
- **Guard variable naming:** See bash-style-guide §4 for naming conventions (`${PROJECT}_${MODULE}_LOADED`).
- **Trap cleanup in tests:** bash-testing skill uses trap-based cleanup (Pattern 6) for test isolation.

## Summary

These 8 patterns handle production scenarios that naive implementations miss:

- **Patterns 1-3** handle modular project architecture (guards, dispatch, wrapper detection)
- **Pattern 4** handles concurrent state management (flock)
- **Pattern 5** handles TTY access and complex returns (nameref)
- **Patterns 6-8** handle integration concerns (cleanup, AI auth, layered config)

Use patterns when the problem matches. Recognize when simpler solutions suffice. All patterns are proven in production codebases.
