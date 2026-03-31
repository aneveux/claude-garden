---
name: bash-tools
version: 1.0.0
description: |
  Preferred CLI tools and integration patterns for bash development. Apply when
  writing bash scripts that need interactive prompts, fuzzy search, terminal
  management, JSON processing, GitHub operations, secret management, directory
  navigation, or issue tracking. Covers gum, tv, tmux, jq, gh, pass, zoxide,
  sesh, and jira with usage patterns and recipes.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Bash Tools

This skill documents the preferred CLI tools for bash development and their integration patterns. These tools solve common problems more elegantly than hand-rolled bash implementations.

## Core Philosophy

**Compose, don't implement.** Modern CLI tools provide better UX, better error handling, and better terminal compatibility than custom bash solutions. Use them liberally.

## gum

`gum` is a tool for glamorous shell scripts. It provides interactive components, styled output, and consistent logging.

### When to Use

- All user-facing output (replace echo/printf)
- Interactive prompts and forms
- Spinners for long-running operations
- Styled and colored text
- Progress indicators

### Key Patterns

**1. Logging with gum log (PRIMARY OUTPUT METHOD)**

Use `gum log --level` for all user-facing messages. This provides consistent formatting, proper stderr/stdout separation, and level-based filtering.

```bash
# Log wrapper functions (use these everywhere)
log_info() {
	gum log --level info "$@"
}

log_warn() {
	gum log --level warn "$@"
}

log_error() {
	gum log --level error "$@"
}

log_debug() {
	if [[ "${DEBUG:-0}" == "1" ]]; then
		gum log --level debug "$@"
	fi
}

log_success() {
	gum log --level info "✓" "$@"
}

# Usage
log_info "Processing files..."
log_warn "Configuration file not found, using defaults"
log_error "Failed to connect to database"
log_debug "Variable value: $var"
log_success "All tests passed"
```

**Rationale:** `gum log` writes errors to stderr, supports multiple log levels, and works correctly with redirects. Much better than echo for user messages.

**2. Interactive text input**

Use `gum input` for single-line input and `gum write` for multi-line input.

```bash
# Single-line input
name=$(gum input --placeholder "Enter your name")

# Multi-line input (opens editor)
description=$(gum write --placeholder "Enter description...")

# With validation
email=$(gum input --placeholder "Email address" --prompt "Email: ")
if [[ ! "$email" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
	log_error "Invalid email format"
	return 1
fi
```

**Nameref pattern for interactive input (avoid subshell TTY issues):**

```bash
# Function that returns value via nameref
get_user_input() {
	local prompt="$1"
	local -n result_var="$2"  # Nameref

	local value
	if ! value=$(gum write --header "$prompt" --placeholder "Type here..."); then
		return 1
	fi

	result_var="$value"  # Return via nameref
}

# Usage (no subshell, TTY works correctly)
local description
if ! get_user_input "Description" description; then
	log_error "Input cancelled"
	return 1
fi
log_info "Got: $description"
```

**Rationale:** Subshells (`var=$(gum write)`) capture stdin, breaking TTY access. Nameref pattern avoids this.

**3. Selection and confirmation**

```bash
# Single choice from list
action=$(gum choose "create" "update" "delete" "cancel")

# Multi-select
selected=$(gum choose --no-limit "option1" "option2" "option3")

# Confirmation
if gum confirm "Delete all files?"; then
	log_info "Confirmed deletion"
else
	log_info "Cancelled"
fi

# With custom prompt
if gum confirm --affirmative="Yes, delete" --negative="No, keep" "Really delete?"; then
	rm -rf "$target"
fi
```

**4. Spinners for long operations**

```bash
# Simple spinner
gum spin --spinner dot --title "Processing..." -- sleep 5

# With command
gum spin --title "Installing dependencies..." -- npm install

# In function
process_data() {
	gum spin --title "Processing large dataset..." -- bash -c '
		# Long-running operation here
		sleep 10
	'
}

# Custom spinner
gum spin --spinner moon --title "Deploying..." -- ./deploy.sh
```

