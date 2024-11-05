# Prometheus Panel builder

The Prometheus Panel builder is a simple wrapper to help creating panels that query a prometheus datasource.

## Usage

```cue
package myDaC

import (
	panelBuilder "github.com/perses/perses/cue/dac-utils/prometheus/panel"
)

panelBuilder & {} // input parameters expected
```

## Parameters

| Parameter       | Type                                                       | Mandatory/Optional | Default | Description                                                |
|-----------------|------------------------------------------------------------|--------------------|---------|------------------------------------------------------------|
| `spec`          | [PanelSpec](../../../api/dashboard.md#panel-specification) | Mandatory          |         | A PanelSpec object                                         |
| `#clause`       | `"by"` \| `"without"` \| `""`                              | Optional           | `""`    | The aggregation clause for this panel's queries.           |
| `#clauseLabels` | [...string]                                                | Optional           | []      | The labels on which to aggregate for this panel's queries. |

the panel spec object can use the following string fields provided by the builder, via interpolation:

| Field   | Type   | Description                                                                                         |
|---------|--------|-----------------------------------------------------------------------------------------------------|
| `#aggr` | string | Aggregation clause built from the provided `#clause` and `#clauseLabels`. E.g `by (namespace, pod)` |

## Example

```cue
package myDaC

import (
	panelBuilder "github.com/perses/perses/cue/dac-utils/prometheus/panel"
	timeseriesChart "github.com/perses/perses/cue/schemas/panels/time-series:model"
	promQuery "github.com/perses/perses/cue/schemas/queries/prometheus:model"
)

#cpuPanel: this=panelBuilder & {
	#clause: "by"
	#clauseLabels: ["container"]

	spec: {
		display: name: "Container CPU"
		plugin: timeseriesChart
		queries: [
			{
				kind: "TimeSeriesQuery"
				spec: plugin: promQuery & {
					spec: query: "sum \(this.#aggr) (container_cpu_usage_seconds{})"
				}
			},
		]
	}
}

#cpuPanel
```
