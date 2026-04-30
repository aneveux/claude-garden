---
name: analysis
category: analysis
description: "Prompt template for analytical tasks like data analysis, comparison, and evaluation"
recommended-techniques:
  - chain-of-thought
  - constraint-specification
  - xml-structuring
---

# Analysis

## When to use

When you need an AI to analyze data, compare options, evaluate trade-offs, or produce structured assessments. Works for technical evaluations, architecture decisions, tool comparisons, and data interpretation.

## Structure

```
Analyze the following {{analysis_type}}.

<input-data>
{{input_data}}
</input-data>

<dimensions>
{{analysis_dimensions}}
</dimensions>

<criteria>
{{evaluation_criteria}}
</criteria>

<constraints>
{{constraints}}
</constraints>

<output-format>
{{output_format}}
</output-format>

Think step by step. {{analysis_instruction}}
```

## Placeholders

| Placeholder | Description | Example |
|-------------|-------------|---------|
| {{analysis_type}} | What kind of analysis this is | "technology comparison for a message queue" |
| {{input_data}} | The raw data, options, or artifacts to analyze | Feature matrices, benchmark data, config files |
| {{analysis_dimensions}} | Axes along which to evaluate | "Performance, operational complexity, cost, ecosystem" |
| {{evaluation_criteria}} | How to weigh or score dimensions | "Latency under 50ms is hard requirement. Cost is secondary." |
| {{constraints}} | Boundaries on the analysis | "Team has no Erlang experience. Must run on AWS." |
| {{output_format}} | Structure for the output | "Comparison matrix, then prose analysis per dimension, then recommendation" |
| {{analysis_instruction}} | Final directive with reasoning visibility | "Show your reasoning for each dimension before the final recommendation." |

## Example

```
Analyze the following technology comparison for a message queue.

<input-data>
Options under consideration:
1. Apache Kafka 3.7
2. NATS JetStream 2.10
3. Amazon SQS + SNS

Context: E-commerce platform processing 15,000 orders/minute at peak.
Current stack: Go microservices on EKS, PostgreSQL, Redis.
Team: 4 backend engineers, no dedicated infra team.
</input-data>

<dimensions>
- Throughput and latency at peak load
- Operational complexity (deploy, monitor, troubleshoot)
- Message ordering and exactly-once delivery guarantees
- Cost at current and 5x projected scale
- Go client ecosystem maturity
</dimensions>

<criteria>
- P99 latency under 100ms is a hard requirement
- Ordering per customer is required, global ordering is not
- Team cannot dedicate more than 10% time to queue operations
- Cost should stay under $2,000/month at current scale
</criteria>

<constraints>
- Must run on AWS (EKS or managed service)
- No JVM expertise on the team — rules out custom Kafka tooling
- Must support dead-letter queues or equivalent retry mechanism
- Data retention of at least 7 days for replay
</constraints>

<output-format>
1. Comparison matrix (option x dimension, rated: strong / adequate / weak)
2. Per-dimension analysis with reasoning (3-5 sentences each)
3. Risk summary for each option (what could go wrong)
4. Final recommendation with justification
</output-format>

Think step by step. Show your reasoning for each dimension before the final recommendation. Call out any assumptions you are making.
```
