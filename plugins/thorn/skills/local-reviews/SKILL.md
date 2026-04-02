---
name: local-reviews
version: 1.0.0
description: |
  Local code review processing for localreview.nvim. Understands the hidden
  .reviews.json file format, discovers review files across a project, parses
  line-keyed comments with range support, detects staleness against git HEAD,
  and acts on review feedback. Use this skill whenever the user mentions local
  reviews, review comments, localreview, processing reviews, code review
  feedback, .reviews.json files, or wants to find and address review annotations
  left in their codebase. Triggers on: "check my reviews", "handle the review
  comments", "process reviews", "local review", "review feedback I left",
  "address review comments", or any reference to .reviews.json files.
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
---

# Local Reviews — localreview.nvim

localreview.nvim lets users leave code review comments locally in their editor. Comments are stored as hidden JSON files alongside the reviewed source files. This skill teaches you how to find, parse, and act on those reviews.

## File Format

Review files are **hidden dotfiles** with the naming convention:

```
.<source-filename>.reviews.json
```

The leading dot is intentional — it keeps review files out of normal directory listings. This is the most important detail to get right: a file reviewed at `/project/src/main.rs` produces `/project/src/.main.rs.reviews.json`.

### JSON Structure

```json
{
  "version": 1,
  "reviews": {
    "42": [
      {
        "comment": "This function is too complex, consider splitting",
        "timestamp": 1711540800,
        "end_line": null,
        "commit": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"
      }
    ],
    "15": [
      {
        "comment": "Refactor this block for clarity",
        "timestamp": 1711540950,
        "end_line": 22,
        "commit": null
      }
    ]
  }
}
```

### Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `version` | number | Always `1` — format version marker |
| `reviews` | object | Dictionary keyed by **start line number as string** |
| `comment` | string | The review text left by the user |
| `timestamp` | number | Unix epoch seconds when the comment was created |
| `end_line` | number or null | End line for range reviews (inclusive). `null` = single-line review |
| `commit` | string or null | Git SHA at review creation time. `null` if git tracking was disabled |

Key details:
- Line numbers are **1-indexed strings** as dictionary keys
- Multiple comments can exist on the same line (the value is an array)
- Range reviews are stored under the start line, with `end_line` indicating the span
- The commit hash is the full 40-character SHA of HEAD when the review was written

## Discovery

Find all review files in a project:

```
Glob pattern: **/.[!.]*.reviews.json
```

The `[!.]` prevents matching files that start with `..`. Run this from the project root.

To map a review file back to its source:
1. Take the review file path: `/project/src/.main.rs.reviews.json`
2. Get the directory: `/project/src/`
3. Get the basename: `.main.rs.reviews.json`
4. Strip the leading `.` and trailing `.reviews.json` → `main.rs`
5. Rejoin: `/project/src/main.rs`

## Staleness Detection

When a review has a non-null `commit` field, compare it against the current `git rev-parse HEAD`. If they differ, the code has changed since the review was written — the review may be addressing code that no longer exists at that line. Flag stale reviews in the summary but still present them — the comment's intent is usually still relevant even if line numbers shifted.

## Processing Reviews

When the user asks to process, check, or handle their reviews:

1. **Discover** — glob for all `.reviews.json` files in the project
2. **Parse** — read each file, extract comments with their line references
3. **Correlate** — map each review file back to its source file, read the source context around the commented lines
4. **Present** — show a clear summary grouped by file, with line numbers, comment text, and staleness status
5. **Act** — based on user intent: summarize only, fix the code, or clean up review files

### Summary Format

Present reviews grouped by source file, ordered by line number:

```
## Review Summary

Found N comments across M files:

### path/to/file.rs (2 comments)
- **Line 42**: "This function is too complex" (2024-03-27, stale)
- **Lines 15-22**: "Refactor this block" (2024-03-27, current)

### path/to/other.py (1 comment)
- **Line 8**: "Missing error handling" (2024-03-28, no commit tracked)
```

Convert timestamps to human-readable dates. Mark staleness as:
- **current** — commit matches HEAD
- **stale** — commit differs from HEAD
- **no commit tracked** — commit field is null

### Fixing Code

When addressing review comments:
1. Read the source file around the commented lines (enough context to understand the code)
2. Interpret the review comment's intent — it's a human instruction about what to change
3. Make the fix directly in the source file
4. After all fixes, report what was changed
5. Offer to clean up the `.reviews.json` files for addressed comments

### Cleaning Up

Delete `.reviews.json` files only when explicitly asked or after confirming with the user. Reviews are local-only — once deleted, they're gone. When partially addressing reviews (some fixed, some not), remove only the addressed entries from the JSON rather than deleting the whole file.
