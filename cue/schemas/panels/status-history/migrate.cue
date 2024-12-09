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

if #panel.type != _|_ if #panel.type == "status-history" {
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

		// Add migration logic for Value mapping(value)
		#valueMappings: *#panel.fieldConfig.defaults.mappings | _|_
		if #valueMappings != _|_ {

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
											color: *#mapping.color[option.color] | option.color
										}
									}
								}
							}

						}]
					}

					if mapping.type == "range" || mapping.type == "regex" || mapping.type == "special" {
						#result: {
							if mapping.options.result.text != _|_ {
								value: mapping.options.result.text
							}
							if mapping.options.result.color != _|_ {
								color: *#mapping.color[mapping.options.result.color] | mapping.options.result.color
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

	}
}
