# Variable

## Choose a scope

There are three different scopes in which you can define a variable, depending on how much you want it to be shared.

- for common use cases, use higher scopes to reuse the same variable on multiple dashboards
- for more specific needs, use lower scopes to restrict the variable availability to a specific set of (or even a
  single) dashboard(s).

### Dashboard level

That's the usual level to define a variable.

```typescript
interface DashboardSpec {
  // ... existing dashboard spec ...
  variables: VariableSpec[];
}
```

### Project level

In case you would like to share a variable across different dashboards in the **same** project, you will need to
create a `Variable`.

```yaml
  kind: "Variable"
  metadata:
    name: <string>
    project: <string>
  spec: <variable_spec>
```

### Global level

When we talk about scope and user permission in a REST API, the easiest way is to associate one permission per endpoint.
If we want to provide a variable shared by all projects, then it makes sense to have a different object that is
living outside a project.

That’s why we have another resource called `GlobalVariable`

```yaml
  kind: "GlobalVariable"
  metadata:
    name: <string>
  spec: <variable_spec>
```

## Variable specification

We are supporting two different types of variable. `TextVariable` and `ListVariable`

### TextVariable

```yaml
kind: "TextVariable"
spec: <text_spec>
```

#### `<text_spec>`

```yaml
  # It is a mandatory attribute when you are defining a variable directly in a dashboard.
  # If you are creating a GlobalVariable or a Variable, you don't have to use this attribute as it is replaced by metadata.name.
  # This is the unique name of the variable that can be used in another variable or in the different dashboard to use
  [ name: <string> ]

  [ display: <display_spec> ]
  value: <string>
  [ constant: <boolean> | default = false ]
```

#### Example

```yaml
kind: "Variable"
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
spec: <list_spec>
```

#### `<list_spec>`

```yaml
  # It is a mandatory attribute when you are defining a variable directly in a dashboard.
  # If you are creating a GlobalVariable or a Variable, you don't have to use this attribute as it is replaced by metadata.name.
  # This is the unique name of the variable that can be used in another variable or in the different dashboard to use
  [ name: <string> ]

  [ display: <display_spec> ]

  # It can be a single value or a list.
  [ defaultValue: <string> | <array of string> ]
  [ allowAllValue: <boolean> | default = false ]
  [ allMultiple: <boolean> | default = false ]

  # It is a custom value that will be used if allowAllValue is true and if then `all` is selected
  [ customAllValue: <string> ]

  # CapturingRegexp is the regexp used to catch and filter the result of the query.
  # If empty, then nothing is filtered. This is the equivalent of setting capturingRegexp with (.*)
  [ capturingRegexp: <string> ]

  # The definition of the plugin variable
  plugin: <plugin_spec>
```

#### `<display_spec>`

```yaml
  # The new name of the variable. If set, it will replace `metadata.name` in the variable title in the UI.
  # Note that it cannot be used when you are querying the API. Only `metadata.name` can be used to reference the variable.
  # This is just for display purpose.
  [ name: <string> ]

  # The description of the variable
  [ description: <string> ]

  # If true, the variable won't be displayed above the dashboard.
  [ hidden: <boolean> | default = false ]
```

#### Plugin definition

```yaml
  # The type of the variable. For example, `PrometheusPromQLVariable`
  kind: <string>

  # The actual definition of the variable. It will depend on the type defined in the previous field `kind`
  spec: <plugin_spec>
```

We are supporting only prometheus for the variables for the moment.
Please take a look at the [documentation](./plugin/prometheus.md#variable) to know the spec for the Prometheus variable.

## API Definition

### `Variable`

#### Get a list of `Variable`

```bash
GET /api/v1/projects/<project_name>/variables
```

URL query parameters:

- name = `<string>` : should be used to filter the list of variables based on the prefix name.

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

- name = `<string>` : should be used to filter the list of datasource based on the prefix name.

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
