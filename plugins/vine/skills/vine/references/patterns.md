# Channel Patterns

Ready-to-use channel recipes for common use cases. Copy, adapt, and drop into
`~/.config/television/cable/`.

## Table of Contents

1. Git workflows
2. Docker / containers
3. Kubernetes
4. System administration
5. Development tools
6. Project-specific patterns
7. Scripting patterns

---

## 1. Git Workflows

### Interactive branch switcher with diff preview

```toml
[metadata]
name = "git-branch-preview"
description = "Switch branches with diff preview"
requirements = ["git"]

[source]
command = "git branch --format='%(refname:short)\\t%(objectname:short)\\t%(subject)'"
display = "{split:\\t:0|pad:30: :right} {split:\\t:1} {split:\\t:2}"
output = "{split:\\t:0}"

[preview]
command = "git log --oneline -20 '{split:\\t:0}'"

[keybindings]
ctrl-d = "actions:diff"
ctrl-e = "actions:checkout"

[actions.diff]
description = "Show diff against current branch"
command = "git diff '{split:\\t:0}'"
mode = "fork"

[actions.checkout]
description = "Checkout branch"
command = "git checkout '{split:\\t:0}'"
mode = "execute"
```

### Interactive commit browser

```toml
[metadata]
name = "git-commits"
description = "Browse commits with full diff preview"
requirements = ["git"]

[source]
command = "git log --oneline --format='%h\\t%s\\t%an\\t%cr' -100"
display = "{split:\\t:0} {split:\\t:1} ({split:\\t:3})"
output = "{split:\\t:0}"

[preview]
command = "git show --stat --color=always '{split:\\t:0}'"

[keybindings]
ctrl-d = "actions:full-diff"
ctrl-p = "actions:cherry-pick"

[actions.full-diff]
description = "Full diff"
command = "git show --color=always '{split:\\t:0}' | less -R"
mode = "execute"

[actions.cherry-pick]
description = "Cherry-pick commit"
command = "git cherry-pick '{split:\\t:0}'"
mode = "fork"
```

## 2. Docker / Containers

### Full container management

```toml
[metadata]
name = "docker-manage"
description = "Full Docker container management"
requirements = ["docker"]

[source]
command = ["docker ps --format '{{.ID}}\\t{{.Names}}\\t{{.Image}}\\t{{.Status}}'",
           "docker ps -a --format '{{.ID}}\\t{{.Names}}\\t{{.Image}}\\t{{.Status}}'"]
display = "{split:\\t:1|pad:25: :right} {split:\\t:2|pad:30: :right} {split:\\t:3}"
output = "{split:\\t:0}"

[preview]
command = "docker inspect '{split:\\t:0}' | jq '.[0] | {State, Config: {Image: .Config.Image, Cmd: .Config.Cmd, Env: .Config.Env[:5]}}'"

[keybindings]
shortcut = "f5"
ctrl-l = "actions:logs"
ctrl-x = "actions:stop"
ctrl-a = "actions:attach"
ctrl-r = "actions:restart"

[actions.logs]
description = "Tail logs"
command = "docker logs -f --tail 100 '{split:\\t:0}'"
mode = "execute"

[actions.stop]
description = "Stop container"
command = "docker stop '{split:\\t:0}' && echo 'Stopped'"
mode = "fork"

[actions.restart]
description = "Restart container"
command = "docker restart '{split:\\t:0}' && echo 'Restarted'"
mode = "fork"

[actions.attach]
description = "Shell into container"
command = "docker exec -it '{split:\\t:0}' /bin/sh"
mode = "execute"
```

### Docker compose services

```toml
[metadata]
name = "docker-compose-services"
description = "Manage docker compose services"
requirements = ["docker"]

[source]
command = "docker compose ps --format '{{.Name}}\\t{{.Service}}\\t{{.State}}\\t{{.Ports}}'"
display = "{split:\\t:1|pad:20: :right} {split:\\t:2|pad:10: :right} {split:\\t:3}"
output = "{split:\\t:1}"

[preview]
command = "docker compose logs --tail 30 '{split:\\t:1}'"

[keybindings]
ctrl-r = "actions:restart"
ctrl-l = "actions:logs"

[actions.restart]
description = "Restart service"
command = "docker compose restart '{split:\\t:1}'"
mode = "fork"

[actions.logs]
description = "Follow logs"
command = "docker compose logs -f '{split:\\t:1}'"
mode = "execute"
```

## 3. Kubernetes

### Pod manager with namespace awareness

```toml
[metadata]
name = "k8s-pod-manager"
description = "Browse and manage K8s pods across namespaces"
requirements = ["kubectl"]

[source]
command = ["kubectl get pods -A --no-headers -o custom-columns='NS:.metadata.namespace,NAME:.metadata.name,STATUS:.status.phase,RESTARTS:.status.containerStatuses[0].restartCount,AGE:.metadata.creationTimestamp'",
           "kubectl get pods --no-headers -o custom-columns='NS:.metadata.namespace,NAME:.metadata.name,STATUS:.status.phase,RESTARTS:.status.containerStatuses[0].restartCount,AGE:.metadata.creationTimestamp'"]
display = "{0|pad:20: :right} {1|pad:40: :right} {2}"
output = "{1}"

[preview]
command = "kubectl describe pod '{1}' -n '{0}'"

[keybindings]
ctrl-l = "actions:logs"
ctrl-e = "actions:exec"
ctrl-d = "actions:delete"

[actions.logs]
description = "Stream pod logs"
command = "kubectl logs -f '{1}' -n '{0}'"
mode = "execute"

[actions.exec]
description = "Exec into pod"
command = "kubectl exec -it '{1}' -n '{0}' -- /bin/sh"
mode = "execute"

[actions.delete]
description = "Delete pod"
command = "kubectl delete pod '{1}' -n '{0}'"
mode = "fork"
```

