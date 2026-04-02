---
description: "Find, summarize, and act on local code reviews left by localreview.nvim. Use when the user wants to process review comments, address review feedback, or clean up .reviews.json files."
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Agent, AskUserQuestion
---

# Thorn Reviews

Process local code review comments created by localreview.nvim.

## Step 0: Parse Arguments

The user's input follows `/thorn:reviews`. Parse for a mode keyword:

| Argument | Mode | Description |
|----------|------|-------------|
| *(empty)* | **summary** | Discover and present all pending reviews |
| `fix` | **fix** | Address all review comments by editing source files |
| `clean` | **clean** | Remove processed `.reviews.json` files |

## Step 1: Discover Review Files

Search the current project for all localreview.nvim review files:

```
Glob pattern: **/.[!.]*.reviews.json
```

If no review files are found, tell the user:
"No local review files found in this project. Reviews are created by localreview.nvim as hidden `.<filename>.reviews.json` files."
Then stop.

## Step 2: Parse and Correlate

For each review file found:

1. **Read** the JSON content
2. **Map back to source** — strip leading `.` and trailing `.reviews.json` from the basename, rejoin with the directory path
3. **Check staleness** — if any review has a non-null `commit` field, compare against current `git rev-parse HEAD`
4. **Build a review list** — collect all comments with their file, line(s), text, date, and staleness

Skip review files that are empty or have no entries in the `reviews` object.

### Review data structure

For each comment, track:
- Source file path (relative to project root)
- Start line (the dictionary key, parsed as integer)
- End line (from `end_line` field, null for single-line)
- Comment text
- Timestamp (convert to YYYY-MM-DD for display)
- Staleness: `current` / `stale` / `no commit tracked`

## Step 3: Present Summary

Show the review summary grouped by file:

```
Found N review comments across M files:

### path/to/file.rs (K comments)
- **Line 42**: "Comment text here" (2024-03-27, current)
- **Lines 15-22**: "Range comment text" (2024-03-27, stale)
```

Order files alphabetically, comments by line number within each file.

### Summary mode → ask what to do next

After presenting the summary, ask:

Use AskUserQuestion:
- question: "What would you like to do with these reviews?"
- header: "Review Actions"
- options:
  - label: "Fix all"
    description: "Address every review comment by editing source files"
  - label: "Fix selectively"
    description: "Go through comments one by one and decide"
  - label: "Just the summary"
    description: "Done — I only needed to see what's pending"

Route based on selection:
- **Fix all** → proceed to Step 4 (fix mode)
- **Fix selectively** → proceed to Step 4 with selective=true
- **Just the summary** → stop

### Fix mode / Clean mode → skip the question

If the user already specified `fix` or `clean`, skip the question and go directly to the relevant step.

## Step 4: Fix Mode

For each review comment (or selected subset):

1. **Read source context** — read the source file around the commented lines (10 lines before and after for context)
2. **Interpret the comment** — understand what the reviewer is asking for. Review comments are instructions: "too complex", "missing error handling", "refactor this" all have clear intent
3. **Apply the fix** — edit the source file to address the comment
4. **Track progress** — note which comments have been addressed

For stale reviews, read extra context. The code may have shifted — use the comment's intent rather than trusting exact line numbers. If the relevant code has been completely rewritten or removed, skip that comment and note it in the report.

### Selective mode

When selective=true, for each comment:
1. Show the comment text and the current source code at those lines
2. Ask the user: "Address this comment?" with Yes/Skip options
3. Only fix if they say yes

### After fixing

Report what was done:

```
Addressed N of M review comments:
  - path/to/file.rs:42 — split function into smaller helpers
  - path/to/file.rs:15-22 — refactored loop with iterator chain
Skipped:
  - path/to/other.py:8 — code has been removed since review
```

Then ask whether to clean up the addressed review entries.

## Step 5: Clean Mode

Two sub-modes depending on context:

**Full clean** (all comments in a file were addressed or user explicitly wants clean):
- Delete the entire `.reviews.json` file

**Partial clean** (some comments addressed, others remain):
- Read the review file
- Remove only the addressed entries from the `reviews` object
- If no entries remain, delete the file
- If entries remain, write back the updated JSON

Report what was cleaned:

```
Cleaned up review files:
  - Removed .main.rs.reviews.json (all 2 comments addressed)
  - Updated .lib.rs.reviews.json (removed 1 of 3 comments)
```
