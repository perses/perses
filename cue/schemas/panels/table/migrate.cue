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
				if #var == "Time" { "timestamp" },
				if #var == "Value" { "value" },
				#var
			][0]
		}

<<<<<<< HEAD
		columnSettings: list.Concat([
			[for transformation in (*#panel.transformations | [])
				if transformation.id == "organize"
					for desiredIndex, _ in [for k in transformation.options.indexByName {}] for columnName, index in transformation.options.indexByName if desiredIndex == index {
							name: {_nameBuilder & {#var: columnName}}.output
							if (*transformation.options.renameByName[columnName] | null) != null {
								header: transformation.options.renameByName[columnName]
							}
							if (*transformation.options.excludeByName[columnName] | null) != null {
								hide: transformation.options.excludeByName[columnName]
							}
					}
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
					},
				}
			],
		])
=======
		// columnSettings: [for settingsID, settings in _settingsGatherer {
		// 	name: settingsID
		// 	if settings.headers != _|_ if len(settings.headers) > 0 {
		// 		let headers = [for settingKey, _ in settings.headers { settingKey }]
		// 		// Why do we take the last element here: it's mostly based on grafana's behavior
		// 		// - field overrides take precedence over the organize transformation (organize transformation was processed first above)
		// 		// - if there are multiple overrides for the same field, the last one takes precedence
		// 		header: headers[len(headers) - 1]
		// 	}
		// 	if settings.hide != _|_ {
		// 		hide: settings.hide
		// 	}
		// 	if settings.widths != _|_ if len(settings.widths) > 0 {
		// 		let widths = [for settingKey, _ in settings.widths { settingKey }]
		// 		width: strconv.Atoi(widths[len(widths) - 1])
		// 	}
		// }]

		// Bringing back the old logic from before #2273 + some adjustments due to using cue v0.11.0 + corner case uncovered with unit test added since:

    // Grafana "organize" transformation allow to reorder columns. In Perses, columns are ordered by they columnSetting index in the
		_sortableColumns: [if #panel.transformations != _|_ for transformation in #panel.transformations if transformation.id == "organize" for column, entry in transformation.options.indexByName {
			name: column
			index: entry
		}]

		_sortedColumns: list.Sort(_sortableColumns, {x: {}, y: {}, less: x.index < y.index})

		_excludedColumns: [if #panel.transformations != _|_ for transformation in #panel.transformations if transformation.id == "organize" for excludedColumn, value in transformation.options.excludeByName {
			name: excludedColumn
			hide: true
		}]

		// We use the future 'header' information as a key for both maps here, because this is the common denominator between the two sources
		// Indeed in grafana the fieldconfig's overrides are matched against the final column name (thus potentially renamed))
		_renamedMap: [if #panel.transformations != _|_ for transformation in #panel.transformations if transformation.id == "organize" for technicalName, prettyName in transformation.options.renameByName {
			name: prettyName
			technicalName: technicalName
		}]
		_customWidthMap: [if #panel.fieldConfig.overrides != _|_ for override in #panel.fieldConfig.overrides if override.matcher.id == "byName" && override.matcher.options != _|_ for property in override.properties if property.id == "custom.width" {
			name: override.matcher.options
			width: property.value
		}]

		// Only keep one value per column name
		_gatherExcludedSettings: {
			name: string

			return: "\(name)": list.Concat([
				[for item in _excludedColumns if item.name == name {
					cItem.hide
				}]
			])
		}

		_gatherRenamedSettings: {
			name: string

			return: "\(name)": list.Concat([
				[for item in _renamedMap if item.name == name {
					cItem.technicalName
				}]
			])
		}

		_gatherCustomWidthSettings: {
			name: string

			return: "\(name)": list.Concat([
				[for item in _renamedMap if item.name == name {
					cItem.width
				}]
			])
		}



		columnSettings: [for column in _sortedColumns {
			name: column.name

			_prettyName: [for prettyName, technicalName in _renamedMap if technicalName == column.name { prettyName	}]

			if len(_prettyName) > 0 {header: _prettyName[0]}

			if _excludedColumns[column.name] != _|_ {
				hide: true
			}

			if len(_prettyName) == 0 {
				_customWidth: [for prettyName, customWidth in _customWidthMap if prettyName == column.name {customWidth}]
				if len(_customWidth) > 0 {width: _customWidth[0]}
			}

			if len(_prettyName) > 0 {
				_customWidth: [for prettyName, customWidth in _customWidthMap if prettyName == _prettyName[0] {customWidth}]
				if len(_customWidth) > 0 { width: _customWidth[0]}
			}
		}]
>>>>>>> 9b197ad9 (wip)

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
							backgroundColor: *#mapping.color[option.color] | option.color
						}
					}]
				}

				if mapping.type == "range" || mapping.type == "regex" || mapping.type == "special" {
					condition: [//switch
						if mapping.type == "range" {
							kind: "Range",
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
							kind: "Regex",
							spec: {
								expr: mapping.options.pattern
							}
						},
						if mapping.type == "special" {
							kind: "Misc",
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
						backgroundColor: *#mapping.color[mapping.options.result.color] | mapping.options.result.color
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
},
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
},
