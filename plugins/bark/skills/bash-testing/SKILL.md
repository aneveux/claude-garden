---
name: bash-testing
version: 1.0.0
description: |
  Testing infrastructure and patterns for bash scripts. Apply when writing bats
  tests, setting up test environments, creating mocks, organizing test files,
  handling CI mode, or writing test assertions. Covers bats setup with git
  submodules, test isolation with setup/teardown, inline heredoc mocking,
  CI-aware testing patterns, assertion strategies, and test organization.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Bash Testing

This skill documents testing infrastructure and patterns for bash scripts using the bats testing framework. All patterns are production-proven and enable reliable, isolated, CI-compatible test suites.

## Core Philosophy

**Isolation is mandatory.** Every test gets a fresh environment, explicit setup, and guaranteed cleanup. Tests never depend on execution order, never share state, and never modify files outside their test directory.

## 1. Bats Setup with Git Submodules

**Rule:** Install bats and helpers as git submodules in `tests/lib/` or `test/lib/`.

**Rule:** Use all three libraries: bats-core (framework), bats-support (helpers), bats-assert (assertions).

**Rule:** Create `test_helper.bash` to load libraries and provide shared utilities.

**Rationale:** Git submodules pin exact versions, enable offline testing, and avoid CI environment setup. All three libraries work together to provide complete testing infrastructure.

### Installation Commands

```bash
# In project root
git submodule add https://github.com/bats-core/bats-core.git tests/lib/bats-core
git submodule add https://github.com/bats-core/bats-support.git tests/lib/bats-support
git submodule add https://github.com/bats-core/bats-assert.git tests/lib/bats-assert

# Commit submodule configuration
git add .gitmodules tests/lib/
git commit -m "test: add bats testing infrastructure"
```

### Resulting .gitmodules

```ini
[submodule "tests/lib/bats-core"]
	path = tests/lib/bats-core
	url = https://github.com/bats-core/bats-core.git
[submodule "tests/lib/bats-support"]
	path = tests/lib/bats-support
	url = https://github.com/bats-core/bats-support.git
[submodule "tests/lib/bats-assert"]
	path = tests/lib/bats-assert
	url = https://github.com/bats-core/bats-assert.git
```

### Cloning Project with Submodules

```bash
# Fresh clone
git clone <repo-url>
cd <repo>
git submodule update --init --recursive

# Or clone with submodules in one command
git clone --recursive <repo-url>
```

### Directory Convention

Both `tests/` and `test/` are acceptable directory names. Choose one convention per project:

- `tests/` - Common in single-file projects
- `test/` - Common in modular projects with `lib/` directory

Structure:
```
project/
├── tests/                          # or test/
│   ├── lib/
│   │   ├── bats-core/             # git submodule
│   │   ├── bats-support/          # git submodule
│   │   └── bats-assert/           # git submodule
│   ├── test_helper.bash           # Shared utilities
│   ├── test_feature1.bats         # One test file per feature
│   └── test_feature2.bats
└── src/                            # Code under test
```

### test_helper.bash Template

```bash
#!/usr/bin/env bash
# Shared test utilities and fixtures

# Get project root (one directory up from test directory)
PROJECT_ROOT="$(cd "$(dirname "$BATS_TEST_DIRNAME")" && pwd)"
export PROJECT_ROOT

#######################################
# Create isolated test git repository
# Globals:
#   BATS_FILE_TMPDIR - Bats temp directory
# Arguments:
#   $1 - Repo name (optional, default: test-repo)
# Outputs:
#   Prints path to created repository
# Returns:
#   0 if successful
#######################################
create_test_repo() {
	local repo_name="${1:-test-repo}"
	local repo_path="${BATS_FILE_TMPDIR}/${repo_name}"

	mkdir -p "$repo_path"
	cd "$repo_path"

	git init --quiet
	git config user.email "test@example.com"
	git config user.name "Test User"

	echo "# Test Repository" > README.md
	git add README.md
	git commit --quiet -m "Initial commit"

	echo "$repo_path"
}

#######################################
# Load project libraries for testing
# Sources library files and disables strict mode for test context.
# Globals:
#   PROJECT_ROOT - Project root directory
# Arguments:
#   $@ - Library names (without .sh extension)
# Example:
#   load_project_libs "git" "config" "log"
#######################################
load_project_libs() {
	export PROJECT_ROOT

	# Disable strict mode in tests (sourced code may assume it)
	set +e
	set +u
	set +o pipefail

	# Source each library
	for lib in "$@"; do
		# shellcheck source=/dev/null
		source "${PROJECT_ROOT}/lib/${lib}.sh"
	done
}
```

