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
import (
	commonMigrate "github.com/perses/perses/cue/schemas/common/migrate"
)
import "list"

#grafanaType: "status-history"
#panel:       _

#mapping: {
    type: string
    options: [...{
        key: string
        value: string
        text: string
        color: string
    }]
}

kind: "StatusHistoryChart"
spec: {
		#showLegend: *#panel.options.legend.showLegend | true
		if #showLegend {
			legend: {
				position: *(#panel.options.legend.placement & "right") | "bottom"
				mode:     *(#panel.options.legend.displayMode & "table") | "list"
			}
		}

		// Using flatten to avoid having an array of arrays with "value" mappings
		// (https://cuelang.org/docs/howto/use-list-flattenn-to-flatten-lists/)
		let x = list.FlattenN([
			if (*#panel.fieldConfig.defaults.mappings | null) != null for mapping in #panel.fieldConfig.defaults.mappings {
				if mapping.type == "value" {
					[for key, option in mapping.options {
						{
							kind: "Value"
							spec: {
								value: key
								result: {
									if option.text != _|_ {
										value: option.text
									}
									if option.color != _|_ {
										color: *commonMigrate.#mapping.color[option.color] | option.color
									}
								}
							}
						}

					}]
				}

				if mapping.type == "range" || mapping.type == "regex" || mapping.type == "special" {
					#result: {
						value: *mapping.options.result.text | ""
						if mapping.options.result.color != _|_ {
							color: *commonMigrate.#mapping.color[mapping.options.result.color] | mapping.options.result.color
						}
					}
					[//switch
						if mapping.type == "range" {
							kind: "Range"
							spec: {
								if mapping.options.from != _|_ {
									from: mapping.options.from
								}
								if mapping.options.to != _|_ {
									to: mapping.options.to
								}
								result: #result
							}
						},
						if mapping.type == "regex" {
							kind: "Regex"
							spec: {
								pattern: mapping.options.pattern
								result:  #result
							}
						},
						if mapping.type == "special" {
							kind: "Misc"
							spec: {
								value: [//switch
									if mapping.options.match == "nan" {"NaN"},
									if mapping.options.match == "null+nan" {"null"},
									mapping.options.match,
								][0]
								result: #result
							}
						},
					][0]
				}
			},
		], 1)

		if len(x) > 0 {
			mappings: x
		}
	}
