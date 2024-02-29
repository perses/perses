# CUE SDK for Dashboard-as-Code

This section provides all the information about the CUE SDK to develop dashboards as code in Perses.
It's focusing on explaining how to use the different "builders" provided by the SDK, that you should rely on to simplify the coding.
Besides, you can always manipulate directly the base datamodel of the Perses dashboard, but this is less convenient.

See the dedicated pages for each builder:
- [Dashboard builder](./dashboard.md)
- [Panel Groups builder](./panel-groups.md)
- Prometheus-specific builders:
  - [Panel builder](./prometheus/panel.md)
  - [Variables builder](./prometheus/variables.md)

See also some useful patterns for DaC with the CUE SDK in the below section.

## Useful patterns

This section provides additional tips & tricks to help you developping dashboards as code:

- For code organization & to allow reuse/imports of definitions, it's often interesting to declare things like panels, variables etc. upfront and to pass them afterwards to the dashboard object.
```cue
package test

import (
	dashboardBuilder "github.com/perses/perses/cue/dac-utils/dashboard"
	panelGroupsBuilder "github.com/perses/perses/cue/dac-utils/panel-groups:panelGroups"
	panelBuilder "github.com/perses/perses/cue/dac-utils/prometheus/panel"
	varsBuilder "github.com/perses/perses/cue/dac-utils/prometheus/variables"
	timeseriesChart "github.com/perses/perses/cue/schemas/panels/time-series:model"
	promQuery "github.com/perses/perses/cue/schemas/queries/prometheus:model"
)

#myVarsBuilder: varsBuilder & {
	input: [{
		name:           "namespace"
		pluginKind:     "PrometheusPromQLVariable"
		metric:         "kube_namespace_labels"
		allowMultiple:  true
		datasourceName: "promDemo"
	}, {
		name:           "pod"
		pluginKind:     "PrometheusPromQLVariable"
		metric:         "kube_pod_info"
		allowAllValue:  true
		allowMultiple:  true
		datasourceName: "promDemo"
	}]
}

#cpuPanel: this=panelBuilder & {
	#filter: #myVarsBuilder.fullFilter
	spec: {
		display: name: "Container CPU"
		plugin: timeseriesChart
		queries: [
			{
				kind: "TimeSeriesQuery"
				spec: plugin: promQuery & {
					spec: query: "sum (container_cpu_usage_seconds{\(this.#filter)})"
				}
			},
		]
	}
}

dashboardBuilder & {
	#name:      "ContainersMonitoring"
	#project:   "MyProject"
	#variables: #myVarsBuilder.variables
	#panelGroups: panelGroupsBuilder & {
		#input: [
			{
				#title: "Resource usage"
				#cols:  3
				#panels: [
					#cpuPanel,
				]
			},
		]
	}
}
```

Once your code is organized this way, you can even split the different definitions in different files. This avoids e.g to have one very big file when you have a dashboard with lots of panels.