**5. Styled output**

```bash
# Colored text
gum style --foreground 212 "This is pink text"

# Bold and colored
gum style --bold --foreground 99 "Important message"

# Borders and padding
gum style \
	--border double \
	--padding "1 2" \
	--border-foreground 212 \
	"Boxed message"

# Multiple styles
header=$(gum style --bold --foreground 212 "DEPLOYMENT COMPLETE")
details=$(gum style --foreground 246 "All services running")
echo "$header"
echo "$details"
```

### Don't Use When

- **Non-interactive scripts** - CI/CD or cron jobs where no TTY available
- **Data output for piping** - Use plain echo/printf when output is consumed by another program
- **Performance-critical loops** - gum has startup overhead, don't call in tight loops

## tv (television)

`tv` is a fast, Rust-based fuzzy finder built around **channels** — TOML configs that define searchable data sources with preview and actions. It replaces fzf as the preferred interactive picker.

For comprehensive tv patterns, channel creation, custom TOML configs, and shell integration, load the **vine** skill. Below are the essentials for bash scripting.

### When to Use

- Selecting from lists of items (files, commits, options)
- Filtering large datasets interactively
- File picking with preview
- Building reusable selection channels

### Key Patterns

**1. Basic selection from piped input**

```bash
# Select from piped input (stdin channel)
selected=$(ls | tv)

# Select file from git
file=$(git ls-files | tv)

# Select from array
options=("option1" "option2" "option3")
choice=$(printf '%s\n' "${options[@]}" | tv)
```

**2. Built-in channels**

tv ships with channels for common sources — no piping required:

```bash
# File picker
file=$(tv files)

# Git log picker
commit=$(tv git-log)

# Environment variables
var=$(tv env)
```

**3. Nameref pattern for TTY access**

Like any interactive tool, tv needs TTY access. Use nameref to avoid subshell capture (see bash-patterns §5 for full rationale):

```bash
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

# Usage: select_from_list chosen "feature" "bugfix" "refactor"
```

### Don't Use When

- **Non-interactive context** - Scripts without TTY
- **Few items** - For 2-3 options, use `gum choose` instead (simpler, faster)
- **Custom channels needed** - Load vine skill for TOML channel patterns

## tmux

`tmux` is a terminal multiplexer for managing sessions and panes.

### When to Use

- Setting up project workspaces
- Persistent remote sessions
- Split-pane development workflows
- Session management across projects

### Key Patterns

**1. Session management**

```bash
# Create or attach to session
session="myproject"
if tmux has-session -t "$session" 2>/dev/null; then
	tmux attach-session -t "$session"
else
	tmux new-session -s "$session"
fi

# Create session with initial command
tmux new-session -s "$session" -n "main" -d
tmux send-keys -t "$session:main" "cd ~/projects/$session" C-m

# Attach to session
tmux attach-session -t "$session"
```

**2. Pane splitting and layout**

```bash
# Create session with split panes
tmux new-session -s workspace -d
tmux split-window -h -t workspace  # Horizontal split
tmux split-window -v -t workspace  # Vertical split

# Send commands to specific panes
tmux send-keys -t workspace:0.0 "vim" C-m
tmux send-keys -t workspace:0.1 "git status" C-m

# Attach
tmux attach-session -t workspace
```

**3. Workspace setup script**

```bash
setup_workspace() {
	local project="$1"
	local session="${project##*/}"

	if tmux has-session -t "$session" 2>/dev/null; then
		log_info "Session $session already exists"
		tmux attach-session -t "$session"
		return
	fi

	log_info "Creating workspace for $project"

	# Create session with main editor pane
	tmux new-session -s "$session" -n "code" -d -c "$project"
	tmux send-keys -t "$session:code" "vim" C-m

	# Create horizontal split for terminal
	tmux split-window -h -t "$session:code" -c "$project"

	# Create new window for git operations
	tmux new-window -t "$session" -n "git" -c "$project"
	tmux send-keys -t "$session:git" "git status" C-m

	# Attach to session
	tmux attach-session -t "$session"
}
```

