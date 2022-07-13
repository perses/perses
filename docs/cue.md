CUE in Perses
====================

Perses comes with validation capabilities based on [CUE](https://cuelang.org/), a powerful validation language that permitted us to move the type constraints out of Golang (static language), which in the end makes it possible to modify at runtime the list of objects that Perses can accept. More concretely, this allows to support new kinds of charts and/or datasources dynamically, in the form of plugins written in CUE.

# Writing plugins

This section explains about the format any plugin should follow to be accepted & registered by Perses at runtime.

## Panel

A panel plugin looks like the following:

```cue
package <panel type> // e.g package line

#panel: {
	kind:       "<Panel name>" // e.g kind: "LineChart"
	datasource: #datasource
	options: {
		queries:      [...#query]
		show_legend?: bool
	}
}

#datasource: _
#query:      _
```
it should contain:
- a package name.
- a `#panel` definition that holds:
  - the panel's `kind`.
  - \* `datasource: #datasource`
  - an `options` map containing
    - \* a field that maps to the `#query` definition (like `queries: [...#query]`,  `query: #query` etc.)
    - any other field you want for this plugin.
- \* a placeholder value `_` for `#datasource` and `#query`. _This is mandatory to pass the initial "compilation" of the plugin, then when it will be used to validate a panel the relevant definitions will be injected at runtime._

_* guidelines that apply if your panel defines a query & a datasource (e.g LineChart), otherwise don't apply (e.g TextPanel)_

## Query

A query plugin looks like the following:

```cue
package <query type> // e.g package prometheus

#datasource: {
	kind: "PrometheusDatasource"
}

#query: {
	kind: "PrometheusGraphQuery"
	options: {
		query:       string
		min_step?:   =~"^(?:(\\d+)y)?(?:(\\d+)w)?(?:(\\d+)d)?(?:(\\d+)h)?(?:(\\d+)m)?(?:(\\d+)s)?(?:(\\d+)ms)?$"
		resolution?: number
	}
}
```
it should contain:
- a package name.
- a `#datasource` definition that holds the `kind` of datasource corresponding to this query type.
- a `#query` definition that holds:
  - the query's `kind`.
  - an `options` map containing any field you want for this plugin.
