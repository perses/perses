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

| Parameter          | Type                                                                                                                                                     | Mandatory/Optional | Description                                                                                                         |
|--------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------|---------------------------------------------------------------------------------------------------------------------|
| `#name`            | string                                                                                                                                                   | Mandatory          | The name of the dashboard.                                                                                          |
| `#project`         | string                                                                                                                                                   | Optional           | The project to which the dashboard belongs.                                                                         |
| `#display`         | [Display](../../api/dashboard.md#display-specification)                                                                                                  | Optional           | Display object to tune the display name and description.                                                            |
| `#panelGroups`     | map[string]: { layout: [Layout](../../api/dashboard.md#layout-specification), panels: map[string]: [Panel](../../api/dashboard.md#panel-specification) } | Optional           | A map where each key is a panel group name, and the value is an object containing layout and panels for that group. |
| `#variables`       | [...[VariableSpec](../../api/variable.md#dashboard)]                                                                                               | Optional           | An array of variables defined for the dashboard.                                                                    |
| `#datasources`     | map[string]: [DatasourceSpec](../../api/datasource.md#dashboard)                                                                                   | Optional           | A map of datasources defined by this dashboard                                                                      |
| `#duration`        | string                                                                                                                                                   | Optional           | the default time range to use on the initial load of the dashboard                                                  |
| `#refreshInterval` | string                                                                                                                                                   | Optional           | the default refresh interval to use on the initial load of the dashboard                                            |

## Example

```cue
package myDaC

import (
	dashboardBuilder "github.com/perses/perses/cue/dac-utils/dashboard"
	panelGroupsBuilder "github.com/perses/perses/cue/dac-utils/panelgroups"
	panelBuilder "github.com/perses/perses/cue/dac-utils/prometheus/panel"
	varGroupBuilder "github.com/perses/perses/cue/dac-utils/variable/group"
	textVarBuilder "github.com/perses/perses/cue/dac-utils/variable/text"
	labelValuesVarBuilder "github.com/perses/perses/cue/dac-utils/prometheus/variable/labelvalues"
	timeseriesChart "github.com/perses/perses/cue/schemas/panels/time-series:model"
	promQuery "github.com/perses/perses/cue/schemas/queries/prometheus:model"
)

dashboardBuilder & {
	#name:    "ContainersMonitoring"
	#project: "MyProject"
	#variables: {varGroupBuilder & {
		#input: [
			textVarBuilder & {
				#name:     "prometheus"
				#value:    "platform"
				#constant: true
			},
			labelValuesVarBuilder & {
				#name: "stack"
				#display: name: "PaaS"
				#metric:         "thanos_build_info"
				#label:          "stack"
				#datasourceName: "promDemo"
			}
		]
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
Please refer to their respective documentation for more information about each.