**4. Session checking and cleanup**

```bash
# List sessions
tmux list-sessions

# Check if session exists
if tmux has-session -t "$session" 2>/dev/null; then
	log_info "Session exists"
fi

# Kill session
tmux kill-session -t "$session"

# Kill all sessions except current
tmux kill-session -a
```

### Don't Use When

- **Simple single-command scripts** - Overhead not worth it
- **No persistent workspace needed** - Just use regular terminal
- **CI/CD environments** - No interactive session management needed

## jq

`jq` is a command-line JSON processor for parsing and manipulating JSON data.

### When to Use

- Parsing API responses
- Processing JSON config files
- Extracting fields from structured data
- Transforming JSON structure
- Building JSON output

### Key Patterns

**1. Field extraction**

```bash
# Extract single field
name=$(echo "$json" | jq -r '.name')

# Nested field
email=$(echo "$json" | jq -r '.user.email')

# Optional field (won't error if missing)
description=$(echo "$json" | jq -r '.description // "No description"')

# Multiple fields
echo "$json" | jq -r '.name, .email, .created_at'
```

**Rationale:** `-r` flag outputs raw strings without quotes. Essential for shell variable assignment.

**2. Array processing**

```bash
# Extract field from all array elements
names=$(echo "$json" | jq -r '.[].name')

# Filter array
active=$(echo "$json" | jq -r '.[] | select(.active == true) | .id')

# Map array
ids=$(echo "$json" | jq -r '.users | map(.id) | .[]')

# First/last element
first=$(echo "$json" | jq -r '.[0].name')
last=$(echo "$json" | jq -r '.[-1].name')

# Count elements
count=$(echo "$json" | jq 'length')
```

**3. Complex selections and transformations**

```bash
# Select with multiple conditions
results=$(echo "$json" | jq -r '.[] | select(.status == "active" and .role == "admin")')

# Construct new object
transformed=$(echo "$json" | jq '{
	id: .user_id,
	name: .full_name,
	email: .contact.email
}')

# Group by field
grouped=$(echo "$json" | jq 'group_by(.category)')
```

**4. Building JSON output**

```bash
# From shell variables
result=$(jq -n \
	--arg name "$name" \
	--arg email "$email" \
	--argjson age "$age" \
	'{name: $name, email: $email, age: $age}')

# Array from arguments
items=$(jq -n --arg a "$item1" --arg b "$item2" '[$a, $b]')

# Complex structure
config=$(jq -n \
	--arg env "$ENVIRONMENT" \
	--argjson port "$PORT" \
	'{
		environment: $env,
		server: {port: $port, host: "localhost"}
	}')
```

**5. Practical API parsing**

```bash
# GitHub API with jq
pr_info=$(gh api "repos/$OWNER/$REPO/pulls/$PR_NUMBER")
pr_title=$(echo "$pr_info" | jq -r '.title')
pr_author=$(echo "$pr_info" | jq -r '.user.login')
pr_state=$(echo "$pr_info" | jq -r '.state')

# Extract array of values
reviewers=$(echo "$pr_info" | jq -r '.requested_reviewers[].login')

# Format for display
echo "$pr_info" | jq -r '"PR #\(.number): \(.title) by \(.user.login)"'
```

### Don't Use When

- **Simple key=value config** - Use grep/source for basic shell configs
- **Non-JSON data** - Use awk/sed for other structured formats
- **Performance-critical loops** - Parsing overhead matters in tight loops

## gh

`gh` is the official GitHub CLI for interacting with GitHub from the command line.

### When to Use

- Creating, viewing, merging pull requests
- Managing issues
- Running GitHub Actions workflows
- Making authenticated API calls
- Repository operations

### Key Patterns

**1. Pull request workflow**

```bash
# Create PR
gh pr create \
	--title "Add new feature" \
	--body "Description of changes" \
	--base main \
	--head feature-branch

# Create PR interactively
gh pr create --web

# View current PR
gh pr view

# View specific PR
gh pr view 123

# View PR with JSON output
gh pr view 123 --json number,title,body,state,author

# List PRs
gh pr list --state open --limit 20

# Merge PR
gh pr merge 123 --squash --delete-branch

# Check PR status
gh pr checks
```

