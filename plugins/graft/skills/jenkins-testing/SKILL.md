---
name: jenkins-testing
version: 1.0.0
description: |
  Jenkins plugin testing expertise — JenkinsRule, RealJenkinsRule, JenkinsSessionRule, Pipeline
  testing, config roundtrips, Acceptance Test Harness page objects, and expert-approved test
  patterns. Use this skill when writing tests for Jenkins plugins, choosing between test rules,
  setting up test dependencies, or understanding Jenkins-specific test utilities. Make sure to
  use this skill whenever the user mentions Jenkins plugin tests, config roundtrip, Pipeline test,
  snippetizer test, or Jenkins test harness — even if they just say "add tests for my plugin."
  Triggers on: JenkinsRule, RealJenkinsRule, JenkinsSessionRule, Jenkins plugin test, config roundtrip,
  WorkflowJob test, acceptance test harness, ATH, @WithoutJenkins, BuildWatcher, LoggerRule,
  jenkins-test-harness, mvn test Jenkins, HtmlUnit Jenkins.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Jenkins Plugin Testing

Testing Jenkins plugins requires specialized test harnesses that spin up real Jenkins instances.
The parent POM includes `jenkins-test-harness` automatically — no explicit dependency needed.

## Choosing the Right Test Rule

| Rule | Speed | Realism | Use when |
|------|-------|---------|----------|
| `JenkinsRule` | Fast | Good | Default choice. In-process Jenkins with HtmlUnit. |
| `RealJenkinsRule` | Slow | Best | Classloader isolation, restart testing, FIPS mode. |
| `JenkinsSessionRule` | Medium | Good | Persistence across restarts (same JENKINS_HOME). |
| `@WithoutJenkins` | Fastest | None | Pure unit tests that don't need Jenkins. |

**Decision flow:**
1. Can you test without Jenkins at all? → `@WithoutJenkins`
2. Does classloading matter (reflection, `Class.forName`)? → `RealJenkinsRule`
3. Testing persistence across restarts? → `JenkinsSessionRule`
4. Everything else → `JenkinsRule`

## Test Dependencies

The BOM handles version alignment. Add these in test scope:

```xml
<!-- Pipeline testing -->
<dependency>
    <groupId>org.jenkins-ci.plugins.workflow</groupId>
    <artifactId>workflow-job</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.jenkins-ci.plugins.workflow</groupId>
    <artifactId>workflow-cps</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.jenkins-ci.plugins.workflow</groupId>
    <artifactId>workflow-basic-steps</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.jenkins-ci.plugins.workflow</groupId>
    <artifactId>workflow-durable-task-step</artifactId>
    <scope>test</scope>
</dependency>

<!-- Snippetizer testing -->
<dependency>
    <groupId>org.jenkins-ci.plugins.workflow</groupId>
    <artifactId>workflow-cps</artifactId>
    <classifier>tests</classifier>
    <scope>test</scope>
</dependency>
```

## Essential Test Patterns

### Config Roundtrip (the most important test)

Verifies configuration survives form submission → serialization → deserialization:

```java
@Rule public JenkinsRule j = new JenkinsRule();

@Test
public void configRoundtrip() throws Exception {
    FreeStyleProject p = j.createFreeStyleProject();
    MyBuilder before = new MyBuilder("hello");
    before.setTimeout(30);
    p.getBuildersList().add(before);
    j.configRoundtrip(p);
    MyBuilder after = p.getBuildersList().get(MyBuilder.class);
    j.assertEqualDataBoundBeans(before, after);
}

@Test
public void globalConfigRoundtrip() throws Exception {
    MyConfig config = GlobalConfiguration.all().get(MyConfig.class);
    config.setServerUrl("https://example.com");
    j.configRoundtrip();
    assertEquals("https://example.com", config.getServerUrl());
}
```

**Write one for every `@DataBoundConstructor`/`@DataBoundSetter` field.** This catches
serialization bugs, form binding mismatches, and XStream configuration errors.

### Pipeline Testing

```java
@ClassRule public static BuildWatcher bw = new BuildWatcher();
@Rule public JenkinsRule j = new JenkinsRule();

@Test
public void pipelineSmokes() throws Exception {
    WorkflowJob p = j.createProject(WorkflowJob.class, "test");
    p.setDefinition(new CpsFlowDefinition(
        "node { myStep name: 'test' }", true));  // true = sandbox
    WorkflowRun b = j.buildAndAssertSuccess(p);
    j.assertLogContains("expected output", b);
}
```

**Load scripts from resources** (exemplar pattern from cache-step-plugin):
```java
p.setDefinition(new CpsFlowDefinition(
    IOUtils.toString(getClass().getResource("testScript.groovy"), UTF_8), true));
```

### Snippetizer Testing

Verifies Pipeline DSL generation round-trips correctly:
```java
@Test
public void snippetizer() throws Exception {
    SnippetizerTester st = new SnippetizerTester(j);
    st.assertRoundTrip(new MyStep("value"), "myStep 'value'");
    // Test with optional param
    MyStep withExcludes = new MyStep("value");
    withExcludes.setExcludes("*.tmp");
    st.assertRoundTrip(withExcludes, "myStep excludes: '*.tmp', name: 'value'");
}
```

### Security Testing

```java
@Test
public void formValidationEscapesHtml() throws Exception {
    FreeStyleProject p = j.createFreeStyleProject();
    p.setDisplayName("<img src=x>");
    // Verify the validation output escapes HTML
    // (assertion depends on what you're testing)
}

@Test
public void permissionCheckInValidation() throws Exception {
    j.jenkins.setSecurityRealm(j.createDummySecurityRealm());
    j.jenkins.setAuthorizationStrategy(new MockAuthorizationStrategy()
        .grant(Jenkins.READ).onRoot().to("reader"));

    try (ACLContext ctx = ACL.as(User.getById("reader", true))) {
        FormValidation result = descriptor.doCheckName("test");
        assertEquals(FormValidation.Kind.OK, result.kind);
    }
}
```

## Running Tests

```bash
mvn test                              # All tests
mvn test -Dtest=MyTest                # Single class
mvn test -Dtest=MyTest#myMethod       # Single method
mvn -Djenkins.test.timeout=300 verify # Custom timeout (seconds)
```

## Reference Files

For detailed API documentation on test rules and advanced patterns, read:
- `references/test-rules.md` — JenkinsRule, RealJenkinsRule, JenkinsSessionRule, LoggerRule API
- `references/test-patterns.md` — CasC testing, ATH page objects, anti-patterns

## Anti-Patterns (What Expert Reviewers Catch)

1. **`Thread.sleep()`** — use `waitForCompletion()`, `waitForMessage()`, `waitOnline()`
2. **Writing new tests when existing tests suffice** — extend existing tests instead
3. **Meaningless test scenarios** — test real behavior, not hypothetical states
4. **JenkinsRule when classloading matters** — use `RealJenkinsRule` for anything with reflection
5. **Hard-coding Jenkins URLs** — use `j.getURL()` or `j.jenkins.getRootUrl()`
6. **RestartableJenkinsRule** — deprecated, use `JenkinsSessionRule`
7. **Testing in ATH what JenkinsRule can handle** — ATH is 10-100x slower
8. **Heuristic-based security tests** — use deterministic behavior matching production
