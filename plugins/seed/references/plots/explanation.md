---
name: explanation
category: analysis
description: "Prompt template for explaining concepts or code to a specific audience"
recommended-techniques:
  - role-assignment
  - constraint-specification
---

# Explanation

## When to use

When you need an AI to explain a concept, algorithm, architecture, or piece of code. Works for teaching, onboarding documentation, and knowledge transfer where the audience's expertise level matters.

## Structure

```
You are {{role}}.

<audience>
Expertise: {{expertise_level}}
They already know: {{existing_knowledge}}
They do not know: {{knowledge_gaps}}
</audience>

<subject>
{{subject}}
</subject>

<scope>
Depth: {{depth}}
Breadth: {{breadth}}
</scope>

<preferences>
{{preferences}}
</preferences>

{{explanation_instruction}}
```

## Placeholders

| Placeholder | Description | Example |
|-------------|-------------|---------|
| {{role}} | Teacher/explainer persona | "a patient senior engineer onboarding a new team member" |
| {{expertise_level}} | Audience skill level | "Junior developer, 1 year experience, comfortable with Python" |
| {{existing_knowledge}} | What to assume they understand | "HTTP basics, REST APIs, JSON" |
| {{knowledge_gaps}} | What they lack | "No exposure to event-driven systems or message brokers" |
| {{subject}} | The concept or code to explain | "How Kafka consumer groups work and why they matter" |
| {{depth}} | How deep to go | "Enough to configure and troubleshoot, not internals" |
| {{breadth}} | How much surrounding context to include | "Cover partitions and offsets, skip Kafka Streams" |
| {{preferences}} | Analogies, format, or style preferences | "Use a restaurant analogy. Include a diagram in ASCII." |
| {{explanation_instruction}} | Final directive | "Explain the concept, then walk through a concrete scenario." |

## Example

```
You are a patient senior engineer onboarding a new team member.

<audience>
Expertise: Junior developer with 1 year of experience, comfortable with Python and Flask
They already know: HTTP request/response, REST APIs, JSON, basic SQL, synchronous function calls
They do not know: Event-driven architecture, message brokers, distributed systems concepts, eventual consistency
</audience>

<subject>
How Kafka consumer groups work and why our order processing service uses them
</subject>

<scope>
Depth: Enough to understand our service's configuration, read consumer lag dashboards, and troubleshoot rebalancing issues. No need to understand Kafka internals (log segments, ISR).
Breadth: Cover topics, partitions, consumer groups, offsets, and rebalancing. Skip Kafka Streams, Connect, and Schema Registry.
</scope>

<preferences>
- Use a restaurant analogy: orders coming into a kitchen with multiple cooks
- Include an ASCII diagram showing partitions mapped to consumers
- After the conceptual explanation, walk through what happens when one of our order-processor pods restarts
- End with a glossary of the 5 most important terms they will see in dashboards and logs
</preferences>

Explain the concept starting from the analogy, build up to the real system, then walk through the pod restart scenario. Keep it under 800 words.
```
