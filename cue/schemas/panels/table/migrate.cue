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

		// intermediary object to gather all the settings/overrides we can find, before taking decisions about which ones to assign to columnSettings
		// Because CUE doesn't allow to override values, we have to do some tricky stuff like creating unique fields for each "candidate" to avoid conflicts.
		_settingsGatherer: {}
		if #panel.transformations != _|_ for i, transformation in #panel.transformations if transformation.id == "organize" {
			for excludedColumn, value in transformation.options.excludeByName if value {
				_settingsGatherer: "\(excludedColumn)": hide: true
			}
			for technicalName, displayName in transformation.options.renameByName {
				let name = [
					// Map Grafana special 'Value' to lowercase 'value':
					if technicalName == "Value" { "value" },
					technicalName
				][0]
				_settingsGatherer: "\(name)": headers: "\(displayName)": true
			}
		}
		if #panel.fieldConfig.overrides != _|_ {
			for i, override in #panel.fieldConfig.overrides if override.matcher.id == "byName" && override.matcher.options != _|_ {
				for property in override.properties {
					let name = [
						// Map Grafana special 'Value' to lowercase 'value':
						if override.matcher.options == "Value" { "value" },
						override.matcher.options
					][0]
					if property.id == "displayName" {
						// Grafana's field overrides can be defined on fields already renamed via the Organize transformation,
						// hence why we go through the map here to try gathering the renames in the same "place".
						// NB: this is best effort. E.g if there are several organize transformations chained this wont work, but a settings
						// object will still get created, thus it could still be arranged manually by the user after the migration.
						for k, v in _settingsGatherer {
							if v.headers[override.matcher.options] != _|_ {
								_settingsGatherer: "\(k)": headers: "\(property.value)": true
							}
						}
						_settingsGatherer: "\(name)": headers: "\(property.value)": true
					}
					if property.id == "custom.width" {
						// same as above
						for k, v in _settingsGatherer {
							if v.headers[override.matcher.options] != _|_ {
								_settingsGatherer: "\(k)": widths: "\(property.value)": true
							}
						}
						_settingsGatherer: "\(name)": widths: "\(property.value)": true
					}
				}
			}
		}

		columnSettings: [for settingsID, settings in _settingsGatherer {
			name: settingsID
			if settings.headers != _|_ if len(settings.headers) > 0 {
				let headers = [for settingKey, _ in settings.headers { settingKey }]
				// Why do we take the last element here: it's mostly based on grafana's behavior
				// - field overrides take precedence over the organize transformation (organize transformation was processed first above)
				// - if there are multiple overrides for the same field, the last one takes precedence
				header: headers[len(headers) - 1]
			}
			if settings.hide != _|_ {
				hide: settings.hide
			}
			if settings.widths != _|_ if len(settings.widths) > 0 {
				let widths = [for settingKey, _ in settings.widths { settingKey }]
				width: strconv.Atoi(widths[len(widths) - 1])
			}
		}]
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