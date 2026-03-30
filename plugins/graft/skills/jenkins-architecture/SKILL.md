---
name: jenkins-architecture
version: 1.0.0
description: |
  Jenkins plugin core architecture — extension points, Descriptor/Describable pattern, Stapler
  web framework, configuration binding, annotations, persistence, and project structure. Use
  this skill when writing, reviewing, or understanding Jenkins plugin Java code. Covers the
  foundational APIs and patterns every Jenkins plugin builds on: @Extension, @DataBoundConstructor,
  @DataBoundSetter, @Symbol, BuildStepDescriptor, GlobalConfiguration, and XStream persistence.
  Make sure to use this skill whenever the user mentions Jenkins plugin development, hpi files,
  Jenkins build steps, Jenkins global configuration, Manage Jenkins page, Jenkins XML persistence,
  or any Jenkins extension point — even if they just say "write a Jenkins plugin."
  Triggers on: Jenkins plugin, extension point, Descriptor, Describable, Stapler, DataBoundConstructor,
  config.jelly, hpi, Jenkins API, pom.xml Jenkins, Jenkins build step, GlobalConfiguration,
  Manage Jenkins, Jenkins persistence, SimpleBuildStep.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Jenkins Plugin Architecture

Core knowledge for building Jenkins plugins. Everything here applies to all plugin types —
build steps, post-build actions, global configuration, Pipeline steps, and custom extensions.

## Project Structure

```
my-plugin/
  pom.xml                           # Parent POM: org.jenkins-ci.plugins:plugin
  src/main/java/                    # Java source
  src/main/resources/               # Jelly views, help files, messages.properties
  src/test/java/                    # JUnit tests
  src/test/resources/               # Test data, @LocalData, Pipeline .groovy scripts
  work/                             # Dev Jenkins state (hpi:run), gitignored
```

**Parent POM** (must be recent):
```xml
<parent>
    <groupId>org.jenkins-ci.plugins</groupId>
    <artifactId>plugin</artifactId>
    <version>4.88</version>
    <relativePath />
</parent>
```

**BOM for dependency alignment** — eliminates version conflicts:
```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>io.jenkins.tools.bom</groupId>
            <artifactId>bom-2.462.x</artifactId>
            <version>...</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

**Choosing the right BOM line:** The BOM artifact name encodes the minimum Jenkins LTS version
(e.g., `bom-2.462.x` targets Jenkins 2.462.x LTS). Match it to the `<jenkins.version>` in
your parent POM. Check [jenkinsci/bom](https://github.com/jenkinsci/bom) for available lines.
When starting a new plugin, use the latest LTS BOM. When maintaining an existing plugin, match
the BOM to the project's declared minimum Jenkins version.

**Build commands:**
| Command | Purpose |
|---------|---------|
| `mvn verify` | Build + static analysis + tests |
| `mvn hpi:run` | Launch dev Jenkins at localhost:8080/jenkins/ |
| `mvn hpi:run -Dport=5000` | Custom port |
| `mvn package` | Produce .hpi file |

## Extension Points

Extension points are interfaces/abstract classes that model Jenkins behavior. Plugins provide
implementations annotated with `@Extension` for automatic discovery via `ExtensionList`.

### Build Step Base Classes

| Class | Purpose | When to use |
|-------|---------|-------------|
| `Builder` | Build-time actions | Compile, test, deploy steps |
| `Recorder` | Post-build result collection | Collect stats, mark unstable/failure. Runs before notifiers. |
| `Notifier` | Post-build notifications | Send outcomes (email, Slack). Runs after recorders. |
| `BuildWrapper` | Pre/post environment setup | Wraps entire build (e.g., set env vars, start services) |
| `SimpleBuildStep` | Pipeline-compatible builder | Preferred for new build steps — works in both Freestyle and Pipeline |
| `SimpleBuildWrapper` | Pipeline-compatible wrapper | Preferred for new wrappers |

### Other Key Extension Points

| Class | Purpose |
|-------|---------|
| `GlobalConfiguration` | Plugin global settings on Manage Jenkins page |
| `Action` / `RunAction2` | Add URLs, sidebar links, views to model objects |
| `JobProperty<J>` | Per-job configuration |
| `Trigger<J>` | Build triggers (cron, SCM polling) |
| `SCM` | Source control integrations |
| `RunListener` | Build lifecycle hooks |
| `AdministrativeMonitor` | Warnings in admin UI |
| `QueueDecisionHandler` | Control build queue behavior |

## The Descriptor/Describable Pattern

The central extensibility mechanism — mirrors the Object/Class relationship.

**`Describable<T>`** — the configurable instance (a specific Builder config). Gets serialized
to XML. Has `getDescriptor()` that looks up the singleton via `Jenkins.get().getDescriptorOrDie()`.

**`Descriptor<T>`** — the singleton metadata/factory. Responsibilities:
- Renders configuration forms (Jelly/Groovy views)
- Stores system-wide configuration (`save()`/`load()`)
- Creates instances from form submissions
- Form validation (`doCheckXyz` methods)
- Dropdown population (`doFillXyzItems` methods)

**Convention**: Always a static nested class named `DescriptorImpl`:

```java
public class MyBuilder extends Builder implements SimpleBuildStep {
    private final String serverUrl;

