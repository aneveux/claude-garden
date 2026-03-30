# Jenkins Form Validation

## Table of Contents

- [doCheck Pattern](#docheck-pattern)
- [Multi-field Dependencies](#multi-field-dependencies)
- [Context Access](#context-access)
- [Dropdown Population](#dropdown-population)
- [Validate Button](#validate-button)
- [Security in Form Validation](#security-in-form-validation)
- [Structured Form Submission](#structured-form-submission)
- [Credentials Integration](#credentials-integration)

---

## doCheck Pattern

Methods named `doCheckFieldName` on the `Descriptor` class provide live validation
as users type in configuration forms. Jenkins maps the method name to the field
automatically — `doCheckThreads` validates the `threads` field.

Return one of three validation states:

| Method                        | Renders as   | Use when                        |
|-------------------------------|--------------|---------------------------------|
| `FormValidation.ok()`        | No message   | Input is valid                  |
| `FormValidation.warning(msg)` | Yellow bar   | Valid but risky                 |
| `FormValidation.error(msg)`   | Red bar      | Invalid, blocks save            |

```java
public FormValidation doCheckThreads(@QueryParameter String value) {
    if (value.isEmpty()) {
        return FormValidation.warning("Defaults to 1 when empty");
    }
    try {
        int threads = Integer.parseInt(value);
        if (threads < 1) {
            return FormValidation.error("Must be at least 1");
        }
        if (threads > Runtime.getRuntime().availableProcessors() * 4) {
            return FormValidation.warning("High thread count may degrade performance");
        }
        return FormValidation.ok();
    } catch (NumberFormatException e) {
        return FormValidation.error("Not a number");
    }
}
```

The `@QueryParameter` annotation binds the current field value from the form.
Jenkins calls this method via AJAX on every keystroke (debounced), so keep
validation fast and side-effect free.

---

## Multi-field Dependencies

When validation depends on more than one field, add additional `@QueryParameter`
parameters. Jenkins re-triggers validation whenever any referenced field changes.

```java
public FormValidation doCheckThreads(
        @QueryParameter String value,
        @QueryParameter String cpu) {
    if (value.isEmpty() || cpu.isEmpty()) {
        return FormValidation.ok();
    }
    int threads = Integer.parseInt(value);
    int cores = Integer.parseInt(cpu);
    if (threads > cores * 2) {
        return FormValidation.warning(
            "Thread count (%d) exceeds 2x CPU cores (%d)", threads, cores);
    }
    return FormValidation.ok();
}
```

### Navigating form hierarchy

When the dependent field lives in a parent or sibling section, use
`@RelativePath` to navigate the form tree:

```java
public FormValidation doCheckPort(
        @QueryParameter String value,
        @RelativePath("..") @QueryParameter String host) {
    // host is one level up in the form hierarchy
    if (host.isEmpty()) {
        return FormValidation.error("Set host first");
    }
    return FormValidation.ok();
}
```

The path syntax mirrors directory navigation: `..` goes up one level,
`../../parent` goes up two levels then into a named section.

---

## Context Access

Use `@AncestorInPath` to access the enclosing model object. This is essential
for permission checks and looking up project-scoped resources.

```java
public FormValidation doCheckBranch(
        @QueryParameter String value,
        @AncestorInPath AbstractProject<?, ?> project) {
    if (project == null) {
        // Global configuration context — no project available
        return FormValidation.ok();
    }
    if (!project.hasPermission(Item.CONFIGURE)) {
        return FormValidation.ok();
    }
    if (value.isEmpty()) {
        return FormValidation.error("Branch is required");
    }
    return FormValidation.ok();
}
```

`@AncestorInPath` walks up the URL path to find the nearest object of the
requested type. When the form is rendered outside a project context (e.g.,
global tool configuration), the parameter is `null`.

Common ancestor types:

- `Item` or `AbstractProject<?, ?>` for job-level configuration
- `Jenkins` for global configuration
- `Computer` for node configuration

---

## Dropdown Population

### ListBoxModel (standard dropdown)

A method named `doFillFieldNameItems` on the Descriptor populates a `<select>`
dropdown. The naming convention is strict: `doFill` + field name (capitalized)
+ `Items`.

```java
public ListBoxModel doFillCredentialItems(
        @AncestorInPath Item item,
        @QueryParameter String credential) {
    StandardListBoxModel result = new StandardListBoxModel();
    if (item == null && !Jenkins.get().hasPermission(Jenkins.ADMINISTER)) {
        return result.includeCurrentValue(credential);
    }
    if (item != null && !item.hasPermission(Item.EXTENDED_READ)) {
        return result.includeCurrentValue(credential);
    }
    result.includeEmptyValue();
    result.includeAs(
        item == null ? Jenkins.getAuthentication() : Tasks.getAuthenticationOf(item),
        item,
        StandardUsernameCredentials.class
    );
    return result;
}
```

### ComboBoxModel (searchable dropdown)

For fields where users can type a custom value or pick from suggestions:

```java
public ComboBoxModel doFillLabelItems() {
    ComboBoxModel model = new ComboBoxModel();
    for (Label label : Jenkins.get().getLabels()) {
        model.add(label.getDisplayName());
    }
    return model;
}
```

In Jelly, use `<f:combobox field="label"/>` instead of `<f:select/>`.

---

## Validate Button

For expensive checks (network calls, credential testing), use an explicit
button instead of live validation.

### Jelly markup

```xml
<f:validateButton
    title="Test Connection"
    progress="Testing..."
    method="testConnection"
    with="url,credential"
    checkMethod="post" />
```

- `method` maps to `doTestConnection` on the Descriptor
- `with` lists field names whose values are passed as parameters
- `checkMethod="post"` is required when the server method uses `@POST`

### Java handler

```java
@POST
public FormValidation doTestConnection(
        @QueryParameter String url,
        @QueryParameter String credential,
        @AncestorInPath Item item) {
    if (item != null) {
        item.checkPermission(Item.CONFIGURE);
    } else {
        Jenkins.get().checkPermission(Jenkins.ADMINISTER);
    }
    try {
        SomeClient client = new SomeClient(url, lookupCredential(credential));
        client.ping();
        return FormValidation.ok("Connection successful");
    } catch (IOException e) {
        return FormValidation.error("Connection failed: " + e.getMessage());
    }
}
```

Always annotate with `@POST` when the method has side effects or accesses
secrets. This enforces CSRF crumb validation on the request.

---

## Security in Form Validation

### Permission checks

Every `doCheck` and `doFill` method is accessible via HTTP. Always verify
permissions before performing validation that could leak information.

Critical rule: return `FormValidation.ok()` (not an error) when permissions
are missing. Returning an error would reveal whether a value is valid or
invalid to unauthorized users.

```java
public FormValidation doCheckUrl(
        @QueryParameter String value,
        @AncestorInPath Item item) {
    // Null item = no context (e.g., pipeline snippet generator)
    if (item == null) {
        if (!Jenkins.get().hasPermission(Jenkins.ADMINISTER)) {
            return FormValidation.ok();
        }
    } else {
        if (!item.hasPermission(Item.CONFIGURE)) {
            return FormValidation.ok();
        }
    }
    // Actual validation only runs for authorized users
    if (value.isEmpty()) {
        return FormValidation.error("URL is required");
    }
    try {
        new URL(value);
        return FormValidation.ok();
    } catch (MalformedURLException e) {
        return FormValidation.error("Invalid URL: " + e.getMessage());
    }
}
```

### CSRF protection

Methods that perform side effects (network calls, writes) must use `@POST`:

```java
@POST
@Restricted(NoExternalUse.class)
public FormValidation doTestConnection(@QueryParameter String url) {
    Jenkins.get().checkPermission(Jenkins.ADMINISTER);
    // ... test connection
}
```

### Restricting internal methods

Use `@Restricted(DoNotUse.class)` from `org.kohsuke.accmod` to mark methods
that should only be called by the Jelly/Groovy view layer, not by external
code:

```java
@Restricted(DoNotUse.class)
public ListBoxModel doFillServerItems() {
    // Only callable from the config form, not from other plugins
    return new ListBoxModel();
}
```

This does not affect HTTP access — it is a compile-time annotation that
generates warnings when other plugins reference the method directly.

---

## Structured Form Submission

Jenkins transforms HTML forms into a JSON tree on the client side before
submission. The server receives this tree and binds it to Java objects.

### Automatic binding

The standard approach relies on `@DataBoundConstructor` and `@DataBoundSetter`:

```java
public class MyBuilder extends Builder {
    private final String url;
    private int threads;

    @DataBoundConstructor
    public MyBuilder(String url) {
        this.url = url;
    }

    @DataBoundSetter
    public void setThreads(int threads) {
        this.threads = threads;
    }

    public String getUrl() { return url; }
    public int getThreads() { return threads; }
}
```

- Constructor parameters are required fields
- `@DataBoundSetter` marks optional fields
- Getters must follow JavaBean naming for form pre-population

### Manual binding

When automatic binding is insufficient, access the JSON directly in the
Descriptor's `newInstance` method:

```java
@Override
public MyBuilder newInstance(StaplerRequest2 req, JSONObject formData)
        throws FormException {
    String url = formData.getString("url");
    int threads = formData.optInt("threads", 1);
    return new MyBuilder(url, threads);
}
```

### Nested structures

Repeatable blocks and hetero-lists produce nested JSON arrays. Use
`req.bindJSONToList()` for collections:

```java
@DataBoundConstructor
public MyBuilder(String url) {
    this.url = url;
}

@DataBoundSetter
public void setActions(List<PostAction> actions) {
    this.actions = actions;
}
```

The Jelly side uses `<f:repeatableProperty field="actions"/>` to generate
the corresponding form structure.

---

## Credentials Integration

Never store passwords as plain `String` fields. Use the Credentials Plugin to
manage secrets securely.

### Store a credential reference

The build step stores only the credential ID:

```java
public class MyBuilder extends Builder {
    private final String credentialsId;

    @DataBoundConstructor
    public MyBuilder(String credentialsId) {
        this.credentialsId = credentialsId;
    }

    public String getCredentialsId() { return credentialsId; }
}
```

### Jelly form

Use the credentials select control instead of a text field:

```xml
<f:entry title="Credentials" field="credentialsId">
    <c:select/>
</f:entry>
```

The `<c:select/>` tag requires the `credentials` Jelly namespace:

```xml
xmlns:c="/lib/credentials"
```

### Populate the dropdown

```java
public ListBoxModel doFillCredentialsIdItems(
        @AncestorInPath Item item,
        @QueryParameter String credentialsId) {
    StandardListBoxModel result = new StandardListBoxModel();
    if (item == null && !Jenkins.get().hasPermission(Jenkins.ADMINISTER)) {
        return result.includeCurrentValue(credentialsId);
    }
    if (item != null && !item.hasPermission(Item.EXTENDED_READ)) {
        return result.includeCurrentValue(credentialsId);
    }
    return result
        .includeEmptyValue()
        .includeAs(
            item == null ? Jenkins.getAuthentication() : Tasks.getAuthenticationOf(item),
            item,
            StandardUsernamePasswordCredentials.class,
            Collections.emptyList()
        )
        .includeCurrentValue(credentialsId);
}
```

### Look up credentials at runtime

Resolve the stored ID to actual credentials during build execution:

```java
@Override
public void perform(Run<?, ?> run, FilePath workspace,
        EnvVars env, Launcher launcher, TaskListener listener)
        throws InterruptedException, IOException {
    StandardUsernamePasswordCredentials creds =
        CredentialsProvider.findCredentialById(
            credentialsId,
            StandardUsernamePasswordCredentials.class,
            run,
            Collections.emptyList()
        );
    if (creds == null) {
        throw new AbortException("Credentials not found: " + credentialsId);
    }
    String username = creds.getUsername();
    String password = creds.getPassword().getPlainText();
    // Use credentials...
}
```

Always resolve credentials at build time, never during configuration. This
ensures credential rotation is picked up without reconfiguring jobs.
