if #panel.type != _|_ if #panel.type == "table" {
	kind: "Table"
	spec: {
		if #panel.options != _|_ if #panel.options.cellHeight != _|_ {
			density: [
				if #panel.options.cellHeight == "sm" { "compact" },
				if #panel.options.cellHeight == "md" { "standard" },
				if #panel.options.cellHeight == "lg" { "comfortable" }
			][0]
		}

		// /!\ Disabling the improved migration logic from #2273 for columnSettings for now, because it triggers a bug with the new CUE evaluator.
		// Would need the resolution of this issue to consider bringing it back: https://github.com/cue-lang/cue/issues/3178#issuecomment-2399694260
		// NB: the commit that appended this comment should be revert since it removed some unit tests.
		//
		// intermediary object to gather all the settings/overrides we can find, before taking decisions about which ones to assign to columnSettings
		// Because CUE doesn't allow to override values, we have to do some tricky stuff like creating unique fields for each "candidate" to avoid conflicts.
		// _settingsGatherer: {}
		// _nameBuilder: {
		// 	#var: string
		// 	output: [
		// 		// Rename anonymous fields that Perses names differently than Grafana
		// 		if #var == "Time" { "timestamp" },
		// 		if #var == "Value" { "value" },
		// 		#var
		// 	][0]
		// }
		// if #panel.transformations != _|_ for transformation in #panel.transformations if transformation.id == "organize" {
		// 	for excludedColumn, value in transformation.options.excludeByName if value {
		// 		let name = {_nameBuilder & {#var: excludedColumn}}.output
		// 		_settingsGatherer: "\(name)": hide: true
		// 	}
		// 	for technicalName, displayName in transformation.options.renameByName {
		// 		let name = {_nameBuilder & {#var: technicalName}}.output
		// 		_settingsGatherer: "\(name)": headers: "\(displayName)": true
		// 	}
		// }
		// if #panel.fieldConfig.overrides != _|_ {
		// 	for override in #panel.fieldConfig.overrides if override.matcher.id == "byName" && override.matcher.options != _|_ {
		// 		for property in override.properties {
		// 			let name = {_nameBuilder & {#var: override.matcher.options}}.output
		// 			if property.id == "displayName" {
		// 				// Grafana's field overrides can be defined on fields already renamed via the Organize transformation,
		// 				// hence why we go through the map here to try gathering the renames in the same "place".
		// 				// NB: this is best effort. E.g if there are several organize transformations chained this wont work, but a settings
		// 				// object will still get created, thus it could still be arranged manually by the user after the migration.
		// 				for k, v in _settingsGatherer {
		// 					if v.headers[name] != _|_ {
		// 						_settingsGatherer: "\(k)": headers: "\(property.value)": true
		// 					}
		// 				}
		// 				_settingsGatherer: "\(name)": headers: "\(property.value)": true
		// 			}
		// 			if property.id == "custom.width" {
		// 				// same as above
		// 				for k, v in _settingsGatherer {
		// 					if v.headers[name] != _|_ {
		// 						_settingsGatherer: "\(k)": widths: "\(property.value)": true
		// 					}
		// 				}
		// 				_settingsGatherer: "\(name)": widths: "\(property.value)": true
		// 			}
		// 		}
		// 	}
		// }

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

		_excludedColumns: [if #panel.transformations != _|_ for transformation in #panel.transformations if transformation.id == "organize" for excludedColumn, value in transformation.options.excludeByName if value {
			name: excludedColumn,
			hide: true
		}]

		// Build intermediary maps to be able to merge settings coming from different places
		// We use the future 'header' information as a key for both maps here, because this is the common denominator between the two sources
		// Indeed in grafana the fieldconfig's overrides are matched against the final column name (thus potentially renamed))
		_renamedMap: {if #panel.transformations != _|_ for transformation in #panel.transformations if transformation.id == "organize" for technicalName, prettyName in transformation.options.renameByName if _renamedMap[prettyName] == _|_ {
			"\(prettyName)": technicalName
		}}
		_customWidthMap: {if #panel.fieldConfig.overrides != _|_ for override in #panel.fieldConfig.overrides if override.matcher.id == "byName" && override.matcher.options != _|_ for property in override.properties if property.id == "custom.width" if _customWidthMap[override.matcher.options] == _|_ {
			"\(override.matcher.options)": property.value
		}}

		_prettifiedColumns: list.Concat([[for rKey, rVal in _renamedMap {
			name: rVal
			header: rKey
			if _customWidthMap[rKey] != _|_ {
				width: _customWidthMap[rKey]
			}
		}],[for cwKey, cwVal in _customWidthMap if _renamedMap[cwKey] == _|_ {
			name: cwKey
			width: cwVal
		}]])

		columnSettings: list.Concat([_excludedColumns,_prettifiedColumns])

		cellSettings: [
				if #panel.fieldConfig != _|_  && #panel.fieldConfig.defaults != _|_ && #panel.fieldConfig.defaults.mappings != _|_ for mapping in #panel.fieldConfig.defaults.mappings {

					if mapping.type == "value" {
						[for key, option in mapping.options {
							condition: {
									kind: "Value"
									spec: {
										value: key
									}
							}
							if option.text != _|_ { text: option.text }
							if option.color != _|_ { backgroundColor: [ // switch
									if #mapping.color[option.color] != _|_ { #mapping.color[option.color] },
									{ option.color }
							][0]}
					 }]
					}

					if mapping.type == "range"  || mapping.type == "regex" || mapping.type == "special" {
							condition: [
								if mapping.type == "range" { kind: "Range", spec: {
									if mapping.options.from != _|_ { min: mapping.options.from },
									if mapping.options.to != _|_ { max: mapping.options.to }
								}},
								if mapping.type == "regex" { kind: "Regex", spec: { expr: mapping.options.pattern }},
								if mapping.type == "special" { kind: "Misc", spec: { value: [
									if mapping.options.match == "empty" { "empty" },
									if mapping.options.match == "null" { "null" },
									if mapping.options.match == "nan" { "NaN" },
									if mapping.options.match == "null+nan" { "null" },
									if mapping.options.match == "true" { "true" },
									if mapping.options.match == "false" { "false" },
								][0] }},
							][0]
							if mapping.result.text != _|_ { text: mapping.result.text }
							if mapping.result.color != _|_ { backgroundColor: [ // switch
									if #mapping.color[mapping.result.color] != _|_ { #mapping.color[mapping.result.color] },
									{ mapping.result.color }
							][0]}
					}
				}
		]
	}
},
if #panel.type != _|_ if #panel.type == "table-old" {
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
				if style.align != _|_ if style.align != "auto" {
					align: style.align
				}
			}]
		}
	}
},