    @DataBoundConstructor
    public MyBuilder(String serverUrl) {
        this.serverUrl = serverUrl;
    }

    public String getServerUrl() { return serverUrl; }

    @DataBoundSetter
    public void setTimeout(int timeout) { this.timeout = timeout; }

    @Override
    public void perform(Run<?, ?> run, FilePath workspace,
                        Launcher launcher, TaskListener listener) {
        listener.getLogger().println("Connecting to " + serverUrl);
    }

    @Symbol("myStep")
    @Extension
    public static class DescriptorImpl extends BuildStepDescriptor<Builder> {
        @Override
        public String getDisplayName() { return "My Build Step"; }

        @Override
        public boolean isApplicable(Class<? extends AbstractProject> t) {
            return true;
        }

        public FormValidation doCheckServerUrl(@QueryParameter String value) {
            if (value.isEmpty()) return FormValidation.error("URL is required");
            return FormValidation.ok();
        }
    }
}
```

`BuildStepDescriptor<T>` adds `isApplicable()` to control which job types the step appears in.

## Key Annotations

| Annotation | Purpose |
|-----------|---------|
| `@Extension` | Auto-registers class to ExtensionList. Has `ordinal()` (higher = first) and `optional` (graceful skip if deps missing). |
| `@DataBoundConstructor` | Marks constructor Stapler uses to create instances from JSON. Parameter names matched to JSON keys via compile-time annotation processing. |
| `@DataBoundSetter` | Optional properties. After constructor runs, remaining JSON properties set via matching setters. |
| `@Symbol("name")` | Short symbolic name for Pipeline DSL. Requires structs plugin dependency. |
| `@QueryParameter` | Injects HTTP query params into doCheck/doFill methods. Has `required`, `fixEmpty`. |
| `@AncestorInPath` | Injects ancestor model object from URL path. |
| `@Restricted(NoExternalUse.class)` | Marks internal APIs — not for external plugin use. |
| `@CheckForNull` / `@NonNull` | Nullability annotations — expected on web-facing methods. |
| `@POST` | Marks methods requiring POST (CSRF protection). Pair with `checkMethod="post"` in Jelly. |

### Constructor/Setter Best Practice

Keep `@DataBoundConstructor` parameters **minimal** (mandatory only). Use `@DataBoundSetter` for optional:

```java
@DataBoundConstructor
public MyStep(String location) { this.location = location; }

@DataBoundSetter
public void setTimeout(int timeout) { this.timeout = timeout; }
```

**Default values with XStream optimization** — store null when value equals default:
```java
@CheckForNull private String stuff;