**2. Issue management**

```bash
# Create issue
gh issue create \
	--title "Bug report" \
	--body "Description" \
	--label bug \
	--assignee "@me"

# Create issue interactively
gh issue create --web

# List issues
gh issue list --state open --assignee "@me"

# View issue
gh issue view 456

# Close issue
gh issue close 456 --comment "Fixed in PR #123"
```

**3. GitHub API access**

```bash
# Raw API call (auth handled automatically)
gh api repos/:owner/:repo/issues

# POST request
gh api -X POST repos/:owner/:repo/issues \
	--field title="New issue" \
	--field body="Description"

# GraphQL query
gh api graphql -f query='
	query {
		viewer {
			login
			name
		}
	}
'

# With variables
gh api graphql \
	-f query='query($owner: String!, $repo: String!) { ... }' \
	-F owner="$OWNER" \
	-F repo="$REPO"
```

**4. Repository operations**

```bash
# Clone with gh (sets up auth)
gh repo clone owner/repo

# Create repo
gh repo create new-repo --public --description "My project"

# Fork repo
gh repo fork owner/repo --clone

# View repo
gh repo view owner/repo

# List repos
gh repo list owner --limit 30
```

**5. Workflow integration**

```bash
# Run workflow
gh workflow run deploy.yml --ref main

# List workflow runs
gh run list --workflow=deploy.yml

# View run details
gh run view 123456

# Watch run progress
gh run watch 123456

# Download artifacts
gh run download 123456
```

### Don't Use When

- **Non-GitHub repositories** - Obviously, use git directly
- **Operations not supported** - Some advanced git operations require direct git commands
- **Offline work** - Need network for API calls

## pass

`pass` is a password manager for the command line, storing secrets in GPG-encrypted files.

### When to Use

- Retrieving API tokens
- Loading credentials for scripts
- Managing secrets securely
- Environment variable injection

### Key Patterns

**1. Basic secret retrieval**

```bash
# Get secret
token=$(pass show api/github/token)

# Get specific line (first line is usually the secret)
password=$(pass show services/database | head -n1)

# Use in API call
curl -H "Authorization: Bearer $(pass show api/github/token)" \
	https://api.github.com/user
```

**2. Variable assignment pattern**

```bash
# Load secret into variable
load_secret() {
	local secret_path="$1"
	local -n target_var="$2"

	if ! target_var=$(pass show "$secret_path" 2>/dev/null); then
		log_error "Failed to load secret: $secret_path"
		return 1
	fi

	log_debug "Loaded secret from: $secret_path"
}

# Usage
local api_token
if ! load_secret "api/github/token" api_token; then
	return 1
fi

# Use the token
curl -H "Authorization: Bearer $api_token" "$API_URL"
```

**3. Checking secret existence**

```bash
# Check if secret exists before using
if pass show "api/service/key" &>/dev/null; then
	key=$(pass show "api/service/key")
	log_info "Using API key from pass"
else
	log_warn "API key not found in pass, trying environment"
	key="${SERVICE_API_KEY:-}"
fi
```

**4. Multi-line secrets**

```bash
# Get full secret (including multi-line)
ssh_key=$(pass show ssh/deploy-key)

# Write to temporary file
temp_key=$(mktemp)
pass show ssh/deploy-key > "$temp_key"
chmod 600 "$temp_key"
ssh -i "$temp_key" user@host
rm -f "$temp_key"
```

### Don't Use When

- **Non-sensitive configuration** - Use regular config files for non-secrets
- **Values already in environment** - If `$VAR` is already set, no need to fetch from pass
- **Pass not installed** - Fall back to environment variables or prompt user

## zoxide

`zoxide` is a smarter `cd` that learns your directory habits. It tracks visit frequency and recency to jump to directories by partial name.

### When to Use

