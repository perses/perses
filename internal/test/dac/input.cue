// Copyright 2025 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package test

import (
	// perses core
	dashboardBuilder "github.com/perses/perses/cuelang/dac-utils/dashboard"
	panelGroupsBuilder "github.com/perses/perses/cuelang/dac-utils/panelgroups"
	varGroupBuilder "github.com/perses/perses/cuelang/dac-utils/variable/group"
	textVarBuilder "github.com/perses/perses/cuelang/dac-utils/variable/text"
	// prometheus plugin
	promQLVarBuilder "github.com/perses/plugins/prometheus/sdk/cue/variable/promql"
	labelValuesVarBuilder "github.com/perses/plugins/prometheus/sdk/cue/variable/labelvalues"
	labelNamesVarBuilder "github.com/perses/plugins/prometheus/sdk/cue/variable/labelnames"
	promFilterBuilder "github.com/perses/plugins/prometheus/sdk/cue/filter"
	panelBuilder "github.com/perses/plugins/prometheus/sdk/cue/panel"
	promQuery "github.com/perses/plugins/prometheus/schemas/prometheus-time-series-query:model"
	promDs "github.com/perses/plugins/prometheus/schemas/datasource:model"
	// other plugins
	staticListVarBuilder "github.com/perses/plugins/staticlistvariable/sdk/cue:staticlist"
	timeseriesChart "github.com/perses/plugins/timeserieschart/schemas:model"
	table "github.com/perses/plugins/table/schemas:model"
)

#myVarsBuilder: varGroupBuilder & {
	#datasourceName: "promDemo"
	#input: [
		labelValuesVarBuilder & {
			#name: "stack"
			#display: name: "PaaS"
			#metric:          "thanos_build_info"
			#label:           "stack"
			#capturingRegexp: "(.+)"
		},
		textVarBuilder & {
			#name:     "prometheus"
			#value:    "platform"
			#constant: true
		},
		staticListVarBuilder & {
			#name: "prometheus_namespace"
			#display: description: "to reduce the query scope thus improve performances"
			#values: ["observability", "monitoring"]
		},
		promQLVarBuilder & {
			#name:          "namespace"
			#metric:        "kube_namespace_labels"
			#allowMultiple: true
		},
		labelNamesVarBuilder & {
			#name:   "namespaceLabels"
			#metric: "kube_namespace_labels"
		},
		promQLVarBuilder & {
			#name:          "pod"
			#query:         "group by (pod) (kube_pod_info{stack=~\"$stack\",prometheus=~\"$prometheus\",prometheus_namespace=~\"$prometheus_namespace\",namespace=~\"$namespace\"})"
			#allowAllValue: true
			#allowMultiple: true
		},
		promQLVarBuilder & {
			#name:           "container"
			#metric:         "kube_pod_container_info"
			#allowAllValue:  true
			#allowMultiple:  true
			#customAllValue: ".*"
		},
		labelNamesVarBuilder & {
			#name: "containerLabels"
			#display: {
				description: "simply the list of labels for the considered metric"
				hidden:      true
			}
			#query: "kube_pod_container_info{\(#filter)}"
			#sort:  "alphabetical-ci-desc"
		},
	]
}

#filter: {promFilterBuilder & #myVarsBuilder}.filter

#cpuPanel: panelBuilder & {
	#grouping: string | *""

	spec: {
		display: name: "Container CPU"
		plugin: timeseriesChart & {
			spec: querySettings: [
				{
					queryIndex: 0
					colorMode:  "fixed-single"
					colorValue: "#0be300"
				},
			]
		}
		queries: [
			{
				kind: "TimeSeriesQuery"
				spec: plugin: promQuery & {
					spec: query: "sum \(#grouping) (container_cpu_usage_seconds{\(#filter)})"
				}
			},
		]
		links: [
			{
				url: "http://localhost:3000/projects/perses/dashboards/hello?" + #myVarsBuilder.queryParams
			},
		]
	}
}

#memoryPanel: panelBuilder & {
	#grouping: string | *""

	spec: {
		display: name: "Container memory"
		plugin: timeseriesChart
		queries: [
			{
				kind: "TimeSeriesQuery"
				spec: plugin: promQuery & {
					spec: query: "max \(#grouping) (container_memory_rss{\(#filter)})"
				}
			},
		]
	}
}

#targetsPanel: panelBuilder & {
	spec: {
		display: name: "Target status"
		plugin: table & {
			spec: {
				cellSettings: [
					{
						condition: {
							kind: "Value"
							spec: {
								value: "1"
							}
						}
						text:            "UP"
						backgroundColor: "#00FF00"
					},
					{
						condition: {
							kind: "Value"
							spec: {
								value: "0"
							}
						}
						text:            "DOWN"
						backgroundColor: "#FF0000"
					},
				]
				transforms: [
					{
						kind: "JoinByColumnValue"
						spec: {
							columns: ["instance"]
						}
					},
				]
			}
		}
		queries: [
			{
				kind: "TimeSeriesQuery"
				spec: plugin: promQuery & {
					spec: query: "up{\(#filter)}"
				}
			},
		]
	}
}

dashboardBuilder & {
	#name: "ContainersMonitoring"
	#display: name: "Containers monitoring"
	#project:   "MyProject"
	#variables: #myVarsBuilder.variables
	#panelGroups: panelGroupsBuilder & {
		#input: [
			{
				#title: "Resource usage"
				#cols:  3
				#panels: [
					#memoryPanel,
					#cpuPanel,
				]
			},
			{
				#title:  "Resource usage bis"
				#cols:   1
				#height: 4
				#panels: [
					#cpuPanel & {#grouping: "by (container)"},
					#memoryPanel & {#grouping: "by (container)"},
				]
			},
			{
				#title: "Misc"
				#cols:  1
				#panels: [
					#targetsPanel,
				]
			},
		]
	}
	#datasources: {myPromDemo: {
		default: true
		plugin: promDs & {spec: {
			directUrl: "http://localhost:9090"
		}}
	}}
	#duration:        "3h"
	#refreshInterval: "30s"
}