## 2. Test Structure and Organization

**Rule:** One test file per feature area.

**Rule:** File naming: `test_<feature>.bats` or `test_<feature_area>.bats`.

**Rule:** Every test file loads bats libraries, defines setup/teardown, and contains related @test blocks.

**Rationale:** One-per-feature organization keeps tests focused, makes failures easy to locate, and enables parallel test execution. Standard structure ensures consistency across projects.

### Test File Skeleton

```bash
#!/usr/bin/env bats
# Test suite for <feature area>

# Load Bats libraries
load 'lib/bats-support/load'
load 'lib/bats-assert/load'

# Path to script under test
SCRIPT_PATH="${BATS_TEST_DIRNAME}/../src/my-script.sh"

#######################################
# Setup - runs before each test
#######################################
setup() {
	# Create temporary directory
	TEST_DIR=$(mktemp -d)
	cd "$TEST_DIR"
	export TEST_DIR

	# Feature-specific setup (optional)
	# Create test fixtures, initialize state, etc.
}

#######################################
# Teardown - runs after each test
#######################################
teardown() {
	# Return to root and clean up temp directory
	cd /
	rm -rf "$TEST_DIR"
}

#######################################
# Tests
#######################################

@test "descriptive test name explains what is verified" {
	# Arrange
	echo "input data" > input.txt

	# Act
	run bash "$SCRIPT_PATH" input.txt

	# Assert
	assert_success
	assert_output "expected output"
}

@test "another test for same feature area" {
	# Test implementation
}
```

### Referencing Script Under Test

For executable scripts:
```bash
# Single-file script
SCRIPT_PATH="${BATS_TEST_DIRNAME}/../src/script.sh"

# Main dispatcher
SCRIPT_PATH="${BATS_TEST_DIRNAME}/../qf"

# Use in test
run bash "$SCRIPT_PATH" command --flag
```

For library functions:
```bash
# Load test helper to get load_project_libs
load 'test_helper'

setup() {
	# Load specific libraries
	load_project_libs "git" "config"

	# Now functions from those libs are available
	TEST_DIR=$(mktemp -d)
	cd "$TEST_DIR"
}

@test "library function works correctly" {
	# Call function directly (no 'run bash')
	run repo_root
	assert_success
}
```

## 3. Test Isolation with Setup and Teardown

**Rule:** Every test gets fresh temp directory via `mktemp -d` in setup().

**Rule:** Always `cd "$TEST_DIR"` in setup to isolate filesystem operations.

**Rule:** Always `cd / && rm -rf "$TEST_DIR"` in teardown to guarantee cleanup.

**Rule:** Never rely on execution order between tests.

**Rationale:** Full isolation prevents test pollution, makes tests independent, and enables parallel execution. Explicit cleanup prevents filesystem cruft and ensures tests pass in any order.

### Complete Setup/Teardown Template

```bash
setup() {
	# Create isolated temp directory
	TEST_DIR=$(mktemp -d)

	# Change to temp directory (all relative paths now isolated)
	cd "$TEST_DIR"

	# Export for access in helper functions
	export TEST_DIR

	# Feature-specific setup
	# Example: Create git repo
	git init --quiet
	git config user.email "test@example.com"
	git config user.name "Test User"

	# Example: Create initial files
	echo "initial content" > data.txt
}

teardown() {
	# Always change away from test directory first
	cd /

	# Clean up temp directory
	rm -rf "$TEST_DIR"

	# Unset exported variables (optional but clean)
	unset TEST_DIR
}
```

### Setup/Teardown Best Practices

```bash
# ✅ GOOD: Explicit cleanup, no assumptions
setup() {
	TEST_DIR=$(mktemp -d)
	cd "$TEST_DIR"
}

teardown() {
	cd /
	rm -rf "$TEST_DIR"
}

# ❌ BAD: No cleanup, pollutes filesystem
setup() {
	mkdir test-$$
	cd test-$$
}
# No teardown - files left behind

# ❌ BAD: Relies on execution order
@test "first test creates file" {
	echo "data" > shared.txt
}

@test "second test reads file" {
	# FAILS if run alone or in different order
	assert [ -f shared.txt ]
}

# ✅ GOOD: Each test is independent
@test "first test" {
	echo "data" > file.txt
	assert [ -f file.txt ]
}

@test "second test" {
	# Creates its own file, doesn't depend on previous test
	echo "data" > file.txt
	assert [ -f file.txt ]
}
```

