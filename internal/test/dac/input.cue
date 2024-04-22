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
	promFilterBuilder "github.com/perses/perses/cue/dac-utils/prometheus/filter"
	timeseriesChart "github.com/perses/perses/cue/schemas/panels/time-series:model"
	promQuery "github.com/perses/perses/cue/schemas/queries/prometheus:model"
)

#myVarsBuilder: varGroupBuilder & {
	#input: [
		labelValuesVarBuilder & {
			#name: "stack"
			#display: name: "PaaS"
			#metric:          "thanos_build_info"
			#label:           "stack"
			#datasourceName:  "promDemo"
			#capturingRegexp: "(.+)"
		},
		textVarBuilder & {
			#name:     "prometheus"
			#value:    "platform"
			#constant: true
		},
		textVarBuilder & {
			#name: "prometheus_namespace"
			#display: description: "constant to reduce the query scope thus improve performances"
			#value:    "observability"
			#constant: true
		},
		promQLVarBuilder & {
			#name:           "namespace"
			#metric:         "kube_namespace_labels"
			#allowMultiple:  true
			#datasourceName: "promDemo"
		},
		labelNamesVarBuilder & {
			#name:           "namespaceLabels"
			#metric:         "kube_namespace_labels"
			#datasourceName: "promDemo"
		},
		promQLVarBuilder & {
			#name:           "pod"
			#query:          "group by (pod) (kube_pod_info{stack=\"$stack\",prometheus=\"$prometheus\",prometheus_namespace=\"$prometheus_namespace\",namespace=\"$namespace\"})"
			#allowAllValue:  true
			#allowMultiple:  true
			#datasourceName: "promDemo"
		},
		promQLVarBuilder & {
			#name:           "container"
			#metric:         "kube_pod_container_info"
			#allowAllValue:  true
			#allowMultiple:  true
			#customAllValue: ".*"
			#datasourceName: "promDemo"
		},
		labelNamesVarBuilder & {
			#name: "containerLabels"
			#display: {
				description: "simply the list of labels for the considered metric"
				hidden:      true
			}
			#query:          "kube_pod_container_info{stack=\"$stack\",prometheus=\"$prometheus\",prometheus_namespace=\"$prometheus_namespace\",namespace=\"$namespace\",pod=\"$pod\",container=\"$container\"}"
			#datasourceName: "promDemo"
			#sort:           "alphabetical-ci-desc"
		},
	]
}

#filter: {promFilterBuilder & #myVarsBuilder}.filter

#cpuPanel: this=panelBuilder & {
	spec: {
		display: name: "Container CPU"
		plugin: timeseriesChart
		queries: [
			{
				kind: "TimeSeriesQuery"
				spec: plugin: promQuery & {
					spec: query: "sum \(this.#aggr) (container_cpu_usage_seconds{\(#filter)})"
				}
			},
		]
	}
}

#memoryPanel: this=panelBuilder & {
	#clause: "by"
	#clauseLabels: ["container"]

	spec: {
		display: name: "Container memory"
		plugin: timeseriesChart
		queries: [
			{
				kind: "TimeSeriesQuery"
				spec: plugin: promQuery & {
					spec: query: "max \(this.#aggr) (container_memory_rss{\(#filter)})"
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
					#cpuPanel,
					#memoryPanel,
				]
			},
		]
	}
}
