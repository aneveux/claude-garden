# Jenkins Plugin Test Patterns

## Table of Contents

- [Config Roundtrip Testing](#config-roundtrip-testing)
- [Pipeline Testing](#pipeline-testing)
- [Snippetizer Testing](#snippetizer-testing)
- [Form Validation Testing](#form-validation-testing)
- [CasC Testing](#casc-testing)
- [Security Testing](#security-testing)
- [Acceptance Test Harness Patterns](#acceptance-test-harness-patterns)
- [Test Dependencies and Setup](#test-dependencies-and-setup)
- [Anti-patterns to Avoid](#anti-patterns-to-avoid)

---

## Config Roundtrip Testing

The most important plugin test pattern. Verifies that configuration survives
a form submission round-trip: save the config, reload the page, confirm
the values are intact.

### Builder Roundtrip

```java
@Test
public void configRoundtrip() throws Exception {
    FreeStyleProject p = j.createFreeStyleProject();
    MyBuilder before = new MyBuilder("hello");
    p.getBuildersList().add(before);
    j.configRoundtrip(p);
    MyBuilder after = p.getBuildersList().get(MyBuilder.class);
    j.assertEqualDataBoundBeans(before, after);
}
```

`assertEqualDataBoundBeans` compares all `@DataBoundConstructor` and
`@DataBoundSetter` properties recursively. Prefer it over field-by-field
assertions.

### Global Config Roundtrip

```java
@Test
public void globalConfigRoundtrip() throws Exception {
    MyGlobalConfig config = MyGlobalConfig.get();
    config.setServerUrl("https://example.com");
    config.save();

    j.configRoundtrip();

    MyGlobalConfig reloaded = MyGlobalConfig.get();
    assertEquals("https://example.com", reloaded.getServerUrl());
}
```

The no-argument `j.configRoundtrip()` submits the global configuration page.

### Publisher Roundtrip

```java
@Test
public void publisherRoundtrip() throws Exception {
    FreeStyleProject p = j.createFreeStyleProject();
    MyPublisher before = new MyPublisher("report/*.xml");
    p.getPublishersList().add(before);
    j.configRoundtrip(p);
    MyPublisher after = p.getPublishersList().get(MyPublisher.class);
    j.assertEqualDataBoundBeans(before, after);
}
```

### Node Config Roundtrip

```java
@Test
public void nodeConfigRoundtrip() throws Exception {
    DumbSlave slave = j.createSlave();
    MyNodeProperty before = new MyNodeProperty("value");
    slave.getNodeProperties().add(before);
    j.configRoundtrip(slave);
    MyNodeProperty after = slave.getNodeProperties().get(MyNodeProperty.class);
    j.assertEqualDataBoundBeans(before, after);
}
```

---

## Pipeline Testing

### Dependencies

Add these test-scoped dependencies in `pom.xml`:

```xml
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
```

Versions are managed by the BOM; do not pin them manually.

### Basic Pipeline Test

```java
@Test
public void pipelineStep() throws Exception {
    WorkflowJob p = j.createProject(WorkflowJob.class, "test-pipeline");
    p.setDefinition(new CpsFlowDefinition(
            "node { writeFile text: 'hello', file: 'out.txt' }", true));
    WorkflowRun b = j.buildAndAssertSuccess(p);
    j.assertLogContains("hello", b);
}
```

Key classes: `WorkflowJob`, `CpsFlowDefinition`, `WorkflowRun`.

### Sandbox Mode

The second argument to `CpsFlowDefinition` controls sandbox mode:

- `true` (recommended) -- runs in Groovy sandbox, matching production defaults.
- `false` -- runs outside the sandbox. Use only when testing admin-level scripts
  or when the step genuinely requires unsandboxed execution.

```java
// Sandboxed (default production behavior)
new CpsFlowDefinition("node { myStep() }", true)

// Unsandboxed (admin scripts)
new CpsFlowDefinition("node { myStep() }", false)
```

### Loading Scripts from Resources

Place `.groovy` files under `src/test/resources/` alongside the test class.

```java
@Test
public void pipelineFromResource() throws Exception {
    String script = IOUtils.toString(
            getClass().getResource("myPipeline.groovy"),
            StandardCharsets.UTF_8);
    WorkflowJob p = j.createProject(WorkflowJob.class, "resource-pipeline");
    p.setDefinition(new CpsFlowDefinition(script, true));
    WorkflowRun b = j.buildAndAssertSuccess(p);
    j.assertLogContains("expected output", b);
}
```

### Asserting Build Failures

```java
@Test
public void pipelineFailsOnBadInput() throws Exception {
    WorkflowJob p = j.createProject(WorkflowJob.class, "fail-pipeline");
    p.setDefinition(new CpsFlowDefinition(
            "node { myStep(param: 'invalid') }", true));
    WorkflowRun b = j.buildAndAssertStatus(Result.FAILURE, p);
    j.assertLogContains("Invalid parameter", b);
}
```

---

## Snippetizer Testing

Verifies that a Pipeline step object round-trips through the snippet
generator -- the UI that turns step configuration into Groovy code.

### Dependency

```xml
<dependency>
    <groupId>org.jenkins-ci.plugins.workflow</groupId>
    <artifactId>workflow-cps</artifactId>
    <classifier>tests</classifier>
    <scope>test</scope>
</dependency>
```

The `tests` classifier pulls in `SnippetizerTester`.

### Round-trip Test

```java
@Test
public void snippetizerRoundtrip() throws Exception {
    SnippetizerTester st = new SnippetizerTester(j);
    MyStep step = new MyStep("hello");
    step.setOptionalParam(42);
    st.assertRoundTrip(step, "myStep opt: 42, value: 'hello'");
}
```

`assertRoundTrip` takes the configured step object and the expected Groovy
snippet string. It verifies that serializing the step produces the expected
snippet and that parsing the snippet back reconstructs an equivalent step.

---

## Form Validation Testing

### Testing doCheck Methods

`FormValidation` methods named `doCheckFieldName` run server-side when a
user changes a form field.

```java
@Test
public void validatesServerUrl() throws Exception {
    MyBuilder.DescriptorImpl descriptor = j.jenkins
            .getDescriptorByType(MyBuilder.DescriptorImpl.class);

    FormValidation ok = descriptor.doCheckServerUrl("https://example.com");
    assertEquals(FormValidation.Kind.OK, ok.kind);

    FormValidation error = descriptor.doCheckServerUrl("");
    assertEquals(FormValidation.Kind.ERROR, error.kind);
}
```

### XSS Prevention Testing

Verify that user-controlled values are properly escaped in rendered HTML.

```java
@Test
public void displayNameIsEscaped() throws Exception {
    FreeStyleProject p = j.createFreeStyleProject("xss-test");
    p.setDisplayName("<script>alert('xss')</script>");

    JenkinsRule.WebClient wc = j.createWebClient();
    HtmlPage page = wc.goTo("job/xss-test/");
    String content = page.getWebResponse().getContentAsString();

    assertThat(content, not(containsString("<script>alert")));
    assertThat(content, containsString("&lt;script&gt;"));
}
```

### Testing with Security Assertions

```java
@Test
public void formValidationRequiresPermission() throws Exception {
    j.jenkins.setSecurityRealm(j.createDummySecurityRealm());
    j.jenkins.setAuthorizationStrategy(
            new MockAuthorizationStrategy()
                    .grant(Jenkins.READ).everywhere().toEveryone());

    JenkinsRule.WebClient wc = j.createWebClient()
            .withBasicApiToken("reader");
    wc.setThrowExceptionOnFailingStatusCode(false);

    Page page = wc.goTo(
            "descriptorByName/MyBuilder/checkServerUrl?value=foo",
            null);
    assertEquals(403, page.getWebResponse().getStatusCode());
}
```

---

## CasC Testing

Configuration as Code (CasC) tests verify that your plugin's configuration
survives YAML import and export.

### Dependencies

```xml
<dependency>
    <groupId>io.jenkins</groupId>
    <artifactId>configuration-as-code</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>io.jenkins.configuration-as-code</groupId>
    <artifactId>test-harness</artifactId>
    <scope>test</scope>
</dependency>
```

### Import Test

Place YAML files under `src/test/resources/` alongside the test class.

```yaml
# src/test/resources/com/example/MyPluginCasCTest/configuration-as-code.yml
unclassified:
  myPlugin:
    serverUrl: "https://example.com"
    timeout: 30
```

```java
@Test
@ConfiguredWithCode("configuration-as-code.yml")
public void importConfig() {
    MyGlobalConfig config = MyGlobalConfig.get();
    assertEquals("https://example.com", config.getServerUrl());
    assertEquals(30, config.getTimeout());
}
```

### Export Round-trip Test

```java
@Test
@ConfiguredWithCode("configuration-as-code.yml")
public void exportConfig() throws Exception {
    ConfiguratorRegistry registry = ConfiguratorRegistry.get();
    ConfigurationContext context = new ConfigurationContext(registry);
    CNode node = ConfigurationAsCode.get().toYaml(context);

    String exported = Util.toYamlString(node);
    assertThat(exported, containsString("serverUrl: \"https://example.com\""));
    assertThat(exported, containsString("timeout: 30"));
}
```

### Testing All Configuration Variants

Write separate YAML files for each configuration variant: defaults only,
minimal config, full config, edge cases. Each gets its own test method
annotated with `@ConfiguredWithCode`.

---

## Security Testing

### Permission Checks

```java
@Test
public void requiresAdminPermission() throws Exception {
    j.jenkins.setSecurityRealm(j.createDummySecurityRealm());
    j.jenkins.setAuthorizationStrategy(
            new MockAuthorizationStrategy()
                    .grant(Jenkins.ADMINISTER).everywhere().to("admin")
                    .grant(Jenkins.READ).everywhere().to("reader"));

    JenkinsRule.WebClient adminWc = j.createWebClient()
            .login("admin");
    adminWc.goTo("myPlugin/configure");  // should succeed

    JenkinsRule.WebClient readerWc = j.createWebClient()
            .login("reader");
    readerWc.setThrowExceptionOnFailingStatusCode(false);
    Page page = readerWc.goTo("myPlugin/configure", null);
    assertEquals(403, page.getWebResponse().getStatusCode());
}
```

### MockAuthorizationStrategy

Fine-grained permission setup for tests:

```java
new MockAuthorizationStrategy()
    .grant(Jenkins.ADMINISTER).everywhere().to("admin")
    .grant(Jenkins.READ).everywhere().toEveryone()
    .grant(Item.READ).onItems(project).to("developer")
    .grant(Item.BUILD).onItems(project).to("developer");
```

### CSRF Protection

```java
@Test
public void postEndpointRequiresCrumb() throws Exception {
    JenkinsRule.WebClient wc = j.createWebClient();

    // Correct: use crumbed URL
    WebRequest req = new WebRequest(
            wc.createCrumbedUrl("myPlugin/doAction"),
            HttpMethod.POST);
    Page page = wc.getPage(req);
    assertEquals(200, page.getWebResponse().getStatusCode());
}
```

### @POST Annotation Verification

Endpoints that mutate state must be annotated with `@POST`. The test
harness rejects `GET` requests to `@POST` endpoints with a 405 status:

```java
@Test
public void getRequestRejectedOnPostEndpoint() throws Exception {
    JenkinsRule.WebClient wc = j.createWebClient();
    wc.setThrowExceptionOnFailingStatusCode(false);

    Page page = wc.goTo("myPlugin/doAction", null);
    assertEquals(405, page.getWebResponse().getStatusCode());
}
```

---

## Acceptance Test Harness Patterns

The Acceptance Test Harness (ATH) runs tests against a real Jenkins WAR in
Docker. Use it for integration scenarios that `JenkinsRule` cannot cover:
browser interaction, Docker-based agents, multi-controller setups.

### Page Object Model

ATH uses a page object hierarchy:

| Class                  | Purpose                                         |
|------------------------|-------------------------------------------------|
| `PageObject`           | Base class, wraps a URL                         |
| `ContainerPageObject`  | Page that contains other page objects            |
| `PageArea`             | Section within a `ContainerPageObject`           |
| `Control`              | Single form element (input, checkbox, dropdown)  |

### CapybaraPortingLayer Convenience Methods

All page objects inherit these from `CapybaraPortingLayer`:

```java
find(by)                // locate element
clickButton("Save")     // click button by text
waitFor(by, timeout)    // wait for element to appear
fillIn("xpath", value)  // fill input field
check(by)               // check a checkbox
```

### Key Page Objects

- `Jenkins` -- the root page object, entry point for navigation.
- `FreeStyleJob` -- create, configure, and build a freestyle project.
- `Build` -- a specific build run. Access console output, artifacts.
- `DumbSlave` -- create and manage a static agent.
- `GlobalSecurityConfig` -- configure security realm and authorization.

### Test Anatomy

```java
@WithPlugins("my-plugin")
@WithCredentials(credentialType = WithCredentials.USERNAME_PASSWORD,
        values = {"admin", "secret"}, id = "my-creds")
public class MyPluginATHTest extends AbstractJUnitTest {

    @Test
    public void configureAndBuild() {
        FreeStyleJob job = jenkins.jobs.create();
        job.configure();
        // ... configure the job
        job.save();

        Build build = job.startBuild().shouldSucceed();
        assertThat(build.getConsole(), containsString("Success"));
    }
}
```

### @WithDocker for Container-Based Tests

```java
@WithDocker
@WithPlugins({"docker-workflow", "my-plugin"})
public class DockerIntegrationTest extends AbstractJUnitTest {
    // Tests that require Docker containers
}
```

### When to Use ATH vs JenkinsRule

| Scenario                        | Use            |
|---------------------------------|----------------|
| Config roundtrip                | `JenkinsRule`  |
| Pipeline step behavior          | `JenkinsRule`  |
| Form validation logic           | `JenkinsRule`  |
| Browser rendering / JS          | ATH            |
| Docker-based build agents       | ATH            |
| Cross-plugin integration        | ATH            |
| Performance-sensitive test suite | `JenkinsRule`  |

ATH tests are 10-100x slower than `JenkinsRule` tests. Default to
`JenkinsRule` and escalate to ATH only when necessary.

---

## Test Dependencies and Setup

### Parent POM

The Jenkins plugin parent POM includes `jenkins-test-harness` automatically.
No explicit dependency is needed for `JenkinsRule`.

```xml
<parent>
    <groupId>org.jenkins-ci.plugins</groupId>
    <artifactId>plugin</artifactId>
    <version>4.88</version>
    <relativePath />
</parent>
```

### BOM for Version Alignment

Use the Jenkins BOM to align all plugin dependency versions:

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>io.jenkins.tools.bom</groupId>
            <artifactId>bom-2.462.x</artifactId>
            <version>3435.v238d66a_043fb_</version>
            <scope>import</scope>
            <type>pom</type>
        </dependency>
    </dependencies>
</dependencyManagement>
```

With the BOM in place, omit `<version>` tags on individual dependencies.

### Test Classifier Dependencies

Some plugins publish a separate test jar with test utilities:

```xml
<dependency>
    <groupId>org.jenkins-ci.plugins.workflow</groupId>
    <artifactId>workflow-cps</artifactId>
    <classifier>tests</classifier>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>jenkins.scm</groupId>
    <artifactId>scm-api</artifactId>
    <classifier>tests</classifier>
    <scope>test</scope>
</dependency>
```

### Running Tests

```bash
# All tests
mvn test

# Single test class
mvn test -Dtest=MyBuilderTest

# Single test method
mvn test -Dtest=MyBuilderTest#configRoundtrip

# Custom timeout (seconds)
mvn test -Djenkins.test.timeout=600

# Debug mode (suspend and wait for debugger on port 5005)
mvn -Dmaven.surefire.debug test
```

---

## Anti-patterns to Avoid

### Thread.sleep()

Never use `Thread.sleep()` to wait for asynchronous operations. The test
harness provides deterministic waiting methods:

```java
// BAD
build.run();
Thread.sleep(10000);
assertLogContains("done", build);

// GOOD
WorkflowRun b = j.buildAndAssertSuccess(p);

// GOOD -- waiting for a specific message
j.waitForMessage("Deploying to staging", b);

// GOOD -- waiting for a node to come online
j.waitOnline(slave);

// GOOD -- waiting for build completion
j.waitForCompletion(b);
```

### Testing in ATH What JenkinsRule Can Handle

ATH spins up a full Jenkins instance in Docker. A roundtrip test that takes
200ms with `JenkinsRule` takes 20+ seconds in ATH. Reserve ATH for scenarios
that genuinely require a browser or Docker environment.

### Sharing Mutable State with @ClassRule

`@ClassRule` shares a single `JenkinsRule` across all test methods in a class.
Tests that modify shared state (create jobs, change security) will interfere
with each other. Prefer `@Rule` (per-test instance) unless you have a
compelling performance reason and all tests are read-only.

```java
// RISKY -- shared state across tests
@ClassRule
public static JenkinsRule j = new JenkinsRule();

// SAFE -- fresh instance per test
@Rule
public JenkinsRule j = new JenkinsRule();
```

### RestartableJenkinsRule (Deprecated)

`RestartableJenkinsRule` is deprecated. Use `JenkinsSessionRule` for tests
that need to survive a Jenkins restart:

```java
@Rule
public JenkinsSessionRule sessions = new JenkinsSessionRule();

@Test
public void persistsAcrossRestart() throws Throwable {
    sessions.then(j -> {
        FreeStyleProject p = j.createFreeStyleProject("persist-test");
        p.setDescription("before restart");
    });
    sessions.then(j -> {
        FreeStyleProject p = j.jenkins.getItemByFullName(
                "persist-test", FreeStyleProject.class);
        assertEquals("before restart", p.getDescription());
    });
}
```

Each `sessions.then()` lambda runs in a fresh Jenkins session. State must
survive via persistence (XML on disk), not in-memory references.

### Hard-coding Jenkins URLs

Never construct Jenkins URLs manually. The port is dynamically assigned:

```java
// BAD
String url = "http://localhost:8080/job/test/";

// GOOD
URL url = j.getURL();
String jobUrl = j.getURL() + "job/test/";
```

### Writing New Tests When Existing Tests Can Be Extended

Before adding a new test method, check if an existing test already covers
a related scenario. Extending an existing test with an additional assertion
is cheaper than bootstrapping a new Jenkins instance. This applies
especially to `JenkinsRule` tests where each method starts a fresh controller.
