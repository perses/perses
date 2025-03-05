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
	panelBuilder "github.com/perses/plugins/prometheus/sdk/cue/panel"
	promQuery "github.com/perses/plugins/prometheus/schemas/prometheus-time-series-query:model"
	timeseriesChart "github.com/perses/plugins/timeserieschart/schemas:model"
)

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
					spec: query: "max \(this.#aggr) (container_memory_rss{job=\"node-exporter\"})"
				}
			},
		]
	}
}

dashboardBuilder & {
	#name:    "ContainersMonitoring"
	#project: "MyProject"
	#panelGroups: panelGroupsBuilder & {
		#input: [
			{
				#title: "Resource usage"
				#cols:  3
				#panels: [
					#memoryPanel,
				]
			},
		]
	}
}
