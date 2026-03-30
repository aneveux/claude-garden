---
name: jenkins-pipeline
version: 1.0.0
description: |
  Jenkins Pipeline step implementation — Step/StepExecution pattern, CPS threading model,
  @Symbol naming, SynchronousNonBlockingStepExecution, durability with onResume(), and
  Pipeline-compatible API migration. Use this skill when implementing custom Pipeline steps,
  writing Jenkinsfile-compatible plugin code, or understanding how steps interact with the
  CPS VM thread. Make sure to use this skill whenever the user mentions Pipeline steps, custom
  Jenkinsfile steps, CPS threading, Step/StepExecution, or Pipeline credentials — even if they
  just say "make my plugin work in Pipeline."
  Triggers on: Pipeline step, StepExecution, workflow-step-api, CpsFlowDefinition, Jenkinsfile,
  @Symbol, SynchronousNonBlockingStepExecution, Pipeline plugin, Pipeline credentials, CPS thread,
  Pipeline compatible, workflow-cps.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Jenkins Pipeline Step Implementation

How to implement custom Pipeline steps that integrate cleanly with Declarative and Scripted
Pipeline. The canonical pattern comes from the `workflow-step-api-plugin`.

## Step + StepExecution Pattern

Every Pipeline step has two classes:

**Step** — declares parameters, creates execution:
```java
public class ReadCacheStep extends Step {
    private final String name;

    @DataBoundConstructor
    public ReadCacheStep(String name) {
        this.name = name;
    }

    public String getName() { return name; }

    @DataBoundSetter
    public void setExcludes(String excludes) { this.excludes = excludes; }

    // Prevent snippet generator from emitting excludes: ''
    public String getExcludes() { return Util.fixEmpty(excludes); }

    @Override
    public StepExecution start(StepContext context) throws Exception {
        return new Execution(context, this);
    }

    @Extension
    @Symbol("readCache")
    public static class DescriptorImpl extends StepDescriptor {
        @Override
        public String getFunctionName() { return "readCache"; }

        @Override
        public String getDisplayName() { return "Read Cache"; }

        @Override
        public Set<? extends Class<?>> getRequiredContext() {
            return Set.of(FilePath.class, Run.class, TaskListener.class);
        }
    }
}
```

**StepExecution** — the runtime logic:
```java
private static class Execution extends SynchronousNonBlockingStepExecution<Void> {
    private final transient ReadCacheStep step;

    Execution(StepContext context, ReadCacheStep step) {
        super(context);
        this.step = step;
    }

    @Override
    protected Void run() throws Exception {
        TaskListener listener = getContext().get(TaskListener.class);
        FilePath workspace = getContext().get(FilePath.class);
        Run<?, ?> run = getContext().get(Run.class);

        listener.getLogger().println("Reading cache: " + step.getName());
        // ... implementation ...
        return null;
    }

    @Override
    public void onResume() {
        // Called after Jenkins restart — restart the operation
        // since cache operations are idempotent
        super.onResume();
    }
}
```

## Execution Types

Choose the right base class:

| Class | Thread Model | When to use |
|-------|-------------|-------------|
| `SynchronousStepExecution` | Runs on CPS VM thread | **Avoid** — blocks the entire Pipeline engine |
| `SynchronousNonBlockingStepExecution` | Runs synchronously but off CPS thread | **Preferred** for I/O-bound steps (network, file ops) |
| `StepExecution` (async) | Non-blocking, callback-based | Long-running or event-driven steps (wait for input, external trigger) |
| `GeneralNonBlockingStepExecution` | Abstract helper for async | Simplifies async patterns |

**The CPS VM thread** runs all Pipeline Groovy code. If your step blocks this thread
(via `SynchronousStepExecution` or heavy computation), it blocks ALL Pipeline jobs
on that controller. Always use `SynchronousNonBlockingStepExecution` for I/O work.

## StepDescriptor Details

```java
public static class DescriptorImpl extends StepDescriptor {
    @Override
    public String getFunctionName() { return "myStep"; }

    @Override
    public Set<? extends Class<?>> getRequiredContext() {
        // Declare what context objects the step needs
        return Set.of(FilePath.class, Run.class, TaskListener.class);
    }

    @Override
    public boolean takesImplicitBlockArgument() {
        // true for steps like withEnv { ... } that wrap a block
        return false;
    }
}
```

**Required context** tells Jenkins what the step needs. Common context types:
- `Run.class` — the build
- `FilePath.class` — workspace (requires agent allocation)
- `TaskListener.class` — build log
- `Launcher.class` — process execution on agent
- `EnvVars.class` — environment variables
- `FlowNode.class` — Pipeline graph node

Steps that don't need `FilePath` or `Launcher` can run without a `node {}` block.

## Durability: onResume()

When Jenkins restarts mid-Pipeline, running steps get `onResume()` called.

**Idempotent operations** (cache read/write, file copy): just restart.
**Non-idempotent operations** (deploy, send notification): check state and decide.
**Default behavior**: `super.onResume()` re-runs `run()`.

