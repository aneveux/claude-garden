---
name: jenkins-ui
version: 1.0.0
description: |
  Jenkins UI and frontend development — Jelly views, Design Library components, form controls,
  help files, JavaScript integration, and XSS prevention. Use this skill when writing config.jelly
  files, implementing Jenkins UI views, working with form validation, or applying Design Library
  patterns. Covers the full frontend stack: Jelly templating, Stapler form binding, CSS classes,
  dialog/notification JS APIs, and layout patterns. Make sure to use this skill whenever the user
  mentions Jenkins forms, Jelly files, Jenkins configuration pages, help files for Jenkins,
  Jenkins frontend, or Design Library — even if they just say "create the config form."
  Triggers on: config.jelly, global.jelly, Jelly view, Jenkins form, f:entry, f:textbox, f:select,
  Design Library, help-*.html, Jenkins UI, Jenkins frontend, Jenkins config page, Jelly XSS,
  Jenkins JavaScript, validateButton.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Jenkins UI Development

Jenkins UI uses Apache Jelly (XML templating) with the Jenkins Design Library for consistent
components. Views live alongside Java classes in `src/main/resources/<package>/<ClassName>/`.

## File Conventions

```
src/main/resources/com/example/MyBuilder/
  config.jelly          # Job/step configuration form
  help.html             # Step-level help text
  help-fieldName.html   # Per-field inline help (auto-linked via field= attribute)
  help-fieldName_fr.html # Localized help variant

src/main/resources/com/example/MyConfig/
  config.jelly          # Global configuration form (Manage Jenkins)
```

## Jelly Basics

Every Jelly file **must** start with XSS protection:

```xml
<?jelly escape-by-default='true'?>
<j:jelly xmlns:j="jelly:core"
         xmlns:f="/lib/form"
         xmlns:l="/lib/layout"
         xmlns:st="jelly:stapler"
         xmlns:t="/lib/hudson">
  <!-- content -->
</j:jelly>
```

**Namespaces:**
| Prefix | URI | Purpose |
|--------|-----|---------|
| `j:` | `jelly:core` | Control flow: j:if, j:choose, j:forEach, j:set, j:out |
| `f:` | `/lib/form` | Form controls: f:entry, f:textbox, f:select, etc. |
| `l:` | `/lib/layout` | Layout: l:layout, l:main-panel, l:side-panel, l:icon, l:card |
| `t:` | `/lib/hudson` | Jenkins components: t:progressBar, t:help, t:setIconSize |
| `st:` | `jelly:stapler` | Stapler: st:bind (JS proxy), st:adjunct (CSS/JS), st:include |

**JEXL expressions:**
- `${it.name}` — current object's properties
- `${app}` — Jenkins singleton
- `${h}` — Functions helper class
- `${%messageKey}` — localized message lookup from Messages.properties

## Configuration Form Pattern

**Job/step config** (`config.jelly`):
```xml
<?jelly escape-by-default='true'?>
<j:jelly xmlns:j="jelly:core" xmlns:f="/lib/form">
  <f:entry title="${%Server URL}" field="serverUrl">
    <f:textbox placeholder="https://example.com" />
  </f:entry>

  <f:entry title="${%Credentials}" field="credentialsId">
    <f:select />
  </f:entry>

  <f:advanced>
    <f:entry title="${%Timeout}" field="timeout">
      <f:number default="30" min="1" />
    </f:entry>
  </f:advanced>

  <f:validateButton title="${%Test Connection}" progress="${%Testing...}"
    method="testConnection" with="serverUrl,credentialsId"
    checkMethod="post" />
</j:jelly>
```

**Global config** (`config.jelly` on GlobalConfiguration class):
```xml
<?jelly escape-by-default='true'?>
<j:jelly xmlns:j="jelly:core" xmlns:f="/lib/form">
  <f:section title="${%My Plugin}">
    <f:entry title="${%Default Server}" field="serverUrl">
      <f:textbox />
    </f:entry>
    <f:entry title="${%Cache Manager}" field="cacheManager">
      <f:dropdownDescriptorSelector />
    </f:entry>
  </f:section>
</j:jelly>
```

