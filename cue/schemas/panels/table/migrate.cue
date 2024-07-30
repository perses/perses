import "list"

if #panel.type != _|_ if #panel.type == "table" {
	kind: "Table"
	spec: {
		if #panel.options.cellHeight != _|_ {
			density: [
				if #panel.options.cellHeight == "sm" { "compact" },
				if #panel.options.cellHeight == "md" { "standard" },
				if #panel.options.cellHeight == "lg" { "standard" }
			][0]
		}
		columnSettings: []

		if #panel.transformations != _|_  {
			for transformation in #panel.transformations {
				if transformation.id == "organize" {
					for excludedColumn, value in transformation.options.excludeByName if value {
						list.Concat([columnSettings, [{ name: excludedColumn, hide: true }]])
					}
					for renamedColumn, value in transformation.options.renameByName {
						list.Concat([columnSettings, [{	name: renamedColumn, header: value }]])
					}
				}
			}
		}
		if #panel.overrides != _|_ {
			for override in #panel.overrides {
				if override.matcher.id == "byName" && override.matcher.options != _|_ {
					for property in override.properties {
						if property.id == "custom.width" {
							list.Concat([columnSettings, [{	name: override.matcher.options, width: property.value }]])
						}
						if property.id == "links" {
							list.Concat([columnSettings, [{	name: override.matcher.options, cellDescription: property.value }]])
						}
					}
				}
			}
		}

	}
}