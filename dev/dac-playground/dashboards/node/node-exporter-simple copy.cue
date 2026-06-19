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

// A copy of the simple node-exporter dashboard (kept in its own package to
// avoid clashing with the original when evaluated from the same directory).
package nodeExporterSimpleCopy

import (
	dashboardBuilder "github.com/perses/perses/cue/dac-utils/dashboard"
	panelGroupsBuilder "github.com/perses/perses/cue/dac-utils/panelgroups"
	panels "cue.example/panels"
)

dashboardBuilder & {
	#name:    "node-exporter-simple-copy"
	#project: "MyProject"
	#display: name: "Node Exporter / Simple (copy)"
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
				#title: "Time series"
				#cols:  2
				#panels: [
					panels.#timeseriesCPUBasic,
					panels.#timeseriesMemoryBasic,
				]
			},
		]
	}
}

