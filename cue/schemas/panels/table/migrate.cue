if #panel.type != _|_ if #panel.type == "table" {
	kind: "Table"
	spec: {
		if #panel.options != _|_ if #panel.options.cellHeight != _|_ {
			density: [
				if #panel.options.cellHeight == "sm" { "compact" },
				if #panel.options.cellHeight == "md" { "standard" },
				if #panel.options.cellHeight == "lg" { "standard" }
			][0]
		}

		// TODO: Implement the logic to have a unique colum settings for each columns. Currently a migrated column can have multiple column settings
    #excluded: [if #panel.transformations != _|_ for transformation in #panel.transformations if transformation.id == "organize" for excludedColumn, value in transformation.options.excludeByName if value { name: excludedColumn, hide: true	}]
    #renamed: [if #panel.transformations != _|_ for transformation in #panel.transformations if transformation.id == "organize" for renamedColumn, value in transformation.options.renameByName {	name: renamedColumn, header: value }]
    #customWidth: [if #panel.fieldConfig.overrides != _|_ for override in #panel.fieldConfig.overrides if override.matcher.id == "byName" && override.matcher.options != _|_ for property in override.properties if property.id == "custom.width" { name: override.matcher.options, width: property.value }]
		columnSettings: #excluded + #renamed + #customWidth
	}
}