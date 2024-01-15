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
	"github.com/perses/perses/cue/model/api/v1"
	panelBuilder "github.com/perses/perses/cue/dac-utils/prometheus/panel"
	panelGroupBuilder "github.com/perses/perses/cue/dac-utils/panel-group:panelGroup"
	timeseriesChart "github.com/perses/perses/cue/schemas/panels/time-series:model"
	promQuery "github.com/perses/perses/cue/schemas/queries/prometheus:model"
)

#myPanels: {
	"memory": this=panelBuilder & {
		#clause: "by"
		#clauseLabels: ["container"]

		spec: {
			display: name: "Container Memory"
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
}

v1.#Dashboard & {
	metadata: {
		name:    "Containers monitoring"
		project: "My project"
	}
	spec: {
		panels:    #myPanels
		layouts: [
			panelGroupBuilder & {#panels: #myPanels, #title: "Resource usage", #cols: 3},
		]
	}
}