## 4. Mock Strategy with Inline Heredoc

**Rule:** Create mock executables using heredoc scripts in setup().

**Rule:** Mocks go in `$TEST_DIR` (or `$TEST_DIR/bin/`), prepended to PATH.

**Rule:** Always `chmod +x` on each mock.

**Rule:** Use `env PATH="$TEST_DIR:$PATH"` per test run, not global export.

**Rationale:** Inline heredoc mocks are self-contained, don't require separate fixture files, can be customized per test, and enable testing without real tool dependencies.

### Basic Mock Pattern

```bash
setup() {
	TEST_DIR=$(mktemp -d)
	cd "$TEST_DIR"
	export TEST_DIR

	# Mock external tool with canned response
	cat > "$TEST_DIR/gum" << 'EOF'
#!/usr/bin/env bash
echo "mocked output"
EOF
	chmod +x "$TEST_DIR/gum"
}

@test "script calls mocked tool" {
	# Prepend mock directory to PATH for this test run
	run env PATH="$TEST_DIR:$PATH" bash "$SCRIPT_PATH" command

	assert_success
	assert_output --partial "mocked output"
}
```

### Mock with Conditional Behavior

```bash
setup() {
	TEST_DIR=$(mktemp -d)
	cd "$TEST_DIR"

	# Mock that responds differently based on arguments
	cat > "$TEST_DIR/gum" << 'EOF'
#!/usr/bin/env bash
if [[ "$1" == "confirm" ]]; then
	exit 0  # Auto-confirm
elif [[ "$1" == "input" ]]; then
	echo "mocked input"
elif [[ "$1" == "write" ]]; then
	echo "mocked multiline"
	echo "content here"
else
	echo "Unknown gum command: $1" >&2
	exit 1
fi
EOF
	chmod +x "$TEST_DIR/gum"
}
```

### Mock that Captures Arguments

```bash
setup() {
	TEST_DIR=$(mktemp -d)
	cd "$TEST_DIR"

	# Mock that records calls for assertion
	cat > "$TEST_DIR/claude" << 'EOF'
#!/usr/bin/env bash
# Capture arguments
echo "$@" >> "$TEST_DIR/claude.calls"

# Consume stdin (if any)
cat > /dev/null

# Return canned response
echo "AI generated response"
EOF
	chmod +x "$TEST_DIR/claude"
}

@test "script calls claude with correct arguments" {
	run env PATH="$TEST_DIR:$PATH" bash "$SCRIPT_PATH" generate

	assert_success

	# Verify arguments passed to mock
	assert [ -f "$TEST_DIR/claude.calls" ]
	run cat "$TEST_DIR/claude.calls"
	assert_output --partial "expected argument"
}
```

### Common Mock Examples

```bash
# Mock aws CLI (authentication wrapper)
cat > "$TEST_DIR/aws" << 'EOF'
#!/usr/bin/env bash
if [[ "$1" == "sts" ]] && [[ "$2" == "get-caller-identity" ]]; then
	echo '{"UserId":"AIDAI123","Account":"123456789012","Arn":"arn:aws:iam::123456789012:user/test"}'
	exit 0
fi
exit 0
EOF
chmod +x "$TEST_DIR/aws"

# Mock gh CLI
cat > "$TEST_DIR/gh" << 'EOF'
#!/usr/bin/env bash
if [[ "$1" == "pr" ]] && [[ "$2" == "create" ]]; then
	echo "https://github.com/owner/repo/pull/123"
	exit 0
elif [[ "$1" == "api" ]]; then
	echo '{"number":123,"title":"Test PR"}'
	exit 0
fi
exit 1
EOF
chmod +x "$TEST_DIR/gh"

# Mock claude with stdin consumption
cat > "$TEST_DIR/claude" << 'EOF'
#!/usr/bin/env bash
cat > /dev/null  # Consume stdin
echo "Refined output from AI"
EOF
chmod +x "$TEST_DIR/claude"

# Mock with exit code control
cat > "$TEST_DIR/tool" << 'EOF'
#!/usr/bin/env bash
if [[ "$1" == "--fail" ]]; then
	echo "Error occurred" >&2
	exit 1
fi
echo "Success"
exit 0
EOF
chmod +x "$TEST_DIR/tool"
```

### PATH Management for Mocks