```java
@Override
public void onResume() {
    // Option 1: Restart (safe for idempotent ops)
    super.onResume();

    // Option 2: Fail gracefully
    getContext().onFailure(new AbortException("Interrupted by restart"));

    // Option 3: Skip if already done (check external state)
    if (alreadyCompleted()) {
        getContext().onSuccess(null);
    } else {
        super.onResume();
    }
}
```

## Pipeline-Compatible API Migration

| Legacy (Freestyle only) | Pipeline-compatible |
|--------------------------|---------------------|
| `AbstractBuild` | `Run<?, ?>` |
| `AbstractProject` | `Job<?, ?>` |
| `AbstractBuild.getProject()` | `Run.getParent()` |
| `BuildListener` | `TaskListener` |
| `getBuiltOn()` | `FilePath.toComputer()` |
| `TransientProjectActionFactory` | `TransientActionFactory<Job>` |
| `Trigger<AbstractProject>` | `Trigger<Job>` or `Trigger<ParameterizedJob>` |

**Key rule**: If your method signature uses `AbstractBuild`, it won't work in Pipeline.
Always use `Run` and `Job` as the base types.

## @Symbol for Clean Pipeline Syntax

Without `@Symbol`: `step([$class: 'MyBuilder', name: 'value'])`
With `@Symbol("myStep")`: `myStep 'value'`

Requires `structs` plugin dependency. Place `@Symbol` on the `DescriptorImpl`:
```java
@Symbol("myStep")
@Extension
public static class DescriptorImpl extends StepDescriptor { ... }
```

For build steps (Builder/Publisher), `@Symbol` goes on `BuildStepDescriptor`:
```java
@Symbol("myBuilder")
@Extension
public static class DescriptorImpl extends BuildStepDescriptor<Builder> { ... }
```

## Credentials in Pipeline

Never use plain `String` password fields. Use the Credentials Plugin:

1. Store a `credentialsId` field (String)
2. Use `<c:select/>` in config.jelly for the credential picker
3. Look up credentials at runtime using the appropriate type:

```java
// Username + password (most common)
StandardUsernamePasswordCredentials creds = CredentialsProvider.findCredentialById(
    credentialsId, StandardUsernamePasswordCredentials.class, run);

// API token / secret text
StringCredentials token = CredentialsProvider.findCredentialById(
    credentialsId, StringCredentials.class, run);
String secret = token.getSecret().getPlainText();

// SSH private key
SSHUserPrivateKey sshKey = CredentialsProvider.findCredentialById(
    credentialsId, SSHUserPrivateKey.class, run);

// File-based credential (certificates, keystores)
FileCredentials file = CredentialsProvider.findCredentialById(
    credentialsId, FileCredentials.class, run);
```

**Common credential types:**
| Interface | Use case | Plugin dependency |
|-----------|----------|-------------------|
| `StandardUsernamePasswordCredentials` | Username + password | `credentials` |
| `StringCredentials` | API tokens, secret strings | `plain-credentials` |
| `SSHUserPrivateKey` | SSH keys | `ssh-credentials` |
| `FileCredentials` | Certificates, keystores | `plain-credentials` |
| `StandardCertificateCredentials` | X.509 certificates | `credentials` |

**Domain scoping** — use `CredentialsMatchers` for filtering:
```java
List<StandardUsernamePasswordCredentials> creds = CredentialsProvider.lookupCredentials(
    StandardUsernamePasswordCredentials.class, run.getParent(),
    ACL.SYSTEM, URIRequirementBuilder.fromUri(serverUrl).build());
```

**Security**: Keep credential usage inside `sh` steps. Never store secrets in Groovy
variables — they get serialized to `program.dat`.

## Declarative Pipeline Considerations

- Never use `script {}` blocks — they defeat the purpose of Declarative Pipeline
- If your step needs controller-level scripting, use Scripted Pipeline instead
- Steps should be self-contained — one step, one action
- Use `@Symbol` so steps work naturally in `steps {}` blocks

## Error Handling

Use `AbortException` for user-facing errors (bad config, missing file):
```java
throw new AbortException("Cache '" + name + "' not found");
```

Use `IllegalStateException` for programming errors (should never happen):
```java
if (workspace == null) throw new IllegalStateException("No workspace");
```

Use `getContext().onFailure(exception)` for async error reporting.

## Production Plugin Patterns

Best practices observed in well-reviewed production plugins:

1. **Multi-module structure** — core API + backends as separate HPIs
2. **SPI pattern** — abstract `ExtensionPoint` with backends discovered via `@Extension`
3. **Null Object** — default/disabled implementation as both default and kill switch
4. **`SynchronousNonBlockingStepExecution`** — never blocks CPS thread
5. **`Util.fixEmpty()` in getters** — clean snippet generator output
6. **`@POST` on validation methods** — CSRF protection
7. **Graceful degradation** — most failures log a message but don't fail the build
8. **SystemProperties escape hatches** — runtime-tunable flags via script console
9. **Least-privilege agents** — agents never get direct cloud credentials
10. **Pipeline script tests stored as `.groovy` resources** — not inline strings