## Key Form Controls

| Tag | Purpose | Java backing |
|-----|---------|-------------|
| `<f:entry title="..." field="...">` | Wrapper with label + help icon | Getter/setter matching field name |
| `<f:textbox />` | Text input | String property |
| `<f:number min="1" max="99" default="5"/>` | Numeric input | int/Integer property |
| `<f:password />` | Secret input | `Secret` type (never plain String) |
| `<f:textarea />` | Multi-line text | String property |
| `<f:textarea codemirror-mode="shell"/>` | Code editor | String with syntax highlighting |
| `<f:checkbox title="..." />` | Checkbox | boolean property |
| `<f:booleanRadio />` | Yes/No radio pair | boolean property |
| `<f:select />` | Dropdown | `doFillFieldItems()` returns `ListBoxModel` |
| `<f:enum default="SECONDS">${it.description}</f:enum>` | Enum dropdown | Enum property |
| `<f:combobox />` | Searchable dropdown | `doFillFieldItems()` returns `ComboBoxModel` |
| `<f:toggleSwitch title="Disabled" checkedTitle="Enabled"/>` | Toggle switch | boolean property |
| `<f:optionalBlock>` | Checkbox-gated section | boolean + nested properties |
| `<f:advanced>` | Collapsible "Advanced..." | Contains optional f:entry elements |
| `<f:section title="...">` | Form grouping | Visual section header |
| `<f:repeatableProperty field="items"/>` | Repeatable list | List<T> property |
| `<f:repeatableHeteroProperty />` | Heterogeneous repeatable | DescribableList property |
| `<f:dropdownDescriptorSelector />` | Extension-point dropdown | ExtensionPoint property |
| `<f:validateButton method="test" with="a,b"/>` | Server-side validation | `doTest()` on Descriptor |

## Help Files

Place `help-fieldName.html` next to `config.jelly`. Auto-linked when `field="fieldName"` is used:

```html
<div>
  Enter the server URL including protocol (e.g., <code>https://example.com</code>).
  This is used for API calls during the build.
</div>
```

- Plain HTML content (rendered in tooltip/expand area)
- Localized: `help-fieldName_de.html`, `help-fieldName_fr.html`
- Custom path: `<f:entry help="/plugin/my-plugin/help/custom.html">`

## XSS Prevention (Critical)

1. **Always** use `<?jelly escape-by-default='true'?>` as first line
2. **Never** inject values into `<script>` blocks:
   ```xml
   <!-- UNSAFE -->
   <script>var x = "${value}";</script>

   <!-- SAFE — use data attributes -->
   <div id="x" data-value="${value}"></div>
   <script>
     var x = document.querySelector('#x').getAttribute('data-value');
   </script>
   ```
3. Escape-by-default covers `${...}` in PCDATA, NOT attributes (handled by XML engine)
4. Use `Util.xmlEscape()` and `Functions.htmlAttributeEscape()` in Java when building HTML
5. Core maintainers actively review for CSP compliance

## JavaScript Integration

**JS proxy for AJAX calls to Java:**
```java
@JavaScriptMethod
public int increment(int n) { return count += n; }
```
```xml
<st:bind var="myObj" value="${it}"/>
<script>myObj.increment(1, function(t) { /* t.responseObject() */ });</script>
```

**Adjuncts** (load JS/CSS bundles):
```xml
<st:adjunct includes="io.jenkins.plugins.myPlugin.myScript" />
```
Loads `src/main/resources/io/jenkins/plugins/myPlugin/myScript.js`.

**Dialog API** (modern Jenkins):
```javascript
dialog.alert("Title", { message: "Body" });
dialog.confirm("Delete?").then(() => { /* confirmed */ });
dialog.prompt("Name?").then(value => { /* use value */ });
```

**Toast notifications:**
```javascript
notificationBar.show("Saved!", notificationBar.SUCCESS);
```

## Reference Files

For the full Design Library component catalog and form validation patterns, read:
- `references/design-components.md` — layout, buttons, cards, tables, alerts, icons, CSS classes
- `references/form-validation.md` — doCheck, doFill, validateButton, security in validation