- Navigating between project directories in scripts
- Setting up workspace automation
- Any script that needs to resolve a frequently-visited path

### Key Patterns

**1. Directory jumping**

```bash
# Jump to best match for "projects"
z projects

# Jump to best match for "projects" containing "myapp"
z projects myapp

# Interactive selection (uses tv)
zi
```

**2. In scripts**

```bash
# Get path without changing directory
project_dir=$(zoxide query projects myapp)

# Add directory to zoxide database
zoxide add /path/to/important/dir

# Resolve and cd
cd "$(zoxide query "$project")" || return 1
```

### Don't Use When

- **First-time directories** - zoxide needs prior visits, use full paths
- **CI/CD** - No zoxide database in ephemeral environments
- **Deterministic scripts** - Use explicit paths when reproducibility matters

## sesh

`sesh` is a tmux session manager that connects directories to named sessions. It replaces manual tmux session creation with project-based session handling.

### When to Use

- Project-based tmux session management
- Quick switching between project workspaces
- Automating development environment setup

### Key Patterns

**1. Session management**

```bash
# Connect to or create session for current directory
sesh connect .

# Connect to named project
sesh connect myproject

# List sessions
sesh list

# Interactive session picker (pairs well with tv)
sesh connect "$(sesh list | tv)"
```

**2. In scripts**

```bash
# Setup workspace script
setup_workspace() {
	local project="$1"
	local project_dir
	project_dir=$(zoxide query "$project") || return 1

	sesh connect "$project_dir"
}
```

### Don't Use When

- **No tmux** - sesh requires tmux
- **Simple one-off commands** - Overhead not worth it for quick tasks
- **Custom pane layouts** - Use tmux directly for complex split configurations

## jira

