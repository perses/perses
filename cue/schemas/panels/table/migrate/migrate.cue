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
	"list"

	commonMigrate "github.com/perses/perses/cue/schemas/common/migrate"
)

#grafanaType: "table" | "table-old"
#panel: _

if (*#panel.type | null) == "table" {
	kind: "Table"
	spec: {
		#cellHeight: *#panel.options.cellHeight | null
		if #cellHeight != null {
			density: [
				if #cellHeight == "sm" {"compact"},
				if #cellHeight == "lg" {"comfortable"},
				"standard",
			][0]
		}

		_nameBuilder: {
			#var: string
			output: [
				// Rename anonymous fields that Perses names differently than Grafana
				if #var == "Time" {"timestamp"},
				if #var == "Value" {"value"},
				#var,
			][0]
		}

		columnSettings: list.Concat([
			for transformation in (*#panel.transformations | [])
			// In Grafana, when ordering column at least one column, it will give an index to all columns (in indexByName map).
			// And Perses, columns are sorted by their index in the array of columnSettings.
			// However, if indexByName map is empty, we can just iterate over renameByName and excludeByName maps "randomly".
			if transformation.id == "organize" && len((*transformation.options.indexByName | {})) == 0 {
				list.Concat([
					[for columnName, displayName in (*transformation.options.renameByName | {}) {
						name: {_nameBuilder & {#var: columnName}}.output
						header: displayName
					}],
					[for columnName, isExcluded in (*transformation.options.excludeByName | {}) {
						name: {_nameBuilder & {#var: columnName}}.output
						hide: isExcluded
					}],
				])
			},
			// If indexByName map is not empty, we need can reorder columns based on the index correctly.
			[for transformation in (*#panel.transformations | [])
				if transformation.id == "organize" && len((*transformation.options.indexByName | {})) > 0
				// very smart trick going on here:
				// since column order in Perses is based on the order of items in the array (and not on a index field like Grafana), we have to reorder the items.
				// To do that we need first to iterate from 0 to the length of the map (= first loop) and then to find (= inner loop) the map item whose index equals the current value of the loop variable.
				for desiredIndex, _ in [for k in transformation.options.indexByName {}] for columnName, index in transformation.options.indexByName if desiredIndex == index {
					name: {_nameBuilder & {#var: columnName}}.output
					if (*transformation.options.renameByName[columnName] | null) != null {
						header: transformation.options.renameByName[columnName]
					}
					if (*transformation.options.excludeByName[columnName] | null) != null {
						hide: transformation.options.excludeByName[columnName]
					}
				},
			],
			[for override in (*#panel.fieldConfig.overrides | [])
				if override.matcher.id == "byName" && override.matcher.options != _|_ {
					name: {_nameBuilder & {#var: override.matcher.options}}.output
					for property in override.properties {
						if property.id == "displayName" {
							header: property.value
						}
						if property.id == "custom.width" {
							width: property.value
						}
					}
				},
			],
		])

		// Using flatten to avoid having an array of arrays with "value" mappings
		// (https://cuelang.org/docs/howto/use-list-flattenn-to-flatten-lists/)
		let x = list.FlattenN([
			if (*#panel.fieldConfig.defaults.mappings | null) != null for mapping in #panel.fieldConfig.defaults.mappings {
				if mapping.type == "value" {
					[for key, option in mapping.options {
						condition: {
							kind: "Value"
							spec: {
								value: key
							}
						}
						if option.text != _|_ {
							text: option.text
						}
						if option.color != _|_ {
							backgroundColor: *commonMigrate.#mapping.color[option.color] | option.color
						}
					}]
				}

				if mapping.type == "range" || mapping.type == "regex" || mapping.type == "special" {
					condition: [//switch
						if mapping.type == "range" {
							kind: "Range"
							spec: {
								if mapping.options.from != _|_ {
									min: mapping.options.from
								}
								if mapping.options.to != _|_ {
									max: mapping.options.to
								}
							}
						},
						if mapping.type == "regex" {
							kind: "Regex"
							spec: {
								expr: mapping.options.pattern
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
							}
						},
					][0]

					if mapping.options.result.text != _|_ {
						text: mapping.options.result.text
					}
					if mapping.options.result.color != _|_ {
						backgroundColor: *commonMigrate.#mapping.color[mapping.options.result.color] | mapping.options.result.color
					}
				}
			},
		], 1)

		if len(x) > 0 {
			cellSettings: x
		}

		// Logic to build transforms:

		if #panel.transformations != _|_ {
			#transforms: [
				for transformation in #panel.transformations if transformation.id == "merge" || transformation.id == "joinByField" {
					if transformation.id == "merge" {
						kind: "MergeSeries"
						spec: {
							if transformation.disabled != _|_ {
								disabled: transformation.disabled
							}
						}
					}
					if transformation.id == "joinByField" {
						kind: "JoinByColumnValue"
						spec: {
							columns: *[transformation.options.byField] | []
							if transformation.disabled != _|_ {
								disabled: transformation.disabled
							}
						}
					}
				},
			]
			if len(#transforms) > 0 {
				transforms: #transforms
			}
		}
	}
}
if (*#panel.type | null) == "table-old" {
	kind: "Table"
	spec: {
		if #panel.styles != _|_ {
			columnSettings: [for style in #panel.styles {
				name: style.pattern
				if style.type == "hidden" {
					hide: true
				}
				if style.alias != _|_ {
					header: style.alias
				}
				#align: *style.align | "auto"
				if #align != "auto" {
					align: style.align
				}
			}]
		}
	}
}
