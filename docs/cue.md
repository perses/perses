# CUE in Perses

Perses comes with validation capabilities based on [CUE](https://cuelang.org/), a powerful validation language that permitted us to move the type constraints out of Golang (static language), which in the end makes it possible to modify at runtime the list of objects that Perses can accept. More concretely, this allows to support new kinds of charts and/or datasources dynamically, in the form of plugins written in CUE.

# Writing plugins

This section explains about the format any plugin should follow to be accepted & registered by Perses at runtime.

## Variable

A variable plugin looks like the following:

```cue
package <variable type> // e.g package prometheusLabelValues

kind: "<Variable name>" // e.g kind: "PrometheusLabelValuesVariable"
spec: close({
	label_name: string
	matchers: [...string]
})
```

it should contain:
- a package name.
- the variable's `kind`.
- the variable's `spec` containing any field you want for this query plugin.

## Panel

A panel plugin looks like the following:

```cue
package <panel type> // e.g package timeserie

kind: "<Panel name>" // e.g kind: "TimeSeriesChart",
spec: {
	queries: [...#ts_query]
	legend?:      #legend 
	unit?:        common.#unit
	thresholds?:  common.#thresholds
}

#ts_query: _
```

it should contain:
- a package name.
- the panel's `kind`.
- the panel's `spec` containing:
  - \* a field that maps to the `#ts_query` definition (like `queries: [...#ts_query]`, `query: #ts_query` etc.)
  - any other field you want for this panel plugin.
- \* a placeholder value `_` for `#ts_query`. *This is mandatory to pass the initial "compilation" of the plugin, then when it will be used to validate a panel the relevant definitions will be injected at runtime.*

_* guidelines that apply if your panel defines a query & a datasource (e.g TimeseriesChart), otherwise don't apply (e.g TextPanel)_

## Query

A query plugin looks like the following:

```cue
package <query type> // e.g package prometheus

spec: {
	plugin: {
		kind: "<Query name>" // e.g kind: "PrometheusTimeSeriesQuery"
		spec: {
			datasource: {
				kind: "<Datasource type>" // e.g kind: "PrometheusDatasource"
			}
			query:       string
			min_step?:   =~"^(?:(\\d+)y)?(?:(\\d+)w)?(?:(\\d+)d)?(?:(\\d+)h)?(?:(\\d+)m)?(?:(\\d+)s)?(?:(\\d+)ms)?$"
			resolution?: number
		}
	}
}
```

it should contain:
- a package name.
- under `spec.plugin` :
  - the query's `kind`.
  - the query's `spec` containing:
    - a `datasource` field that holds the `kind` of datasource corresponding to this query type.
    - any other field you want for this query plugin.

# Migration from Grafana

A Perses plugin can optionally embed a `mig.cuepart`* file that is basically describing in CUE language how to convert a given Grafana object into an instance of this plugin. In such case your plugin is considered as the Perses equivalent of this Grafana object type, and it will be used as part of the translation process when a Grafana dashboard is received on the `/api/migrate` endpoint.

*\* this is mandatory to have it named that way. We put in place this constraint because it makes sense to have a single file containing the remapping logic, with the benefit of making the backend logic easier (no need to search for the file). It's also easier to check the migration logic of the different plugins, because you know which file to look for.*

*\* the .cuepart extension is a homemade one. It is used for CUE files that may contain some placeholders for string replacements, that are not valid CUE syntax.*

## Variable

A variable migration file looks like the following:

```cue
if #var.type == "custom" || #var.type == "interval" {
    kind: "StaticListVariable"
    spec: {
        values: [ for _, option in #var.options if option.value !~ "^\\$__.*$" { // the if filters out the grafana global vars that'd be causing validation issues later (e.g "__auto_interval_sampling is used but not defined")
            option.value
        }]
    }
},
```
- The file is named `mig.cuepart`.
- The file content is made of **one or more conditional block(s)**, separated by a coma (even if you have only one).
- Each conditional block defines one or more matches on attributes from the `#var` definition.
  - `#var` is a variable object from Grafana. You can access the different fields with like `#var.field.subfield`. To know the list of fields available, check the Grafana datamodel for this variable (from Grafana repo, or by inspecting the JSON of the dashboard on the Grafana UI).
  - You most certainly want a check on the `#var.type` value like shown in above example.
- Each conditional block contains a list of fields & assignments, meeting the requirements of the considered Perses variable plugin. Use the `#var.field.subfield` syntax to access the values from the Grafana variable, thus achieve its remapping into Perses.

## Panel

A panel migration file looks like the following:

```cue
if #panel.type == "timeseries" || #panel.type == "graph" {
    kind: "TimeSeriesChart"
    spec: {
        queries: [ for _, target in #panel.targets {
            kind: "TimeSeriesQuery"
            spec: {
                plugin: {
                    #target: target
                    %(conditional_timeserie_queries)
                }
            }
        }]
        legend: {
            position: #panel.options.legend.placement
        }
    }
},
```
- The file is named `mig.cuepart`.
- The file content is made of **one or more conditional block(s)**, separated by a coma (even if you have only one).
- Each conditional block defines one or more matches on attributes from the `#panel` definition.
  - `#panel` is a panel object from Grafana. You can access the different fields with like `#panel.field.subfield`. To know the list of fields available, check the Grafana datamodel for this panel (from Grafana repo, or by inspecting the JSON of the dashboard on the Grafana UI).
  - You most certainly want a check on the `#panel.type` value like shown in above example.
- Each conditional block contains a list of fields & assignments, meeting the requirements of the considered Perses panel plugin. Use the `#panel.field.subfield` syntax to access the values from the Grafana panel, thus achieve its remapping into Perses.
- If applies (it most probably does), you have to provide these instructions to allow the migration of your panel's query(ies):

  ```
  #target: <relevant attribute name>
  %(conditional_timeserie_queries)
  ```

  the `%(conditional_timeserie_queries)` placeholder will get replaced by conditionals later in the translation process. `#target` is the standard alias expected for the target object, just like `#panel` is for panels.

### Utilities

There are some utilities that you can use in your panel plugin:
- `#mapping.unit`: mapping table for the unit attribute (key = grafana unit, value = perses equivalent)
- `#mapping.calc`: mapping table for the calculation attribute (key = grafana unit, value = perses equivalent)
- `#defaultCalc`: standard default value for the calculation attribute

## Query

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
- The file is named `mig.cuepart`.
- The file content is made of **one or more conditional block(s)**, separated by a coma (even if you have only one).
- Each conditional block defines one or more matches on attributes from the `#target` definition.
  - `#target` is a target object from Grafana. You can access the different fields with like `#target.field.subfield`. To know the list of fields available, check the Grafana datamodel for the targets (from Grafana repo, or by inspecting the JSON of the dashboard on the Grafana UI).
  - You most certainly want a check on the `#target.datasource.type` value like shown in above example.
- Each conditional block contains a list of fields & assignments, meeting the requirements of the considered Perses query plugin. Use the `#target.field.subfield` syntax to access the values from the Grafana target, thus achieve its remapping into Perses.
