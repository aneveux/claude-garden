---
id: 003
date: 2026-04-30
category: debugging
techniques:
  - role-assignment
  - constraint-specification
  - xml-structuring
summary: "Using role framing to calibrate explanation depth and format"
---

# Specimen 003: Role Assignment

## The Seed (Before)

> explain this error message to me

## Diagnosis

- No role framing — the model defaults to an over-simplified explanation that either insults the reader's intelligence or skips the actual root cause.
- No context provided — the model cannot distinguish between a typo and a systemic architectural issue without seeing surrounding code.
- No expertise calibration — without knowing what the user already understands, the explanation lands at the wrong level.

## The Bloom (After)

```
You are a senior developer mentoring a mid-level engineer who got stuck on
an error. You explain things clearly without being condescending. You assume
they understand the language fundamentals and common patterns, but may not
know the internals of the framework or runtime that produced this error.

Your goal is not just to fix this one error — it is to help them build a
mental model so they can diagnose similar issues independently.

<error>
TypeError: Cannot read properties of undefined (reading 'map')
    at UserList (UserList.tsx:14:28)
    at renderWithHooks (react-dom.development.js:14985:18)
    at mountIndeterminateComponent (react-dom.development.js:17811:13)
</error>

<code file="UserList.tsx">
export function UserList({ data }) {
  const users = data.response.users;
  return (
    <ul>
      {users.map(u => <li key={u.id}>{u.name}</li>)}
    </ul>
  );
}
</code>

<what-i-understand>
I know this means something is undefined when .map() is called. I think
data.response might be undefined, but I am not sure why — the API call
works fine when I test it in the browser.
</what-i-understand>

Structure your response as:

1. **What the error means** — one paragraph, connect the stack trace to the code
2. **Root cause** — why this happens even though the API works (timing, async, render cycle)
3. **The fix** — show the corrected code with defensive checks or proper loading state
4. **Prevention pattern** — a general approach to avoid this class of error in React components
```

## Techniques Applied

- **role-assignment**: Framing as a senior mentor calibrates the explanation to mid-level depth — technical enough to be useful, clear enough to teach.
- **constraint-specification**: The four-part output structure ensures the response covers diagnosis, cause, fix, and prevention instead of stopping at the surface.
- **xml-structuring**: Separating error, code, and existing understanding into tagged sections lets the model use each piece precisely rather than conflating them.
