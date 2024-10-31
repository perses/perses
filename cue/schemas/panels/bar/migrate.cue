 if #panel.type != _|_ if #panel.type == "bargauge" {
	kind: "BarChart"
	spec: {
		#calcName:   *"\(#panel.options.reduceOptions.calcs[0])" | null // only consider [0] here as Perses's BarChart doesn't support individual calcs
		calculation: [// switch
				if #mapping.calc[#calcName] != _|_ {#mapping.calc[#calcName]},
				{#defaultCalc},
		][0]

		#unitPath: *"\(#panel.fieldConfig.defaults.unit)" | null
		if #unitPath != null if #mapping.unit[#unitPath] != _|_ {
			format: {
				unit: #mapping.unit[#unitPath]
			}
		}
		#decimal: *(#panel.fieldConfig.defaults.decimal) | null
		if #decimal != null {
			format: {
				decimalPlaces: #decimal
			}
		}
	}
}
