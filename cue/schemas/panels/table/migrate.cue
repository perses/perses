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

		columnSettings: list.Concat([
			for transformation in (*#panel.transformations | [])
				if transformation.id == "organize" {
					list.Concat([
						[for columnName, displayName in (*transformation.options.renameByName | {}) {
							name: {_nameBuilder & {#var: columnName}}.output
							header: displayName
						}],
						[for columnName, isExcluded in (*transformation.options.excludeByName | {}) {
							name: {_nameBuilder & {#var: columnName}}.output
							hide: isExcluded
						}]
					])
				}
			,
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
							columns: *transformation.options.byField | []
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
