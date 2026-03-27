# Shell Integration

Setting up and customizing tv's shell integration for smart autocomplete and history search.

## Setup

Add to your shell config:

```bash
# Zsh (~/.zshrc)
eval "$(tv init zsh)"

# Bash (~/.bashrc)
eval "$(tv init bash)"

# Fish (~/.config/fish/config.fish)
tv init fish | source

# Nushell
mkdir ($nu.data-dir | path join "vendor/autoload")
tv init nu | save -f ($nu.data-dir | path join "vendor/autoload/tv.nu")

# PowerShell ($PROFILE)
tv init power-shell | Out-File -FilePath $PROFILE -Append
```

This provides two keybindings:
- **Ctrl+T** — Smart autocomplete (context-aware channel selection)
- **Ctrl+R** — Shell history search (replaces default reverse-search)

## How Smart Autocomplete Works

When you press Ctrl+T, tv reads the current command line and picks the right channel.
For example:
- `git checkout ` + Ctrl+T -> opens `git-branch` channel
- `cat ` + Ctrl+T -> opens `files` channel
- `docker exec ` + Ctrl+T -> opens `docker-containers` channel
- Empty line + Ctrl+T -> opens fallback channel (default: `files`)

The mapping is defined in `config.toml`.

## Channel Triggers Configuration

```toml
[shell_integration]
fallback_channel = "files"        # Channel when no trigger matches

[shell_integration.channel_triggers]
# Format: "channel-name" = ["command prefix", ...]
"git-branch" = ["git checkout", "git switch", "git branch -d", "git merge"]
"git-log" = ["git show", "git revert", "git cherry-pick"]
"docker-containers" = ["docker exec", "docker stop", "docker restart", "docker logs"]
"docker-images" = ["docker run", "docker rmi"]
"ssh-hosts" = ["ssh", "scp", "rsync"]
"k8s-pods" = ["kubectl exec", "kubectl logs", "kubectl describe pod"]
"npm-scripts" = ["npm run"]
"make-targets" = ["make"]
"systemd-units" = ["systemctl"]
"procs" = ["kill"]
"files" = ["cat", "less", "vim", "nvim", "code", "bat", "head", "tail"]
"dirs" = ["cd", "ls", "tree"]
```

Triggers match from most specific to least specific. `"git checkout"` matches before
a hypothetical `"git"` trigger.

## Shell Integration Keybindings

Override the default Ctrl+T and Ctrl+R:

```toml
[shell_integration.keybindings]
smart_autocomplete = "ctrl-t"
command_history = "ctrl-r"
```

## Custom Shell Integration Scripts

For advanced customization, generate the integration script and modify it:

```bash
# Generate to a file instead of eval'ing directly
mkdir -p ~/.config/television/shell
tv init zsh > ~/.config/television/shell/integration.zsh

# Source the custom version in .zshrc
source "$HOME/.config/television/shell/integration.zsh"
```

### Auto-Execute on Selection (Zsh)

By default, selecting an autocomplete entry fills the command line but doesn't execute.
To auto-execute:

```bash
# In your custom integration.zsh, uncomment or add:
_tv_search() {
    emulate -L zsh
    zle -I
    local current_prompt
    current_prompt=$LBUFFER
    local output
    output=$(tv --autocomplete-prompt "$current_prompt" $*)
    zle reset-prompt
    if [[ -n $output ]]; then
        RBUFFER=""
        LBUFFER=$current_prompt$output
        zle accept-line    # <- this auto-executes
    fi
}
zle -N tv-search _tv_search
bindkey '^T' tv-search
```

### Additional Keybindings

You can bind multiple tv invocations to different keys:

```bash
# Ctrl+F for files specifically
_tv_files() {
    emulate -L zsh
    zle -I
    local output
    output=$(tv files)
    zle reset-prompt
    if [[ -n $output ]]; then
        LBUFFER+=$output
    fi
}
zle -N tv-files _tv_files
bindkey '^F' tv-files
```

## Integration with Bash Scripts

When using tv inside scripts (not interactive shell), shell integration isn't needed.
Use tv directly:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Direct invocation — no shell integration required
selected=$(tv files --input "$1") || exit 0
echo "Selected: $selected"
```

Shell integration is only for interactive terminal use (Ctrl+T, Ctrl+R).
