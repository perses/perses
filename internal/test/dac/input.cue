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
	panelGroupsBuilder "github.com/perses/perses/cue/dac-utils/panel-groups:panelGroups"
	panelBuilder "github.com/perses/perses/cue/dac-utils/prometheus/panel"
	varsBuilder "github.com/perses/perses/cue/dac-utils/prometheus/variables"
	timeseriesChart "github.com/perses/perses/cue/schemas/panels/time-series:model"
	promQuery "github.com/perses/perses/cue/schemas/queries/prometheus:model"
)

#myVarsBuilder: varsBuilder & {
	input: [{
		name: "stack"
		display: name: "PaaS"
		pluginKind:     "PrometheusLabelValuesVariable"
		metric:         "thanos_build_info"
		label:          "stack"
		datasourceName: "promDemo"
	}, {
		name:     "prometheus"
		kind:     "TextVariable"
		value:    "platform"
		constant: true
	}, {
		name: "prometheus_namespace"
		display: description: "constant to reduce the query scope thus improve performances"
		kind:     "TextVariable"
		value:    "observability"
		constant: true
	}, {
		name:           "namespace"
		pluginKind:     "PrometheusPromQLVariable"
		metric:         "kube_namespace_labels"
		allowMultiple:  true
		datasourceName: "promDemo"
	}, {
		name:           "namespaceLabels"
		pluginKind:     "PrometheusLabelNamesVariable"
		metric:         "kube_namespace_labels"
		datasourceName: "promDemo"
	}, {
		name:           "pod"
		pluginKind:     "PrometheusPromQLVariable"
		metric:         "kube_pod_info"
		allowAllValue:  true
		allowMultiple:  true
		datasourceName: "promDemo"
	}, {
		name:           "container"
		pluginKind:     "PrometheusPromQLVariable"
		metric:         "kube_pod_container_info"
		allowAllValue:  true
		allowMultiple:  true
		datasourceName: "promDemo"
	}, {
		name: "containerLabels"
		display: {
			description: "simply the list of labels for the considered metric"
			hidden:      true
		}
		pluginKind:     "PrometheusLabelNamesVariable"
		metric:         "kube_pod_container_info"
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
					spec: query: "sum \(this.#aggr) (container_cpu_usage_seconds{\(this.#filter)})"
				}
			},
		]
	}
}

#memoryPanel: this=panelBuilder & {
	#filter: #myVarsBuilder.fullFilter
	#clause: "by"
	#clauseLabels: ["container"]

	spec: {
		display: name: "Container memory"
		plugin: timeseriesChart
		queries: [
			{
				kind: "TimeSeriesQuery"
				spec: plugin: promQuery & {
					spec: query: "max \(this.#aggr) (container_memory_rss{\(this.#filter)})"
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
