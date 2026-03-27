# Plan Format Specification

Plan files live in `.trellis/plans/NNN-<slug>.md` where NNN is a zero-padded sequential number.

## Numbering

Read existing plans in `.trellis/plans/`, take the highest NNN, increment by 1. First plan is 001.

## Lightweight Format (standard path, 3-8 files)

```markdown
---
id: "001"
title: "Rate Limiting"
status: draft | approved | in-progress | done | cancelled | failed
created: 2026-03-24
---

## Tasks
1. [ ] `src/middleware/rate-limit.ts` - Create sliding window rate limiter
2. [ ] `src/app.ts` - Wire rate limiter into middleware chain
3. [ ] `tests/rate-limit.test.ts` - Add rate limit tests

## Done When
- Rate limit returns 429 after 100 requests/minute
- All tests pass
- Middleware registered before route handlers
```

## Full Format (complex path, 8+ files, waves)

```markdown
---
id: "002"
title: "Auth Module Redesign"
status: draft | approved | in-progress | done | cancelled | failed
created: 2026-03-24
wave_count: 3
---

## Wave 1 (independent - can parallelize)
1. [ ] `src/auth/token.ts` - Token management (create, validate, refresh)
2. [ ] `src/auth/types.ts` - Shared types for auth module

## Wave 2 (depends on wave 1)
3. [ ] `src/auth/oauth.ts` - OAuth2 flow (redirect, callback, token exchange)
4. [ ] `src/middleware/auth.ts` - Auth middleware using token.ts

## Wave 3 (depends on wave 2)
5. [ ] `tests/auth/token.test.ts` - Unit tests for token management
6. [ ] `tests/auth/oauth.test.ts` - Integration tests for OAuth flow

## Done When
- OAuth login redirects to provider and returns with token
- Expired tokens trigger silent refresh
- All tests pass
- Auth middleware rejects invalid tokens with 401

## Must Haves
- token.ts imported in middleware/auth.ts
- oauth.ts calls token.ts for token operations
- Tests cover: happy path, expired token, invalid token
```

## Optional: Notes

When stewardship documents (VISION.md, DECISIONS.md) are loaded and misalignment is found, planners add a Notes section to flag it:

```markdown
## Notes
- Misalignment: <principle or ADR> — work may conflict with <vision/decision>
- Recommendation: <adjust approach, override decision, or proceed with awareness>
```

## Rules

- `status` field is updated by the trellis command as work progresses
- Task checkboxes `[ ]` / `[x]` updated by workers after each commit
- Wave numbering determines execution order in complex path
- Tasks within a wave are independent (can parallelize)
- `Done When` items must be observable and testable — no subjective criteria
- `Must Haves` (complex only) specify structural constraints for verification
