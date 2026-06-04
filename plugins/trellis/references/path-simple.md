# Simple Path

Direct edit for clear changes (1-5 files). No agents, no plan file — you do it yourself.

Show the stem:
```
─────────────────────────────────────────────
    ,*-.
    |  |   🌿 Quick fix!
,.  |  |
| |_|  | ,.
`---.  |_| |
    |  .--`
    |  |
    |  |
─────────────────────────────────────────────
```

## Model

The simple path runs inline (no agent spawn), so no model selection needed.
If a specialist is used, it runs at the `tiers.simple` model (default: haiku).
Check `trellis.yaml` — if `models.tiers.simple` is set, use it; otherwise use haiku.

## Execution

1. Read the relevant file(s)
2. Make the change directly
3. Self-check:
   - Does the change look correct?
   - If tests exist, run them
   - Any obvious issues?
4. Commit following the commit protocol:
   - Check CLAUDE.md for commit conventions
   - One commit per logical change (may be 1-3 commits for multi-file work)
5. **For 3+ file changes**: do an inline review pass before declaring done.
   This is NOT an agent spawn — review your own changes:
   - `git diff` the changes since you started
   - Check: did you miss any file that should have changed?
   - Check: any import/reference that now points to something that moved?
   - Check: do tests still pass?
   If you find issues, fix them and commit.
6. Update `.trellis/STATE.md`:
   - Set Focus to describe what was done
   - Update Last timestamp
   - Append any learnings
7. Show the tree and report what was done:
```
─────────────────────────────────────────────
      ,xXXXXx,
     ,XXXXXXXX,
     XXXXXXXXXX   🌳 Done!
     `"""XX"""`
         XX
         XX
         XX
─────────────────────────────────────────────
```