@NonNull
public String getStuff() {
    return stuff == null ? DescriptorImpl.DEFAULT_STUFF : stuff;
}

@DataBoundSetter
public void setStuff(@NonNull String stuff) {
    this.stuff = stuff.equals(DescriptorImpl.DEFAULT_STUFF) ? null : stuff;
}
```

This prevents the snippet generator from emitting redundant empty arguments.

## Stapler Web Framework

Convention-over-configuration URL routing via object graph traversal.

**URL dispatch**: Each path segment resolves to getter/method/field:
- `/jenkins/job/myproject/configure` → `Jenkins.getJob("myproject").doConfigure()`
- `/jenkins/descriptorByName/com.example.MyBuilder/` → the DescriptorImpl singleton

**Method conventions**:
- `doXxx(StaplerRequest2, StaplerResponse2)` → handles GET/POST to `/xxx`
- `getXxx()` → traverses to child object at `/xxx`
- `getDynamic(String, ...)` → catch-all dynamic lookup

**View dispatch**: If no method matches, Stapler looks for Jelly/Groovy views:
- `index.jelly` — root view of an object
- `config.jelly` — configuration forms (on Descriptors)
- `global.jelly` — global configuration sections
- `help-fieldName.html` — inline help for form fields

## Configuration Binding Flow

1. User fills form (rendered by `config.jelly`)
2. Form data submitted as JSON (client-side transformation)
3. Stapler calls `StaplerRequest2.bindJSON(Class, JSONObject)`:
   - Finds `@DataBoundConstructor`, matches JSON keys to param names
   - Invokes constructor with matched values
   - Sets remaining properties via `@DataBoundSetter` methods
   - Runs any `@PostConstruct` methods
4. Object stored in project config (serialized to XML via XStream)

## Persistence

Jenkins stores data as XML in `JENKINS_HOME` via XStream serialization.

**Rules:**
- Mark non-persistent fields `transient`
- Retain deprecated fields for backward compatibility
- Migrate old fields in `readResolve()`
- Use `save()` to persist, `load()` to restore
- `PersistentDescriptor` interface auto-invokes `load()` on startup

**GlobalConfiguration pattern:**
```java
@Extension
@Symbol("myPluginConfig")
public class MyConfig extends GlobalConfiguration implements PersistentDescriptor {
    private String serverUrl;

    public String getServerUrl() { return serverUrl; }

    @DataBoundSetter
    public void setServerUrl(String serverUrl) {
        this.serverUrl = serverUrl;
        save();
    }
}
```

The `@Symbol` enables Configuration-as-Code (CasC) support automatically.

## Key Utility Classes

| Class | Purpose |
|-------|---------|
| `FormValidation` | Return type for doCheck methods — .ok(), .warning(msg), .error(msg) |
| `ListBoxModel` | Return type for doFill methods — populates dropdowns |
| `FilePath` | Remote-aware file operations (works across controller/agent) |
| `Launcher` | Remote-aware process execution |
| `Jenkins` | Singleton root object — entry point for everything |
| `Secret` | Encrypted storage for passwords/tokens — never use plain String |
| `Util` | String utilities — fixEmpty(), xmlEscape(), etc. |
| `Functions` | Jelly helper — htmlAttributeEscape(), isWindows(), etc. |

## Common Pitfalls

1. **Using `AbstractBuild` instead of `Run`** — breaks Pipeline compatibility
2. **Storing secrets as plain String** — always use `Secret` class
3. **Missing `@Symbol`** — forces ugly `[$class: 'ClassName']` Pipeline syntax
4. **Bloated `@DataBoundConstructor`** — put optional params in `@DataBoundSetter`
5. **Missing `save()` after GlobalConfiguration changes** — data lost on restart
6. **Caching values that change** (proxy config, DNS) — resolve just-in-time
7. **`toLowerCase()` without `Locale.ROOT`** — locale-dependent behavior
8. **Unnecessary dependency additions** — core maintainers consistently flag this