```bash
# ✅ GOOD: PATH per test run, doesn't leak
@test "with mocks" {
	run env PATH="$TEST_DIR:$PATH" bash "$SCRIPT_PATH"
	assert_success
}

# ✅ GOOD: Multiple mocks in bin/ subdirectory
setup() {
	TEST_DIR=$(mktemp -d)
	cd "$TEST_DIR"
	mkdir bin

	cat > bin/gum << 'EOF'
#!/usr/bin/env bash
echo "mocked"
EOF
	chmod +x bin/gum

	cat > bin/tv << 'EOF'
#!/usr/bin/env bash
echo "selected"
EOF
	chmod +x bin/tv
}

@test "with multiple mocks" {
	run env PATH="$TEST_DIR/bin:$PATH" bash "$SCRIPT_PATH"
	assert_success
}

# ❌ BAD: Global PATH export affects all tests
setup() {
	TEST_DIR=$(mktemp -d)
	cd "$TEST_DIR"
	export PATH="$TEST_DIR:$PATH"  # Leaks to other tests
}
```

## 5. CI Mode and Non-Interactive Testing

**Rule:** Env var convention: `USE_GUM=0` and `CI=true` disable interactive prompts.

**Rule:** Document which env vars change behavior in script comments.

**Rule:** Tests always set CI mode environment to prevent hangs.

**Rule:** Code checks for CI mode: `if [[ "${USE_GUM:-1}" == "0" ]] || [[ -n "${CI:-}" ]]; then`

**Rationale:** Interactive tools like gum, tv require TTY and hang in CI. CI mode env vars enable non-interactive fallbacks. Tests must set these to be CI-compatible.

### Environment Variables

| Variable | Purpose | Values |
|----------|---------|--------|
| `CI` | Indicates CI environment | Set to any non-empty value (`true`, `1`) |
| `USE_GUM` | Controls gum usage | `0` = disabled, `1` or unset = enabled |
| `DEBUG` | Enables debug logging | `0` or unset = off, `1` = on |

### Test CI Mode Setup

```bash
@test "script works in CI mode" {
	# Set CI environment variables
	export CI=true
	export USE_GUM=0

	run bash "$SCRIPT_PATH" command

	assert_success
	# No interactive prompts occurred
}

@test "script with CI env set globally" {
	# Can also set in setup() for all tests
	run env CI=true USE_GUM=0 bash "$SCRIPT_PATH" command
	assert_success
}
```

### Code Pattern for CI Detection

```bash
# In script under test
ask_confirmation() {
	local prompt="$1"

	# Check for non-interactive mode
	if [[ "${USE_GUM:-1}" == "0" ]] || [[ -n "${CI:-}" ]]; then
		# CI mode: auto-confirm or use sensible default
		log_info "CI mode: auto-confirming: $prompt"
		return 0
	fi

	# Interactive mode: use gum
	if gum confirm "$prompt"; then
		return 0
	else
		return 1
	fi
}

get_user_input() {
	local prompt="$1"
	local default="${2:-}"

	if [[ "${USE_GUM:-1}" == "0" ]] || [[ -n "${CI:-}" ]]; then
		# CI mode: return default or fail if no default
		if [[ -n "$default" ]]; then
			echo "$default"
			return 0
		else
			log_error "CI mode: no default value for required input: $prompt"
			return 1
		fi
	fi

	# Interactive mode
	gum input --placeholder "$prompt" --value "$default"
}
```

### CI Mode Testing Patterns

```bash
@test "uses defaults in CI mode" {
	export CI=true

	run bash "$SCRIPT_PATH" create --name "test-project"

	assert_success
	# Verify defaults were used, no prompts
	assert_output --partial "Using default configuration"
}

@test "interactive mode prompts user (mocked)" {
	# Not in CI mode, but mock gum for testing
	cat > "$TEST_DIR/gum" << 'EOF'
#!/usr/bin/env bash
if [[ "$1" == "input" ]]; then
	echo "user-provided-value"
fi
EOF
	chmod +x "$TEST_DIR/gum"

	run env PATH="$TEST_DIR:$PATH" bash "$SCRIPT_PATH" create

	assert_success
	assert_output --partial "user-provided-value"
}

@test "fails in CI mode when required input has no default" {
	export CI=true

	run bash "$SCRIPT_PATH" create
	# No --name flag and no default in CI mode

	assert_failure
	assert_output --partial "required input"
}
```

### Cross-Reference

See bash-tools skill for gum fallback patterns and nameref interactive functions.

