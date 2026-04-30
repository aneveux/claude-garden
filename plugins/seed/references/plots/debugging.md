---
name: debugging
category: debugging
description: "Prompt template for diagnosis and debugging prompts"
recommended-techniques:
  - chain-of-thought
  - xml-structuring
  - anti-hallucination
---

# Debugging

## When to use

When you need an AI to help diagnose a bug, unexpected behavior, or system failure. Works for runtime errors, logic bugs, performance issues, and configuration problems.

## Structure

```
Help me debug the following issue.

<symptoms>
{{symptoms}}
</symptoms>

<environment>
{{environment}}
</environment>

<expected-behavior>
{{expected_behavior}}
</expected-behavior>

<actual-behavior>
{{actual_behavior}}
</actual-behavior>

<already-tried>
{{already_tried}}
</already-tried>

<relevant-code>
{{relevant_code}}
</relevant-code>

<logs>
{{logs}}
</logs>

Think step by step. {{investigation_instruction}}
```

## Placeholders

| Placeholder | Description | Example |
|-------------|-------------|---------|
| {{symptoms}} | What is observed going wrong | "API returns 502 intermittently under load" |
| {{environment}} | Runtime details: OS, versions, config | "Go 1.22, Linux, deployed on EKS, 3 replicas behind ALB" |
| {{expected_behavior}} | What should happen | "All requests return 200 with JSON response within 500ms" |
| {{actual_behavior}} | What actually happens | "~5% of requests return 502 after exactly 30 seconds" |
| {{already_tried}} | Debugging steps taken so far | "Checked pod logs, no OOM. Increased replica count, no change." |
| {{relevant_code}} | Code suspected to be involved | The handler, config, or module in question |
| {{logs}} | Error logs, stack traces, metrics | Relevant log output or error messages |
| {{investigation_instruction}} | How to structure the diagnosis | "List hypotheses ranked by likelihood, then suggest targeted steps to confirm or rule out each one." |

## Example

```
Help me debug the following issue.

<symptoms>
Our Go HTTP server intermittently returns 502 errors to clients.
It only happens under load (>200 req/s) and started after we
added a new middleware for request logging.
</symptoms>

<environment>
- Go 1.22, net/http with chi router
- Deployed on EKS (3 pods, 512MB memory limit, 250m CPU)
- ALB with 30s idle timeout
- PostgreSQL 15 on RDS (max_connections=100)
- New middleware added in commit abc123
</environment>

<expected-behavior>
All requests complete within 500ms and return JSON responses.
</expected-behavior>

<actual-behavior>
Under load, approximately 5% of requests hang for exactly 30 seconds,
then the ALB returns 502 to the client. The Go server logs show no
error for these requests — they simply never complete.
</actual-behavior>

<already-tried>
- Checked pod memory and CPU: neither is saturating
- Increased replicas from 3 to 6: no change in error rate
- Reverted the logging middleware: errors stopped
- Re-added middleware: errors returned
- Middleware only calls slog.Info and reads request headers
</already-tried>

<relevant-code>
func LoggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        body, _ := io.ReadAll(r.Body)
        slog.Info("request",
            "method", r.Method,
            "path", r.URL.Path,
            "body_size", len(body),
        )
        next.ServeHTTP(w, r)
    })
}
</relevant-code>

<logs>
No error logs from the Go server for failed requests.
ALB logs show: 502 responses with upstream_response_time=30.000
Pod metrics show goroutine count climbing linearly during load test.
</logs>

Think step by step. List your top 3 hypotheses ranked by likelihood. For each hypothesis, explain the reasoning and suggest a specific diagnostic step to confirm or rule it out. Do not guess — if you are uncertain about a behavior, say so.
```
