# Variable

## Choose a scope

There are different scopes in which you can define a variable, depending on how much you want it to be shared. More about scopes [here](../concepts/datasource-variable-scopes.md)

### Dashboard

That's the usual level to define a variable.

```typescript
interface DashboardSpec {
  // ... existing dashboard spec ...
  variables: VariableSpec[];
}
```

### Project

In case you would like to share a variable across different dashboards in the **same** project, you will need to
create a `Variable`.

```yaml
kind: "Variable"
metadata:
  name: <string>
  project: <string>
spec: <Variable specification>
```

### Global

When we talk about scope and user permission in a REST API, the easiest way is to associate one permission per endpoint.
If we want to provide a variable shared by all projects, then it makes sense to have a different object that is
living outside a project.

That’s why we have another resource called `GlobalVariable`

```yaml
kind: "GlobalVariable"
metadata:
  name: <string>
spec: <Variable specification>
```

## Variable specification

We are supporting two different types of variables: `TextVariable` and `ListVariable`.

### TextVariable

```yaml
kind: "TextVariable"
spec: <Text Variable specification>
```

#### Text Variable specification

```yaml
# It is a mandatory attribute when you are defining a variable directly in a dashboard.
# If you are creating a GlobalVariable or a Variable, you don't have to use this attribute as it is replaced by metadata.name.
# This is the unique name of the variable that can be used in another variable or in the different dashboard to use
name: <string> # Optional

display: <Display specification> # Optional
value: <string>
constant: <boolean> | default = false # Optional
```

#### Example

```yaml
kind: "Variable"  # Alternatively, "GlobalVariable"
metadata:
  name: "text"
  project: "perses"
spec:
  kind: "TextVariable"
  spec:
    value: "my text"
```

Or in case you are defining the variable in a dashboard

```yaml
variables:
  - kind: "TextVariable"
    spec:
      name: "text"
      value: "my text"
```

### ListVariable

```yaml
kind: "ListVariable"
spec: <List Variable specification>
```

#### List Variable specification

```yaml
# It is a mandatory attribute when you are defining a variable directly in a dashboard.
# If you are creating a GlobalVariable or a Variable, you don't have to use this attribute as it is replaced by metadata.name.
# This is the unique name of the variable that can be used in another variable or in the different dashboard to use
name: <string>

display: <Display specification> # Optional

# It's a value from the list to be selected by default
# It can be a single value or a list.
defaultValue: <string> | <array of string> # Optional

# Whether to append the "All" value that allows selecting all available values at once.
allowAllValue: <boolean> | default = false # Optional

# Whether to allow multi-selection of values.
allMultiple: <boolean> | default = false # Optional

# It is a custom value that will be used if allowAllValue is true and if then `all` is selected
customAllValue: <string> # Optional

# CapturingRegexp is the regexp used to catch and filter the result of the query.
# If empty, then nothing is filtered. This is the equivalent of setting capturingRegexp with (.*)
capturingRegexp: <string> # Optional

# The method to apply when rendering the list of values
sort: <enum = "none" | "alphabetical-asc" | "alphabetical-desc" | "numerical-asc" | "numerical-desc" | "alphabetical-ci-asc" | "alphabetical-ci-desc"> | default = "none" # Optional

# The definition of the plugin variable
plugin: <Plugin specification>
```

#### Display specification

```yaml
# The new name of the variable. If set, it will replace `metadata.name` in the variable title in the UI.
# Note that it cannot be used when you are querying the API. Only `metadata.name` can be used to reference the variable.
# This is just for display purpose.
name: <string> # Optional

# The description of the variable
description: <string> # Optional

# If true, the variable won't be displayed above the dashboard.
hidden: <boolean> | default = false # Optional
```

#### Plugin definition

```yaml
# The type of the variable. For example, `PrometheusPromQLVariable`
kind: <string>

# The actual definition of the variable. It will depend on the type defined in the previous field `kind`
spec: <Plugin specification>
```

We are supporting only prometheus for the variables for the moment.
Please take a look at the [documentation](../plugins/prometheus.md#variable) to know the spec for the Prometheus variable.

## API Definition

### `Variable`

#### Get a list of `Variable`

```bash
GET /api/v1/projects/<project_name>/variables
```

URL query parameters:

- name = `<string>` : filters the list of variables based on their name (prefix match).

#### Get a single `Variable`

```bash
GET /api/v1/projects/<project_name>/variables/<variable_name>
```

#### Create a single `Variable`

```bash
POST /api/v1/projects/<project_name>/variables
```

#### Update a single `Variable`

```bash
PUT /api/v1/projects/<project_name>/variables/<variable_name>
```

#### Delete a single `Variable`

```bash
DELETE /api/v1/projects/<project_name>/variables/<variable_name>
```

### `GlobalVariable`

#### Get a list of `GlobalVariable`

```bash
GET /api/v1/globalvariables
```

URL query parameters:

- name = `<string>` : filters the list of variables based on their name (prefix match).

#### Get a single `GlobalVariable`

```bash
GET /api/v1/globalvariables/<name>
```

#### Create a single `GlobalVariable`

```bash
POST /api/v1/globalvariables
```

#### Update a single `GlobalVariable`

```bash
PUT /api/v1/globalvariables/<name>
```

#### Delete a single `GlobalVariable`

```bash
DELETE /api/v1/globalvariables/<name>
```