## 6. Assertion Patterns

**Rule:** Use bats-assert functions for readable, informative test failures.

**Rule:** Prefer specific assertions over generic `[ ]` tests.

**Rationale:** bats-assert provides clear failure messages with diffs, making test failures easy to diagnose.

### Core Assertions

```bash
# Exit code assertions
assert_success          # Exit code is 0
assert_failure          # Exit code is non-zero
assert_failure 2        # Exit code is exactly 2

# Output assertions
assert_output "exact match"                    # Output equals exactly
assert_output --partial "substring"            # Output contains substring
assert_output --regexp "pattern"               # Output matches regex
refute_output                                  # Output is empty
refute_output --partial "should not contain"   # Output doesn't contain

# Line-by-line assertions
assert_line "exact line"                       # Any line matches exactly
assert_line --index 0 "first line"             # Specific line matches
assert_line --partial "substring in line"      # Any line contains substring
refute_line "should not exist"                 # No line matches

# Equality assertions
assert_equal "$actual" "$expected"             # Values are equal
refute_equal "$actual" "$unexpected"           # Values are not equal
```

### File and Directory Assertions

```bash
# File existence
assert [ -f "path/to/file" ]
refute [ -f "should/not/exist" ]

# Directory existence
assert [ -d "path/to/directory" ]
refute [ -d "should/not/exist" ]

# File properties
assert [ -x "executable" ]        # File is executable
assert [ -r "readable" ]          # File is readable
assert [ -s "not-empty" ]         # File is not empty
```

### Output Matching Patterns

```bash
@test "exact output match" {
	run echo "hello world"
	assert_success
	assert_output "hello world"
}

@test "partial output match" {
	run echo "The quick brown fox"
	assert_output --partial "quick brown"
}

@test "regex output match" {
	run echo "Error: file not found"
	assert_output --regexp "^Error:.*not found$"
}

@test "multi-line output" {
	run bash -c 'echo "line1"; echo "line2"'
	assert_line --index 0 "line1"
	assert_line --index 1 "line2"
}

@test "output contains specific line" {
	run bash -c 'echo "foo"; echo "bar"; echo "baz"'
	assert_line "bar"  # Any line matches
}

@test "empty output" {
	run true
	refute_output
}
```

### Error Output Assertions (stderr)

```bash
@test "captures stderr" {
	run bash -c 'echo "error message" >&2; exit 1'

	assert_failure
	# By default, run captures both stdout and stderr to $output
	assert_output "error message"
}

@test "separates stdout and stderr" {
	# Use process substitution to separate streams
	run bash -c 'echo "stdout"; echo "stderr" >&2'

	assert_success
	# $output contains both
	assert_output --partial "stdout"
	assert_output --partial "stderr"
}
```

### Complex Assertions

```bash
@test "verifies file content" {
	echo "expected content" > expected.txt
	bash "$SCRIPT_PATH" create output.txt

	run cat output.txt
	assert_success
	assert_output "expected content"
}

@test "verifies JSON structure" {
	bash "$SCRIPT_PATH" generate config.json

	# Validate with jq
	run jq -e '.version == "1.0"' config.json
	assert_success

	run jq -r '.name' config.json
	assert_output "expected-name"
}

@test "verifies git operations" {
	git init --quiet

	bash "$SCRIPT_PATH" commit-changes

	run git log --oneline
	assert_success
	assert_line --partial "expected commit message"

	run git status --short
	refute_output  # Working directory is clean
}
```

## 7. Common Patterns and Recipes

### Pattern 1: Testing Git Operations

```bash
load 'test_helper'

setup() {
	TEST_DIR=$(mktemp -d)
	cd "$TEST_DIR"

	# Create test git repository
	git init --quiet
	git config user.email "test@example.com"
	git config user.name "Test User"

	# Create initial commit
	echo "# Test" > README.md
	git add README.md
	git commit --quiet -m "Initial commit"
}

teardown() {
	cd /
	rm -rf "$TEST_DIR"
}

@test "creates commit with changes" {
	echo "new file" > feature.txt
	git add feature.txt

	run bash "$SCRIPT_PATH" commit

	assert_success
	run git log --oneline
	assert_line --partial "expected commit message"
}

@test "fails when no changes staged" {
	run bash "$SCRIPT_PATH" commit

	assert_failure
	assert_output --partial "no changes"
}
```

### Pattern 2: Testing File Creation/Modification

