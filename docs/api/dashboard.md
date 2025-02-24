# Dashboard

Without any doubt, this is the principal resource of Perses.

A `Dashboard` belongs to a `Project`. See the [project documentation](./project.md) to see how to create a project.

It is defined like that:

```yaml
kind: "Dashboard"
metadata:
  name: <string>
  project: <string>
spec: <dashboard_specification>
```

See the next section to get details about the `<dashboard_specification>`.

## Dashboard specification

```yaml
# Metadata.name has some restrictions. For example, you can't use space there.
# `display` allows to provide a rich name and a description for your dashboard.
display: <Display specification> # Optional

# `datasources` is a map where the key is the reference of the datasource. The value is the actual datasource definition.
# A datasource can be referenced by the different panels and/or variables.
datasources:
  <string>: <Datasource specification> # Optional

# `variables` is the list of dashboard variables. A variable can be referenced by the different panels and/or by other variables.
variables:
  - <Variable specification> # Optional

# `panels` is a map where the key is the reference of the panel, and the value is the actual panel definition
panels:
  <string>: <Panel specification> # Optional

# `layouts` is the list of layouts. A layout describes how to display the list of panels. 
# Indeed, in Perses the definition of a panel is uncorrelated from the definition of where to position it.
layouts:
  - <Layout specification>

# `duration` is the default time range to use on the initial load of the dashboard.
duration: <duration> # Optional

# `refreshInterval` is the default refresh interval to use on the initial load of the dashboard.
refreshInterval: <duration> # Optional
```

A dashboard in its minimal definition only requires a panel and a layout.

### Display specification

This is the way to provide a rich name and a description for your dashboard. There is no restriction about the type of
characters you can use there.

```yaml
# The new name of the dashboard. If set, it will replace `metadata.name` in the dashboard title in the UI.
# Note that it cannot be used when you are querying the API. Only `metadata.name` can be used to reference the dashboard.
# This is just for display purpose.
name: <string> # Optional

# The description of the dashboard.
description: <string> # Optional
```

### Datasource specification

See the [datasource](./datasource.md) documentation.

### Variable specification

See the [variable](./variable.md) documentation.

### Panel specification

```yaml
kind: "Panel"
spec:
  display: <Display specification>

  # `plugin` is where you define the panel type to use.
  # The panel type chosen should match one of the panel plugins known to the Perses instance.
  plugin: <Panel Plugin specification>

  # `queries` is the list of queries to be executed by the panel. The available types of query are conditioned by the type of panel & the type of datasource used.
  queries:
    - <Query specification> # Optional
```

#### Panel Plugin specification

```yaml
# `kind` is the plugin type of the panel. For example, `TimeSeriesChart`.
kind: <string>

# `spec` is the actual definition of the panel plugin. Each `kind` comes with its own `spec`.
spec: <Plugin specification>
```

#### Query specification

```yaml
# kind` is the type of the query.
kind: <string>
spec:
  plugin: <Query Plugin specification>
```

##### Query Plugin specification

```yaml
# `kind` is the plugin type matching the type of query. For example, `PrometheusTimeSeriesQuery` for the query type `TimeSeriesQuery`.
kind: <string>

# `spec` is the actual definition of the query. Each `kind` comes with its own `spec`.
spec: <Plugin specification>
```

### Layout specification

```yaml
kind: "Grid"
spec:
  [ display: <Grid Display specification> ]
  items:
    [ - <Grid Item specification> ]
```

Example:

```yaml
kind: "Grid"
spec:
  display:
    title: "Row 1"
    collapse:
      open: true
  items:
    - x: 0
      y: 0
      width: 2
      height: 3
      content:
        "$ref": "#/spec/panels/statRAM"
    - x: 0
      y: 4
      width: 2
      height: 3
      content:
        $ref": "#/spec/panels/statTotalRAM"
```

### Grid Display specification

```yaml
title: <string>
collapse:
  open: <boolean>
```

### Grid Item specification

```yaml
x: <int>
y: <int>
width: <int>
height: <int>
content:
  "$ref": <json_panel_ref>
```

## API definition

### Get a list of `Dashboard`

```bash
GET /api/v1/projects/<project_name>/dasbhoards
```

URL query parameters:

- name = `<string>` : filters the list of dashboards based on their name (prefix match).

### Get a single `Dashboard`

```bash
GET /api/v1/projects/<project_name>/dasbhoards/<dasbhoard_name>
```

### Create a single `Dashboard`

```bash
POST /api/v1/projects/<project_name>/dashboards
```

### Update a single `Dashboard`

```bash
PUT /api/v1/projects/<project_name>/dasbhoards/<dasbhoard_name>
```

### Delete a single `Dashboard`

```bash
DELETE /api/v1/projects/<project_name>/dasbhoards/<dasbhoard_name>
```
