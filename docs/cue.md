CUE in Perses
====================

Perses comes with validation capabilities based on [CUE](https://cuelang.org/), a powerful validation language that permitted us to move the type constraints out of Golang (static language), which in the end makes it possible to modify at runtime the list of objects that Perses can accept. More concretely, this allows to support new kinds of charts and/or datasources dynamically, in the form of plugins written in CUE.

# Writing plugins

This section explains about the format any plugin should follow to be accepted & registered by Perses at runtime.

## Chart

A chart plugin looks like the following:

```cue
package <chart type> // e.g package line

#panel: {
	kind: "<Chart name>" // e.g kind: "LineChart"
  display: {
    name:         string
    description?: string
  }
  datasource: {
    kind: string
    key?: string
  }
	options: {
		queries:      [...#query]
		show_legend?: bool
	}
}
```
it should contain:
- a package name (free text).
- a `#panel` definition that holds:
  - the chart's `kind`.
  - optionally, a `display` and a `datasource` to define additional constraints on those 2 fields inherited from the base model. In the example above they could actually be removed, since they are not changing anything to the base constraints for those 2 fields.
  - an `options` map containing any attribute you want for this plugin.

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
- a package name (free text).
- a `#datasource` definition that holds the `kind` of datasource corresponding to this query type.
- a `#query` definition that holds:
  - the query's `kind`.
  - an `options` map containing any attribute you want for this plugin.
