// Copyright 2024 The Perses Authors
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

package migrate

#grafanaType: "status-history"
#panel:       _

kind: "StatusHistoryChart"
spec: {
	#showLegend: *#panel.options.legend.showLegend | true
	if #panel.options.legend != _|_ if #showLegend {
		legend: {
			if #panel.type == "status-history" {
				position: [
					if #panel.options.legend.placement != _|_ if #panel.options.legend.placement == "right" {"right"},
					{"bottom"},
				][0]
				mode: [
					if #panel.options.legend.displayMode == "list" {"list"},
					if #panel.options.legend.displayMode == "table" {"table"},
				][0]
			}
		}
	}
}
