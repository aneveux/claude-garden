# String Pipeline Templates

Television's template system for transforming entry data. Used in `source.display`,
`source.output`, `preview.command`, `preview.header/footer`, `ui.input_header`,
and `actions.*.command`.

## Table of Contents

1. Placeholders — accessing entry data
2. Split — field extraction with custom delimiters
3. String transforms — case, trim, pad, affix
4. Regex — extract and replace
5. Collection operations — map, filter, sort, join
6. Chaining — composing pipelines
7. Examples by use case

---

## 1. Placeholders

| Syntax | Description |
|--------|-------------|
| `{}` | Entire entry (raw) |
| `{0}`, `{1}`, `{2}` | Positional fields, space-delimited |
| `{-1}` | Last positional field |

```toml
# Entry: "abc123 nginx running"
display = "{1}"           # "nginx"
output = "{0}"            # "abc123"
```

## 2. Split

Extract fields using a custom delimiter.

**Syntax:** `{split:DELIMITER:INDEX_OR_RANGE}`

| Form | Description | Example (input: `"a,b,c,d,e"`) |
|------|-------------|------|
| `{split:,:0}` | Single index | `"a"` |
| `{split:,:-1}` | Negative index (from end) | `"e"` |
| `{split:,:1..3}` | Range (exclusive end) | `"b,c"` |
| `{split:,:1..}` | From index to end | `"b,c,d,e"` |
| `{split:,:..2}` | From start to index | `"a,b"` |
| `{split:,:..}` | All (useful before map/filter) | `"a,b,c,d,e"` |

Common delimiters:
- `,` — comma-separated
- `\\t` — tab (escape the backslash in TOML)
- `:` — colon (PATH entries, /etc/passwd)
- `/` — path segments
- ` ` — space (same as positional `{0}`, `{1}`)

```toml
# Tab-separated: "id\tname\tstatus"
display = "{split:\\t:1} ({split:\\t:2})"
output = "{split:\\t:0}"

# Colon-separated: "/usr/local/bin:/home/user/.cargo/bin"
display = "{split::..}"
```

## 3. String Transforms

| Transform | Description | Example |
|-----------|-------------|---------|
| `{upper}` | Uppercase | `"foo"` -> `"FOO"` |
| `{lower}` | Lowercase | `"FOO"` -> `"foo"` |
| `{capitalize}` | Capitalize first letter | `"foo bar"` -> `"Foo bar"` |
| `{trim}` | Strip whitespace (both ends) | `" foo "` -> `"foo"` |
| `{trim_start}` | Strip leading whitespace | `" foo"` -> `"foo"` |
| `{trim_end}` | Strip trailing whitespace | `"foo "` -> `"foo"` |
| `{strip_ansi}` | Remove ANSI escape codes | Strips color codes |
| `{prepend:TEXT}` | Add prefix | `{prepend:> }` -> `"> foo"` |
| `{append:TEXT}` | Add suffix | `{append:!}` -> `"foo!"` |
| `{pad:WIDTH:CHAR:DIR}` | Pad to width | `{pad:10: :left}` -> `"       foo"` |

Padding directions: `left`, `right`, `center`

## 4. Regex

| Transform | Description |
|-----------|-------------|
| `{regex_extract:PATTERN}` | Extract first match |
| `{regex_extract:PATTERN:GROUP}` | Extract capture group |
| `{regex_replace:PATTERN:REPLACEMENT}` | Replace matches |

```toml
# Extract version from "package v1.2.3"
display = "{regex_extract:v(\\d+\\.\\d+\\.\\d+):1}"

# Replace path prefix
output = "{regex_replace:^/home/\\w+:~}"

# Extract repo name from URL
display = "{regex_extract://([^/]+/[^/]+)\\.git:1}"
```

## 5. Collection Operations

These operate on the result of a split that produces multiple elements.

| Transform | Description |
|-----------|-------------|
| `{map:{TRANSFORM}}` | Apply transform to each element |
| `{filter:PATTERN}` | Keep elements matching regex |
| `{sort}` | Sort ascending |
| `{sort:desc}` | Sort descending |
| `{join:DELIMITER}` | Join elements with delimiter |

```toml
# Filter Python files from a comma-separated list, sort, and join with newlines
display = "{split:,:..|filter:\\.py$|sort|join:\\n}"

# Uppercase each element
display = "{split:,:..|map:{trim|upper}|join:, }"

# Extract repo names from URLs
display = "{split:,:..|map:{regex_extract://([^/]+):1|upper}|join: }"
```

## 6. Chaining

Transforms chain left-to-right with `|`:

```
{split:\\t:1|strip_ansi|trim|upper}
```

Processing order:
1. Split by tab, take index 1
2. Strip any ANSI color codes
3. Trim whitespace
4. Convert to uppercase

Nested chains inside `map`:
```
{split:,:..|map:{trim|upper|append:!}}
```

## 7. Examples by Use Case

### Git log with formatted display

```toml
[source]
command = "git log --oneline --format='%h\\t%s\\t%an\\t%cr'"
display = "{split:\\t:0|pad:8: :right} {split:\\t:1} ({split:\\t:3})"
output = "{split:\\t:0}"
```

### Process list with PID extraction

```toml
[source]
command = "ps aux"
display = "{}"
output = "{1}"
no_sort = true
```

### Kubernetes pods with namespace

```toml
[source]
command = "kubectl get pods -A --no-headers"
display = "{1|pad:20: :right} {0|pad:15: :right} {3}"
output = "{1}"
```

### File path manipulation

```toml
# Show just filename, output full path
display = "{regex_extract:[^/]+$}"
output = "{}"

# Show relative path from home
display = "{regex_replace:^/home/\\w+/:~/}"
```

### Tab-separated structured data

```toml
[source]
command = "docker ps --format '{{.ID}}\\t{{.Names}}\\t{{.Image}}\\t{{.Status}}'"
display = "{split:\\t:1|pad:20: :right} {split:\\t:2|pad:30: :right} {split:\\t:3}"
output = "{split:\\t:0}"

[preview]
command = "docker inspect '{split:\\t:0}' | jq ."
header = "{split:\\t:1} ({split:\\t:2})"
```

### Preview with line offset

```toml
# Source emits: "path/to/file:42:matched line"
[source]
command = "rg --line-number --color=never 'TODO'"
output = "{split:::0}"

[preview]
command = "bat -n --color=always --highlight-line {split:::1} '{split:::0}'"
offset = "{split:::1}"
```
