# CUE in Perses

Perses comes with validation capabilities based on [CUE](https://cuelang.org/), a powerful validation language that permitted us to move the type constraints out of Golang (static language), which in the end makes it possible to modify at runtime the list of objects that Perses can accept. More concretely, this allows to support new kinds of charts and/or datasources dynamically, in the form of plugins written in CUE.

## Writing plugins

This section explains about the format any plugin should follow to be accepted & registered by Perses at runtime.

### Variable

A variable plugin looks like the following:

```cue
package model

kind: "<Variable name>" // e.g kind: "PrometheusLabelValuesVariable"
spec: close({
	labelName: string
	matchers: [...string]
})
```

it should define:

- the `model` package,
- the variable's `kind`,
- the variable's `spec` containing any field you want for this variable plugin.

### Panel

A panel plugin looks like the following:

```cue
package model

kind: "<Panel name>" // e.g kind: "TimeSeriesChart",
spec: {
	queries: [...#ts_query]
	legend?:      #legend
	format?:      common.#format
	thresholds?:  common.#thresholds
}
```

it should define:

- the `model` package,
- the panel's `kind`,
- the panel's `spec` containing any field you want for this panel plugin.

### Query

A query plugin looks like the following:

```cue
package model

kind: "<Query name>" // e.g kind: "PrometheusTimeSeriesQuery"
spec: {
  datasource: {
    kind: "<Datasource type>" // e.g kind: "PrometheusDatasource"
  }
  query:       string
  minStep?:   =~"^(?:(\\d+)y)?(?:(\\d+)w)?(?:(\\d+)d)?(?:(\\d+)h)?(?:(\\d+)m)?(?:(\\d+)s)?(?:(\\d+)ms)?$"
  resolution?: number
}
```

it should define:

- the `model` package,
- the query's `kind`,
- the query's `spec` containing:
    - a `datasource` field that holds the `kind` of datasource corresponding to this query type,
    - any other field you want for this query plugin.

## Migration from Grafana

A Perses plugin can optionally embed a `migrate.cue`\* file at its root, that is basically describing in CUE language how to convert a given Grafana object into an instance of this plugin. In such case your plugin is considered as the Perses equivalent of this Grafana object type, i.e it will be used as part of the translation process when a Grafana dashboard is received on the `/api/migrate` endpoint.

*\* this is mandatory to have it named that way. We put in place this constraint because it makes sense to have a single file containing the remapping logic, with the benefit of making the backend logic easier (no need to search for the file). It's also easier to check the migration file of the different plugins, because you know which one to look for.*

!!! warning
    If ever you come to the situation where you have 2 or more plugins describing a migration logic for the same Grafana panel type, be aware that the first one encountered by alphabetical order will take priority.

### Variable

A variable migration file looks like the following:

```cue
if #var.type == "custom" || #var.type == "interval" {
    kind: "StaticListVariable"
    spec: {
        values: strings.Split(#var.query, ",")
    }
},
```

- The file is named `migrate.cue`.
- The file content is made of **one or more conditional block(s)**, separated by commas (even if you have only one).
- Each conditional block defines one or more matches on attributes from the `#var` definition.
    - `#var` references a variable object from Grafana. You can access the different fields with like `#var.field.subfield`. To know the list of fields available, check the Grafana datamodel for the considered variable type (from Grafana repo, or by inspecting the JSON of the dashboard on the Grafana UI).
    - You most certainly want a check on the `#var.type` value like shown in above example.
- Each conditional block contains a list of fields & assignments, meeting the requirements of the considered Perses variable plugin. Use the `#var.field.subfield` syntax to access the values from the Grafana variable, thus achieve its remapping into Perses.

### Panel

A panel migration file looks like the following:

```cue
if #panel.type == "timeseries" || #panel.type == "graph" {
    kind: "TimeSeriesChart"
    spec: {
        legend: {
            position: #panel.options.legend.placement
        }
    }
},
```

- The file is named `migrate.cue`.
- The file content is made of **one or more conditional block(s)**, separated by commas (even if you have only one).
- Each conditional block defines one or more matches on attributes from the `#panel` definition.
    - `#panel` references a panel object from Grafana. You can access the different fields with like `#panel.field.subfield`. To know the list of fields available, check the Grafana datamodel for the considered panel type (from Grafana repo, or by inspecting the JSON of the dashboard on the Grafana UI).
    - You most certainly want a check on the `#panel.type` value like shown in above example.
- Each conditional block contains a list of fields & assignments, meeting the requirements of the considered Perses panel plugin. Use the `#panel.field.subfield` syntax to access the values from the Grafana panel, thus achieve its remapping into Perses.

#### Utilities

There are some utilities that you can use in your plugin migration logic:

- `#mapping.unit`: mapping table for the `unit` attribute (key = grafana unit, value = perses equivalent).
- `#mapping.calc`: mapping table for the `calculation` attribute (key = grafana unit, value = perses equivalent).
- `#mapping.sort`: mapping array for the sort attribute (index = grafana sort id, value = perses equivalent).
- `#defaultCalc`: standard default value for the `calculation` attribute.

### Query

A query migration file looks like the following:

```cue
if #target.datasource.type != _|_ if #target.datasource.type == "prometheus" {
    kind: "PrometheusTimeSeriesQuery"
    spec: {
        datasource: {
            kind: "PrometheusDatasource"
            name: #target.datasource.uid
        }
        query: #target.expr
    }
},
```

- The file is named `migrate.cue`.
- The file content is made of **one or more conditional block(s)**, separated by commas (even if you have only one).
- Each conditional block defines one or more matches on attributes from the `#target` definition.
    - `#target` references a target object from Grafana. You can access the different fields with like `#target.field.subfield`. To know the list of fields available, check the Grafana datamodel for the targets (from Grafana repo, or by inspecting the JSON of the dashboard on the Grafana UI).
    - You most certainly want a check on the `#target.datasource.type` value like shown in above example.
- Each conditional block contains a list of fields & assignments, meeting the requirements of the considered Perses query plugin. Use the `#target.field.subfield` syntax to access the values from the Grafana target, thus achieve its remapping into Perses.
