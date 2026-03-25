# Audit Lenses

## Consistency
What: Uniform application of patterns across the codebase
Where: All source files, focusing on areas touched since last audit
Requires: CLAUDE.md (patterns section), optionally DECISIONS.md
Checks:
- Naming conventions (functions, variables, files, modules)
- Error handling patterns (are they applied uniformly?)
- API shape consistency (similar endpoints follow similar patterns?)
- Logging patterns (same level conventions, same format?)
- Test patterns (same structure, same assertion style?)
Signals file patterns: **/*.{js,ts,py,java,go,sh,rs}
Example finding: "Functions in src/api/ use camelCase but src/utils/ uses snake_case"

## Security
What: Consistent application of security patterns
Where: Auth-related files, API endpoints, config files, dependency manifests
Requires: DECISIONS.md (for auth/security ADRs), ARCHITECTURE.md (for boundary definitions)
Checks:
- Auth patterns applied consistently across all endpoints
- Input validation present at system boundaries
- No hardcoded secrets, tokens, or credentials
- Dependency versions (known vulnerabilities)
- Config files not exposing sensitive defaults
- CORS, CSP, and header security patterns
Signals file patterns: *auth*, *secret*, *credential*, *token*, *.env*, *config*
Trigger on file changes matching: *auth*, *security*, *token*, *session*, *.env*
Example finding: "3 of 12 API endpoints missing rate limiting middleware"

## Architecture
What: Reality matches intended structure
Where: Module boundaries, import graphs, directory structure
Requires: ARCHITECTURE.md (layer definitions, dependency rules)
Checks:
- Layer boundaries respected (no upward imports)
- Dependency direction correct (inner layers don't know about outer)
- No circular dependencies between modules
- New modules placed in correct layer
- Shared code in the right location (not duplicated across modules)
Signals file patterns: new directories, package.json/go.mod/pom.xml changes
Trigger on: new directory creation, new module/package files
Example finding: "src/api/handler.ts imports directly from src/db/queries.ts, bypassing the service layer"

## Vision
What: Recent changes align with project goals and avoid non-goals
Where: New features, new commands, new user-facing behavior
Requires: VISION.md (principles + non-goals)
Checks:
- Each new feature supports at least one principle
- No new feature violates a non-goal
- Project scope isn't creeping beyond stated purpose
- User-facing changes match target user profile
Signals: milestone completion, large feature merges
Example finding: "New GUI dashboard conflicts with non-goal 'terminal-native only'"

## DX (Developer Experience)
What: Is the project getting easier or harder to work with?
Where: CLI interfaces, error messages, documentation, onboarding flow
Requires: VISION.md (if DX principles exist), recent audit history
Checks:
- Error messages are actionable (not just stack traces)
- CLI help text is accurate and complete
- Common workflows require minimal steps
- New features are discoverable
- Breaking changes are documented
- Setup/onboarding friction
Signals: high learnings accumulation rate (many gotchas = poor DX)
Example finding: "qf start requires 4 flags but could infer 3 from context"

## Tech Debt
What: Accumulating shortcuts, workarounds, and maintenance burden
Where: TODO/FIXME comments, deprecated patterns, test coverage
Requires: none (works from code alone)
Checks:
- TODO/FIXME/HACK/WORKAROUND comment count and age
- Deprecated function usage
- Test coverage gaps (files with no corresponding test)
- Dead code (unused exports, unreachable branches)
- Duplicated logic (similar code in multiple places)
- Dependency freshness (major version behind)
Signals: growing TODO count, declining test-to-code ratio
Example finding: "14 TODO comments, oldest from 6 months ago. 3 reference issues that are now closed."