## 4. System Administration

### Service manager (systemd)

```toml
[metadata]
name = "services"
description = "Manage systemd services"
requirements = ["systemctl"]

[source]
command = ["systemctl list-units --type=service --no-legend --no-pager",
           "systemctl list-unit-files --type=service --no-legend --no-pager"]
display = "{}"
output = "{0}"

[preview]
command = "systemctl status '{0}' 2>&1"

[keybindings]
ctrl-r = "actions:restart"
ctrl-s = "actions:stop"
ctrl-j = "actions:journal"

[actions.restart]
description = "Restart service"
command = "sudo systemctl restart '{0}'"
mode = "fork"

[actions.stop]
description = "Stop service"
command = "sudo systemctl stop '{0}'"
mode = "fork"

[actions.journal]
description = "View journal"
command = "journalctl -u '{0}' -f"
mode = "execute"
```

### Port inspector

```toml
[metadata]
name = "ports"
description = "Inspect listening ports"

[source]
command = "ss -tlnp | tail -n +2"
display = "{}"
output = "{3}"
no_sort = true

[preview]
command = "ss -tlnp | head -1 && ss -tlnp | grep '{3}'"
```

## 5. Development Tools

### TODO/FIXME browser

```toml
[metadata]
name = "todos"
description = "Browse TODO and FIXME comments in codebase"
requirements = ["rg"]

[source]
command = "rg --line-number --color=never '(TODO|FIXME|HACK|XXX|WARN):?' --no-heading"
display = "{}"
output = "{split:::0}"

[preview]
command = "bat -n --color=always --highlight-line {split:::1} '{split:::0}'"
offset = "{split:::1}"

[keybindings]
ctrl-e = "actions:edit"

[actions.edit]
description = "Open in editor"
command = "${EDITOR:-vim} +{split:::1} '{split:::0}'"
mode = "execute"
```

### Project file browser with bat preview

```toml
[metadata]
name = "project-files"
description = "Browse project files with syntax highlighting"
requirements = ["fd", "bat"]

[source]
command = "fd -t f --hidden --exclude .git"

[preview]
command = "bat -n --color=always '{}'"

[keybindings]
ctrl-e = "actions:edit"
ctrl-y = "actions:copy-path"

[actions.edit]
description = "Open in editor"
command = "${EDITOR:-vim} '{}'"
mode = "execute"

[actions.copy-path]
description = "Copy path to clipboard"
command = "echo -n '{}' | xclip -selection clipboard"
mode = "fork"
```

## 6. Project-Specific Patterns

### Generic "pick from JSON" pattern

When a tool outputs JSON, use `jq` to extract and format:

```toml
[metadata]
name = "npm-deps"
description = "Browse npm dependencies"

[source]
command = "jq -r '.dependencies // {} | to_entries[] | \"\\(.key)\\t\\(.value)\"' package.json"
display = "{split:\\t:0|pad:30: :right} {split:\\t:1}"
output = "{split:\\t:0}"

[preview]
command = "npm info '{split:\\t:0}' 2>/dev/null || echo 'No info available'"
```

### Makefile target picker

```toml
[metadata]
name = "make-targets"
description = "Browse and run Makefile targets"

[source]
command = "make -qp 2>/dev/null | awk -F: '/^[a-zA-Z0-9][^$#\\/\\t=]*:([^=]|$)/ {print $1}' | sort -u"

[preview]
command = "sed -n '/^{}:/,/^[^ \\t]/p' Makefile | head -20"

[keybindings]
enter = "actions:run"

[actions.run]
description = "Run target"
command = "make {}"
mode = "execute"
```

## 7. Scripting Patterns

### Expect keys for conditional actions

```bash
output=$(tv files --expect "ctrl-e,ctrl-v,ctrl-d")
key=$(echo "$output" | head -1)
file=$(echo "$output" | tail -1)

case "$key" in
  ctrl-e) "$EDITOR" "$file" ;;
  ctrl-v) code "$file" ;;
  ctrl-d) rm -i "$file" ;;
  "")     cat "$file" ;;
esac
```

### Inline mode for script UIs

```bash
# Non-fullscreen picker embedded in script output
echo "Select a file to process:"
selected=$(tv files --inline --height 10) || exit 0
process_file "$selected"
```

### Watch mode for live data

```bash
# Monitor changing data
tv --source-command "kubectl get pods --no-headers" --watch 5.0 \
   --preview-command "kubectl describe pod '{0}'"
```

### Multi-select batch operations

```bash
# Select multiple files, process each
tv files | while read -r file; do
    echo "Processing: $file"
    gzip "$file"
done
```

### Chaining tv invocations

```bash
# First pick a directory, then pick a file within it
dir=$(tv dirs) || exit 0
file=$(tv files "$dir") || exit 0
"$EDITOR" "$file"
```

### Ad-hoc channel from any command

```bash
# No TOML file needed — everything via flags
tv --source-command "curl -s https://api.example.com/items | jq -r '.[].name'" \
   --preview-command "curl -s https://api.example.com/items/{} | jq ."
```
