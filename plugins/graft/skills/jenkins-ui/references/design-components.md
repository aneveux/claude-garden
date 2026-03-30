# Jenkins Design Library — Component Catalog

Reference for Jenkins UI plugin development covering layout, form controls,
display components, and CSS utilities.

---

## Table of Contents

- [Layout Components](#layout-components)
- [Form Controls](#form-controls)
- [Display Components](#display-components)
- [CSS Class Reference](#css-class-reference)

---

## Layout Components

### Layout Types

| Type | Tag | Use Case |
|------|-----|----------|
| Two-column | `<l:layout title="...">` (default) | Standard views, config pages |
| One-column | `<l:layout type="one-column">` | Wizards, setup screens |
| Fullscreen | `<l:layout type="full-screen">` | Custom dashboards, embedded UIs |

### AppBar

Heading bar with optional subtitle and right-aligned action buttons.

```xml
<l:app-bar title="Pipeline Config" subtitle="Branch: main">
  <button class="jenkins-button jenkins-button--primary">Save</button>
</l:app-bar>
```

### Side Panel

Navigation via `<l:tasks>` with individual `<l:task>` entries.

```xml
<l:side-panel>
  <l:app-bar title="Navigation" />
  <l:tasks>
    <l:task title="Dashboard" href="${rootURL}/" icon="symbol-jenkins" />
    <l:task title="Configure" href="configure" icon="symbol-settings" />
    <l:task title="Delete" href="delete" icon="symbol-trash" />
  </l:tasks>
</l:side-panel>
```

### Full Layout Example

```xml
<j:jelly xmlns:j="jelly:core" xmlns:l="/lib/layout" xmlns:f="/lib/form">
  <l:layout title="Pipeline Settings">
    <l:side-panel>
      <l:app-bar title="Pipeline Settings" />
      <l:tasks>
        <l:task title="Root" href="${rootURL}/" icon="symbol-jenkins" />
        <l:task title="Back" href=".." icon="symbol-arrow-left" />
      </l:tasks>
    </l:side-panel>
    <l:main-panel>
      <l:app-bar title="General Configuration">
        <button class="jenkins-button jenkins-button--primary">Run Pipeline</button>
      </l:app-bar>
      <f:form method="post" action="configSubmit">
        <!-- form content -->
        <f:bottomButtonBar>
          <f:submit value="Save" />
        </f:bottomButtonBar>
      </f:form>
    </l:main-panel>
  </l:layout>
</j:jelly>
```

---

## Form Controls

All form tags use `xmlns:f="/lib/form"`. Wrap every field in `<f:entry>`.

### Entry Wrapper

```xml
<f:entry title="Job Name" field="name" description="Unique identifier">
  <f:textbox />
</f:entry>
```

Place `help-<field>.html` alongside `config.jelly` for the `(?)` help icon.

### Input Controls

**Textbox** — text input with placeholder and optional server-side validation:

```xml
<f:textbox placeholder="https://github.com/org/repo.git"
           checkUrl="'checkName?value='+encode(this.value)" />
```

**Number** — numeric with min/max/default:

```xml
<f:number default="3" min="0" max="10" />
```

**Password** — stored encrypted, use `Secret` type in Java:

```xml
<f:password />
```

**Textarea** — multi-line, optional CodeMirror syntax mode:

```xml
<f:textarea codemirror="groovy" />
```

### Selection Controls

**Checkbox:**

```xml
<f:checkbox title="Enable verbose logging" field="verbose" default="false" />
```

**Boolean radio** — explicit yes/no pair:

```xml
<f:booleanRadio field="notificationsEnabled" default="true" />
```

**Select** — populated via `doFillXxxItems()` in descriptor:

```xml
<f:select />
```

```java
public ListBoxModel doFillBranchItems() {
    ListBoxModel items = new ListBoxModel();
    items.add("main");
    items.add("develop");
    return items;
}
```

**Enum** — auto-populated from Java enum, no descriptor method needed:

```xml
<f:enum field="buildType" />
```

**Combobox** — searchable dropdown allowing free-text, uses `doFillXxxItems()`:

```xml
<f:combobox />
```

**Toggle switch:**

```xml
<f:toggleSwitch title="Enabled" field="enabled" />
```

### Structural Controls

**Repeatable property** — structured repeatable list backed by `Describable`:

```xml
<f:repeatableProperty field="parameters" />
```

**Heterogeneous repeatable** — multiple types via extension points:

```xml
<f:repeatableHeteroProperty field="builders" hasHeader="true"
                             descriptors="${descriptor.getApplicableDescriptors()}" />
```

**Optional block** — checkbox-gated section:

```xml
<f:optionalBlock title="Use custom workspace" field="useCustomWorkspace"
                 checked="${instance.useCustomWorkspace}">
  <f:entry title="Directory" field="customWorkspace">
    <f:textbox />
  </f:entry>
</f:optionalBlock>
```

**Advanced** — collapsible section, hidden by default:

```xml
<f:advanced>
  <f:entry title="JVM Arguments" field="jvmArgs">
    <f:textbox default="-Xmx512m" />
  </f:entry>
</f:advanced>
```

**Section** — group related fields with a heading:

```xml
<f:section title="Source Code Management">
  <f:entry title="Repository URL" field="repoUrl"><f:textbox /></f:entry>
  <f:entry title="Branch" field="branch"><f:textbox default="main" /></f:entry>
</f:section>
```

### Validation and Submission

**Validate button** — triggers server-side validation:

```xml
<f:validateButton title="Test Connection" method="testConnection"
                  with="url,credentialsId" />
```

```java
public FormValidation doTestConnection(
        @QueryParameter String url, @QueryParameter String credentialsId) {
    try {
        return FormValidation.ok("Connection successful");
    } catch (Exception e) {
        return FormValidation.error("Failed: " + e.getMessage());
    }
}
```

**Descriptor selector** — dropdown for extension point implementations:

```xml
<f:dropdownDescriptorSelector field="scm" title="SCM"
                               descriptors="${descriptor.getSCMDescriptors()}" />
```

**Submit with bottom bar:**

```xml
<f:bottomButtonBar>
  <f:submit value="Save" />
  <button class="jenkins-button jenkins-button--tertiary">Apply</button>
</f:bottomButtonBar>
```

---

## Display Components

### Buttons

```xml
<button class="jenkins-button jenkins-button--primary">Save</button>
<button class="jenkins-button">Cancel</button>
<button class="jenkins-button jenkins-button--tertiary">Skip</button>
<button class="jenkins-button destructive-color">Delete</button>
<button class="jenkins-button build-color">Build Now</button>
<l:copyButton text="${value}" message="Copied!" tooltip="Copy to clipboard" />
```

### Cards

```xml
<l:card title="Build #42">
  <p>Status: SUCCESS</p>
</l:card>

<l:card title="Test Results" expandable="true">
  <l:card-controls>
    <button class="jenkins-button jenkins-button--tertiary">Edit</button>
  </l:card-controls>
  <p>142 tests passed</p>
</l:card>
```

### Tables

```xml
<table class="jenkins-table jenkins-table--sortable">
  <thead><tr><th>Name</th><th>Status</th><th>Duration</th></tr></thead>
  <tbody><tr><td>Build #42</td><td>SUCCESS</td><td>3m 22s</td></tr></tbody>
</table>
```

Size variants: `jenkins-table--small`, `jenkins-table--medium`.
Cell variants: `jenkins-table__cell--tight`, `jenkins-table__cell--no-wrap`.

### Banners and Alerts

```xml
<div class="jenkins-alert jenkins-alert--info">Info message</div>
<div class="jenkins-alert jenkins-alert--warning">Warning message</div>
<div class="jenkins-alert jenkins-alert--danger">Error message</div>
<div class="jenkins-alert jenkins-alert--success">Success message</div>
```

### Toast Notifications

```javascript
notificationBar.show('Pipeline saved');
notificationBar.show('Agent offline', notificationBar.WARNING);
notificationBar.show('Build failed', notificationBar.ERROR);
notificationBar.show('Deployed', notificationBar.SUCCESS);
```

### Dialogs

```javascript
dialog.alert('Build Complete', 'Build #42 finished.');
dialog.confirm('Delete Job', 'Cannot be undone.').then(ok => { if (ok) { /* */ } });
dialog.prompt('Rename Job', 'New name:').then(name => { if (name) { /* */ } });
dialog.modal('Custom Title', contentElement);
dialog.form('Configure', formElement).then(data => { if (data) { /* */ } });
```

### Empty States

```xml
<l:notice title="No builds yet" icon="symbol-play">
  <p>Run your first build to see results here.</p>
  <button class="jenkins-button jenkins-button--primary">Build Now</button>
</l:notice>
```

### Progress Indicators

```xml
<l:spinner title="Loading..." />
<l:progressAnimation />
<t:progressBar value="${build.progress}" />
<l:progressiveRendering handler="${ajaxHandler}" topology="progressive" />
```

`<l:progressiveRendering>` lazily loads large data sets via AJAX.
The `handler` points to a `ProgressiveRendering` subclass.

### Symbols and Icons

```xml
<l:icon src="symbol-settings" />
<l:icon src="symbol-git-branch plugin-ionicons-api" />
<l:icon src="symbol-warning" class="icon-md" />
```

| Size Class | Pixels |
|------------|--------|
| `icon-sm` | 16px |
| `icon-md` | 24px |
| `icon-lg` | 32px |
| `icon-xlg` | 48px |

Built-in status symbols: `symbol-status-blue` (success), `symbol-status-red`
(failure), `symbol-status-yellow` (unstable), `symbol-status-grey` (not built),
`symbol-status-aborted`.

Weather icons: `symbol-weather-sunny` (80-100%), `symbol-weather-partially-sunny`
(60-79%), `symbol-weather-cloudy` (40-59%), `symbol-weather-rain` (20-39%),
`symbol-weather-storm` (0-19%).

Custom symbols: place SVGs in `src/main/resources/images/symbols/`,
reference as `symbol-<filename> plugin-<your-plugin-id>`.

### Tooltips

```xml
<button class="jenkins-button" tooltip="Run the pipeline now">Build</button>
```

### Colors

Use semantic CSS custom properties. Never hardcode hex values.

| Variable | Purpose |
|----------|---------|
| `--text-color` | Primary text |
| `--text-color-secondary` | Muted text |
| `--background` | Page background |
| `--item-background--hover` | Hover state |
| `--item-background--active` | Active/pressed state |
| `--focus-input-border` | Focused input border |
| `--success-color` | Success green |
| `--warning-color` | Warning yellow |
| `--danger-color` | Danger red |
| `--info-color` | Info blue |

### Spacing

Pattern: `jenkins-!-{margin|padding}-{direction}-{0-6}`

Directions: (none) = all, `-top`, `-bottom`, `-left`, `-right`.

```xml
<div class="jenkins-!-margin-bottom-3">
  <p class="jenkins-!-padding-2">Padded content</p>
</div>
```

---

## CSS Class Reference

### Buttons

| Class | Description |
|-------|-------------|
| `jenkins-button` | Base button |
| `jenkins-button--primary` | Primary action |
| `jenkins-button--tertiary` | Minimal/text button |
| `build-color` | Dynamic build-status color |
| `destructive-color` | Red destructive action |

### Tables

| Class | Description |
|-------|-------------|
| `jenkins-table` | Base table |
| `jenkins-table--sortable` | Sortable columns |
| `jenkins-table--small` | Compact rows |
| `jenkins-table--medium` | Medium rows |
| `jenkins-table__cell--tight` | Minimal cell padding |
| `jenkins-table__cell--no-wrap` | Prevent text wrap |

### Alerts

| Class | Description |
|-------|-------------|
| `jenkins-alert` | Base alert banner |
| `jenkins-alert--info` | Informational (blue) |
| `jenkins-alert--warning` | Warning (yellow) |
| `jenkins-alert--danger` | Error/danger (red) |
| `jenkins-alert--success` | Success (green) |

### Inputs

| Class | Description |
|-------|-------------|
| `jenkins-input` | Base text input |
| `jenkins-select` | Base select dropdown |
| `jenkins-checkbox` | Base checkbox |
| `jenkins-radio` | Base radio button |
| `jenkins-search` | Search input with icon |
| `jenkins-toggle-switch` | Toggle switch |

### Cards

| Class | Description |
|-------|-------------|
| `jenkins-card` | Base card |
| `jenkins-card__controls` | Card action controls |
| `jenkins-card--expandable` | Expandable card |

### Notifications

| Class | Description |
|-------|-------------|
| `jenkins-notification` | Base notification |
| `jenkins-notification--visible` | Show notification |

### Spacing

| Class Pattern | Description |
|---------------|-------------|
| `jenkins-!-margin-{0-6}` | All-sides margin |
| `jenkins-!-margin-{top\|bottom\|left\|right}-{0-6}` | Directional margin |
| `jenkins-!-padding-{0-6}` | All-sides padding |
| `jenkins-!-padding-{top\|bottom\|left\|right}-{0-6}` | Directional padding |

### Typography

| Class | Description |
|-------|-------------|
| `jenkins-!-font-size-xs` | Extra small text |
| `jenkins-!-font-size-sm` | Small text |
| `jenkins-!-font-size-md` | Medium (default) |
| `jenkins-!-font-size-lg` | Large text |
| `jenkins-!-font-weight-bold` | Bold weight |
| `jenkins-!-color-secondary` | Secondary text color |

### Visibility

| Class | Description |
|-------|-------------|
| `jenkins-hidden` | Display none |
| `jenkins-visually-hidden` | Screen-reader only |
| `jenkins-!-show` | Force visible |
