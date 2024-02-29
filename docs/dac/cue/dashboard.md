# Dashboard builder

The Dashboard builder helps creating dashboards in the format expected by Perses.

## Usage

```cue
package myDaC

import (
	dashboardBuilder "github.com/perses/perses/cue/dac-utils/dashboard"
)

dashboardBuilder & {} // input parameters expected
```

## Parameters

| Parameter      | Type                                                                                                                                   | Description                                                                                                         |
|----------------|----------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| `#name`        | string                                                                                                                                 | The name of the dashboard.                                                                                          |
| `#project`     | string                                                                                                                                 | The project to which the dashboard belongs.                                                                         |
| `#variables`   | [...[VariableSpec](../../api/variable.md#dashboard-level)]                                                                             | An array of variables defined for the dashboard.                                                                    |
| `#panelGroups` | map[string]: { layout: [Layout](../../api/dashboard.md#layoutspec), panels: map[string]: [Panel](../../api/dashboard.md#panelspec) } | A map where each key is a panel group name, and the value is an object containing layout and panels for that group. |

## Example

```cue
package myDaC

import (
	dashboardBuilder "github.com/perses/perses/cue/dac-utils/dashboard"
	panelGroupsBuilder "github.com/perses/perses/cue/dac-utils/panel-groups:panelGroups"
	panelBuilder "github.com/perses/perses/cue/dac-utils/prometheus/panel"
	varsBuilder "github.com/perses/perses/cue/dac-utils/prometheus/variables"
	timeseriesChart "github.com/perses/perses/cue/schemas/panels/time-series:model"
	promQuery "github.com/perses/perses/cue/schemas/queries/prometheus:model"
)

dashboardBuilder & {
	#name:    "ContainersMonitoring"
	#project: "MyProject"
	#variables: {varsBuilder & {
		input: [{
			name: "stack"
			display: name: "PaaS"
			pluginKind:     "PrometheusLabelValuesVariable"
			metric:         "thanos_build_info"
			label:          "stack"
			datasourceName: "promDemo"
		}]
	}}.variables
	#panelGroups: panelGroupsBuilder & {
		#input: [
			{
				#title: "Resource usage"
				#cols:  3
				#panels: [
					panelBuilder & {
						spec: {
							display: name: "Container CPU"
							plugin: timeseriesChart
							queries: [
								{
									kind: "TimeSeriesQuery"
									spec: plugin: promQuery & {
										spec: query: "sum by (container) (container_cpu_usage_seconds)"
									}
								},
							]
						}
					}
				]
			},
		]
	}
}
```

As you can see, other builders are used in conjunction with the dashboard builder to facilitate further the coding.
Please refer to their respective documentation for more information about each:
- [Panel Groups builder](./panel-groups.md)
- [Prometheus Panel builder](./prometheus/panel.md)
- [Prometheus Variables builder](./prometheus/variables.md)
