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

A Perses plugin can optionally embed a `migrate` folder file at its root, that contains a `migrate.cue` file. This file is basically describing in CUE language how to convert a given Grafana object into an instance of this plugin. In such case your plugin is considered as the Perses equivalent of this Grafana object type, i.e it will be used as part of the translation process when a Grafana dashboard is received on the `/api/migrate` endpoint.

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
    If ever you come to the situation where you have 2 or more plugins describing a migration logic for the same Grafana object, be aware that the last one encountered by alphabetical order will take priority.

### Panel

A panel migration file looks like the following:

```cue
package migrate

import (
	commonMigrate "github.com/perses/perses/cue/schemas/common/migrate"
)

#grafanaType: "bargauge"
#panel:       _

kind: "BarChart"
spec: {
	calculation: *commonMigrate.#mapping.calc[#panel.options.reduceOptions.calcs[0]] | commonMigrate.#defaultCalc // only consider [0] here as Perses's GaugeChart doesn't support individual calcs

	#unit: *commonMigrate.#mapping.unit[#panel.fieldConfig.defaults.unit] | null
	if #unit != null {
		format: unit: #unit
	}

	#decimal: *#panel.fieldConfig.defaults.decimal | null
	if #decimal != null {
		format: decimalPlaces: #decimal
	}
}
```

- The file must be named `migrate.cue`.
- `#grafanaType` is a mandatory definition to provide, whose string value must match the `type` of the Grafana panel you want to migrate.
- `#panel` is the reference used by Perses to inject the Grafana panel objects to migrate.
    - You can access the different fields via the `#panel.field.subfield` syntax. To find the list of available fields, refer to the Grafana data model for the relevant panel type (from Grafana repo, or by inspecting the JSON of the dashboard on the Grafana UI).
    - Declaring `#panel: _` like in the above example is optional, it's just there to enable standalone validation of the file (`_` means "any" in CUE).
- The file consists of field assignments, using the content of `#panel`. The end result must match the model of the considered Perses panel plugin.
    - Optionally, you can use the `github.com/perses/perses/cue/schemas/common/migrate` package that Perses provides in order to remap some of the attributes:
        - `#mapping.unit`: mapping table for the `unit` attribute (key = grafana unit, value = perses equivalent).
        - `#mapping.calc`: mapping table for the `calculation` attribute (key = grafana unit, value = perses equivalent).
        - `#mapping.color`: mapping table for the "standard" colors used by Grafana (key = color name, value = hex code).
        - `#defaultCalc`: standard default value for the `calculation` attribute.

### Query

A query migration file looks like the following:

```cue
package migrate

#target: _

// NB we would need `if` to support short-circuit in order to avoid code duplication here.
//    See https://github.com/cue-lang/cue/issues/2232
if (*#target.datasource.type | null) == "prometheus" && #target.expr != _|_ {
	kind: "PrometheusTimeSeriesQuery"
	spec: {
		datasource: {
			kind: "PrometheusDatasource"
			name: #target.datasource.uid
		}
		query:         #target.expr
		#legendFormat: *#target.legendFormat | "__auto"
		if #legendFormat != "__auto" {
			seriesNameFormat: #legendFormat
		}
		if #target.interval != _|_ {
			minStep: #target.interval
		}
	}
},
```

- The file must be named `migrate.cue`.
- `#target` is the reference used by Perses to inject the Grafana target objects to migrate.
    - You can access the different fields via the `#target.field.subfield` syntax. To find the list of available fields, refer to the Grafana data model for the targets (from Grafana repo, or by inspecting the JSON of the dashboard on the Grafana UI).
    - Declaring `#target: _` like in the above example is optional, it's just there to enable standalone validation of the file (`_` means "any" in CUE).
- The migration logic must be wrapped into **one or more conditional block(s)**. For each of them:
    - The condition is about one or more attributes from the `#target` definition. You most certainly want a check on the `#target.datasource.type` value like shown in above example.
    - The body consists of field assignments, using the content of `#target`. The end result must match the model of the considered Perses query plugin.

!!! warning
    Ensure that your file evaluates to an empty result if the provided `#target` value does not match the expected type.

### Variable

A variable migration file looks like the following:

```cue
package migrate

import "strings"

#var: _

if #var.type == "custom" || #var.type == "interval" {
	kind: "StaticListVariable"
    spec: {
        values: strings.Split(#var.query, ",")
    }
}
```

- The file must be named `migrate.cue`.
- `#var` is the reference used by Perses to inject the Grafana variable objects to migrate.
    - You can access the different fields via the `#var.field.subfield` syntax. To find the list of available fields, refer to the Grafana data model for the relevant variable type (from Grafana repo, or by inspecting the JSON of the dashboard on the Grafana UI).
    - Declaring `#var: _` like in the above example is optional, it's just there to enable standalone validation of the file (`_` means "any" in CUE).
- The migration logic must be wrapped into **one or more conditional block(s)**. For each of them:
    - The condition is about one or more attributes from the `#var` definition. You most certainly want a check on the `#var.type` value like shown in above example.
    - The body consists of field assignments, using the content of `#var`. The end result must match the model of the considered Perses variable plugin.

!!! warning
    Ensure that your file evaluates to an empty result if the provided `#var` value does not match the expected type.
