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

### Declare intermediary objects for reusability

For code organization & to allow reuse/imports of definitions, it's often interesting to declare things like panels, variables etc. upfront and to pass them afterwards to the dashboard object.

Example: 

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

### Multiple variable groups

If you want 2 independant "groups" of variables on the same dashboard like "C depends on B that depends on A" and "F depends on E that depends on D", use 2 times the variables builder independantly, then concat the lists.

Example: 

```cue
package myDaC

import (
	"list"
	dashboardBuilder "github.com/perses/perses/cue/dac-utils/dashboard"
	panelGroupsBuilder "github.com/perses/perses/cue/dac-utils/panel-groups:panelGroups"
	panelBuilder "github.com/perses/perses/cue/dac-utils/prometheus/panel"
	varsBuilder "github.com/perses/perses/cue/dac-utils/prometheus/variables"
	timeseriesChart "github.com/perses/perses/cue/schemas/panels/time-series:model"
	promQuery "github.com/perses/perses/cue/schemas/queries/prometheus:model"
)

#myCloudVarsBuilder: varsBuilder & {
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

#myVMVarsBuilder: varsBuilder & {
	input: [{
		name:           "datacenter"
		pluginKind:     "PrometheusPromQLVariable"
		metric:         "node_uname_info"
		allowMultiple:  true
		datasourceName: "promDemo"
	}, {
		name:           "hostname"
		pluginKind:     "PrometheusPromQLVariable"
		metric:         "node_uname_info"
		allowAllValue:  true
		allowMultiple:  true
		datasourceName: "promDemo"
	}]
}

#containerCPUPanel: this=panelBuilder & {
	#filter: #myCloudVarsBuilder.fullFilter
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

#vmCPUPanel: this=panelBuilder & {
	#filter: #myVMVarsBuilder.fullFilter
	spec: {
		display: name: "VM CPU"
		plugin: timeseriesChart
		queries: [
			{
				kind: "TimeSeriesQuery"
				spec: plugin: promQuery & {
					spec: query: "sum (node_memory_MemTotal_bytes{\(this.#filter)})"
				}
			},
		]
	}
}

dashboardBuilder & {
	#name:      "ContainersMonitoring"
	#project:   "MyProject"
	#variables: list.Concat([#myCloudVarsBuilder.variables, #myVMVarsBuilder.variables])
	#panelGroups: panelGroupsBuilder & {
		#input: [
			{
				#title: "Resource usage"
				#cols:  3
				#panels: [
					#containerCPUPanel,
					#vmCPUPanel,
				]
			},
		]
	}
}
```

### Custom variable

What if you need a variable with a very specific query, that doesn't fit the standard pattern the variables builder provides? In that case, better to interact directly with the Perses datamodel.

Example: 

```cue
package myDaC

import (
	"list"
	dashboardBuilder "github.com/perses/perses/cue/dac-utils/dashboard"
	panelGroupsBuilder "github.com/perses/perses/cue/dac-utils/panel-groups:panelGroups"
	panelBuilder "github.com/perses/perses/cue/dac-utils/prometheus/panel"
	varsBuilder "github.com/perses/perses/cue/dac-utils/prometheus/variables"
	timeseriesChart "github.com/perses/perses/cue/schemas/panels/time-series:model"
	promQuery "github.com/perses/perses/cue/schemas/queries/prometheus:model"
	v1Dashboard "github.com/perses/perses/cue/model/api/v1/dashboard"
	promQLVar "github.com/perses/perses/cue/schemas/variables/prometheus-promql:model"
)

#myCloudVarsBuilder: varsBuilder & {
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

#mySpecificVMVar: v1Dashboard.#Variable & {
	kind: "ListVariable"
	spec: {
		name: "top5handlers"
		display: {
			name: "Top 5 Handlers"
			hidden: false
		}
		allowAllValue: true
		allowMultiple: true
		plugin: promQLVar & {
			spec: {
				datasource: {
					name: "promDemo"
				}
				expr: "topk(5, sum(rate(http_requests_total{job=\"web-server\"}[5m])) by (instance) * 100 / sum(container_memory_usage_bytes{container_name!=\"\", namespace=\"production\"}))"
			}
		}
	}
}

#containerCPUPanel: this=panelBuilder & {
	#filter: #myCloudVarsBuilder.fullFilter
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

#vmCPUPanel: panelBuilder & {
	spec: {
		display: name: "VM CPU"
		plugin: timeseriesChart
		queries: [
			{
				kind: "TimeSeriesQuery"
				spec: plugin: promQuery & {
					spec: query: "sum (node_memory_MemTotal_bytes{hostname=\"$top5handlers\"})"
				}
			},
		]
	}
}

dashboardBuilder & {
	#name:      "ContainersMonitoring"
	#project:   "MyProject"
	#variables: list.Concat([#myCloudVarsBuilder.variables, [#mySpecificVMVar]])
	#panelGroups: panelGroupsBuilder & {
		#input: [
			{
				#title: "Resource usage"
				#cols:  3
				#panels: [
					#containerCPUPanel,
					#vmCPUPanel,
				]
			},
		]
	}
}
```