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
	"github.com/perses/perses/pkg/model/api/v1"
	panelBuilder "github.com/perses/perses/schemas/builder:prometheusPanel"
	panelGroupBuilder "github.com/perses/perses/schemas/builder:panelGroup"
	varsBuilder "github.com/perses/perses/schemas/builder:prometheusVars"
	timeseriesChart "github.com/perses/perses/schemas/panels/time-series:model"
	promQuery "github.com/perses/perses/schemas/queries/prometheus:model"
)

#myVarsBuilder: varsBuilder & {input: [
	{pluginKind: "PrometheusLabelValuesVariable", datasourceName: "promDemo", name: "PaaS", metric: "thanos_build_info", label: "stack"},
	{kind: "TextVariable", label: "prometheus", value: "platform", constant: true},
	{kind: "TextVariable", label: "prometheus_namespace", value: "observability", constant: true},
	{pluginKind: "PrometheusPromQLVariable", datasourceName: "promDemo", metric: "kube_namespace_labels", label: "namespace", allowMultiple: true},
	{pluginKind: "PrometheusLabelNamesVariable", datasourceName: "promDemo", metric: "kube_namespace_labels", name: "namespaceLabels"},
	{pluginKind: "PrometheusPromQLVariable", datasourceName: "promDemo", metric: "kube_pod_info", label: "pod", allowAllValue: true, allowMultiple: true},
	{pluginKind: "PrometheusPromQLVariable", datasourceName: "promDemo", metric: "kube_pod_container_info", label: "container", allowAllValue: true, allowMultiple: true},
	{pluginKind: "PrometheusLabelNamesVariable", datasourceName: "promDemo", metric: "kube_pod_container_info", name: "containerLabels"},
]}

#myPanels: {
	"memory": this=panelBuilder & {
		#filter: #myVarsBuilder.fullMatcher
		#clause: "by"
		#clauseLabels: ["container"]

		spec: {
			display: name: "Container Memory"
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
	"cpu": this=panelBuilder & {
		#filter: #myVarsBuilder.fullMatcher
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
}

v1.#Dashboard & {
	metadata: {
		name:    "Containers monitoring"
		project: "My project"
	}
	spec: {
		panels:    #myPanels
		variables: #myVarsBuilder.variables
		layouts: [
			panelGroupBuilder & {#panels: #myPanels, #title: "Resource usage", #cols: 3},
		]
	}
}