`jira` ([ankitpokhrel/jira-cli](https://github.com/ankitpokhrel/jira-cli)) is a Go-based CLI for interacting with Jira from the terminal.

### When to Use

- Viewing and creating issues from scripts
- Sprint management automation
- Integrating Jira workflow into dev tools

### Key Patterns

**1. Issue operations**

```bash
# List issues assigned to me
jira issue list -a"$(jira me)"

# View issue details
jira issue view PROJ-123

# Create issue
jira issue create -tBug -s"Login fails on Safari" -pHigh

# Move issue to In Progress
jira issue move PROJ-123 "In Progress"
```

**2. Sprint operations**

```bash
# List current sprint issues
jira sprint list --current

# Add issue to sprint
jira sprint add SPRINT_ID PROJ-123
```

**3. Integration with other tools**

```bash
# Interactive issue picker
issue=$(jira issue list -a"$(jira me)" --plain --no-headers | \
	tv | awk '{print $2}')

# Create branch from issue key
git checkout -b "feature/$issue"
```

### Don't Use When

- **GitHub Issues** - Use `gh` instead
- **No Jira instance** - Obviously
- **Batch API automation** - Consider Jira REST API directly for heavy operations

## Tool Recipes

These patterns show how to combine tools for powerful workflows.

### Recipe 1: jq + tv (Interactive JSON Selection)

```bash
# Select GitHub issue interactively
select_issue() {
	local issue_json
	issue_json=$(gh api "repos/$OWNER/$REPO/issues?state=open")

	local issue_number
	issue_number=$(echo "$issue_json" | \
		jq -r '.[] | "\(.number)\t\(.title)"' | \
		tv | cut -f1)

	if [[ -z "$issue_number" ]]; then
		return 1
	fi

	echo "$issue_number"
}

# Usage
if issue=$(select_issue); then
	log_info "Selected issue #$issue"
fi
```

### Recipe 2: gh + jq (Structured GitHub Data)

```bash
# Get PR information as structured data
get_pr_data() {
	local pr_number="$1"

	# Fetch PR data as JSON
	local pr_json
	pr_json=$(gh pr view "$pr_number" --json number,title,body,state,author,createdAt)

	# Extract fields
	local title
	title=$(echo "$pr_json" | jq -r '.title')
	local author
	author=$(echo "$pr_json" | jq -r '.author.login')
	local state
	state=$(echo "$pr_json" | jq -r '.state')

	log_info "PR #$pr_number: $title"
	log_info "Author: $author, State: $state"
}
```

### Recipe 3: gum spin + Long Operation

```bash
# Deploy with spinner
deploy() {
	local environment="$1"

	if ! gum spin --title "Deploying to $environment..." -- bash -c "
		./scripts/build.sh &&
		./scripts/deploy.sh $environment
	"; then
		log_error "Deployment failed"
		return 1
	fi

	log_success "Deployment complete"
}
```

### Recipe 4: pass + Variable (Secure Loading)

```bash
# Initialize API client with secret from pass
init_api_client() {
	local api_token
	if ! api_token=$(pass show api/service/token 2>/dev/null); then
		log_error "Failed to load API token from pass"
		log_info "Run: pass insert api/service/token"
		return 1
	fi

	# Export for child processes
	export SERVICE_API_TOKEN="$api_token"

	log_success "API client initialized"
}
```

### Recipe 5: tv Files (File Selection)

```bash
# Select and edit file with tv's built-in files channel
edit_file() {
	local file
	file=$(tv files)

	if [[ -n "$file" ]]; then
		"${EDITOR:-vim}" "$file"
	fi
}
```

### Recipe 6: sesh + zoxide (Smart Workspace)

```bash
# Jump to project and connect tmux session
open_project() {
	local project="$1"
	local project_dir
	project_dir=$(zoxide query "$project") || {
		log_error "Unknown project: $project"
		return 1
	}

	sesh connect "$project_dir"
}

# Interactive project picker
pick_project() {
	local session
	session=$(sesh list | tv)

	if [[ -n "$session" ]]; then
		sesh connect "$session"
	fi
}
```

### Recipe 7: jira + tv (Interactive Issue Workflow)

```bash
# Pick an issue and start working on it
start_work() {
	local issue
	issue=$(jira issue list -a"$(jira me)" --plain --no-headers | \
		tv | awk '{print $2}')

	if [[ -z "$issue" ]]; then
		return 1
	fi

	jira issue move "$issue" "In Progress"
	git checkout -b "feature/$issue"
	log_success "Working on $issue"
}
```

## Don't Hand-Roll Reference

This table shows what **not** to build manually. Use the tools instead.

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Interactive prompts | Custom read loops with validation | `gum input`, `gum write`, `gum choose` |
| Fuzzy search | grep + loop | `tv` with channels (see vine skill) |
| JSON parsing | sed/awk/grep hacks | `jq` for all JSON operations |
| GitHub API | curl + manual auth + token management | `gh api` with automatic auth |
| Spinner/progress | Manual animation loops with sleep | `gum spin` |
| Logging | echo with colors and manual stderr | `gum log --level` |
| Colored output | Manual ANSI escape codes | `gum style` with borders |
| Directory jumping | cd + manual bookmarks | `zoxide` with frecency ranking |
| Session management | Custom tmux session scripts | `sesh` for project-based sessions |
| Issue tracking | curl + Jira REST API | `jira` CLI for issue/sprint ops |
| Secret storage | Plain text files or env vars | `pass` with GPG encryption |

## Summary

**Key Principles:**

1. **gum log is the primary output method** - Use it for all user-facing messages with appropriate levels
2. **Prefer composition over implementation** - These tools exist for a reason, use them
3. **Interactive tools need TTY** - Use nameref pattern to avoid subshell issues
4. **jq for all JSON** - Don't parse JSON with grep/sed/awk
5. **gh for all GitHub operations** - Auth is handled, API is simpler
6. **pass for secrets** - Never hardcode credentials
7. **tv for fuzzy selection** - Channel-based architecture, see vine skill for depth
8. **zoxide for navigation** - Frecency-based directory jumping
9. **sesh for sessions** - Project-based tmux session management
10. **jira for issue tracking** - CLI-native Jira workflow
11. **Combine tools for powerful workflows** - jq + tv, gh + jq, sesh + zoxide, jira + tv, etc.
