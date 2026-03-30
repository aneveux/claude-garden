---
name: jenkins-reviews
version: 1.0.0
description: |
  Jenkins plugin code review expertise — security patterns, expert reviewer checklist, common
  anti-patterns, API misuse, and quality standards. Use this skill when reviewing Jenkins plugin
  code, auditing security, checking code against community standards, or preparing a PR for the
  jenkinsci organization. Encodes the actual review patterns of top Jenkins core maintainers:
  what they flag, what they expect, and what they reject. Make sure to use this skill whenever
  the user mentions Jenkins code review, plugin PR, Jenkins security audit, plugin quality check,
  Jenkins anti-patterns, or Jenkins best practices — even if they just say "review my plugin code."
  Triggers on: Jenkins code review, Jenkins PR review, Jenkins security audit, plugin quality,
  Jenkins anti-patterns, Jenkins best practices, plugin PR, jenkinsci review.
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
---

# Jenkins Plugin Code Review

Review checklist derived from the actual PR review patterns of Jenkins core maintainers.
These are the patterns they consistently flag — organized by severity.

## P0 — Critical Issues (Block Merge)

### Security Vulnerabilities

**XSS in Jelly views:**
- Missing `<?jelly escape-by-default='true'?>` as first line
- Values injected directly into `<script>` blocks
- Using `h.rawHtml()` on untrusted content
- Missing HTML escaping in form validation output (use `Util.xmlEscape()`)

**Permission bypass:**
- `<l:layout permission=...>` only hides UI — does NOT protect form submission endpoints
- Missing permission checks in `doCheck`/`doFill` methods
- Returning `FormValidation.error()` when unauthorized (leaks info) — return `.ok()` instead
- Missing `@POST` on validation methods with side effects
- Missing `@Restricted(DoNotUse.class)` on web-facing internal methods

**Secrets exposure:**
- Storing passwords/tokens as plain `String` instead of `Secret`
- Storing secrets in Groovy variables (serialized to `program.dat`)
- Keep token generation AND usage inside a single `sh` step

**CSRF:**
- Missing `@POST` annotation on state-changing endpoints
- Missing `checkMethod="post"` in Jelly `<f:validateButton>`

### API Correctness

**Pipeline incompatibility:**
- Using `AbstractBuild` instead of `Run<?, ?>`
- Using `AbstractProject` instead of `Job<?, ?>`
- Using `BuildListener` instead of `TaskListener`
- Using `getBuiltOn()` instead of `FilePath.toComputer()`

**CPS thread blocking:**
- Using `SynchronousStepExecution` for I/O-bound work — blocks ALL Pipeline jobs
- Must use `SynchronousNonBlockingStepExecution` for anything that does I/O

**Classloader violations:**
- Code that works in JenkinsRule but breaks with real classloading
- `Class.forName()` in flat test hierarchy vs isolated plugin classloaders
- Solution: test with `RealJenkinsRule` when reflection is involved

## P1 — Important Issues (Should Fix Before Merge)

### Design and Architecture

**Unnecessary indirection:**
- Pass data directly rather than inferring from context when the caller has it

**Boolean field defaults:**
- Invert boolean sense for backward compatibility when adding new fields
- New fields default to `false`/`null` in existing serialized XML — design around this

**Just-in-time resolution:**
- Don't cache values that can change at runtime (proxy config, DNS)
- Use `Jenkins.get().getProxy()` over stored proxy references

**Resource leaks:**
- Unclosed streams, missing try-with-resources
- Always close resources in finally blocks or use try-with-resources

### Dependency Hygiene

Core maintainers consistently flag dependency issues:
- Dependencies in `<dependencyManagement>` not `<dependencies>`
- No pre-release versions in managed dependencies
- No unnecessary dependency additions
- Use the BOM for version alignment
- Add `TODO` comments for BOM workarounds

### Code Style

- `toLowerCase(Locale.ROOT)` instead of bare `toLowerCase()`
- Trailing newlines in text files
- Use `Util.fixEmpty()` in getters to clean snippet generator output
- Use generated `Messages` class for i18n display names

## P2 — Minor Issues (Nice to Have)

### Testing

- Extend existing tests instead of writing new ones
- Use `@WithoutJenkins` for tests that don't need Jenkins (faster)
- Use `@ClassRule` for `BuildWatcher` (not `@Rule` — it's per-class)
- Store Pipeline test scripts as `.groovy` resources, not inline strings
- Config roundtrip tests for every @DataBoundConstructor/@DataBoundSetter field

### API Preferences

- `SystemProperties.getDuration()` instead of custom parsing
- Return rich types over primitives from web methods
- Don't change HTTP response codes — avoid breaking existing API consumers

### Minimal Changes

- Avoid tangential cleanup in focused PRs
- Pragmatic test investment — "Doesn't seem worth it" for minor edge cases

## Review Report Format

When reviewing Jenkins plugin code, structure findings like this:

```
## Jenkins Plugin Review Report

### Summary
- Files reviewed: N
- Total findings: N (P0: X, P1: Y, P2: Z)

### P0 — Critical Issues
**File.java:42** Missing @POST on doTestConnection
- **Why critical:** State-changing endpoint without CSRF protection
- **Fix:** Add @POST annotation and checkMethod="post" in Jelly

### P1 — Important Issues
**Builder.java:55** Missing @Symbol on DescriptorImpl
- **Why important:** Forces ugly [$class: 'ClassName'] Pipeline syntax
- **Fix:** Add @Symbol("myBuilder") annotation to DescriptorImpl

### P2 — Minor Issues
**Builder.java:88** toLowerCase() without Locale
- **Fix:** Use toLowerCase(Locale.ROOT)

### Verdict: [A/B/C]
```

## Grading Scale

- **Grade A:** No P0 issues, fewer than 3 P1 issues. Production-ready.
- **Grade B:** No P0 issues, 3+ P1 issues. Needs attention before merge.
- **Grade C:** Any P0 issues or 10+ P1 issues. Needs significant rework.

## Declarative Pipeline Review

When reviewing Jenkinsfiles or Pipeline-related code:

1. **No `script {}` blocks** in Declarative Pipeline
2. **Sandbox mode** (`true`) in `CpsFlowDefinition` for tests
3. **Credentials in Pipeline:** token generation and usage in same `sh` step
4. **Step design:** self-contained, one action per step
5. **`@Symbol`** on all Descriptors for clean DSL syntax

## Configuration as Code (CasC) Review

1. `@Symbol` on GlobalConfiguration and all configurable Descriptors
2. `@DataBoundSetter` for all settable properties
3. CasC import/export round-trip tests exist
4. No side effects in constructors (CasC instantiates objects during import)
