// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the \"License\");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an \"AS IS\" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package migrate

#grafanaType: "stat"
#panel:       _

kind: "MyPanel"
spec: {
	title: #panel.title
	query: {
		datasource: "prometheus"
		expression: #panel.targets[0].expr
	}
	if #panel.fieldConfig != _|_ {
		if #panel.fieldConfig.defaults != _|_ {
			if #panel.fieldConfig.defaults.color != _|_ {
				display: {
					color: #panel.fieldConfig.defaults.color.mode
				}
			}
			if #panel.fieldConfig.defaults.thresholds != _|_ {
				if #panel.fieldConfig.defaults.thresholds.steps != _|_ {
					thresholds: [for step in #panel.fieldConfig.defaults.thresholds.steps {
						color: step.color
						value: step.value
					}]
				}
			}
		}
	}
}
