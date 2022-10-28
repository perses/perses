CUE in Perses
====================

Perses comes with validation capabilities based on [CUE](https://cuelang.org/), a powerful validation language that permitted us to move the type constraints out of Golang (static language), which in the end makes it possible to modify at runtime the list of objects that Perses can accept. More concretely, this allows to support new kinds of charts and/or datasources dynamically, in the form of plugins written in CUE.

# Writing plugins

This section explains about the format any plugin should follow to be accepted & registered by Perses at runtime.

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
  - \* a field that maps to the `#ts_query` definition (like `queries: [...#ts_query]`,  `query: #ts_query` etc.)
  - any other field you want for this panel plugin.
- \* a placeholder value `_` for `#ts_query`. _This is mandatory to pass the initial "compilation" of the plugin, then when it will be used to validate a panel the relevant definitions will be injected at runtime._

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