```bash
@test "creates file if missing" {
	refute [ -f "output.txt" ]

	run bash "$SCRIPT_PATH" create output.txt

	assert_success
	assert [ -f "output.txt" ]
}

@test "modifies existing file" {
	echo "original" > data.txt

	run bash "$SCRIPT_PATH" update data.txt "new content"

	assert_success
	run cat data.txt
	assert_output "new content"
}

@test "preserves file permissions" {
	touch secure.txt
	chmod 600 secure.txt

	bash "$SCRIPT_PATH" modify secure.txt

	run stat -c "%a" secure.txt
	assert_output "600"
}
```

### Pattern 3: Testing CLI Argument Parsing

```bash
@test "requires positional argument" {
	run bash "$SCRIPT_PATH"

	assert_failure
	assert_output --partial "Usage:"
}

@test "accepts flag arguments" {
	run bash "$SCRIPT_PATH" --flag value command

	assert_success
	assert_output --partial "flag=value"
}

@test "handles unknown flags" {
	run bash "$SCRIPT_PATH" --unknown-flag

	assert_failure
	assert_output --partial "unknown"
}

@test "processes multiple arguments" {
	run bash "$SCRIPT_PATH" arg1 arg2 arg3

	assert_success
	assert_line --index 0 "arg1"
	assert_line --index 1 "arg2"
	assert_line --index 2 "arg3"
}
```

### Pattern 4: Testing Error Conditions

```bash
@test "fails on missing dependency" {
	# Mock missing tool
	run env PATH="/nonexistent:$PATH" bash "$SCRIPT_PATH" command

	assert_failure
	assert_output --partial "not found"
}

@test "fails on invalid input" {
	run bash "$SCRIPT_PATH" process invalid-file.txt

	assert_failure 1  # Specific exit code
	assert_output --partial "File not found"
}

@test "handles permission errors" {
	touch readonly.txt
	chmod 000 readonly.txt

	run bash "$SCRIPT_PATH" read readonly.txt

	assert_failure
	assert_output --partial "Permission denied"

	# Cleanup
	chmod 600 readonly.txt
}
```

### Pattern 5: Skipping Tests Conditionally

```bash
@test "requires network access" {
	if [[ -n "${CI:-}" ]]; then
		skip "Skipping network test in CI"
	fi

	run bash "$SCRIPT_PATH" fetch-remote-data

	assert_success
}

@test "requires specific tool" {
	if ! command -v docker &>/dev/null; then
		skip "docker not installed"
	fi

	run bash "$SCRIPT_PATH" docker-command

	assert_success
}
```

## 8. Running Tests

### Basic Test Execution

```bash
# Run all tests
tests/lib/bats-core/bin/bats tests/

# Run specific test file
tests/lib/bats-core/bin/bats tests/test_feature.bats

# Run with verbose output
tests/lib/bats-core/bin/bats --verbose tests/

# Run with tap output
tests/lib/bats-core/bin/bats --tap tests/

# Run tests in parallel
tests/lib/bats-core/bin/bats --jobs 4 tests/
```

### Makefile Integration

```makefile
.PHONY: test
test:
	tests/lib/bats-core/bin/bats tests/

.PHONY: test-verbose
test-verbose:
	tests/lib/bats-core/bin/bats --verbose tests/

.PHONY: test-specific
test-specific:
	tests/lib/bats-core/bin/bats tests/test_$(FEATURE).bats
```

### CI Configuration Example

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: recursive  # Initialize bats submodules

      - name: Run tests
        env:
          CI: true
          USE_GUM: 0
        run: |
          tests/lib/bats-core/bin/bats tests/
```

## Summary

**Key Testing Principles:**

1. **Isolation is mandatory** - Every test gets fresh environment with explicit cleanup
2. **Mock external dependencies** - Use inline heredoc mocks, never require real tools
3. **CI-aware by default** - Set USE_GUM=0 and CI=true to prevent interactive hangs
4. **One test file per feature** - Focused organization enables parallel execution
5. **Specific assertions** - Use bats-assert functions for clear failure messages
6. **Git submodules for bats** - Version pinning and offline testing
7. **No execution order dependencies** - Tests pass in any order, individually or as suite

**Cross-References:**

- See bash-style-guide §1 for strict mode conventions in scripts under test
- See bash-patterns §7 for trap-based cleanup in production code (not needed in tests due to bats teardown)
- See bash-tools for gum fallback patterns and nameref functions used in code under test

**When in doubt:** Isolate completely, mock everything external, assert specifically, and ensure CI compatibility.
