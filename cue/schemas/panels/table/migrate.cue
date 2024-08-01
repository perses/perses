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

		_excludedColumns: [if #panel.transformations != _|_ for transformation in #panel.transformations if transformation.id == "organize" for excludedColumn, value in transformation.options.excludeByName if value {
			name: excludedColumn,
			hide: true
		}]

		// Build intermediary maps to be able to merge settings coming from different places
		// We use the future 'header' information as a key for both maps here, because this is the common denominator between the two sources
		// Indeed in grafana the fieldconfig's overrides are matched against the final column name (thus potentially renamed))
		_renamedMap: {if #panel.transformations != _|_ for transformation in #panel.transformations if transformation.id == "organize" for technicalName, prettyName in transformation.options.renameByName {
			"\(prettyName)": technicalName
		}}
		_customWidthMap: {if #panel.fieldConfig.overrides != _|_ for override in #panel.fieldConfig.overrides if override.matcher.id == "byName" && override.matcher.options != _|_ for property in override.properties if property.id == "custom.width" {
			"\(override.matcher.options)": property.value
		}}

		_prettifiedColumns: [for rKey, rVal in _renamedMap {
			name: rVal
			header: rKey
			if _customWidthMap[rKey] != _|_ {
				width: _customWidthMap[rKey]
			}
		}] + [for cwKey, cwVal in _customWidthMap if _renamedMap[cwKey] == _|_ {
			name: cwKey
			width: cwVal
		}]

		columnSettings: _excludedColumns + _prettifiedColumns
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