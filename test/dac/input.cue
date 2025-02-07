// Copyright 2023 The Perses Authors
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
	dashboardBuilder "github.com/perses/perses/cue/dac-utils/dashboard"
	panelGroupsBuilder "github.com/perses/perses/cue/dac-utils/panelgroups"
	panelBuilder "github.com/perses/perses/cue/dac-utils/prometheus/panel"
	varGroupBuilder "github.com/perses/perses/cue/dac-utils/variable/group"
	promQLVarBuilder "github.com/perses/perses/cue/dac-utils/prometheus/variable/promql"
	labelValuesVarBuilder "github.com/perses/perses/cue/dac-utils/prometheus/variable/labelvalues"
	labelNamesVarBuilder "github.com/perses/perses/cue/dac-utils/prometheus/variable/labelnames"
	textVarBuilder "github.com/perses/perses/cue/dac-utils/variable/text"
	staticListVarBuilder "github.com/perses/perses/cue/dac-utils/variable/staticlist"
	promFilterBuilder "github.com/perses/perses/cue/dac-utils/prometheus/filter"
	timeseriesChart "github.com/perses/perses/cue/schemas/panels/time-series:model"
	table "github.com/perses/perses/cue/schemas/panels/table:model"
	promQuery "github.com/perses/perses/cue/schemas/queries/prometheus:model"
	prometheusDs "github.com/perses/perses/cue/schemas/datasources/prometheus:model"
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
		plugin: prometheusDs & {spec: {
			directUrl: "http://localhost:9090"
		}}
	}}
	#duration:        "3h"
	#refreshInterval: "30s"
}
