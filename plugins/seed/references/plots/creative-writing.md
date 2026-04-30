---
name: creative-writing
category: creative
description: "Prompt template for text generation like blog posts, documentation, and explanations"
recommended-techniques:
  - role-assignment
  - constraint-specification
  - positive-instructions
---

# Creative Writing

## When to use

When you need an AI to produce written content such as blog posts, technical documentation, tutorials, release notes, or any prose where voice, audience, and structure matter.

## Structure

```
You are {{role}}.

<audience>
{{audience}}
</audience>

<voice>
Tone: {{tone}}
Style: {{style_description}}
</voice>

<content-brief>
Topic: {{topic}}
Key points to cover:
{{key_points}}
</content-brief>

<structure>
{{structure}}
</structure>

<constraints>
Length: {{length}}
{{additional_constraints}}
</constraints>

<style-example>
{{style_example}}
</style-example>

{{writing_instruction}}
```

## Placeholders

| Placeholder | Description | Example |
|-------------|-------------|---------|
| {{role}} | Writer persona to adopt | "a senior engineer writing for the company blog" |
| {{audience}} | Who will read this | "Mid-level developers familiar with containers but new to service mesh" |
| {{tone}} | Emotional register | "Conversational but technically precise" |
| {{style_description}} | Writing style characteristics | "Short paragraphs, concrete examples, no jargon without explanation" |
| {{topic}} | What the piece is about | "Why we migrated from REST to gRPC" |
| {{key_points}} | Must-cover content | "Latency improvements, proto schema benefits, migration pain points" |
| {{structure}} | Desired document skeleton | "Hook, problem, solution, results, lessons learned" |
| {{length}} | Target word count or size | "800-1000 words" |
| {{additional_constraints}} | Extra rules | "No marketing language. Include code snippets where relevant." |
| {{style_example}} | Sample paragraph showing desired voice | See example below |
| {{writing_instruction}} | Final directive | "Write the complete blog post." |

## Example

```
You are a senior engineer writing for the company engineering blog.

<audience>
Backend developers at mid to senior level. They know HTTP APIs well
but have limited exposure to observability beyond basic logging.
</audience>

<voice>
Tone: Conversational but technically precise
Style: Short paragraphs. Lead with the "why" before the "how."
Use concrete numbers over vague qualifiers. Inline code for tool
names and commands.
</voice>

<content-brief>
Topic: How we reduced incident response time from 45 minutes to 8 minutes with structured logging
Key points to cover:
- What our logging looked like before (unstructured, grep-based debugging)
- The decision to adopt structured JSON logs with correlation IDs
- How we built a logging middleware that enriches every request
- Dashboard and alert improvements that followed
- Measurable results: MTTR reduction, fewer escalations
</content-brief>

<structure>
1. Hook: a war story from a real incident where bad logs cost us
2. The problem: why unstructured logs fail at scale
3. The solution: structured logging with correlation IDs
4. Implementation: the middleware, the schema, the rollout
5. Results: before/after metrics
6. Lessons: what we would do differently
</structure>

<constraints>
Length: 900-1100 words
No marketing language or product pitches.
Include at least two code snippets (log output before/after, middleware example).
End with actionable takeaways, not a generic conclusion.
</constraints>

<style-example>
It was 2 AM on a Tuesday when the pager fired. Orders were failing,
but the logs told us nothing useful — thousands of lines of
`INFO: processing request` with no way to correlate a single user
journey. We spent 40 minutes grepping timestamps before someone
found the root cause in a database timeout buried three services deep.
That was the last straw.
</style-example>

Write the complete blog post.
```
