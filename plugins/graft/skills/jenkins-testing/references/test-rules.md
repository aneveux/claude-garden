# Jenkins Test Harness Rules

Reference for all JUnit rules and extensions provided by `jenkins-test-harness`.

## Table of Contents

- [JenkinsRule](#jenkinsrule)
  - [Basic Usage](#basic-usage)
  - [Project Creation](#project-creation)
  - [Agent Creation](#agent-creation)
  - [Build Execution](#build-execution)
  - [Configuration Round-Trip](#configuration-round-trip)
  - [Assertions](#assertions)
  - [Web and REST](#web-and-rest)
  - [Security](#security)
  - [WebClient](#webclient)
  - [Shared Instance with ClassRule](#shared-instance-with-classrule)
- [RealJenkinsRule](#realjenkinsrule)
  - [When to Use](#when-to-use)
  - [Key Differences from JenkinsRule](#key-differences-from-jenkinsrule)
  - [Configuration API](#configuration-api)
  - [Restart Testing with then()](#restart-testing-with-then)
  - [Remote Execution](#remote-execution)
- [JenkinsSessionRule](#jenkinssessionrule)
- [LoggerRule](#loggerrule)
- [BuildWatcher](#buildwatcher)
- [Additional Test Utilities](#additional-test-utilities)
  - [MockAuthorizationStrategy](#mockauthorizationstrategy)
  - [SCM Helpers](#scm-helpers)
  - [TestExtension](#testextension)
  - [LocalData](#localdata)
  - [WithoutJenkins](#withoutjenkins)
  - [InboundAgentRule](#inboundagentrule)
- [JUnit 5 Support](#junit-5-support)

---

## JenkinsRule

The workhorse of Jenkins plugin testing. Starts a full Jenkins instance in-process
using embedded Jetty. Each test method gets a clean `JENKINS_HOME` directory,
guaranteeing test isolation.

### Basic Usage

```java
import org.jvnet.hudson.test.JenkinsRule;

public class MyPluginTest {

    @Rule
    public JenkinsRule j = new JenkinsRule();

    @Test
    public void jenkinsIsRunning() {
        assertNotNull(j.jenkins);
        assertEquals(j.jenkins, Jenkins.get());
    }
}
```

The `j.jenkins` field provides direct access to the `Jenkins` singleton.
The embedded Jetty server is available at `j.getURL()`.

### Project Creation

Methods for creating jobs and folders in the test instance.

| Method | Returns | Description |
|--------|---------|-------------|
| `createFreeStyleProject()` | `FreeStyleProject` | Creates project with auto-generated name |
| `createFreeStyleProject(String name)` | `FreeStyleProject` | Creates project with specific name |
| `createProject(Class<T> type)` | `T` | Creates any `TopLevelItem` subtype |
| `createProject(Class<T> type, String name)` | `T` | Creates typed project with specific name |
| `createFolder(String name)` | `Folder` | Creates a folder (requires folder plugin) |

```java
@Test
public void createVariousProjects() {
    FreeStyleProject p = j.createFreeStyleProject("my-job");
    WorkflowJob pipeline = j.createProject(WorkflowJob.class, "my-pipeline");
    Folder folder = j.createFolder("my-folder");

    assertNotNull(j.jenkins.getItem("my-job"));
    assertNotNull(j.jenkins.getItem("my-pipeline"));
    assertNotNull(j.jenkins.getItem("my-folder"));
}
```

### Agent Creation

Methods for adding build agents (nodes) to the test instance.

| Method | Returns | Description |
|--------|---------|-------------|
| `createSlave()` | `DumbSlave` | Offline agent with random name |
| `createSlave(Label label)` | `DumbSlave` | Offline agent with given label |
| `createSlave(String name, String labels, EnvVars env)` | `DumbSlave` | Customized agent |
| `createOnlineSlave()` | `DumbSlave` | Agent that is immediately online |
| `createOnlineSlave(Label label)` | `DumbSlave` | Online agent with given label |
| `waitOnline(Slave slave)` | `Slave` | Blocks until agent connects |

```java
@Test
public void agentWithLabel() throws Exception {
    DumbSlave agent = j.createOnlineSlave(Label.get("linux"));

    FreeStyleProject p = j.createFreeStyleProject();
    p.setAssignedLabel(Label.get("linux"));

    j.buildAndAssertSuccess(p);
}
```

### Build Execution

Methods for triggering builds and waiting for results.

| Method | Returns | Description |
|--------|---------|-------------|
| `buildAndAssertSuccess(FreeStyleProject p)` | `FreeStyleBuild` | Schedules, waits, asserts SUCCESS |
| `assertBuildStatus(Result r, Future<? extends Run> f)` | `Run` | Waits for future, asserts status |
| `assertBuildStatusSuccess(Run r)` | void | Asserts run completed with SUCCESS |
| `waitForCompletion(Run r)` | `Run` | Blocks until run finishes |
| `waitForMessage(String msg, Run r)` | `Run` | Blocks until log contains message |

```java
@Test
public void buildStatusAssertions() throws Exception {
    FreeStyleProject p = j.createFreeStyleProject();
    p.getBuildersList().add(new Shell("echo hello"));

    FreeStyleBuild b = j.buildAndAssertSuccess(p);
    j.assertLogContains("hello", b);
}

@Test
public void waitForFailure() throws Exception {
    FreeStyleProject p = j.createFreeStyleProject();
    p.getBuildersList().add(new Shell("exit 1"));

    QueueTaskFuture<FreeStyleBuild> f = p.scheduleBuild2(0);
    j.assertBuildStatus(Result.FAILURE, f);
}

@Test
public void waitForLogMessage() throws Exception {
    FreeStyleProject p = j.createFreeStyleProject();
    p.getBuildersList().add(new Shell("echo 'step-1-done' && sleep 5"));

    FreeStyleBuild b = p.scheduleBuild2(0).waitForStart();
    j.waitForMessage("step-1-done", b);
}
```

### Configuration Round-Trip

Round-trip testing verifies that configuration survives save/load cycles through
the Jenkins web UI. This catches serialization issues, missing `@DataBoundConstructor`
annotations, and Jelly/Groovy form binding errors.

| Method | Description |
|--------|-------------|
| `configRoundtrip()` | Round-trips the global configuration page |
| `configRoundtrip(Item item)` | Round-trips a job's configuration |
| `configRoundtrip(Builder b)` | Round-trips a builder through a freestyle project |
| `configRoundtrip(Publisher p)` | Round-trips a publisher through a freestyle project |
| `configRoundtrip(Node n)` | Round-trips a node's configuration |
| `configRoundtrip(View v)` | Round-trips a view's configuration |
| `configRoundtrip(Cloud c)` | Round-trips a cloud's configuration |

```java
@Test
public void configRoundTripForBuilder() throws Exception {
    MyBuilder original = new MyBuilder("value1", true);

    MyBuilder roundTripped = j.configRoundtrip(original);

    assertEqualDataBoundBeans(original, roundTripped);
}

@Test
public void configRoundTripForJob() throws Exception {
    FreeStyleProject p = j.createFreeStyleProject();
    p.getBuildersList().add(new MyBuilder("config-value", false));

    j.configRoundtrip(p);

    MyBuilder after = p.getBuildersList().get(MyBuilder.class);
    assertEquals("config-value", after.getValue());
}

@Test
public void globalConfigRoundTrip() throws Exception {
    MyGlobalConfig config = GlobalConfiguration.all().get(MyGlobalConfig.class);
    config.setEndpoint("https://example.com");

    j.configRoundtrip();

    assertEquals("https://example.com", config.getEndpoint());
}
```

### Assertions

Utility assertions beyond standard JUnit.

| Method | Description |
|--------|-------------|
| `assertBuildStatusSuccess(Run r)` | Asserts run result is SUCCESS |
| `assertLogContains(String msg, Run r)` | Asserts build log contains string |
| `assertLogNotContains(String msg, Run r)` | Asserts build log does not contain string |
| `assertXPath(HtmlPage page, String xpath)` | Asserts XPath expression matches |
| `assertHelpExists(Class<? extends Describable> type, String field)` | Asserts help file exists for field |
| `assertEqualDataBoundBeans(Object expected, Object actual)` | Deep-compares DataBound properties |

```java
@Test
public void logAssertions() throws Exception {
    FreeStyleProject p = j.createFreeStyleProject();
    p.getBuildersList().add(new Shell("echo 'deploying to production'"));

    FreeStyleBuild b = j.buildAndAssertSuccess(p);

    j.assertLogContains("deploying to production", b);
    j.assertLogNotContains("ERROR", b);
}

@Test
public void helpFileExists() throws Exception {
    j.assertHelpExists(MyBuilder.class, "endpoint");
}
```

### Web and REST

Methods for interacting with the Jenkins HTTP layer.

| Method | Returns | Description |
|--------|---------|-------------|
| `createWebClient()` | `JenkinsRule.WebClient` | New HtmlUnit-based web client |
| `getURL()` | `URL` | Base URL of the test instance |
| `getJSON(String path)` | `JSONObject` | GET JSON from relative path |
| `postJSON(String path, Object body)` | `JSONObject` | POST JSON to relative path |
| `submit(HtmlForm form)` | `HtmlPage` | Submits an HTML form |

```java
@Test
public void restApiAccess() throws Exception {
    FreeStyleProject p = j.createFreeStyleProject("test-project");

    JSONObject json = j.getJSON("job/test-project/api/json");
    assertEquals("test-project", json.getString("name"));
}
```

### Security

Methods for configuring authentication and authorization in tests.

| Method | Returns | Description |
|--------|---------|-------------|
| `createDummySecurityRealm()` | `HudsonPrivateSecurityRealm` | Realm where any user/password works |
| `createApiToken(User user)` | `ApiTokenStore.TokenUuidAndPlainValue` | Creates API token for user |

```java
@Test
public void securedJenkins() throws Exception {
    j.jenkins.setSecurityRealm(j.createDummySecurityRealm());
    MockAuthorizationStrategy auth = new MockAuthorizationStrategy();
    auth.grant(Jenkins.ADMINISTER).everywhere().to("admin");
    auth.grant(Jenkins.READ, Item.READ).everywhere().to("reader");
    j.jenkins.setAuthorizationStrategy(auth);

    JenkinsRule.WebClient wc = j.createWebClient();
    wc.login("admin");
    wc.goTo("configure"); // admin can access

    JenkinsRule.WebClient readerWc = j.createWebClient();
    readerWc.login("reader");
    assertThrows(FailingHttpStatusCodeException.class,
        () -> readerWc.goTo("configure")); // reader cannot
}
```

### WebClient

`JenkinsRule.WebClient` wraps HtmlUnit for browser-level UI testing. Created
via `j.createWebClient()`.

| Method | Returns | Description |
|--------|---------|-------------|
| `goTo(String path)` | `HtmlPage` | Navigate to relative URL |
| `goTo(String path, String contentType)` | `Page` | Navigate expecting specific content type |
| `login(String username)` | `WebClient` | Authenticate with dummy realm |
| `login(String username, String password)` | `WebClient` | Authenticate with credentials |
| `withBasicCredentials(String username)` | `WebClient` | Use HTTP Basic auth |
| `withBasicApiToken(User user)` | `WebClient` | Use API token auth |
| `submit(HtmlForm form)` | `HtmlPage` | Submit a form |

```java
@Test
public void webUiInteraction() throws Exception {
    FreeStyleProject p = j.createFreeStyleProject("web-test");

    JenkinsRule.WebClient wc = j.createWebClient();
    HtmlPage page = wc.goTo("job/web-test/");
    assertThat(page.getTitleText(), containsString("web-test"));

    HtmlPage configPage = wc.goTo("job/web-test/configure");
    HtmlForm form = configPage.getFormByName("config");
    j.submit(form);
}

@Test
public void apiTokenAuth() throws Exception {
    j.jenkins.setSecurityRealm(j.createDummySecurityRealm());

    User user = User.getById("testuser", true);
    JenkinsRule.WebClient wc = j.createWebClient()
        .withBasicApiToken(user);

    HtmlPage page = wc.goTo("");
    assertEquals(200, page.getWebResponse().getStatusCode());
}
```

### Shared Instance with ClassRule

When tests are read-only and don't mutate Jenkins state, use `@ClassRule` to share
a single instance across all test methods. Significantly faster for large test classes.

```java
public class ReadOnlyTests {

    @ClassRule
    public static JenkinsRule j = new JenkinsRule();

    @Test
    public void checkVersion() {
        assertNotNull(Jenkins.VERSION);
    }

    @Test
    public void checkRootUrl() throws Exception {
        assertNotNull(j.getURL());
    }
}
```

**Warning:** Tests sharing a `@ClassRule` instance must not modify Jenkins state.
Mutations leak across test methods and cause flaky failures.

---

## RealJenkinsRule

Launches Jenkins in a **separate JVM** as a real WAR file. Slower than
`JenkinsRule` but provides full process isolation.

### When to Use

- Classloader isolation testing (plugin loading behavior)
- Startup/shutdown lifecycle behavior
- Restart testing with real WAR extraction
- Memory and GC behavior analysis
- FIPS mode testing
- Custom JVM options (`-Xmx`, system properties)

### Key Differences from JenkinsRule

| Aspect | JenkinsRule | RealJenkinsRule |
|--------|-------------|-----------------|
| JVM | Same process | Separate process |
| Speed | Fast (~2-5s startup) | Slow (~10-20s startup) |
| Lambdas | Normal | Must be `Serializable` |
| Static state | Shared with test | Isolated |
| `@TestExtension` | Available | Unavailable (use `addSyntheticPlugin`) |
| `LoggerRule` | Available | Unavailable (use `withLogger`) |
| `BuildWatcher` | Available | Unavailable (use `TailLog`) |

### Configuration API

Fluent configuration methods called before `then()` blocks.

| Method | Description |
|--------|-------------|
| `withLogger(Class<?> clazz, Level level)` | Enable logger in remote JVM |
| `javaOptions(String... opts)` | Add JVM arguments |
| `withTimeout(int seconds)` | Set step timeout |
| `withDebugPort(int port)` | Enable remote debugging |
| `withDebugSuspend()` | Suspend JVM until debugger attaches |
| `withFIPSEnabled()` | Start Jenkins in FIPS-compliant mode |
| `withColor()` | Enable ANSI color in Jenkins logs |

```java
public class RealJenkinsTest {

    @Rule
    public RealJenkinsRule rr = new RealJenkinsRule()
        .withLogger(MyPlugin.class, Level.FINE)
        .javaOptions("-Xmx512m")
        .withTimeout(300);
}
```

### Restart Testing with then()

Each `then()` call starts a fresh Jenkins process. `JENKINS_HOME` persists
between calls, enabling restart and migration testing.

```java
@Rule
public RealJenkinsRule rr = new RealJenkinsRule();

@Test
public void jobSurvivesRestart() throws Throwable {
    rr.then(r -> {
        FreeStyleProject p = r.createFreeStyleProject("persistent-job");
        p.getBuildersList().add(new Shell("echo hello"));
        r.buildAndAssertSuccess(p);
    });
    // Jenkins process stops. JENKINS_HOME preserved.
    rr.then(r -> {
        FreeStyleProject p = r.jenkins.getItemByFullName(
            "persistent-job", FreeStyleProject.class);
        assertNotNull("job must survive restart", p);
        assertEquals(1, p.getLastBuild().getNumber());
    });
}

@Test
public void configSurvivesRestart() throws Throwable {
    rr.then(r -> {
        MyGlobalConfig config = GlobalConfiguration.all()
            .get(MyGlobalConfig.class);
        config.setEndpoint("https://example.com");
        config.save();
    });
    rr.then(r -> {
        MyGlobalConfig config = GlobalConfiguration.all()
            .get(MyGlobalConfig.class);
        assertEquals("https://example.com", config.getEndpoint());
    });
}
```

### Remote Execution

All code inside `then()` runs in the remote JVM. Variants exist for
different serialization needs.

| Method | Description |
|--------|-------------|
| `then(Step step)` | Standard lambda `(JenkinsRule r) -> void` |
| `then(Step2<T> step)` | Returns a value from remote JVM |
| `runRemotely(Step... steps)` | Execute multiple steps sequentially |
| `runRemotely(StepWithOneArg<A1> step)` | Pass one serializable argument |

```java
@Test
public void remoteExecution() throws Throwable {
    rr.then(r -> {
        // This lambda is serialized, sent to remote JVM, deserialized, executed.
        // All referenced variables must be Serializable.
        String version = Jenkins.VERSION;
        assertNotNull(version);
    });
}
```

**Critical constraint:** Lambdas passed to `then()` are serialized across JVMs.
Any captured variable must implement `Serializable`. Non-serializable captures
cause `NotSerializableException` at runtime.

---

## JenkinsSessionRule

Tests persistence and configuration durability across Jenkins restarts.
Each `then()` call creates a fresh `JenkinsRule` instance but reuses the
same `JENKINS_HOME` directory. Runs in-process (unlike `RealJenkinsRule`).

Preferred replacement for the deprecated `RestartableJenkinsRule`.

Use cases:
- XML serialization round-trip verification
- Upgrade migration testing
- Configuration persistence after restart
- Plugin state durability

```java
public class SessionTest {

    @Rule
    public JenkinsSessionRule sessions = new JenkinsSessionRule();

    @Test
    public void credentialSurvivesRestart() throws Throwable {
        sessions.then(r -> {
            CredentialsStore store = CredentialsProvider
                .lookupStores(r.jenkins).iterator().next();
            store.addCredentials(Domain.global(),
                new UsernamePasswordCredentialsImpl(
                    CredentialsScope.GLOBAL, "my-cred", "",
                    "admin", "s3cret"));
        });
        sessions.then(r -> {
            List<UsernamePasswordCredentials> creds =
                CredentialsProvider.lookupCredentials(
                    UsernamePasswordCredentials.class, r.jenkins);
            assertThat(creds, hasSize(1));
            assertEquals("admin", creds.get(0).getUsername());
        });
    }

    @Test
    public void xmlRoundTrip() throws Throwable {
        sessions.then(r -> {
            FreeStyleProject p = r.createFreeStyleProject("roundtrip");
            p.setDescription("before restart");
        });
        sessions.then(r -> {
            FreeStyleProject p = r.jenkins.getItemByFullName(
                "roundtrip", FreeStyleProject.class);
            assertEquals("before restart", p.getDescription());
        });
    }
}
```

---

## LoggerRule

Enables specific Java loggers during a test and captures their output.
Useful for asserting that expected log messages appear or diagnosing
test failures.

| Method | Returns | Description |
|--------|---------|-------------|
| `record(Class<?> clazz, Level level)` | `LoggerRule` | Enable logger for class |
| `record(String name, Level level)` | `LoggerRule` | Enable logger by name |
| `recordPackage(Class<?> clazz, Level level)` | `LoggerRule` | Enable logger for entire package |
| `capture(int count)` | `LoggerRule` | Limit captured records |
| `quiet()` | `LoggerRule` | Suppress console output of captured logs |
| `getRecords()` | `List<LogRecord>` | All captured log records |
| `getMessages()` | `List<String>` | Formatted message strings |

```java
public class LoggingTest {

    @Rule
    public LoggerRule logging = new LoggerRule()
        .record(MyPlugin.class, Level.FINE)
        .capture(100);

    @Rule
    public JenkinsRule j = new JenkinsRule();

    @Test
    public void pluginLogsDebugMessage() throws Exception {
        FreeStyleProject p = j.createFreeStyleProject();
        p.getBuildersList().add(new MyBuilder());
        j.buildAndAssertSuccess(p);

        assertThat(logging.getMessages(),
            hasItem(containsString("processing build")));
    }
}
```

### Capturing Startup Logs

To capture logs emitted during Jenkins startup, the `LoggerRule` must be
activated **before** `JenkinsRule`. Use `RuleChain` to control ordering.

```java
public class StartupLogTest {

    public LoggerRule logging = new LoggerRule()
        .record(MyInitializer.class, Level.FINE);
    public JenkinsRule j = new JenkinsRule();

    @Rule
    public RuleChain chain = RuleChain
        .outerRule(logging)
        .around(j);

    @Test
    public void captureStartupLogs() {
        assertThat(logging.getMessages(),
            hasItem(containsString("initializing")));
    }
}
```

---

## BuildWatcher

Prints build console output to the test output stream as builds execute.
Invaluable for debugging hanging or failing builds in CI.

Must be declared as `@ClassRule` (per-class, not per-test).

```java
public class WatchedBuildTest {

    @ClassRule
    public static BuildWatcher watcher = new BuildWatcher();

    @Rule
    public JenkinsRule j = new JenkinsRule();

    @Test
    public void buildOutputStreamedToConsole() throws Exception {
        FreeStyleProject p = j.createFreeStyleProject();
        p.getBuildersList().add(new Shell("echo step-1 && echo step-2"));
        j.buildAndAssertSuccess(p);
        // Build log appears in real-time in test output
    }
}
```

**Not available with `RealJenkinsRule`.** Use `TailLog` instead:

```java
@Rule
public RealJenkinsRule rr = new RealJenkinsRule();

@ClassRule
public static TailLog tailLog = new TailLog();

@Test
public void withTailLog() throws Throwable {
    rr.then(r -> {
        FreeStyleProject p = r.createFreeStyleProject();
        r.buildAndAssertSuccess(p);
    });
}
```

---

## Additional Test Utilities

### MockAuthorizationStrategy

Fluent API for defining authorization rules in tests. Pairs with
`createDummySecurityRealm()`.

```java
@Test
public void finegrainedPermissions() throws Exception {
    j.jenkins.setSecurityRealm(j.createDummySecurityRealm());

    MockAuthorizationStrategy auth = new MockAuthorizationStrategy();
    auth.grant(Jenkins.ADMINISTER).everywhere().to("admin");
    auth.grant(Jenkins.READ).everywhere().to("authenticated");
    auth.grant(Item.READ, Item.BUILD).onItems(myProject).to("developer");
    auth.grant(Item.READ).onFolders(myFolder).to("viewer");
    j.jenkins.setAuthorizationStrategy(auth);
}
```

### SCM Helpers

Utilities for populating workspace contents without a real SCM.

**`SingleFileSCM`** -- provides a single file in the workspace:

```java
@Test
public void singleFile() throws Exception {
    FreeStyleProject p = j.createFreeStyleProject();
    p.setScm(new SingleFileSCM("script.sh", "#!/bin/bash\necho done"));
    p.getBuildersList().add(new Shell("bash script.sh"));
    j.buildAndAssertSuccess(p);
}
```

**`ExtractResourceSCM`** -- extracts a ZIP from test resources into workspace:

```java
@Test
public void extractResource() throws Exception {
    FreeStyleProject p = j.createFreeStyleProject();
    p.setScm(new ExtractResourceSCM(getClass().getResource("workspace.zip")));
    j.buildAndAssertSuccess(p);
}
```

### TestExtension

Marks an `@Extension` as only active during tests. The annotated extension
is discovered by Jenkins's extension point mechanism but only when running
inside `JenkinsRule`.

```java
@TestExtension("specificTestMethodName")
public static class MyTestAction implements RootAction {
    @Override public String getIconFileName() { return null; }
    @Override public String getDisplayName() { return "Test"; }
    @Override public String getUrlName() { return "test-action"; }
}

@TestExtension // active for all tests in this class
public static class AlwaysActiveExtension implements QueueDecisionHandler {
    @Override
    public boolean shouldSchedule(Task t, List<Action> actions) {
        return true;
    }
}
```

**Not available with `RealJenkinsRule`.** Use `addSyntheticPlugin()` to
register extensions in the remote JVM instead.

### LocalData

Loads a pre-configured `JENKINS_HOME` from test resources. The annotation
looks for a ZIP or directory at `test/resources/<TestClass>/<methodName>/`
(or `test/resources/<TestClass>/` for shared data).

```java
@Test
@LocalData
public void loadPreConfiguredHome() throws Exception {
    // JENKINS_HOME pre-populated from:
    //   src/test/resources/MyPluginTest/loadPreConfiguredHome/
    FreeStyleProject p = j.jenkins.getItemByFullName(
        "preconfigured-job", FreeStyleProject.class);
    assertNotNull(p);
}
```

The resource directory should mirror `JENKINS_HOME` structure. Common contents:
`config.xml`, `jobs/<name>/config.xml`, `secrets/`, `users/`.

### WithoutJenkins

Skips Jenkins startup for a specific test method. Useful for pure unit tests
in a class that otherwise needs `JenkinsRule`.

```java
@Rule
public JenkinsRule j = new JenkinsRule();

@Test
public void needsJenkins() throws Exception {
    assertNotNull(j.jenkins);
}

@Test
@WithoutJenkins
public void pureUnitTest() {
    MyHelper helper = new MyHelper();
    assertEquals("expected", helper.compute("input"));
}
```

### InboundAgentRule

Manages inbound (formerly JNLP) agents in tests. Handles the agent
process lifecycle including connection and disconnection.

```java
public class InboundAgentTest {

    @Rule
    public JenkinsRule j = new JenkinsRule();

    @Rule
    public InboundAgentRule agents = new InboundAgentRule();

    @Test
    public void buildOnInboundAgent() throws Exception {
        agents.createAgent(j, InboundAgentRule.Options.newBuilder()
            .name("inbound-1")
            .label("docker")
            .build());

        FreeStyleProject p = j.createFreeStyleProject();
        p.setAssignedLabel(Label.get("docker"));
        j.buildAndAssertSuccess(p);
    }
}
```

---

## JUnit 5 Support

Jenkins test harness supports JUnit 5 via extensions. The following table maps
JUnit 4 rules to their JUnit 5 equivalents.

| JUnit 4 | JUnit 5 | Notes |
|----------|---------|-------|
| `@Rule JenkinsRule` | `@WithJenkins` on class + `JenkinsRule` parameter | Injected per-method |
| `@ClassRule JenkinsRule` | `@WithJenkins` on class + static field | Shared instance |
| `@Rule RealJenkinsRule` | `@WithRealJenkins` | Same usage pattern |
| `@Rule JenkinsSessionRule` | `@WithJenkins` + `JenkinsSessionRule` parameter | Injected per-method |
| `@Rule LoggerRule` | `@WithJenkins` handles automatically | Or manual `@RegisterExtension` |
| `@ClassRule BuildWatcher` | Automatic with `@WithJenkins` | Enabled by default |

### Basic JUnit 5 Example

```java
import org.jvnet.hudson.test.junit.jupiter.WithJenkins;

@WithJenkins
class MyPluginJUnit5Test {

    @Test
    void createAndBuild(JenkinsRule j) throws Exception {
        FreeStyleProject p = j.createFreeStyleProject();
        p.getBuildersList().add(new Shell("echo junit5"));
        FreeStyleBuild b = j.buildAndAssertSuccess(p);
        j.assertLogContains("junit5", b);
    }
}
```

### Shared Instance in JUnit 5

```java
@WithJenkins
class SharedInstanceTest {

    static JenkinsRule j;

    @BeforeAll
    static void setUp(JenkinsRule rule) {
        j = rule;
    }

    @Test
    void testOne() {
        assertNotNull(j.jenkins);
    }

    @Test
    void testTwo() throws Exception {
        assertNotNull(j.getURL());
    }
}
```

### Session Rule in JUnit 5

```java
@WithJenkins
class SessionJUnit5Test {

    @Test
    void persistenceAcrossRestarts(JenkinsSessionRule sessions) throws Throwable {
        sessions.then(r -> {
            r.createFreeStyleProject("session-job");
        });
        sessions.then(r -> {
            assertNotNull(r.jenkins.getItem("session-job"));
        });
    }
}
```
