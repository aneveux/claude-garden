---
name: code-task
category: code
description: "Prompt template for asking an AI to write, modify, or generate code"
recommended-techniques:
  - role-assignment
  - xml-structuring
  - constraint-specification
---

# Code Task

## When to use

When you need an AI to produce new code, modify existing code, or generate boilerplate. Works for features, utilities, migrations, scripts, and any code-producing task.

## Structure

```
You are {{role}}.

<context>
{{project_context}}
</context>

<existing-code>
{{relevant_code}}
</existing-code>

<requirements>
Build: {{what_to_build}}
Language: {{language}}
Style: {{style_guide}}

Hard requirements:
{{hard_requirements}}

Do NOT:
{{exclusions}}
</requirements>

<output-format>
{{format_instructions}}
</output-format>

{{task_instruction}}
```

## Placeholders

| Placeholder | Description | Example |
|-------------|-------------|---------|
| {{role}} | Expert persona to adopt | "a senior Go developer specializing in CLI tools" |
| {{project_context}} | Relevant background about the project | "This is a REST API using Fiber v2 with PostgreSQL" |
| {{relevant_code}} | Existing code the AI needs to reference | The current handler file or interface definition |
| {{what_to_build}} | Clear description of the deliverable | "A middleware that rate-limits requests per API key" |
| {{language}} | Target language and version | "Go 1.22" |
| {{style_guide}} | Coding conventions to follow | "Use early returns, no globals, error wrapping with fmt.Errorf" |
| {{hard_requirements}} | Non-negotiable constraints | "Must be thread-safe. Must support Redis and in-memory backends." |
| {{exclusions}} | Things to explicitly avoid | "Do not use third-party rate limiting libraries" |
| {{format_instructions}} | How to structure the response | "Return only the Go source file, no explanation" |
| {{task_instruction}} | The final imperative instruction | "Implement the rate limiter middleware and its tests." |

## Example

```
You are a senior Go developer specializing in CLI tools.

<context>
This is a CLI tool built with cobra. It reads YAML config files and
orchestrates docker containers. The project uses Go 1.22 with modules.
</context>

<existing-code>
// config.go
type Config struct {
    Services []Service `yaml:"services"`
    Network  string    `yaml:"network"`
}

type Service struct {
    Name  string   `yaml:"name"`
    Image string   `yaml:"image"`
    Ports []string `yaml:"ports"`
}
</existing-code>

<requirements>
Build: A validation function that checks Config for common errors before orchestration starts
Language: Go 1.22
Style: Early returns, typed errors, table-driven tests

Hard requirements:
- Validate that all service names are unique
- Validate that port mappings follow "host:container" format with valid port numbers
- Validate that image references are non-empty
- Return all validation errors at once, not just the first one

Do NOT:
- Pull or verify docker images during validation
- Use reflection or struct tags for validation
- Add external dependencies
</requirements>

<output-format>
Return two files: validate.go and validate_test.go.
Include the package declaration and all imports.
</output-format>

Implement the config validation function and comprehensive table-driven tests.
```
