---
name: code-review
category: code
description: "Prompt template for code review focusing on bugs, security, and quality"
recommended-techniques:
  - role-assignment
  - xml-structuring
  - constraint-specification
  - few-shot-examples
---

# Code Review

## When to use

When you need an AI to review code changes for bugs, security vulnerabilities, performance issues, or general quality. Works with diffs, full files, or pull request descriptions.

## Structure

```
You are {{role}}.

<review-scope>
Focus: {{focus_areas}}
Severity levels: {{severity_taxonomy}}
False-positive tolerance: {{tolerance}}
</review-scope>

<input format="{{input_format}}">
{{code_to_review}}
</input>

<context>
{{project_context}}
</context>

<output-format>
{{output_format}}
</output-format>

<example-finding>
{{example_finding}}
</example-finding>

Review the code above. {{review_instruction}}
```

## Placeholders

| Placeholder | Description | Example |
|-------------|-------------|---------|
| {{role}} | Reviewer persona with specialty | "a security-focused code reviewer with OWASP expertise" |
| {{focus_areas}} | What to prioritize in the review | "SQL injection, auth bypass, input validation" |
| {{severity_taxonomy}} | How to classify findings | "critical / high / medium / low / info" |
| {{tolerance}} | Appetite for false positives | "Prefer false positives over missed vulnerabilities" |
| {{input_format}} | Format of the code input | "unified-diff" or "full-file" |
| {{code_to_review}} | The actual code or diff | The diff or source file contents |
| {{project_context}} | Background needed for accurate review | "Java 17 Spring Boot app, user input comes from REST endpoints" |
| {{output_format}} | Structure for findings | "Markdown table: severity, file:line, finding, recommendation" |
| {{example_finding}} | One sample finding to calibrate output | See example below |
| {{review_instruction}} | Specific focus or constraint | "Flag only issues introduced by this diff, not pre-existing ones." |

## Example

```
You are a security-focused code reviewer with OWASP expertise.

<review-scope>
Focus: SQL injection, authentication bypass, input validation, sensitive data exposure
Severity levels: critical (exploitable now) / high (exploitable with effort) / medium (defense-in-depth gap) / low (best practice)
False-positive tolerance: Prefer false positives over missed vulnerabilities
</review-scope>

<input format="unified-diff">
diff --git a/src/main/java/com/example/UserController.java b/src/main/java/com/example/UserController.java
--- a/src/main/java/com/example/UserController.java
+++ b/src/main/java/com/example/UserController.java
@@ -42,6 +42,18 @@ public class UserController {
+    @GetMapping("/users/search")
+    public List<User> searchUsers(@RequestParam String query) {
+        String sql = "SELECT * FROM users WHERE name LIKE '%" + query + "%'";
+        return jdbcTemplate.query(sql, new UserRowMapper());
+    }
+
+    @PostMapping("/users/{id}/role")
+    public void updateRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
+        String role = body.get("role");
+        userService.setRole(id, role);
+        return ResponseEntity.ok().build();
+    }
</input>

<context>
Java 17 Spring Boot application. User input arrives through REST endpoints.
Authentication is handled by Spring Security with JWT tokens.
The userService.setRole method directly updates the database.
</context>

<output-format>
For each finding:
- **Severity**: critical / high / medium / low
- **Location**: file:line
- **Finding**: What is wrong
- **Impact**: What could happen
- **Fix**: Concrete recommendation with code
</output-format>

<example-finding>
- **Severity**: critical
- **Location**: UserController.java:45
- **Finding**: SQL injection via string concatenation in query parameter
- **Impact**: Attacker can extract or modify any database content
- **Fix**: Use parameterized query: `jdbcTemplate.query("SELECT * FROM users WHERE name LIKE ?", new UserRowMapper(), "%" + query + "%")`
</example-finding>

Review the code above. Flag only issues introduced by this diff, not pre-existing ones. For each finding, provide a concrete fix with code.
```
