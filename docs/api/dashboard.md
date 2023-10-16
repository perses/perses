# Dashboard

Without no big doubt, this is the principal resource of Perses.

A `Dashboard` belongs to a `Project`. See the [project documentation](./project.md) to see how to create a project.

It is defined like that:

```yaml
kind: "Dashboard"
metadata:
  name: <string>
  project: <string>
spec: <dashboard_specification>
```

See the next section to get details about the `<dashboard_specification>`

## Dashboard specification

```yaml
  # Metadata.name has some restrictions. For example, you can't use space there.
  # Display is the way to provide a reach name and a description for your dashboard.
  [ display: <display_spec> ]
  datasources:
    [ <string>: <datasource_spec> ]
  # The list of the variable that should be used in the different panels or even in the different variables.
  [ variables: <variable_spec> ]
  # It is a map where the key is the reference of the panel. The value is the actual panel definition that will describe
  # what kind of chart you will display. One panel can only hold one chart.
  panels:
    [ <string>: <panel_spec> ]
  # It is the list of layout. A layout is the object you need to use to describe how to display the list of the panel.
  layouts:
    - <layout_spec>
  # The default time you would like to use when getting data to fill the dashboard
  [ duration: <duration> ]
  # The default refresh interval to use when landing on the dashboard.
  [ refresh_interval: <duration> ]
```

A dashboard in its minimal definition only required a panel and a layout.

### `<display_spec>`

This is the way to provide a reach name and a description for your dashboard. There is no restriction about the type of
characters you can use there.

```yaml
  # The new name of the dashboard. If set, it will replace `metadata.name` in the dashboard title in the UI.
  # Note that it cannot be used when you are querying the API. Only `metadata.name` can be used to reference the dashboard.
  # This is just for display purpose.
  [ name: <string> ]
  # The description of the dashboard
  [ description: <string> ]
```

### `<panel_spec>`

```yaml
kind: "Panel"
spec:
  display: <display_spec>
  # This where you will define your chart
  # The chart definition will depend on the chart plugin available in Perses
  plugin: <plugin_spec>
  # A list of query executed by the panel. The type of the query is conditioned by the type of chart used.
  queries:
    - [ <query_spec> ]
```

### `<layout_spec>`

```yaml
kind: "Grid"
spec:
  [ display: <grid_display_spec> ]
  items:
    [- <grid_item_spec> ]
```

### `<grid_item_spec>`

```yaml
x: <int>
y: <int>
width: <int>
height: <int>
content:
  "$ref": <json_panel_ref>
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

## API definition

### Get a list of `Dashboard`

```bash
GET /api/v1/projects/<project_name>/dasbhoards
```

URL query parameters:

- name = `<string>` : filters the list of dashboards based on their names (prefix).

### Get a single `Dashboard`

```bash
GET /api/v1/projects/<project_name>/dasbhoards/<dasbhoard_name>
```

### Create a single `Dashboard`

```bash
POST /api/v1/projects/<project_name>/secrets
```

### Update a single `Dashboard`

```bash
PUT /api/v1/projects/<project_name>/dasbhoards/<dasbhoard_name>
```

### Delete a single `Dashboard`

```bash
DELETE /api/v1/projects/<project_name>/dasbhoards/<dasbhoard_name>
```
