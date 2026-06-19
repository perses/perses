// Copyright The Perses Authors
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

package nodeExporterSimple

import (
	dashboardBuilder "github.com/perses/perses/cue/dac-utils/dashboard"
	panelGroupsBuilder "github.com/perses/perses/cue/dac-utils/panelgroups"
	panels "cue.example/panels"
)

dashboardBuilder & {
	#name:    "node-exporter-simple"
	#project: "MyProject"
	#display: name: "Node Exporter / Simple"
	#panelGroups: panelGroupsBuilder & {
		#input: [
			{
				#title: "Overview"
				#cols:  3
				#panels: [
					panels.#gaugeSysLoad,
					panels.#gaugeRootFS,
					panels.#gaugeRAMUsed,
				]
			},
			{
				#title: "Totals"
				#cols:  4
				#panels: [
					panels.#statRAMTotal,
					panels.#statCPUCores,
					panels.#statRootFSTotal,
					panels.#statUptime,
				]
			},
			{
				#title: "Time series"
				#cols:  2
				#panels: [
					panels.#timeseriesCPUBasic,
					panels.#timeseriesMemoryBasic,
					panels.#timeseriesNetworkTrafficBasic,
					panels.#timeseriesDiskSpaceUsedBasic,
				]
			},
		]
	}
}

